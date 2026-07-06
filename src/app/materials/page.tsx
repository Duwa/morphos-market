import { prisma } from "@/lib/prisma";
import { certificate } from "@/lib/provenance";
import { MaterialsClient } from "@/components/MaterialsClient";

export const dynamic = "force-dynamic";

export default async function MaterialsPage() {
  const rows = await prisma.material.findMany({
    include: { events: { orderBy: { seq: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const initial = rows.map((m) => ({
    slug: m.slug,
    name: m.name,
    innovator: m.innovator,
    category: m.category,
    morphology: m.morphology,
    description: m.description,
    cert: certificate(
      m.events.map((e) => ({
        seq: e.seq,
        kind: e.kind,
        detail: e.detail,
        actor: e.actor,
        prevHash: e.prevHash,
        hash: e.hash,
        createdAt: e.createdAt.toISOString(),
      }))
    ),
  }));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Materials · provenance registry</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        The innovations that make new shapes viable.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        A non-humanoid robot only wins when the material does — a compliant skin, a
        dense tactile array, a lighter structure. Here, each material earns a{" "}
        <span className="text-ink">tamper-evident provenance trail</span>: Registered →
        Tested → Adopted → Graduated, causally ordered and hash-chained. Edit any past
        step and the chain breaks. This is the record a manufacturer — or a real-money
        venue — can trust.
      </p>

      <div className="mt-8">
        <MaterialsClient initial={initial} />
      </div>
    </div>
  );
}
