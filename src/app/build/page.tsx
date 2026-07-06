import { prisma } from "@/lib/prisma";
import { verifyPulls } from "@/lib/builds";
import { GENESIS_HASH } from "@/lib/seal";
import { BuildClient } from "@/components/BuildClient";

export const dynamic = "force-dynamic";

export default async function BuildPage() {
  const [rows, mats] = await Promise.all([
    prisma.build.findMany({
      include: { bom: true, pullEvents: { orderBy: { seq: "asc" } } },
      orderBy: [{ pulls: "desc" }, { createdAt: "desc" }],
    }),
    prisma.material.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const initial = rows.map((b) => ({
    slug: b.slug,
    name: b.name,
    author: b.author,
    morphology: b.morphology,
    summary: b.summary,
    steps: b.steps.split("\n").map((s) => s.trim()).filter(Boolean),
    pulls: b.pulls,
    bom: b.bom.map((i) => ({ part: i.part, qty: i.qty, materialSlug: i.materialSlug })),
    pullValid: verifyPulls(b.pullEvents, b.slug),
    pullHead: b.pullEvents.length ? b.pullEvents[b.pullEvents.length - 1].hash : GENESIS_HASH,
  }));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Build · DIY robot market</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        Don&apos;t just predict the shape. Build it.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        Publish a real robot with an <span className="text-ink">open bill of materials</span> — parts,
        quantities, and links to registered materials — plus steps anyone can follow. When someone hits{" "}
        <span className="text-ink">Build this</span>, it logs a real <span className="text-ink">consumption-pull</span>:
        the confirmed demand that turns the forecast market into a true just-in-time system. Every pull is
        hash-chained, so the demand signal can&apos;t be faked.
      </p>

      <div className="mt-8">
        <BuildClient initial={initial} materials={mats} />
      </div>
    </div>
  );
}
