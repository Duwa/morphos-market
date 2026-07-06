import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";
import { hashLink, GENESIS_HASH } from "@/lib/seal";
import { payloadOf, certificate } from "@/lib/provenance";

export const dynamic = "force-dynamic";

const KINDS = ["softgripper", "tactile", "wheeled", "swarm", "snakearm", "quadruped", "humanoid"];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

export async function GET() {
  const materials = await prisma.material.findMany({
    include: { events: { orderBy: { seq: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const out = materials.map((m) => ({
    slug: m.slug,
    name: m.name,
    innovator: m.innovator,
    category: m.category,
    morphology: m.morphology,
    description: m.description,
    cert: certificate(m.events),
  }));
  return NextResponse.json(out);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  let body: { name?: string; category?: string; morphology?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const description = (body.description ?? "").trim();
  const category = (body.category ?? "").trim() || "Uncategorized";
  const morphology = KINDS.includes(body.morphology ?? "") ? (body.morphology as string) : "softgripper";
  if (name.length < 3) return NextResponse.json({ error: "Name the material" }, { status: 400 });
  if (description.length < 10) return NextResponse.json({ error: "Describe what it does" }, { status: 400 });

  let slug = slugify(name);
  if (await prisma.material.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  // first provenance event, hash-chained from genesis
  const first = { seq: 0, kind: "Registered", detail: `Registered by ${user.handle}`, actor: user.handle };
  const hash = hashLink(GENESIS_HASH, payloadOf(first));

  const material = await prisma.material.create({
    data: {
      slug,
      name: name.slice(0, 120),
      innovator: user.handle,
      category: category.slice(0, 60),
      morphology,
      description: description.slice(0, 600),
      events: {
        create: { ...first, prevHash: GENESIS_HASH, hash },
      },
    },
    include: { events: { orderBy: { seq: "asc" } } },
  });

  return NextResponse.json(
    {
      slug: material.slug,
      name: material.name,
      innovator: material.innovator,
      category: material.category,
      morphology: material.morphology,
      description: material.description,
      cert: certificate(material.events),
    },
    { status: 201 }
  );
}
