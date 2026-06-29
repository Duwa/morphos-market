import { prisma } from "@/lib/prisma";
import { ImagineClient } from "@/components/ImagineClient";

export const dynamic = "force-dynamic";

export default async function ImaginePage() {
  const rows = await prisma.submission.findMany({
    orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const initial = rows.map((r) => ({
    id: r.id,
    formName: r.formName,
    morphology: r.morphology,
    pitch: r.pitch,
    question: r.question,
    author: r.author,
    votes: r.votes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Imagine a form</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        What shape isn&apos;t here yet?
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        The atlas is a starting point, not a limit. Sketch a morphology nobody&apos;s
        building, make the case for why it wins, and propose the market that would
        prove you right. The most-voted ideas become real markets.
      </p>

      <div className="mt-8">
        <ImagineClient initial={initial} />
      </div>
    </div>
  );
}
