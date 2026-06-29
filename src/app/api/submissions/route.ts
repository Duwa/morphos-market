import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const KINDS = [
  "humanoid",
  "wheeled",
  "swarm",
  "snakearm",
  "quadruped",
  "softgripper",
  "tactile",
];

export async function GET() {
  const subs = await prisma.submission.findMany({
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json(subs);
}

export async function POST(req: Request) {
  const user = await getOrCreateUser();
  let body: {
    formName?: string;
    morphology?: string;
    pitch?: string;
    question?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const formName = (body.formName ?? "").trim();
  const pitch = (body.pitch ?? "").trim();
  if (formName.length < 3)
    return NextResponse.json({ error: "Give your form a name" }, { status: 400 });
  if (pitch.length < 10)
    return NextResponse.json({ error: "Add a sentence on why this shape wins" }, { status: 400 });

  const morphology = KINDS.includes(body.morphology ?? "")
    ? (body.morphology as string)
    : "humanoid";

  const sub = await prisma.submission.create({
    data: {
      formName: formName.slice(0, 120),
      morphology,
      pitch: pitch.slice(0, 600),
      question: (body.question ?? "").trim().slice(0, 240) || null,
      author: user.handle,
    },
  });
  return NextResponse.json(sub, { status: 201 });
}
