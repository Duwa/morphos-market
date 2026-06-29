import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { tradeCost, priceYes, sharesForBudget, type Outcome } from "@/lib/lmsr";
import { serializeMarket } from "@/lib/market";

export const dynamic = "force-dynamic";

// Body: { marketId, outcome: "YES"|"NO", side: "BUY"|"SELL", shares?, budget? }
export async function POST(req: Request) {
  const user = await getOrCreateUser();
  let body: {
    marketId?: string;
    outcome?: Outcome;
    side?: "BUY" | "SELL";
    shares?: number;
    budget?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { marketId, outcome, side = "BUY" } = body;
  if (!marketId || (outcome !== "YES" && outcome !== "NO"))
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const market = await prisma.market.findUnique({ where: { id: marketId } });
  if (!market)
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status !== "OPEN")
    return NextResponse.json({ error: "Market is not open" }, { status: 409 });
  if (new Date(market.closesAt).getTime() < Date.now())
    return NextResponse.json({ error: "Market trading has closed" }, { status: 409 });

  const position = await prisma.position.findUnique({
    where: { userId_marketId: { userId: user.id, marketId: market.id } },
  });
  const owned =
    outcome === "YES" ? position?.yesShares ?? 0 : position?.noShares ?? 0;

  // Resolve the requested size into a signed share delta.
  let delta: number;
  if (side === "SELL") {
    const want = body.shares ?? owned; // default: sell entire position
    if (want <= 0)
      return NextResponse.json({ error: "Nothing to sell" }, { status: 400 });
    if (want > owned + 1e-9)
      return NextResponse.json(
        { error: `You only hold ${owned.toFixed(2)} ${outcome} shares` },
        { status: 400 }
      );
    delta = -Math.min(want, owned);
  } else {
    if (typeof body.budget === "number" && body.budget > 0) {
      delta = sharesForBudget(market.qYes, market.qNo, market.b, outcome, body.budget);
    } else if (typeof body.shares === "number" && body.shares > 0) {
      delta = body.shares;
    } else {
      return NextResponse.json({ error: "Specify shares or budget" }, { status: 400 });
    }
  }

  const cost = tradeCost(market.qYes, market.qNo, market.b, outcome, delta);
  // cost > 0 means the trader pays; cost < 0 means they receive credits.
  if (cost > 0 && cost > user.balance + 1e-9)
    return NextResponse.json(
      { error: `Insufficient balance: need ${cost.toFixed(2)}, have ${user.balance.toFixed(2)}` },
      { status: 400 }
    );

  const newQYes = outcome === "YES" ? market.qYes + delta : market.qYes;
  const newQNo = outcome === "NO" ? market.qNo + delta : market.qNo;
  const newPriceYes = priceYes(newQYes, newQNo, market.b);

  // Apply atomically.
  const [updatedMarket] = await prisma.$transaction([
    prisma.market.update({
      where: { id: market.id },
      data: { qYes: newQYes, qNo: newQNo, volume: { increment: Math.abs(cost) } },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: cost } },
    }),
    prisma.position.upsert({
      where: { userId_marketId: { userId: user.id, marketId: market.id } },
      create: {
        userId: user.id,
        marketId: market.id,
        yesShares: outcome === "YES" ? Math.max(0, delta) : 0,
        noShares: outcome === "NO" ? Math.max(0, delta) : 0,
      },
      update:
        outcome === "YES"
          ? { yesShares: { increment: delta } }
          : { noShares: { increment: delta } },
    }),
    prisma.trade.create({
      data: {
        userId: user.id,
        marketId: market.id,
        outcome,
        shares: delta,
        cost,
        priceYes: newPriceYes,
      },
    }),
  ]);

  const freshUser = await prisma.user.findUnique({ where: { id: user.id } });
  const freshPos = await prisma.position.findUnique({
    where: { userId_marketId: { userId: user.id, marketId: market.id } },
  });

  return NextResponse.json({
    market: serializeMarket(updatedMarket),
    filled: { outcome, shares: delta, cost },
    balance: freshUser?.balance ?? 0,
    position: {
      yesShares: freshPos?.yesShares ?? 0,
      noShares: freshPos?.noShares ?? 0,
    },
  });
}
