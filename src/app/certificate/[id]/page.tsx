import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  eventsFor,
  metricsFor,
  evaluate,
  pullsByMorphology,
} from "@/lib/graduation";
import { loadReputation } from "@/lib/reputation-server";
import { morphFor } from "@/lib/morphology";
import { logHead, sealChain, verifyChain } from "@/lib/seal";
import { RobotArt } from "@/components/RobotArt";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const market =
    (await prisma.market.findUnique({ where: { slug: id } })) ??
    (await prisma.market.findUnique({ where: { id } }));
  if (!market) notFound();

  const [trades, builds, rep] = await Promise.all([
    prisma.trade.findMany({ where: { marketId: market.id }, orderBy: { createdAt: "asc" } }),
    prisma.build.findMany({ select: { morphology: true, pulls: true } }),
    loadReputation(),
  ]);
  const pulls = pullsByMorphology(builds)[morphFor(market.slug)] ?? 0;
  const events = eventsFor(market, trades);
  const metrics = metricsFor(market, events, pulls, rep.scores);
  const { checks, eligible } = evaluate(metrics);
  const sealed = sealChain(events);
  const chainValid = verifyChain(sealed);
  const head = logHead(events);

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/graduation" className="label hover:text-ink transition-colors">← Graduation</Link>
        <PrintButton />
      </div>

      <div className="tick border-2 border-border-strong bg-surface p-8 relative">
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <div className="label" style={{ color: "var(--accent)" }}>Morphos · promotion certificate</div>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              {eligible ? "Cleared for promotion" : "Not yet graduated"}
            </h1>
          </div>
          <div className="w-16 h-16 shrink-0 rounded-full border-2 flex items-center justify-center"
            style={{ borderColor: eligible ? "var(--yes)" : "var(--faint)" }}>
            <span className="mono text-2xl" style={{ color: eligible ? "var(--yes)" : "var(--faint)" }}>
              {eligible ? "✓" : "○"}
            </span>
          </div>
        </div>

        {/* subject */}
        <div className="grid sm:grid-cols-[1fr_120px] gap-4 items-center py-5 border-b border-border">
          <div>
            <div className="label mb-1">Market</div>
            <div className="text-lg font-semibold leading-snug">{market.title}</div>
            <p className="mt-2 text-sm text-muted leading-relaxed">{market.description}</p>
          </div>
          <div className="hidden sm:block h-24 bg-surface-2 border border-border rounded scanline relative overflow-hidden">
            <RobotArt kind={morphFor(market.slug)} className="absolute inset-0 p-1" />
          </div>
        </div>

        {/* the qualifying signals */}
        <div className="py-5 border-b border-border">
          <div className="label mb-3">Qualified on — belief and real demand, not volume</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border border border-border">
            <Cell k="Believers" v={`${metrics.traders}`} ok={checks.breadth} sub={metrics.credibility > 0.05 ? `+${metrics.credibility.toFixed(1)}★ proven` : "unweighted"} />
            <Cell k="Conviction" v={`${(metrics.conviction * 100).toFixed(0)}%`} ok={checks.conviction} sub="off 50/50" />
            <Cell k="Real pull" v={`${metrics.pulls}`} ok={checks.pull} sub="builds" />
            <Cell k="Activity" v={`${metrics.trades}`} ok={checks.activity} sub="trades" />
          </div>
        </div>

        {/* verifiable provenance */}
        <div className="py-5 border-b border-border">
          <div className="label mb-2">Verifiable provenance</div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="mono" style={{ color: chainValid ? "var(--yes)" : "var(--no)" }}>{chainValid ? "✓" : "✗"}</span>
              <span className="text-muted">Causal log {chainValid ? "verified — tamper-evident & replay-reproducible" : "broken"}</span>
            </div>
            <div className="text-muted">{events.length} events</div>
          </div>
          <div className="mono text-xs mt-3 p-3 rounded bg-surface-2 border border-border break-all" style={{ color: "var(--muted)" }}>
            log head sha256: {head}
          </div>
        </div>

        {/* statement */}
        <div className="pt-5">
          {eligible ? (
            <p className="text-sm leading-relaxed">
              This market has earned broad, credible belief and confirmed real-world
              demand, verified by replaying its tamper-evident causal log. It is{" "}
              <span className="font-semibold text-ink">cleared for promotion to a real-money venue</span>.
              Anyone can independently reproduce this verdict from the log head above.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              This market has not yet met the graduation gate. It is shown here for
              transparency — the same verifiable criteria apply to every market.
            </p>
          )}
        </div>
      </div>

      <p className="label mt-4 text-center">Morphos · morphology &gt; anthropomorphism</p>
    </div>
  );
}

function Cell({ k, v, ok, sub }: { k: string; v: string; ok: boolean; sub: string }) {
  return (
    <div className="bg-surface p-3">
      <div className="label">{k}</div>
      <div className="mono text-xl font-semibold mt-0.5" style={{ color: ok ? "var(--yes)" : "var(--faint)" }}>
        {ok ? "✓ " : ""}{v}
      </div>
      <div className="label mt-0.5">{sub}</div>
    </div>
  );
}
