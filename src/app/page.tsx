import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { MarketCard } from "@/components/MarketCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await prisma.market.findMany({ orderBy: { volume: "desc" } });
  const markets = rows.map(serializeMarket);

  const categories = Array.from(new Set(markets.map((m) => m.category)));

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* Thesis hero */}
      <section className="py-12 border-b border-border">
        <div className="label mb-3">Prediction market · robot morphology</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          Automation doesn&apos;t have to look like us.
        </h1>
        <p className="mt-4 max-w-2xl text-muted leading-relaxed">
          The humanoid is a human bias. Replicating the density and bandwidth of
          biological mechanoreceptors — the touch that makes hands dexterous — is
          brutally hard. So the winning shapes may be wheeled bases, swarms,
          continuum arms, and soft grippers. Trade your thesis on what
          automation actually becomes.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
          <Stat k="Open markets" v={markets.filter((m) => m.status === "OPEN").length.toString()} />
          <Stat k="Domains" v={categories.length.toString()} />
          <Stat
            k="Total volume"
            v={`${markets.reduce((s, m) => s + m.volume, 0).toLocaleString()} cr`}
          />
          <Stat k="Pricing" v="LMSR AMM" />
        </div>
      </section>

      {/* Markets grid */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="label text-ink">All markets</h2>
          <span className="label">{markets.length} contracts</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {markets.map((m) => (
            <MarketCard key={m.id} m={m} />
          ))}
        </div>
      </section>
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
