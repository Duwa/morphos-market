import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { RobotArt, type MorphKind } from "@/components/RobotArt";
import { COMPONENTS, TASKS, VERDICTS, type Component } from "@/lib/dexterity";
import { pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DexterityPage() {
  const rows = await prisma.market.findMany();
  const priceBySlug = new Map(rows.map((r) => [r.slug, serializeMarket(r).priceYes]));

  return (
    <div className="max-w-5xl mx-auto px-5 py-10">
      <div className="label mb-2">The dexterity ladder · prediction markets as journalism</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        Does the job need a hand — or just a hack?
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        &ldquo;Humans do this work, so a humanoid should&rdquo; is the anthropomorphic
        fallacy. Real dexterity is four capabilities the hand fuses into one shape.
        Unbundle them, and most labour needs only a <span className="text-ink">hackable slice</span> —
        not the whole hand. This isn&apos;t an op-ed; the crowd&apos;s live price is the verdict.
      </p>

      {/* the four components */}
      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {COMPONENTS.map((c) => (
          <div key={c.key} className="tick border border-border bg-surface p-4">
            <div className="label" style={{ color: c.key === "tactile" ? "var(--no)" : "var(--accent)" }}>{c.status}</div>
            <div className="font-semibold text-ink mt-1">{c.label}</div>
            <p className="text-sm text-muted mt-1.5 leading-relaxed">{c.note}</p>
          </div>
        ))}
      </div>

      {/* the ladder */}
      <h2 className="label text-ink mt-12 mb-4">Human labour, decomposed</h2>
      <div className="space-y-3">
        {TASKS.map((t) => {
          const price = t.marketSlug ? priceBySlug.get(t.marketSlug) : undefined;
          const v = VERDICTS[t.verdict];
          return (
            <div key={t.name} className="tick border border-border bg-surface p-4">
              <div className="grid sm:grid-cols-[72px_1fr_auto] gap-4 items-center">
                <div className="hidden sm:block h-14 bg-surface-2 border border-border rounded scanline relative overflow-hidden">
                  <RobotArt kind={t.morphology as MorphKind} className="absolute inset-0 p-1" />
                </div>

                <div className="min-w-0">
                  <div className="font-semibold text-ink leading-snug">{t.name}</div>
                  <p className="text-sm text-muted mt-1 leading-relaxed">{t.note}</p>
                  {/* which components it demands */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {COMPONENTS.map((c) => {
                      const on = t.needs.includes(c.key as Component);
                      return (
                        <span key={c.key} className="mono text-[0.7rem] px-2 py-0.5 rounded border"
                          style={{
                            borderColor: on ? (c.key === "tactile" ? "var(--no)" : "var(--accent)") : "var(--border)",
                            color: on ? (c.key === "tactile" ? "var(--no)" : "var(--accent)") : "var(--faint)",
                            background: on ? "var(--surface-2)" : "var(--surface)",
                          }}>
                          {on ? "●" : "○"} {c.label.split(" ")[0].toLowerCase()}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span className="btn rounded px-2.5 py-1 text-[0.7rem] inline-block" style={{ borderColor: v.color, color: v.color, background: "var(--surface)" }}>
                    {v.label}
                  </span>
                  {price !== undefined ? (
                    <Link href={`/market/${t.marketSlug}`} className="label hover:text-ink">
                      market <span className="mono font-semibold" style={{ color: "var(--yes)" }}>{pct(price)}</span> →
                    </Link>
                  ) : (
                    <span className="label">no market yet</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-muted leading-relaxed max-w-2xl">
        Read down the ladder: force and reach are already won by non-humanoid forms;
        the fight narrows to <span className="text-ink">touch</span>, and even there the
        hacks (vision-based tactile, structured tasks) are closing in. The humanoid&apos;s
        real ground is the blind, unstructured, one-off long tail — real, but smaller
        than the hype, and shrinking. Don&apos;t take our word for it. Watch the prices.
      </p>
    </div>
  );
}
