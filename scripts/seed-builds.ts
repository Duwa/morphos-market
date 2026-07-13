// Seeds example DIY builds (with open BOMs referencing seeded materials) and a
// few consumption-pull events. Run: npm run seed:builds

import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const GENESIS = "GENESIS";
const hashLink = (prev: string, payload: string) =>
  createHash("sha256").update(`${prev}|${payload}`).digest("hex");
const pullPayload = (seq: number, actor: string, build: string) =>
  JSON.stringify({ seq, actor, build });

const BUILDS = [
  {
    slug: "desk-swarm-scout",
    name: "Desk swarm scout",
    author: "maker_ada",
    morphology: "swarm",
    summary: "A pack of five tiny wheeled bots that map and patrol a desk or shelf together — cheap, cooperative, non-humanoid.",
    steps: "Print five chassis\nSolder the drive boards\nFlash the swarm firmware\nCalibrate the IR mesh\nRelease the swarm",
    bom: [
      { part: "3D-printed chassis", qty: 5, materialSlug: "aircore-lattice" },
      { part: "micro gear motor", qty: 10, materialSlug: null },
      { part: "IR mesh sensor", qty: 5, materialSlug: null },
    ],
    pulls: 3,
  },
  {
    slug: "flatfloor-tote-mover",
    name: "Flat-floor tote mover",
    author: "maker_kepler",
    morphology: "wheeled",
    summary: "A low wheeled base that ferries 40kg totes across a flat warehouse floor — no legs, no drama, no falling over.",
    steps: "Bolt the drive base\nMount the tote cradle\nFlash the nav stack\nMap the floor",
    bom: [
      { part: "wheeled drive base", qty: 1, materialSlug: "aircore-lattice" },
      { part: "lidar", qty: 1, materialSlug: null },
      { part: "tote cradle", qty: 1, materialSlug: null },
    ],
    pulls: 4,
  },
  {
    slug: "gentle-picker-arm",
    name: "Gentle picker arm",
    author: "maker_boru",
    morphology: "softgripper",
    summary: "A benchtop arm with a soft gel gripper that picks fruit and delicate parts without a rigid five-finger hand.",
    steps: "Assemble the 3-DOF arm\nCast the gel muscle\nMount the soft gripper\nTune the grip pressure",
    bom: [
      { part: "soft gripper mitt", qty: 1, materialSlug: "gelactuate-soft-muscle" },
      { part: "tactile pad", qty: 2, materialSlug: "flexskin-tactile-membrane" },
      { part: "servo", qty: 3, materialSlug: null },
    ],
    pulls: 5,
  },
];

async function main() {
  await prisma.pullEvent.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.build.deleteMany();

  for (const b of BUILDS) {
    const build = await prisma.build.create({
      data: {
        slug: b.slug, name: b.name, author: b.author, morphology: b.morphology,
        summary: b.summary, steps: b.steps, pulls: b.pulls,
        bom: { create: b.bom.map((i) => ({ part: i.part, qty: i.qty, materialSlug: i.materialSlug })) },
      },
    });
    let prev = GENESIS;
    for (let seq = 0; seq < b.pulls; seq++) {
      const actor = `builder_${seq + 1}`;
      const hash = hashLink(prev, pullPayload(seq, actor, b.slug));
      await prisma.pullEvent.create({ data: { buildId: build.id, seq, actor, prevHash: prev, hash } });
      prev = hash;
    }
  }
  console.log(`Seeded ${BUILDS.length} builds with pull logs.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
