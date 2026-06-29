import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { MarketCard } from "@/components/MarketCard";
import { RobotArt } from "@/components/RobotArt";
import { MORPHOLOGIES } from "@/lib/morphology";

export const dynamic = "force-dynamic";

export default async function Home() {
  const rows = await prisma.market.findMany({ orderBy: { volume: "desc" } });
  const markets = rows.map(serializeMarket);

  const categories = Array.from(new Set(markets.map((m) => m.category)));

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* Cinematic thesis hero */}
      <section className="border-b border-border">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 py-12 items-center">
          <div>
            <div className="label mb-3">Prediction market · robot morphology</div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
              Automation doesn&apos;t have to look like us.
            </h1>
            <p className="mt-5 max-w-xl text-muted leading-relaxed">
              The humanoid is a human bias. Replicating the density and bandwidth
              of biological mechanoreceptors — the touch that makes hands
              dexterous — is brutally hard. So the winning shapes may be wheeled
              bases, swarms, continuum arms, and soft grippers.
            </p>
            <p className="mt-3 max-w-xl text-ink font-medium">
              Trade your thesis on what automation actually becomes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#markets" className="btn rounded px-5 py-2.5 bg-ink text-white border-transparent">
                Enter the markets
              </a>
              <Link href="/atlas" className="btn rounded px-5 py-2.5 bg-surface text-ink">
                Explore the atlas
              </Link>
            </div>
          </div>

          {/* large featured form, with the field of alternatives behind it */}
          <div className="relative tick border border-border bg-surface-2 scanline aspect-[4/3] overflow-hidden">
            <RobotArt kind="swarm" className="absolute inset-0 p-6" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between bg-surface/80 backdrop-blur border-t border-border">
              <span className="label">Cooperative swarm</span>
              <span className="label">one of many possible shapes →</span>
            </div>
          </div>
        </div>

        {/* morphology strip — room for imagination */}
        <div className="pb-10">
          <div className="label mb-3">The morphology space</div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {MORPHOLOGIES.map((m) => (
              <Link
                key={m.kind}
                href={`/atlas#${m.kind}`}
                className="group border border-border bg-surface hover:border-border-strong transition-colors p-1"
                title={m.name}
              >
                <div className="h-16">
                  <RobotArt kind={m.kind} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="label text-center truncate px-1 pb-1">{m.name.split(" / ")[0].split(" ")[0]}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-2 pb-10">
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
      <section id="markets" className="py-8 scroll-mt-20">
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
