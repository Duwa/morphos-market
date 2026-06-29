import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { getOrCreateUser } from "@/lib/session";

export const dynamic = "force-dynamic";

// `id` may be a cuid or a slug.
async function findMarket(id: string) {
  return (
    (await prisma.market.findUnique({ where: { id } })) ??
    (await prisma.market.findUnique({ where: { slug: id } }))
  );
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const market = await findMarket(id);
  if (!market)
    return NextResponse.json({ error: "Market not found" }, { status: 404 });

  const user = await getOrCreateUser();
  const position = await prisma.position.findUnique({
    where: { userId_marketId: { userId: user.id, marketId: market.id } },
  });
  const trades = await prisma.trade.findMany({
    where: { marketId: market.id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return NextResponse.json({
    market: serializeMarket(market),
    position: position
      ? { yesShares: position.yesShares, noShares: position.noShares }
      : { yesShares: 0, noShares: 0 },
    history: trades.map((t) => ({
      priceYes: t.priceYes,
      at: t.createdAt.toISOString(),
    })),
  });
}
