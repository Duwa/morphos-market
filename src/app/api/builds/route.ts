import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { GENESIS_HASH } from "@/lib/seal";
import { verifyPulls } from "@/lib/builds";

export const dynamic = "force-dynamic";

const KINDS = ["wheeled", "swarm", "snakearm", "quadruped", "softgripper", "tactile", "humanoid"];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function GET() {
  const builds = await prisma.build.findMany({
    include: { bom: true, pullEvents: { orderBy: { seq: "asc" } } },
    orderBy: [{ pulls: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(
    builds.map((b) => ({
      slug: b.slug,
      name: b.name,
      author: b.author,
      morphology: b.morphology,
      summary: b.summary,
      steps: b.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      pulls: b.pulls,
      bom: b.bom.map((i) => ({ part: i.part, qty: i.qty, materialSlug: i.materialSlug })),
      pullValid: verifyPulls(b.pullEvents, b.slug),
      pullHead: b.pullEvents.length ? b.pullEvents[b.pullEvents.length - 1].hash : GENESIS_HASH,
    }))
  );
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  let body: {
    name?: string;
    morphology?: string;
    summary?: string;
    steps?: string;
    bom?: { part?: string; qty?: number; materialSlug?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const summary = (body.summary ?? "").trim();
  if (name.length < 3) return NextResponse.json({ error: "Name your build" }, { status: 400 });
  if (summary.length < 10) return NextResponse.json({ error: "Add a short summary" }, { status: 400 });

  const morphology = KINDS.includes(body.morphology ?? "") ? (body.morphology as string) : "wheeled";
  const bom = (body.bom ?? [])
    .map((i) => ({ part: (i.part ?? "").trim(), qty: Math.max(1, Math.floor(i.qty ?? 1)), materialSlug: i.materialSlug || null }))
    .filter((i) => i.part.length > 0)
    .slice(0, 30);

  let slug = slugify(name);
  if (await prisma.build.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const build = await prisma.build.create({
    data: {
      slug,
      name: name.slice(0, 120),
      author: user.handle,
      morphology,
      summary: summary.slice(0, 400),
      steps: (body.steps ?? "").slice(0, 2000),
      bom: { create: bom },
    },
    include: { bom: true },
  });

  return NextResponse.json(
    {
      slug: build.slug,
      name: build.name,
      author: build.author,
      morphology: build.morphology,
      summary: build.summary,
      steps: build.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      pulls: 0,
      bom: build.bom.map((i) => ({ part: i.part, qty: i.qty, materialSlug: i.materialSlug })),
      pullValid: true,
      pullHead: GENESIS_HASH,
    },
    { status: 201 }
  );
}
