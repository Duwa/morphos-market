import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RobotArt, type MorphKind } from "@/components/RobotArt";
import { MORPHOLOGIES } from "@/lib/morphology";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const [openMarkets, materials, builds] = await Promise.all([
    prisma.market.count({ where: { status: "OPEN" } }),
    prisma.material.count(),
    prisma.build.count(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-5">
      {/* HERO — the thesis, in one breath */}
      <section className="pt-14 pb-10">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <div className="label mb-4">A prediction market · a positive-sum medium</div>
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.02]">
              Automation doesn&apos;t have to look like us.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted leading-relaxed">
              The humanoid is a human bias. The touch that makes hands dexterous —
              biological mechanoreception — is the hardest unsolved problem in
              robotics. So the winning shapes may be wheeled bases, swarms,
              continuum arms, and soft grippers. Morphos is where the best of those
              ideas gets surfaced, priced, and built.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/markets" className="btn rounded px-6 py-3 bg-ink text-white border-transparent text-sm">
                Explore the markets →
              </Link>
              <Link href="/atlas" className="btn rounded px-6 py-3 bg-surface text-ink text-sm">
                Why non-humanoid?
              </Link>
            </div>
            <p className="label mt-5">
              &ldquo;The robots aren&apos;t going to be full-form humanoids — they&apos;re going to be whatever the optimal shape is.&rdquo; — Mark Cuban
            </p>
          </div>

          <div className="relative tick border border-border bg-surface-2 scanline aspect-square overflow-hidden">
            <RobotArt kind="swarm" className="absolute inset-0 p-8" />
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between bg-surface/80 backdrop-blur border-t border-border">
              <span className="label">Cooperative swarm</span>
              <span className="label">one of many possible shapes →</span>
            </div>
          </div>
        </div>
      </section>

      {/* ONE BREATH — the manifesto */}
      <section className="border-y border-border py-10">
        <p className="text-xl sm:text-2xl font-medium leading-snug max-w-4xl text-balance">
          Not a casino. A medium. Markets here graduate on{" "}
          <span className="text-accent">belief and real demand</span> — not money —
          so the best ideas rise into the mass market, and every verdict is a
          tamper-evident, reproducible fact.
        </p>
      </section>

      {/* THE MORPHOLOGY SPACE — the shareable, dream-about-it visual */}
      <section className="py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="label text-ink">The morphology space</h2>
          <Link href="/atlas" className="label hover:text-ink">full atlas →</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MORPHOLOGIES.map((m) => (
            <Link key={m.kind} href={`/atlas#${m.kind}`}
              className="group border border-border bg-surface hover:border-border-strong transition-colors p-1" title={m.name}>
              <div className="h-16">
                <RobotArt kind={m.kind} className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="label text-center truncate px-1 pb-1">{m.name.split(" / ")[0].split(" ")[0]}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* PILLARS — the depth, framed as a loop */}
      <section className="py-8">
        <h2 className="label text-ink mb-5">Dream it → build it → prove it → the best rises</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Pillar href="/atlas" kind="snakearm" title="Dream the shapes" body="An atlas of robot forms and the case for each — imagine the one that isn't here yet." />
          <Pillar href="/build" kind="wheeled" title="Build it for real" body="Open bills of materials anyone can build. 'Build this' is real, confirmed demand." />
          <Pillar href="/proof" kind="tactile" title="Prove it" body="Pricing is provably manipulation-resistant; every settlement is a replayable, tamper-evident fact." />
          <Pillar href="/graduation" kind="quadruped" title="The best graduates" body="Broad belief + real demand — not volume — carries a market up to a real-money venue." />
        </div>
      </section>

      {/* SIGNAL */}
      <section className="py-10 border-t border-border">
        <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
          <Stat k="Open markets" v={openMarkets.toString()} />
          <Stat k="Morphologies" v={MORPHOLOGIES.length.toString()} />
          <Stat k="Registered materials" v={materials.toString()} />
          <Stat k="Open builds" v={builds.toString()} />
          <div className="ml-auto flex flex-wrap gap-3">
            <Link href="/markets" className="btn rounded px-5 py-2.5 bg-ink text-white border-transparent text-sm">
              Enter the markets
            </Link>
            <Link href="/imagine" className="btn rounded px-5 py-2.5 bg-surface text-ink text-sm">
              Propose a form
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Pillar({ href, kind, title, body }: { href: string; kind: MorphKind; title: string; body: string }) {
  return (
    <Link href={href} className="tick group border border-border bg-surface p-4 hover:border-border-strong transition-colors block">
      <div className="h-16 mb-3 relative overflow-hidden rounded bg-surface-2 border border-border scanline">
        <RobotArt kind={kind} className="absolute inset-0 p-1 opacity-85 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="font-semibold text-ink group-hover:text-accent transition-colors">{title}</div>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </Link>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="mono text-2xl font-semibold text-ink">{v}</div>
      <div className="label mt-0.5">{k}</div>
    </div>
  );
}
