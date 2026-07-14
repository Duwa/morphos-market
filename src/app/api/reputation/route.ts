import { NextResponse } from "next/server";
import { loadReputation } from "@/lib/reputation-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { stats } = await loadReputation();
  return NextResponse.json(
    stats
      .filter((s) => s.calls > 0)
      .map((s) => ({
        handle: s.handle,
        score: s.score,
        calls: s.calls,
        wins: s.wins,
        losses: s.losses,
      }))
  );
}
