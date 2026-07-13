// Graduation: which markets have earned their way up.
//
// The manifesto reframes this: a thing graduates on BROAD, REAL belief — not on
// money. So the gate weighs breadth (many unique believers), conviction (the
// crowd decided), and real pull (confirmed "Build this" demand from the DIY
// layer). Volume is shown but no longer gates — that was the casino metric.
// Everything is computed by REPLAYING the tamper-evident causal log.

import { replay, marketPrice, type MarketEvent } from "./events";
import type { Outcome } from "./lmsr";

export type Thresholds = {
  minTraders: number; // breadth — many believers, not one whale
  minConviction: number; // distance of YES price from 0.5
  minPulls: number; // real consumption-pull from builds of this morphology
  minTrades: number; // baseline activity
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  minTraders: 3,
  minConviction: 0.18,
  minPulls: 2,
  minTrades: 6,
};

export type Metrics = {
  volume: number; // informational only
  trades: number;
  traders: number;
  prob: number;
  conviction: number;
  pulls: number; // real demand for this market's morphology
};

export type Checks = {
  breadth: boolean;
  conviction: boolean;
  pull: boolean;
  activity: boolean;
};

// Sum real "Build this" pulls by morphology → the demand signal per shape.
export function pullsByMorphology(
  builds: { morphology: string; pulls: number }[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of builds) out[b.morphology] = (out[b.morphology] ?? 0) + b.pulls;
  return out;
}

// Build the canonical event log for a market from its stored row + trade rows.
export function eventsFor(
  market: { id: string; b: number; qYes: number; qNo: number },
  trades: { userId: string; outcome: string; shares: number; createdAt: Date }[]
): MarketEvent[] {
  const ordered = [...trades].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );
  let sumYes = 0;
  let sumNo = 0;
  for (const t of ordered) {
    if (t.outcome === "YES") sumYes += t.shares;
    else sumNo += t.shares;
  }
  const events: MarketEvent[] = [
    {
      kind: "Create",
      market: market.id,
      b: market.b,
      qYes0: market.qYes - sumYes,
      qNo0: market.qNo - sumNo,
    },
  ];
  for (const t of ordered) {
    events.push({
      kind: "Trade",
      market: market.id,
      user: t.userId,
      outcome: t.outcome as Outcome,
      shares: t.shares,
    });
  }
  return events;
}

export function metricsFor(
  market: { id: string; b: number; qYes: number; qNo: number; volume: number },
  events: MarketEvent[],
  pulls = 0
): Metrics {
  const w = replay(events);
  const m = w.markets.get(market.id)!;
  const traders = new Set<string>();
  let trades = 0;
  for (const e of events) {
    if (e.kind === "Trade" && e.market === market.id) {
      traders.add(e.user);
      trades++;
    }
  }
  const prob = marketPrice(m);
  return {
    volume: market.volume,
    trades,
    traders: traders.size,
    prob,
    conviction: Math.abs(prob - 0.5),
    pulls,
  };
}

export function evaluate(metrics: Metrics, t: Thresholds = DEFAULT_THRESHOLDS) {
  const checks: Checks = {
    breadth: metrics.traders >= t.minTraders,
    conviction: metrics.conviction >= t.minConviction,
    pull: metrics.pulls >= t.minPulls,
    activity: metrics.trades >= t.minTrades,
  };
  const eligible = Object.values(checks).every(Boolean);
  const met = Object.values(checks).filter(Boolean).length;
  const progress = met / Object.values(checks).length;
  return { checks, eligible, progress };
}
