import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  const markets = await prisma.market.findMany({
    orderBy: { volume: "desc" },
  });
  return NextResponse.json(markets.map(serializeMarket));
}
