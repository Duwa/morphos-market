// Logarithmic Market Scoring Rule (Hanson) for a binary YES/NO market.
// Prices always sum to 1 and move smoothly with order flow. `b` controls
// liquidity: larger b = deeper market, less price movement per share.

export type Outcome = "YES" | "NO";

// Numerically stable cost function: C(q) = b * (m + ln(sum exp((q_i - m)/b)))
export function cost(qYes: number, qNo: number, b: number): number {
  const a = qYes / b;
  const c = qNo / b;
  const m = Math.max(a, c);
  return b * (m + Math.log(Math.exp(a - m) + Math.exp(c - m)));
}

// Instantaneous price of YES in [0,1]. Price of NO is 1 - this.
export function priceYes(qYes: number, qNo: number, b: number): number {
  const a = qYes / b;
  const c = qNo / b;
  const m = Math.max(a, c);
  const eA = Math.exp(a - m);
  const eC = Math.exp(c - m);
  return eA / (eA + eC);
}

// Cost (credits) to buy `shares` of `outcome`. Negative shares = selling,
// which returns a negative cost (credits flow back to the trader).
export function tradeCost(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  shares: number
): number {
  const before = cost(qYes, qNo, b);
  const after =
    outcome === "YES"
      ? cost(qYes + shares, qNo, b)
      : cost(qYes, qNo + shares, b);
  return after - before;
}

// How many shares of `outcome` a given credit `budget` buys (binary search).
export function sharesForBudget(
  qYes: number,
  qNo: number,
  b: number,
  outcome: Outcome,
  budget: number
): number {
  if (budget <= 0) return 0;
  let lo = 0;
  let hi = 1;
  // expand upper bound until it exceeds the budget
  while (tradeCost(qYes, qNo, b, outcome, hi) < budget && hi < 1e9) hi *= 2;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (tradeCost(qYes, qNo, b, outcome, mid) < budget) lo = mid;
    else hi = mid;
  }
  return lo;
}
