import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  eventsFor,
  metricsFor,
  evaluate,
  pullsByMorphology,
  DEFAULT_THRESHOLDS,
} from "@/lib/graduation";
import { logHead, sealChain, verifyChain } from "@/lib/seal";
import { RobotArt } from "@/components/RobotArt";
import { morphFor } from "@/lib/morphology";
import { loadReputation } from "@/lib/reputation-server";

export const dynamic = "force-dynamic";

export default async function GraduationPage() {
  const [markets, builds, rep] = await Promise.all([
    prisma.market.findMany({ orderBy: { volume: "desc" } }),
    prisma.build.findMany({ select: { morphology: true, pulls: true } }),
    loadReputation(),
  ]);
  const pullMap = pullsByMorphology(builds);

  const rows = await Promise.all(
    markets.map(async (m) => {
      const trades = await prisma.trade.findMany({
        where: { marketId: m.id },
        orderBy: { createdAt: "asc" },
      });
      const events = eventsFor(m, trades);
      const metrics = metricsFor(m, events, pullMap[morphFor(m.slug)] ?? 0, rep.scores);
      const verdict = evaluate(metrics);
      const sealed = sealChain(events);
      return {
        slug: m.slug,
        title: m.title,
        metrics,
        ...verdict,
        integrity: {
          chainValid: verifyChain(sealed),
          head: logHead(events),
          events: events.length,
        },
      };
    })
  );
  rows.sort((a, b) =>
    a.eligible === b.eligible ? b.progress - a.progress : a.eligible ? -1 : 1
  );

  const eligibleCount = rows.filter((r) => r.eligible).length;

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="label mb-2">Graduation</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        The markets that earned their way up.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        The best rises — not on money, on <span className="text-ink">belief and real demand</span>.
        A market graduates when many people believe (breadth), the crowd has decided
        (conviction), and real makers are building it (pull from the DIY market). Raw
        volume is shown but doesn&apos;t gate — that was the casino metric. The verdict
        replays a tamper-evident causal log, so anyone can verify it.
      </p>

      {/* threshold legend */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border border-border bg-surface-2 p-4 tick">
        <Legend k="Breadth" v={`≥ ${DEFAULT_THRESHOLDS.minTraders} believers`} />
        <Legend k="Conviction" v={`≥ ${(DEFAULT_THRESHOLDS.minConviction * 100).toFixed(0)}% off 50/50`} />
        <Legend k="Real pull" v={`≥ ${DEFAULT_THRESHOLDS.minPulls} builds`} />
        <Legend k="Activity" v={`≥ ${DEFAULT_THRESHOLDS.minTrades} trades`} />
        <Legend k="Eligible now" v={`${eligibleCount} / ${rows.length}`} />
      </div>

      <div className="mt-8 space-y-4">
        {rows.map((r) => (
          <div key={r.slug} className="tick border border-border bg-surface">
            <div className="grid sm:grid-cols-[100px_1fr_auto] gap-4 p-4 items-center">
              <div className="hidden sm:block h-16 bg-surface-2 border border-border rounded scanline relative overflow-hidden">
                <RobotArt kind={morphFor(r.slug)} className="absolute inset-0 p-1" />
              </div>

              <div className="min-w-0">
                <Link href={`/market/${r.slug}`} className="font-semibold text-ink hover:text-accent leading-snug line-clamp-2">
                  {r.title}
                </Link>
                <div className="mt-2">
                  <div className="meter">
                    <span style={{ width: `${r.progress * 100}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  <Crit label="believers" ok={r.checks.breadth} v={`${r.metrics.traders}${r.metrics.credibility > 0.05 ? ` +${r.metrics.credibility.toFixed(1)}★` : ""}`} />
                  <Crit label="conviction" ok={r.checks.conviction} v={`${(r.metrics.conviction * 100).toFixed(0)}%`} />
                  <Crit label="real pull" ok={r.checks.pull} v={`${r.metrics.pulls}`} />
                  <Crit label="trades" ok={r.checks.activity} v={`${r.metrics.trades}`} />
                </div>
              </div>

              <div className="text-right shrink-0">
                {r.eligible ? (
                  <span className="btn rounded px-3 py-1.5 inline-block" style={{ background: "var(--yes)", color: "#fff", borderColor: "transparent" }}>
                    ✓ Graduates
                  </span>
                ) : (
                  <span className="label">{Math.round(r.progress * 100)}% there</span>
                )}
              </div>
            </div>

            {/* integrity strip — the verifiable bit */}
            <div className="border-t border-border px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 bg-surface-2">
              <span className="label" style={{ color: r.integrity.chainValid ? "var(--yes)" : "var(--no)" }}>
                {r.integrity.chainValid ? "✓ log verified" : "✗ log broken"}
              </span>
              <span className="label">{r.integrity.events} events</span>
              <span className="label mono truncate">head {r.integrity.head.slice(0, 16)}…</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="label">{k}: </span>
      <span className="mono text-sm text-ink">{v}</span>
    </div>
  );
}

function Crit({ label, ok, v }: { label: string; ok: boolean; v: string }) {
  return (
    <span className="label" style={{ color: ok ? "var(--yes)" : "var(--faint)" }}>
      {ok ? "✓" : "○"} {label} {v}
    </span>
  );
}
