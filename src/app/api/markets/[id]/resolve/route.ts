import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Admin-style resolution. Pays 1 credit per winning share to every holder.
// Body: { outcome: "YES" | "NO" }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { outcome?: "YES" | "NO" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const outcome = body.outcome;
  if (outcome !== "YES" && outcome !== "NO")
    return NextResponse.json({ error: "outcome must be YES or NO" }, { status: 400 });

  const market =
    (await prisma.market.findUnique({ where: { id } })) ??
    (await prisma.market.findUnique({ where: { slug: id } }));
  if (!market)
    return NextResponse.json({ error: "Market not found" }, { status: 404 });
  if (market.status === "RESOLVED")
    return NextResponse.json({ error: "Already resolved" }, { status: 409 });

  const positions = await prisma.position.findMany({
    where: { marketId: market.id },
  });

  const payouts = positions
    .map((p) => ({
      userId: p.userId,
      amount: outcome === "YES" ? p.yesShares : p.noShares,
    }))
    .filter((x) => x.amount > 1e-9);

  await prisma.$transaction([
    prisma.market.update({
      where: { id: market.id },
      data: { status: "RESOLVED", outcome },
    }),
    ...payouts.map((x) =>
      prisma.user.update({
        where: { id: x.userId },
        data: { balance: { increment: x.amount } },
      })
    ),
  ]);

  return NextResponse.json({
    ok: true,
    outcome,
    paidHolders: payouts.length,
    totalPaid: payouts.reduce((s, x) => s + x.amount, 0),
  });
}
