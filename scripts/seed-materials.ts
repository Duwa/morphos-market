// Seeds example materials at different provenance stages so the registry
// demonstrates the full lifecycle. Run: npm run seed:materials

import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const GENESIS = "GENESIS";
const hashLink = (prev: string, payload: string) =>
  createHash("sha256").update(`${prev}|${payload}`).digest("hex");
const payloadOf = (e: { seq: number; kind: string; detail: string; actor: string }) =>
  JSON.stringify({ seq: e.seq, kind: e.kind, detail: e.detail, actor: e.actor });

type Step = { kind: string; detail: string; actor: string };

const MATERIALS: {
  slug: string; name: string; innovator: string; category: string; morphology: string; description: string; steps: Step[];
}[] = [
  {
    slug: "flexskin-tactile-membrane",
    name: "FlexSkin tactile membrane",
    innovator: "hapticworks",
    category: "Tactile sensing",
    morphology: "tactile",
    description: "A stretchable membrane packing 260 sensors/cm² — approaching human fingertip mechanoreceptor density, the bottleneck for dexterous non-humanoid hands.",
    steps: [
      { kind: "Registered", detail: "Registered by hapticworks", actor: "hapticworks" },
      { kind: "Tested", detail: "100k-cycle durability, 260 sensors/cm² verified by an independent lab", actor: "sensor-lab" },
      { kind: "Adopted", detail: "Integrated into a shipping soft-gripper hand", actor: "gripco" },
      { kind: "Graduated", detail: "Proven across 3 deployed product lines", actor: "morphos" },
    ],
  },
  {
    slug: "aircore-lattice",
    name: "AirCore printed lattice",
    innovator: "latticelabs",
    category: "Lightweight structure",
    morphology: "quadruped",
    description: "A 3D-printed metamaterial lattice cutting limb mass 40% at equal stiffness — makes legged and swarm robots cheaper to move and safer near people.",
    steps: [
      { kind: "Registered", detail: "Registered by latticelabs", actor: "latticelabs" },
      { kind: "Tested", detail: "Load + fatigue tests confirm 40% mass reduction at equal stiffness", actor: "struct-test" },
      { kind: "Adopted", detail: "Adopted in a quadruped inspection robot's legs", actor: "trotbot" },
    ],
  },
  {
    slug: "gelactuate-soft-muscle",
    name: "GelActuate soft muscle",
    innovator: "softmatter",
    category: "Soft actuation",
    morphology: "softgripper",
    description: "An electro-active gel that contracts like muscle — compliant, silent, and gentle enough to pick soft produce without a rigid five-finger hand.",
    steps: [
      { kind: "Registered", detail: "Registered by softmatter", actor: "softmatter" },
      { kind: "Tested", detail: "Bench tests: 18% contraction, 500g/cm² force, 50k cycles", actor: "actuation-lab" },
    ],
  },
];

async function main() {
  await prisma.materialEvent.deleteMany();
  await prisma.material.deleteMany();

  for (const m of MATERIALS) {
    const events = [] as {
      seq: number; kind: string; detail: string; actor: string; prevHash: string; hash: string;
    }[];
    let prev = GENESIS;
    m.steps.forEach((s, seq) => {
      const payload = { seq, ...s };
      const hash = hashLink(prev, payloadOf(payload));
      events.push({ ...payload, prevHash: prev, hash });
      prev = hash;
    });
    await prisma.material.create({
      data: {
        slug: m.slug, name: m.name, innovator: m.innovator, category: m.category,
        morphology: m.morphology, description: m.description,
        events: { create: events },
      },
    });
  }
  console.log(`Seeded ${MATERIALS.length} materials with provenance trails.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
