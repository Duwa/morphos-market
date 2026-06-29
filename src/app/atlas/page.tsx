import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeMarket } from "@/lib/market";
import { RobotArt } from "@/components/RobotArt";
import { MORPHOLOGIES } from "@/lib/morphology";
import { pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AtlasPage() {
  const rows = await prisma.market.findMany();
  const bySlug = new Map(rows.map((r) => [r.slug, serializeMarket(r)]));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Morphology atlas</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        The shapes automation could take.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        Every robot doesn&apos;t converge on a body like ours. Here&apos;s the
        design space — each form, the argument for why it might win, and the live
        markets pricing it. Imagine the one that isn&apos;t here yet, then{" "}
        <Link href="/imagine" className="text-accent underline underline-offset-2">
          propose it
        </Link>
        .
      </p>

      <div className="mt-10 space-y-4">
        {MORPHOLOGIES.map((m, i) => {
          const linked = m.marketSlugs
            .map((s) => bySlug.get(s))
            .filter(Boolean) as ReturnType<typeof serializeMarket>[];
          const reverse = i % 2 === 1;
          return (
            <section
              key={m.kind}
              id={m.kind}
              className="tick border border-border bg-surface scroll-mt-20 grid md:grid-cols-[280px_1fr]"
              style={reverse ? { direction: "rtl" } : undefined}
            >
              {/* art panel */}
              <div className="relative bg-surface-2 scanline border-border md:border-r min-h-[200px]" style={{ direction: "ltr" }}>
                <RobotArt kind={m.kind} className="absolute inset-0 p-6" />
              </div>

              {/* text panel */}
              <div className="p-6" style={{ direction: "ltr" }}>
                <h2 className="text-xl font-bold tracking-tight">{m.name}</h2>
                <div className="label mt-1" style={{ color: "var(--accent)" }}>
                  {m.tagline}
                </div>
                <p className="mt-3 text-muted leading-relaxed">{m.thesis}</p>

                {linked.length > 0 && (
                  <div className="mt-5">
                    <div className="label mb-2">Markets pricing this</div>
                    <div className="flex flex-col gap-1.5">
                      {linked.map((mk) => (
                        <Link
                          key={mk.id}
                          href={`/market/${mk.slug}`}
                          className="flex items-center gap-3 border border-border rounded px-3 py-2 hover:bg-surface-2 transition-colors"
                        >
                          <span className="text-sm text-ink flex-1 truncate">{mk.title}</span>
                          <span className="mono text-sm font-semibold shrink-0" style={{ color: "var(--yes)" }}>
                            {pct(mk.priceYes)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
