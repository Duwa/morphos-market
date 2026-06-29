// Machine-proves the laws the whole architecture rests on. Run: npm run verify
//
//   1. Path-independence  — reaching a state costs the same by any path
//   2. Loops cost zero     — buy then sell returns to the start (no arbitrage)
//   3. Determinism         — replay(log) is a pure function of the log
//   4. Causality           — illegal events (sell-before-buy, trade-after-resolve) are rejected
//   5. Tamper-evidence     — editing a past event breaks the hash chain
//   6. Truncation/payout   — resolution pays 1 per winning share, 0 otherwise

import {
  replay,
  pathCost,
  marketPrice,
  CausalError,
  START_BALANCE,
  type MarketEvent,
} from "../src/lib/events";
import { sealChain, verifyChain } from "../src/lib/seal";

let passed = 0;
let failed = 0;
const EPS = 1e-9;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
  } else {
    failed++;
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}  ${detail}`);
  }
}

const M = "mkt";
const U = "alice";
const create: MarketEvent = { kind: "Create", market: M, b: 150 };

console.log("\nMorphos · settlement invariants\n");

// 1. PATH-INDEPENDENCE — two paths to +100 YES cost the same
{
  const single = pathCost([create, { kind: "Trade", market: M, user: U, outcome: "YES", shares: 100 }], U);
  const split = pathCost(
    [
      create,
      { kind: "Trade", market: M, user: U, outcome: "YES", shares: 30 },
      { kind: "Trade", market: M, user: U, outcome: "YES", shares: 70 },
    ],
    U
  );
  check("path-independence: buy 100 == buy 30 + buy 70", Math.abs(single - split) < EPS, `${single} vs ${split}`);
}

// 2. LOOPS COST ZERO — buy then sell the same shares returns to start
{
  const loop: MarketEvent[] = [
    create,
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: 80 },
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: -80 },
  ];
  const w = replay(loop);
  const cost = pathCost(loop, U);
  const m = w.markets.get(M)!;
  check("loop cost is zero (buy 80 then sell 80)", Math.abs(cost) < EPS, `cost=${cost}`);
  check("loop returns market to start price 0.5", Math.abs(marketPrice(m) - 0.5) < EPS, `p=${marketPrice(m)}`);
}

// 3. DETERMINISM — replaying the same log twice yields identical state
{
  const log: MarketEvent[] = [
    create,
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: 40 },
    { kind: "Trade", market: M, user: "bob", outcome: "NO", shares: 25 },
  ];
  const a = replay(log);
  const b = replay(log);
  const ma = a.markets.get(M)!;
  const mb = b.markets.get(M)!;
  check("determinism: replay is a pure fold", ma.qYes === mb.qYes && ma.qNo === mb.qNo && a.bal.get(U) === b.bal.get(U));
}

// 4. CAUSALITY — illegal events must be rejected
{
  let rejectedSell = false;
  try {
    replay([create, { kind: "Trade", market: M, user: U, outcome: "YES", shares: -10 }]);
  } catch (e) {
    rejectedSell = e instanceof CausalError;
  }
  check("causality: cannot sell shares never bought", rejectedSell);

  let rejectedAfterResolve = false;
  try {
    replay([
      create,
      { kind: "Resolve", market: M, outcome: "YES" },
      { kind: "Trade", market: M, user: U, outcome: "YES", shares: 5 },
    ]);
  } catch (e) {
    rejectedAfterResolve = e instanceof CausalError;
  }
  check("causality: cannot trade a resolved market", rejectedAfterResolve);

  let rejectedTradeBeforeCreate = false;
  try {
    replay([{ kind: "Trade", market: M, user: U, outcome: "YES", shares: 5 }]);
  } catch (e) {
    rejectedTradeBeforeCreate = e instanceof CausalError;
  }
  check("causality: cannot trade before market exists", rejectedTradeBeforeCreate);
}

// 5. TAMPER-EVIDENCE — editing a sealed event breaks the chain
{
  const log: MarketEvent[] = [
    create,
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: 40 },
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: 20 },
  ];
  const sealed = sealChain(log);
  check("tamper-evidence: untouched chain verifies", verifyChain(sealed));
  // tamper: rewrite a past trade's size
  const tampered = sealed.map((s) => ({ ...s }));
  (tampered[1].event as { shares: number }).shares = 9999;
  check("tamper-evidence: edited past event is detected", verifyChain(tampered) === false);
}

// 6. TRUNCATION / PAYOUT — resolution pays winners 1/share, losers 0
{
  const log: MarketEvent[] = [
    create,
    { kind: "Trade", market: M, user: U, outcome: "YES", shares: 50 },
    { kind: "Trade", market: M, user: "bob", outcome: "NO", shares: 50 },
    { kind: "Resolve", market: M, outcome: "YES" },
  ];
  const w = replay(log);
  const aliceGain = (w.bal.get(U) ?? 0) - (START_BALANCE - pathCost([log[0], log[1]], U));
  // alice held 50 YES → should be paid +50 at resolution
  check("truncation: YES winner paid 1 credit per share", Math.abs(aliceGain - 50) < EPS, `gain=${aliceGain}`);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exitCode = failed === 0 ? 0 : 1;
