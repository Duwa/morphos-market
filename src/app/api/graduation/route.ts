import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  eventsFor,
  metricsFor,
  evaluate,
  pullsByMorphology,
  DEFAULT_THRESHOLDS,
} from "@/lib/graduation";
import { morphFor } from "@/lib/morphology";
import { loadReputation } from "@/lib/reputation-server";
import { logHead, sealChain, verifyChain } from "@/lib/seal";

export const dynamic = "force-dynamic";

export async function GET() {
  const [markets, builds, rep] = await Promise.all([
    prisma.market.findMany({ orderBy: { volume: "desc" } }),
    prisma.build.findMany({ select: { morphology: true, pulls: true } }),
    loadReputation(),
  ]);
  const pullMap = pullsByMorphology(builds);

  const results = await Promise.all(
    markets.map(async (m) => {
      const trades = await prisma.trade.findMany({
        where: { marketId: m.id },
        orderBy: { createdAt: "asc" },
      });
      const events = eventsFor(m, trades);
      const pulls = pullMap[morphFor(m.slug)] ?? 0;
      const metrics = metricsFor(m, events, pulls, rep.scores);
      const { checks, eligible, progress } = evaluate(metrics);

      const sealed = sealChain(events);
      const integrity = {
        chainValid: verifyChain(sealed),
        logHead: logHead(events),
        events: events.length,
      };

      return {
        slug: m.slug,
        title: m.title,
        category: m.category,
        status: m.status,
        eligible,
        progress,
        metrics,
        checks,
        integrity,
      };
    })
  );

  results.sort((a, b) =>
    a.eligible === b.eligible ? b.progress - a.progress : a.eligible ? -1 : 1
  );

  return NextResponse.json({ thresholds: DEFAULT_THRESHOLDS, markets: results });
}
