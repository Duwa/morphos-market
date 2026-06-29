import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const sub = await prisma.submission.update({
      where: { id },
      data: { votes: { increment: 1 } },
    });
    return NextResponse.json({ votes: sub.votes });
  } catch {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }
}
