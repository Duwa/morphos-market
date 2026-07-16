import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { MarketCard } from "@/components/MarketCard";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const rows = await prisma.market.findMany({ orderBy: { volume: "desc" } });
  const markets = rows.map(serializeMarket);
  const categories = Array.from(new Set(markets.map((m) => m.category)));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Markets</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
        What shape will automation take?
      </h1>
      <p className="mt-3 max-w-2xl text-muted leading-relaxed">
        Binary milestone markets on robot morphology. Back the future you believe
        in — priced by a manipulation-resistant market maker.
      </p>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        <Stat k="Open markets" v={markets.filter((m) => m.status === "OPEN").length.toString()} />
        <Stat k="Domains" v={categories.length.toString()} />
        <Stat k="Total volume" v={`${markets.reduce((s, m) => s + m.volume, 0).toLocaleString()} cr`} />
        <Stat k="Pricing" v="LMSR AMM" />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {markets.map((m) => (
          <MarketCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="mono text-xl font-semibold text-ink">{v}</div>
      <div className="label mt-0.5">{k}</div>
    </div>
  );
}
