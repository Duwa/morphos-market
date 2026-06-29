// The causal event-monad core.
//
// State is NOT stored — it is the deterministic FOLD of an append-only event
// log (`replay`). Each `step` enforces CAUSAL preconditions (you cannot sell
// shares you never bought; you cannot trade a resolved market). Value (cost)
// is path-INdependent (proven in scripts/verify-invariants.ts); possibility
// is path-DEpendent (enforced here). Pure module — no Node/DOM deps — so it
// runs identically on server, client, and in tests.

import { tradeCost, priceYes, type Outcome } from "./lmsr";

export const START_BALANCE = 1000;

export type MarketEvent =
  | { kind: "Create"; market: string; b: number; qYes0?: number; qNo0?: number }
  | { kind: "Trade"; market: string; user: string; outcome: Outcome; shares: number } // +buy / -sell
  | { kind: "Resolve"; market: string; outcome: Outcome }
  | { kind: "Graduate"; market: string };

export type Market = {
  id: string;
  b: number;
  qYes: number;
  qNo: number;
  status: "OPEN" | "RESOLVED" | "GRADUATED";
  outcome: Outcome | null;
  volume: number;
  trades: number;
};

export type World = {
  markets: Map<string, Market>;
  pos: Map<string, { yes: number; no: number }>; // key: user|market
  bal: Map<string, number>;
};

export class CausalError extends Error {}

export function emptyWorld(): World {
  return { markets: new Map(), pos: new Map(), bal: new Map() };
}

export function marketPrice(m: Market): number {
  return priceYes(m.qYes, m.qNo, m.b);
}

const EPS = 1e-9;
const pkey = (user: string, market: string) => `${user}|${market}`;
function balOf(w: World, u: string) {
  return w.bal.get(u) ?? START_BALANCE;
}

// Apply one event. Throws CausalError if the event violates causal order.
// Mutates `w` in place (replay supplies a fresh world each run → determinism).
export function step(w: World, e: MarketEvent): World {
  switch (e.kind) {
    case "Create": {
      if (w.markets.has(e.market))
        throw new CausalError(`Create: market ${e.market} already exists`);
      w.markets.set(e.market, {
        id: e.market,
        b: e.b,
        qYes: e.qYes0 ?? 0,
        qNo: e.qNo0 ?? 0,
        status: "OPEN",
        outcome: null,
        volume: 0,
        trades: 0,
      });
      return w;
    }

    case "Trade": {
      const m = w.markets.get(e.market);
      if (!m) throw new CausalError(`Trade before Create: ${e.market}`); // causality
      if (m.status !== "OPEN")
        throw new CausalError(`Trade on ${m.status} market ${e.market}`); // causality

      const pk = pkey(e.user, e.market);
      const p = w.pos.get(pk) ?? { yes: 0, no: 0 };
      const owned = e.outcome === "YES" ? p.yes : p.no;
      // causal guard: cannot sell more than you hold
      if (e.shares < 0 && owned + e.shares < -EPS)
        throw new CausalError(
          `cannot sell ${-e.shares} ${e.outcome}; holds ${owned}`
        );

      const c = tradeCost(m.qYes, m.qNo, m.b, e.outcome, e.shares);
      const bal = balOf(w, e.user);
      if (c > 0 && c > bal + EPS)
        throw new CausalError(`insufficient balance: need ${c}, has ${bal}`);

      // apply value
      if (e.outcome === "YES") m.qYes += e.shares;
      else m.qNo += e.shares;
      m.volume += Math.abs(c);
      m.trades += 1;
      w.bal.set(e.user, bal - c);
      w.pos.set(pk, {
        yes: p.yes + (e.outcome === "YES" ? e.shares : 0),
        no: p.no + (e.outcome === "NO" ? e.shares : 0),
      });
      return w;
    }

    case "Resolve": {
      const m = w.markets.get(e.market);
      if (!m) throw new CausalError(`Resolve before Create: ${e.market}`);
      if (m.status === "RESOLVED")
        throw new CausalError(`market ${e.market} already resolved`);
      m.status = "RESOLVED";
      m.outcome = e.outcome;
      // propositional truncation: pay 1 credit per winning share, discard the rest
      for (const [pk, p] of w.pos) {
        const sep = pk.indexOf("|");
        const user = pk.slice(0, sep);
        const market = pk.slice(sep + 1);
        if (market !== e.market) continue;
        const win = e.outcome === "YES" ? p.yes : p.no;
        if (win > EPS) w.bal.set(user, balOf(w, user) + win);
      }
      return w;
    }

    case "Graduate": {
      const m = w.markets.get(e.market);
      if (!m) throw new CausalError(`Graduate before Create: ${e.market}`);
      m.status = "GRADUATED";
      return w;
    }
  }
}

// The monad's fold: state is DERIVED from the causal log, never stored.
export function replay(events: MarketEvent[]): World {
  const w = emptyWorld();
  for (const e of events) step(w, e);
  return w;
}

// Total credits a user spent across a sequence (path cost). Negative = received.
export function pathCost(events: MarketEvent[], user: string): number {
  const w = replay(events);
  return START_BALANCE - balOf(w, user);
}
