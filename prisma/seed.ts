import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Milestone markets framed around the thesis: full humanoid form is a human
// bias. Replicating mechanoreception / dexterous touch is brutally hard, so
// automation may converge on non-humanoid morphologies instead.
const MARKETS = [
  {
    slug: "humanoids-outnumbered-2030",
    title:
      "By 2030, will non-humanoid robots outnumber humanoid robots in active industrial deployment?",
    description:
      "Resolves YES if credible industry data (IFR or equivalent) shows wheeled, tracked, armed, or other non-humanoid robots vastly exceed bipedal humanoids in operational industrial settings at end of 2030.",
    category: "Form",
    closesIn: 1400,
    resolvesIn: 1430,
    b: 220,
    qYes: 80,
    qNo: 0,
  },
  {
    slug: "tactile-skin-parity-2032",
    title:
      "By 2032, will a shipping robot demonstrate full-hand tactile sensing at human fingertip density (>240 sensors/cm² class)?",
    description:
      "Replicating the density and bandwidth of human mechanoreceptors (Merkel, Meissner, Pacinian, Ruffini) is the core bottleneck for humanoid dexterity. Resolves YES on a commercially shipping product, not a lab demo.",
    category: "Sensing",
    closesIn: 2000,
    resolvesIn: 2030,
    b: 150,
    qYes: 0,
    qNo: 60,
  },
  {
    slug: "amazon-bipedal-fleet-2029",
    title:
      "By 2029, will Amazon operate >10,000 bipedal humanoid robots across its fulfillment network?",
    description:
      "Amazon's current fleet is overwhelmingly wheeled drive units (Proteus, Hercules) and fixed arms (Sparrow, Cardinal). Resolves YES if Amazon confirms a deployed bipedal humanoid fleet above 10,000 units.",
    category: "Form",
    closesIn: 900,
    resolvesIn: 920,
    b: 150,
    qYes: 0,
    qNo: 90,
  },
  {
    slug: "swarm-warehouse-2031",
    title:
      "By 2031, will a major logistics operator run a 1,000+ unit cooperative mobile-robot swarm in one facility?",
    description:
      "Distributed many-small-robots morphology vs. few-large-humanoids. Resolves YES if a single warehouse/port runs 1,000+ coordinating autonomous mobile robots as a cooperative swarm.",
    category: "Mobility",
    closesIn: 1700,
    resolvesIn: 1720,
    b: 150,
    qYes: 40,
    qNo: 20,
  },
  {
    slug: "snake-arm-inspection-2028",
    title:
      "By 2028, will continuum / snake-arm robots become standard for confined-space industrial inspection?",
    description:
      "Hyper-redundant continuum manipulators reach where rigid arms and humanoids cannot. Resolves YES if multiple major aerospace/energy firms cite snake-arm robots as standard inspection equipment.",
    category: "Manipulation",
    closesIn: 600,
    resolvesIn: 620,
    b: 120,
    qYes: 25,
    qNo: 10,
  },
  {
    slug: "general-purpose-humanoid-profit-2030",
    title:
      "By 2030, will any general-purpose humanoid robot company report a profitable hardware business?",
    description:
      "Tests whether the humanoid form factor is economically viable at scale, not just demoed. Resolves YES on audited positive gross margin on humanoid hardware sales/leases.",
    category: "Form",
    closesIn: 1300,
    resolvesIn: 1330,
    b: 180,
    qYes: 0,
    qNo: 50,
  },
  {
    slug: "soft-gripper-default-2031",
    title:
      "By 2031, will soft / compliant grippers outsell rigid multi-finger hands for robotic picking?",
    description:
      "Instead of a five-finger human hand, much of manipulation may converge on soft suction and compliant grippers. Resolves YES on industry unit-sales data favoring soft/compliant end-effectors.",
    category: "Manipulation",
    closesIn: 1600,
    resolvesIn: 1620,
    b: 150,
    qYes: 35,
    qNo: 15,
  },
  {
    slug: "quadruped-mainstream-2029",
    title:
      "By 2029, will quadruped robots exceed 100,000 cumulative commercial units deployed?",
    description:
      "Four-legged morphology for inspection, security, and rough terrain. Resolves YES on combined reported deployments across vendors exceeding 100,000 units.",
    category: "Mobility",
    closesIn: 1100,
    resolvesIn: 1120,
    b: 150,
    qYes: 50,
    qNo: 10,
  },
  {
    slug: "vision-tactile-parity-2030",
    title:
      "By 2030, will vision-based tactile sensors match human-fingertip touch in a shipping robot?",
    description:
      "Camera-behind-gel sensors (GelSight-class) may hack mechanoreception non-humanoidly — sensing contact geometry optically instead of copying skin. Resolves YES if a shipping product demonstrates human-fingertip-class tactile acuity this way.",
    category: "Sensing",
    closesIn: 1300,
    resolvesIn: 1330,
    b: 150,
    qYes: 40,
    qNo: 25,
  },
  {
    slug: "wiring-harness-nonhumanoid-2031",
    title:
      "By 2031, will non-humanoid arms route wiring harnesses on a production car line before humanoids do?",
    description:
      "Threading a wire loom through a chassis cavity is a classic 'needs a bendy limb' task. Resolves YES if continuum/snake-arm robots do it in volume production before any humanoid does.",
    category: "Manipulation",
    closesIn: 1700,
    resolvesIn: 1720,
    b: 150,
    qYes: 35,
    qNo: 20,
  },
  {
    slug: "reconfigurable-line-2032",
    title:
      "By 2032, will a major automaker run a software-reconfigurable robot line, retooled in software rather than steel?",
    description:
      "A fleet of shape-shifting robots could let a factory reprogram its line for a new model in software — attacking the biggest cost in auto: retooling. Resolves YES on a confirmed production deployment.",
    category: "Form",
    closesIn: 2000,
    resolvesIn: 2030,
    b: 160,
    qYes: 25,
    qNo: 35,
  },
];

async function main() {
  console.log("Seeding Morphos markets…");
  await prisma.trade.deleteMany();
  await prisma.position.deleteMany();
  await prisma.market.deleteMany();

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  for (const m of MARKETS) {
    await prisma.market.create({
      data: {
        slug: m.slug,
        title: m.title,
        description: m.description,
        category: m.category,
        b: m.b,
        qYes: m.qYes,
        qNo: m.qNo,
        volume: Math.round((m.qYes + m.qNo) * 0.5),
        closesAt: new Date(now + m.closesIn * day),
        resolvesAt: new Date(now + m.resolvesIn * day),
      },
    });
  }
  console.log(`Seeded ${MARKETS.length} markets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
