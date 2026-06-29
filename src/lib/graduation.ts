// Graduation: which markets have earned their way up to a real-money venue.
//
// A market graduates only when it shows genuine, broad-based signal — and the
// decision is computed by REPLAYING its causal event log, so the verdict is
// reproducible and the underlying log is tamper-evident (see seal.ts). This is
// the artifact you hand a regulated venue: "this market earned it; here's proof."

import { replay, marketPrice, type MarketEvent } from "./events";
import type { Outcome } from "./lmsr";

export type Thresholds = {
  minVolume: number;
  minTrades: number;
  minTraders: number;
  minConviction: number; // distance of YES price from 0.5 — how much the crowd "decided"
};

export const DEFAULT_THRESHOLDS: Thresholds = {
  minVolume: 200,
  minTrades: 8,
  minTraders: 3,
  minConviction: 0.18,
};

export type Metrics = {
  volume: number;
  trades: number;
  traders: number;
  prob: number;
  conviction: number;
};

export type Checks = {
  volume: boolean;
  trades: boolean;
  traders: boolean;
  conviction: boolean;
};

// Build the canonical event log for a market from its stored row + trade rows.
// The Create event carries the initial (seed) liquidity so replay reconstructs
// exactly the current state.
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
  events: MarketEvent[]
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
  };
}

export function evaluate(metrics: Metrics, t: Thresholds = DEFAULT_THRESHOLDS) {
  const checks: Checks = {
    volume: metrics.volume >= t.minVolume,
    trades: metrics.trades >= t.minTrades,
    traders: metrics.traders >= t.minTraders,
    conviction: metrics.conviction >= t.minConviction,
  };
  const eligible = Object.values(checks).every(Boolean);
  const met = Object.values(checks).filter(Boolean).length;
  const progress = met / Object.values(checks).length;
  return { checks, eligible, progress };
}
