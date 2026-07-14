// Reputation: who is early + right. The manifesto's "reputation before money."
//
// A forecaster earns reputation by buying the WINNING side of a market that
// later resolves — and more for getting in EARLY (cheap), when the crowd
// disagreed. Being wrong costs a little. Computed purely from the trade log +
// each market's resolved outcome, so it's reproducible and can't be bought.

export type RepTrade = {
  userId: string;
  outcome: string; // YES | NO
  shares: number;
  priceYes: number; // price after the trade (entry proxy)
};

export type ResolvedMarket = { outcome: string; trades: RepTrade[] };

export type RepStat = {
  userId: string;
  score: number;
  calls: number; // distinct resolved markets traded
  wins: number;
  losses: number;
};

export function computeReputation(markets: ResolvedMarket[]): Map<string, RepStat> {
  const map = new Map<string, RepStat>();
  const get = (u: string) => {
    let s = map.get(u);
    if (!s) { s = { userId: u, score: 0, calls: 0, wins: 0, losses: 0 }; map.set(u, s); }
    return s;
  };

  for (const m of markets) {
    const counted = new Set<string>();
    for (const t of m.trades) {
      if (t.shares <= 0) continue; // reputation is for convictions (buys), not exits
      const s = get(t.userId);
      if (!counted.has(t.userId)) { s.calls++; counted.add(t.userId); }
      // price they effectively paid for their side
      const pSide = t.outcome === "YES" ? t.priceYes : 1 - t.priceYes;
      if (t.outcome === m.outcome) {
        s.score += t.shares * (1 - pSide); // cheaper + right = more credit
        s.wins++;
      } else {
        s.score -= t.shares * pSide * 0.5; // wrong costs, but less
        s.losses++;
      }
    }
  }
  return map;
}

// Map userId → score, for weighting graduation breadth.
export function scoreByUser(map: Map<string, RepStat>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [u, s] of map) out[u] = s.score;
  return out;
}

// How much a single believer's vote is worth, 0..1 on top of their base 1.
// A proven forecaster's belief counts up to ~2×; noise counts 1×.
export function repWeight(score: number | undefined): number {
  if (!score || score <= 0) return 0;
  return Math.min(1, score / 20);
}
