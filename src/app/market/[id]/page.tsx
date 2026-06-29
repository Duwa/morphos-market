import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { priceYes } from "@/lib/lmsr";
import { TradePanel } from "@/components/TradePanel";
import { Sparkline } from "@/components/Sparkline";
import { getOrCreateUser } from "@/lib/session";
import { pct1, daysUntil, CATEGORY_TONE } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row =
    (await prisma.market.findUnique({ where: { slug: id } })) ??
    (await prisma.market.findUnique({ where: { id } }));
  if (!row) notFound();

  const market = serializeMarket(row);
  const user = await getOrCreateUser();
  const position = await prisma.position.findUnique({
    where: { userId_marketId: { userId: user.id, marketId: row.id } },
  });
  const trades = await prisma.trade.findMany({
    where: { marketId: row.id },
    orderBy: { createdAt: "asc" },
    take: 300,
  });

  // Price history: seed at the implied opening price, then each trade.
  const opening = priceYes(0, 0, row.b); // 0.5 baseline
  const history = [opening, ...trades.map((t) => t.priceYes), market.priceYes];

  const tone = CATEGORY_TONE[market.category] ?? "var(--accent)";

  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <Link href="/" className="label hover:text-ink transition-colors">
        ← All markets
      </Link>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mt-4">
        {/* Left: market detail */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <span className="label" style={{ color: tone }}>
              ▍{market.category}
            </span>
            <span className="label">
              {market.status === "RESOLVED"
                ? `resolved ${market.outcome}`
                : `closes in ${daysUntil(market.closesAt)}`}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight leading-snug">
            {market.title}
          </h1>

          {/* Headline probability + chart */}
          <div className="tick border border-border bg-surface mt-6 p-5">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="label">YES probability</div>
                <div className="mono text-4xl font-bold" style={{ color: "var(--yes)" }}>
                  {pct1(market.priceYes)}
                </div>
              </div>
              <div className="text-right">
                <div className="label">NO</div>
                <div className="mono text-2xl font-semibold" style={{ color: "var(--no)" }}>
                  {pct1(market.priceNo)}
                </div>
              </div>
            </div>
            <Sparkline points={history} />
            <div className="flex justify-between label mt-2">
              <span>open {pct1(opening)}</span>
              <span>{trades.length} trades · vol {market.volume.toLocaleString()} cr</span>
            </div>
          </div>

          {/* Resolution criteria */}
          <div className="mt-6">
            <h2 className="label text-ink mb-2">Resolution criteria</h2>
            <p className="text-muted leading-relaxed">{market.description}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-px bg-border border border-border">
            <Meta k="Status" v={market.status} />
            <Meta k="Closes" v={new Date(market.closesAt).toLocaleDateString()} />
            <Meta k="Resolves" v={new Date(market.resolvesAt).toLocaleDateString()} />
            <Meta k="Liquidity b" v={market.b.toString()} />
            <Meta k="YES shares" v={market.qYes.toFixed(1)} />
            <Meta k="NO shares" v={market.qNo.toFixed(1)} />
          </div>
        </div>

        {/* Right: trade panel */}
        <div className="lg:sticky lg:top-20 self-start">
          <TradePanel
            initialMarket={market}
            initialPosition={{
              yesShares: position?.yesShares ?? 0,
              noShares: position?.noShares ?? 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <div className="label">{k}</div>
      <div className="mono text-sm text-ink mt-0.5">{v}</div>
    </div>
  );
}
