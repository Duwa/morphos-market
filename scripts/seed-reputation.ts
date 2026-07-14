// Resolves two markets with two-sided trading so reputation has signal. The
// traders are the same operators who back the non-humanoid market, so their
// track record here boosts that market's credibility. Run: npm run seed:rep

import { PrismaClient } from "@prisma/client";
import { tradeCost, priceYes, type Outcome } from "../src/lib/lmsr";

const prisma = new PrismaClient();

const ROUNDS: {
  slug: string; outcome: Outcome; trades: [string, Outcome, number][];
}[] = [
  {
    slug: "snake-arm-inspection-2028",
    outcome: "YES", // continuum arms did become standard
    trades: [
      ["trader_alpha", "YES", 30],
      ["trader_beta", "YES", 25],
      ["trader_gamma", "NO", 20], // wrong call
      ["trader_delta", "YES", 15],
    ],
  },
  {
    slug: "general-purpose-humanoid-profit-2030",
    outcome: "NO", // no profitable humanoid hardware business
    trades: [
      ["trader_alpha", "NO", 40],
      ["trader_beta", "NO", 30],
      ["trader_gamma", "YES", 25], // wrong call
      ["trader_delta", "NO", 20],
    ],
  },
];

async function main() {
  const users: Record<string, string> = {};
  for (const handle of ["trader_alpha", "trader_beta", "trader_gamma", "trader_delta"]) {
    const u = await prisma.user.upsert({ where: { handle }, create: { handle }, update: {} });
    users[handle] = u.id;
  }

  for (const r of ROUNDS) {
    const m = await prisma.market.findUnique({ where: { slug: r.slug } });
    if (!m) { console.warn(`skip ${r.slug} — not found`); continue; }
    if (m.status === "RESOLVED") { console.log(`skip ${r.slug} — already resolved`); continue; }

    let qYes = m.qYes, qNo = m.qNo, vol = 0;
    for (const [handle, outcome, shares] of r.trades) {
      const uid = users[handle];
      const cost = tradeCost(qYes, qNo, m.b, outcome, shares);
      if (outcome === "YES") qYes += shares; else qNo += shares;
      const p = priceYes(qYes, qNo, m.b);
      vol += Math.abs(cost);
      await prisma.$transaction([
        prisma.position.upsert({
          where: { userId_marketId: { userId: uid, marketId: m.id } },
          create: { userId: uid, marketId: m.id, yesShares: outcome === "YES" ? shares : 0, noShares: outcome === "NO" ? shares : 0 },
          update: outcome === "YES" ? { yesShares: { increment: shares } } : { noShares: { increment: shares } },
        }),
        prisma.trade.create({ data: { userId: uid, marketId: m.id, outcome, shares, cost, priceYes: p } }),
      ]);
    }
    await prisma.market.update({
      where: { id: m.id },
      data: { qYes, qNo, volume: { increment: vol }, status: "RESOLVED", outcome: r.outcome },
    });
    console.log(`Resolved ${r.slug} → ${r.outcome} (${r.trades.length} trades)`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
