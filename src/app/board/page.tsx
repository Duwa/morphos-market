import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { morphFor } from "@/lib/morphology";
import { RobotArt, type MorphKind } from "@/components/RobotArt";
import { eventsFor, metricsFor, evaluate, pullsByMorphology } from "@/lib/graduation";
import { loadReputation } from "@/lib/reputation-server";
import { certificate } from "@/lib/provenance";

export const dynamic = "force-dynamic";

type Col = "Signal" | "Tested" | "Adopted" | "Pulled" | "Graduated";
const COLUMNS: { key: Col; blurb: string }[] = [
  { key: "Signal", blurb: "demand forecast" },
  { key: "Tested", blurb: "validated" },
  { key: "Adopted", blurb: "in a design" },
  { key: "Pulled", blurb: "real consumption" },
  { key: "Graduated", blurb: "proven" },
];

type Card = {
  type: "market" | "material" | "build";
  title: string;
  metric: string;
  morph: MorphKind;
  col: Col;
  href: string;
};

const TONE = { market: "var(--accent)", material: "var(--warn)", build: "var(--yes)" };

export default async function BoardPage() {
  const [marketRows, matRows, buildRows] = await Promise.all([
    prisma.market.findMany({ orderBy: { volume: "desc" } }),
    prisma.material.findMany({ include: { events: { orderBy: { seq: "asc" } } } }),
    prisma.build.findMany({ orderBy: { pulls: "desc" } }),
  ]);
  const pullMap = pullsByMorphology(buildRows);
  const rep = await loadReputation();

  const marketCards: Card[] = await Promise.all(
    marketRows.map(async (m) => {
      const trades = await prisma.trade.findMany({ where: { marketId: m.id }, orderBy: { createdAt: "asc" } });
      const { eligible } = evaluate(metricsFor(m, eventsFor(m, trades), pullMap[morphFor(m.slug)] ?? 0, rep.scores));
      const s = serializeMarket(m);
      return {
        type: "market" as const,
        title: m.title,
        metric: `${Math.round(s.priceYes * 100)}% YES`,
        morph: morphFor(m.slug),
        col: m.status === "RESOLVED" || eligible ? "Graduated" : "Signal",
        href: `/market/${m.slug}`,
      };
    })
  );

  const matCards: Card[] = matRows.map((m) => {
    const stage = certificate(m.events).stage;
    const col: Col = stage === "Tested" ? "Tested" : stage === "Adopted" ? "Adopted" : stage === "Graduated" ? "Graduated" : "Signal";
    return { type: "material", title: m.name, metric: stage ?? "Registered", morph: m.morphology as MorphKind, col, href: "/materials" };
  });

  const buildCards: Card[] = buildRows.map((b) => ({
    type: "build",
    title: b.name,
    metric: `${b.pulls} pulls`,
    morph: b.morphology as MorphKind,
    col: b.pulls > 0 ? "Pulled" : "Adopted",
    href: "/build",
  }));

  const all = [...marketCards, ...matCards, ...buildCards];

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Board · the pull system</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        Demand pulls the pipeline.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        One board for the whole system. Market forecasts sense demand on the left; materials,
        designs, and builds flow right as they&apos;re tested, adopted, and pulled by real
        consumption — until they graduate. Nothing is pushed on a guess; every move is a
        causal event.
      </p>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Legend tone={TONE.market} label="Markets · signal" />
        <Legend tone={TONE.material} label="Materials · provenance" />
        <Legend tone={TONE.build} label="Builds · pull" />
      </div>

      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((c) => {
          const cards = all.filter((x) => x.col === c.key);
          return (
            <div key={c.key} className="min-w-[200px] w-[200px] shrink-0">
              <div className="tick border border-border bg-surface-2 px-3 py-2 mb-2">
                <div className="flex items-center justify-between">
                  <span className="label text-ink">{c.key}</span>
                  <span className="mono text-sm font-semibold">{cards.length}</span>
                </div>
                <div className="label">{c.blurb}</div>
              </div>
              <div className="space-y-2">
                {cards.map((card, i) => (
                  <Link key={i} href={card.href}
                    className="block border border-border bg-surface rounded p-2.5 hover:border-border-strong transition-colors"
                    style={{ borderLeft: `3px solid ${TONE[card.type]}` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 shrink-0 bg-surface-2 rounded overflow-hidden relative">
                        <RobotArt kind={card.morph} className="absolute inset-0" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[0.8rem] font-medium text-ink leading-tight line-clamp-2">{card.title}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="label" style={{ color: TONE[card.type] }}>{card.type}</span>
                      <span className="mono text-[0.7rem] text-ink">{card.metric}</span>
                    </div>
                  </Link>
                ))}
                {cards.length === 0 && <div className="label text-center py-4">—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-sm" style={{ background: tone }} />
      <span className="label">{label}</span>
    </div>
  );
}
