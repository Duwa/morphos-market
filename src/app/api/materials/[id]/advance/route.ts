import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { hashLink } from "@/lib/seal";
import { payloadOf, currentStage, nextStage, certificate, type Stage } from "@/lib/provenance";

export const dynamic = "force-dynamic";

// Advance a material to its next lifecycle stage. Causal order is enforced:
// you cannot skip a stage, and each event hash-links to the previous one.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getOrCreateUser();
  const { id } = await params;
  let body: { detail?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const material = await prisma.material.findUnique({
    where: { slug: id },
    include: { events: { orderBy: { seq: "asc" } } },
  });
  if (!material) return NextResponse.json({ error: "Material not found" }, { status: 404 });

  const cur = currentStage(material.events) as Stage | null;
  const next = nextStage(cur);
  if (!next || next === "Registered")
    return NextResponse.json({ error: "Already fully graduated" }, { status: 409 });

  const seq = material.events.length;
  const prevHash = material.events[material.events.length - 1].hash;
  const detail = (body.detail ?? "").trim().slice(0, 300) || defaultDetail(next);
  const payload = { seq, kind: next, detail, actor: user.handle };
  const hash = hashLink(prevHash, payloadOf(payload));

  await prisma.materialEvent.create({
    data: { materialId: material.id, ...payload, prevHash, hash },
  });

  const fresh = await prisma.material.findUnique({
    where: { id: material.id },
    include: { events: { orderBy: { seq: "asc" } } },
  });
  return NextResponse.json({ slug: material.slug, cert: certificate(fresh!.events) });
}

function defaultDetail(stage: string): string {
  switch (stage) {
    case "Tested":
      return "Passed independent validation";
    case "Adopted":
      return "Integrated into a shipping design";
    case "Graduated":
      return "Proven at scale — cleared for real-money markets";
    default:
      return stage;
  }
}
