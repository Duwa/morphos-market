import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  eventsFor,
  metricsFor,
  evaluate,
  DEFAULT_THRESHOLDS,
} from "@/lib/graduation";
import { logHead, sealChain, verifyChain } from "@/lib/seal";

export const dynamic = "force-dynamic";

export async function GET() {
  const markets = await prisma.market.findMany({ orderBy: { volume: "desc" } });

  const results = await Promise.all(
    markets.map(async (m) => {
      const trades = await prisma.trade.findMany({
        where: { marketId: m.id },
        orderBy: { createdAt: "asc" },
      });
      const events = eventsFor(m, trades);
      const metrics = metricsFor(m, events);
      const { checks, eligible, progress } = evaluate(metrics);

      // tamper-evident commitment to the market's full causal log
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

  // graduation candidates first, then by progress
  results.sort((a, b) =>
    a.eligible === b.eligible ? b.progress - a.progress : a.eligible ? -1 : 1
  );

  return NextResponse.json({ thresholds: DEFAULT_THRESHOLDS, markets: results });
}
