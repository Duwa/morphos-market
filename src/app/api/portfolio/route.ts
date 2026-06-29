import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { priceYes } from "@/lib/lmsr";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getOrCreateUser();
  const positions = await prisma.position.findMany({
    where: { userId: user.id },
    include: { market: true },
  });

  const holdings = positions
    .filter((p) => p.yesShares > 1e-6 || p.noShares > 1e-6)
    .map((p) => {
      const pYes = priceYes(p.market.qYes, p.market.qNo, p.market.b);
      const resolved = p.market.status === "RESOLVED";
      // Mark-to-market: open positions at current price, resolved at payout.
      const yesValue = resolved
        ? p.market.outcome === "YES"
          ? p.yesShares
          : 0
        : p.yesShares * pYes;
      const noValue = resolved
        ? p.market.outcome === "NO"
          ? p.noShares
          : 0
        : p.noShares * (1 - pYes);
      return {
        marketId: p.market.id,
        slug: p.market.slug,
        title: p.market.title,
        status: p.market.status,
        outcome: p.market.outcome,
        priceYes: pYes,
        yesShares: p.yesShares,
        noShares: p.noShares,
        value: yesValue + noValue,
      };
    });

  const positionsValue = holdings.reduce((s, h) => s + h.value, 0);

  return NextResponse.json({
    handle: user.handle,
    balance: user.balance,
    positionsValue,
    netWorth: user.balance + positionsValue,
    holdings,
  });
}
