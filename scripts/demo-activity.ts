// Generates realistic multi-trader activity on one market so it crosses the
// graduation thresholds — for demoing the graduation pipeline. Idempotent-ish:
// re-running adds more activity. Run: npm run demo:activity

import { PrismaClient } from "@prisma/client";
import { tradeCost, priceYes, type Outcome } from "../src/lib/lmsr";

const prisma = new PrismaClient();
const SLUG = "humanoids-outnumbered-2030";

const HANDLES = ["trader_alpha", "trader_beta", "trader_gamma", "trader_delta"];
// [traderIndex, outcome, shares]
const PLAN: [number, Outcome, number][] = [
  [0, "YES", 40],
  [1, "YES", 55],
  [2, "NO", 20],
  [3, "YES", 50],
  [0, "YES", 60],
  [1, "YES", 35],
  [2, "YES", 45],
  [3, "YES", 30],
  [0, "YES", 40],
  [1, "YES", 25],
];

async function main() {
  const m = await prisma.market.findUnique({ where: { slug: SLUG } });
  if (!m) throw new Error(`market ${SLUG} not found — seed first`);

  const users = [];
  for (const handle of HANDLES) {
    users.push(
      await prisma.user.upsert({ where: { handle }, create: { handle }, update: {} })
    );
  }

  let qYes = m.qYes;
  let qNo = m.qNo;
  let volAdded = 0;

  for (const [ui, outcome, shares] of PLAN) {
    const u = users[ui];
    const cost = tradeCost(qYes, qNo, m.b, outcome, shares);
    if (outcome === "YES") qYes += shares;
    else qNo += shares;
    const p = priceYes(qYes, qNo, m.b);
    volAdded += Math.abs(cost);

    await prisma.$transaction([
      prisma.position.upsert({
        where: { userId_marketId: { userId: u.id, marketId: m.id } },
        create: {
          userId: u.id,
          marketId: m.id,
          yesShares: outcome === "YES" ? shares : 0,
          noShares: outcome === "NO" ? shares : 0,
        },
        update:
          outcome === "YES"
            ? { yesShares: { increment: shares } }
            : { noShares: { increment: shares } },
      }),
      prisma.user.update({ where: { id: u.id }, data: { balance: { decrement: cost } } }),
      prisma.trade.create({
        data: { userId: u.id, marketId: m.id, outcome, shares, cost, priceYes: p },
      }),
    ]);
  }

  await prisma.market.update({
    where: { id: m.id },
    data: { qYes, qNo, volume: { increment: volAdded } },
  });

  console.log(
    `Added ${PLAN.length} trades by ${HANDLES.length} traders to "${SLUG}". ` +
      `Price ${(priceYes(m.qYes, m.qNo, m.b) * 100).toFixed(0)}% → ${(priceYes(qYes, qNo, m.b) * 100).toFixed(0)}%, ` +
      `+${Math.round(volAdded)} cr volume.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
