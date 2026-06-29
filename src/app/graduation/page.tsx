import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  eventsFor,
  metricsFor,
  evaluate,
  DEFAULT_THRESHOLDS,
} from "@/lib/graduation";
import { logHead, sealChain, verifyChain } from "@/lib/seal";
import { RobotArt } from "@/components/RobotArt";
import { morphFor } from "@/lib/morphology";

export const dynamic = "force-dynamic";

export default async function GraduationPage() {
  const markets = await prisma.market.findMany({ orderBy: { volume: "desc" } });

  const rows = await Promise.all(
    markets.map(async (m) => {
      const trades = await prisma.trade.findMany({
        where: { marketId: m.id },
        orderBy: { createdAt: "asc" },
      });
      const events = eventsFor(m, trades);
      const metrics = metricsFor(m, events);
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
        Morphos is the farm system. A market graduates to a real-money venue only
        when it shows genuine, broad-based signal — and the verdict is computed by
        replaying its tamper-evident causal log, so it&apos;s reproducible by
        anyone. This is the certificate a regulated exchange can trust.
      </p>

      {/* threshold legend */}
      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border border-border bg-surface-2 p-4 tick">
        <Legend k="Volume" v={`≥ ${DEFAULT_THRESHOLDS.minVolume} cr`} />
        <Legend k="Trades" v={`≥ ${DEFAULT_THRESHOLDS.minTrades}`} />
        <Legend k="Unique traders" v={`≥ ${DEFAULT_THRESHOLDS.minTraders}`} />
        <Legend k="Conviction" v={`≥ ${(DEFAULT_THRESHOLDS.minConviction * 100).toFixed(0)}% off 50/50`} />
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
                  <Crit label="vol" ok={r.checks.volume} v={`${Math.round(r.metrics.volume)}`} />
                  <Crit label="trades" ok={r.checks.trades} v={`${r.metrics.trades}`} />
                  <Crit label="traders" ok={r.checks.traders} v={`${r.metrics.traders}`} />
                  <Crit label="conviction" ok={r.checks.conviction} v={`${(r.metrics.conviction * 100).toFixed(0)}%`} />
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
