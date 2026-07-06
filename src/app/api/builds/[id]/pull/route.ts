import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { hashLink, GENESIS_HASH } from "@/lib/seal";
import { pullPayload } from "@/lib/builds";

export const dynamic = "force-dynamic";

// "Build this" = a real consumption-pull event. Hash-chained onto the build's
// pull log — this is the confirmed demand that makes Morphos a true JIT system.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  const { id } = await params;

  const build = await prisma.build.findUnique({
    where: { slug: id },
    include: { pullEvents: { orderBy: { seq: "asc" } } },
  });
  if (!build) return NextResponse.json({ error: "Build not found" }, { status: 404 });

  const seq = build.pullEvents.length;
  const prevHash = seq ? build.pullEvents[seq - 1].hash : GENESIS_HASH;
  const hash = hashLink(prevHash, pullPayload(seq, user.handle, build.slug));

  const [updated] = await prisma.$transaction([
    prisma.build.update({ where: { id: build.id }, data: { pulls: { increment: 1 } } }),
    prisma.pullEvent.create({
      data: { buildId: build.id, seq, actor: user.handle, prevHash, hash },
    }),
  ]);

  return NextResponse.json({ pulls: updated.pulls, pullHead: hash, pullValid: true });
}
