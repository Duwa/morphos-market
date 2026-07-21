import type { MorphKind } from "@/components/RobotArt";

export type Morphology = {
  kind: MorphKind;
  name: string;
  tagline: string;
  thesis: string;
  marketSlugs: string[];
};

// The atlas: each robot form, why it might win, and the markets that price it.
export const MORPHOLOGIES: Morphology[] = [
  {
    kind: "wheeled",
    name: "Wheeled / Tracked Base",
    tagline: "The workhorse that already won the warehouse",
    thesis:
      "Why carry a heavy bipedal skeleton just to move a box across a flat floor? Wheeled drive units are cheap, stable, and tireless. Amazon already runs a million of them. The boring shape may quietly take the most ground.",
    marketSlugs: ["amazon-bipedal-fleet-2029", "humanoids-outnumbered-2030"],
  },
  {
    kind: "swarm",
    name: "Cooperative Swarm",
    tagline: "A thousand small minds beat one big body",
    thesis:
      "Instead of one expensive humanoid, deploy hundreds of cheap units that coordinate. Failure of one is noise, not catastrophe. The form factor is the fleet, not the individual.",
    marketSlugs: ["swarm-warehouse-2031"],
  },
  {
    kind: "snakearm",
    name: "Continuum / Snake-Arm",
    tagline: "Reaches where rigid arms and humans can't",
    thesis:
      "Hyper-redundant continuum manipulators thread through jet engines, reactors, and pipework. No human arm — and no humanoid — bends like this. Confined-space inspection wants a snake, not a person.",
    marketSlugs: ["snake-arm-inspection-2028"],
  },
  {
    kind: "quadruped",
    name: "Quadruped",
    tagline: "Stability on terrain that breaks wheels and bipeds",
    thesis:
      "Four legs cross rubble, stairs, and slopes that stop wheels and topple bipeds. For inspection, security, and the outdoors, the dog beat the android to market.",
    marketSlugs: ["quadruped-mainstream-2029"],
  },
  {
    kind: "softgripper",
    name: "Soft / Compliant Gripper",
    tagline: "You may not need five fingers",
    thesis:
      "Much of manipulation is picking and placing — and soft suction or compliant grippers do that more reliably than a brittle five-finger hand. The end-effector diverges from the human hand.",
    marketSlugs: ["soft-gripper-default-2031"],
  },
  {
    kind: "tactile",
    name: "Tactile Sensing",
    tagline: "The bottleneck nobody prices in",
    thesis:
      "Human dexterity rides on mechanoreceptor density and bandwidth no machine matches yet. Until touch is solved, the humanoid hand is a beautiful demo, not a worker. This is the hard wall.",
    marketSlugs: ["tactile-skin-parity-2032"],
  },
  {
    kind: "humanoid",
    name: "Humanoid",
    tagline: "Built for our world — or our bias?",
    thesis:
      "The case for humanoids is real: our world is already shaped for human bodies. The case against is harder — replicating touch, balance, and economics at scale. The market decides if form follows function or vanity.",
    marketSlugs: ["general-purpose-humanoid-profit-2030", "amazon-bipedal-fleet-2029"],
  },
];

// Per-market concept art. Defaults to humanoid if unmapped.
export const MARKET_MORPH: Record<string, MorphKind> = {
  "humanoids-outnumbered-2030": "wheeled",
  "tactile-skin-parity-2032": "tactile",
  "amazon-bipedal-fleet-2029": "wheeled",
  "swarm-warehouse-2031": "swarm",
  "snake-arm-inspection-2028": "snakearm",
  "general-purpose-humanoid-profit-2030": "humanoid",
  "soft-gripper-default-2031": "softgripper",
  "quadruped-mainstream-2029": "quadruped",
  "vision-tactile-parity-2030": "tactile",
  "wiring-harness-nonhumanoid-2031": "snakearm",
  "reconfigurable-line-2032": "wheeled",
};

export function morphFor(slug: string): MorphKind {
  return MARKET_MORPH[slug] ?? "humanoid";
}
