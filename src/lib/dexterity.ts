import type { MorphKind } from "@/components/RobotArt";

// The dexterity ladder. Human labour, decomposed into the four capabilities the
// human hand fuses — so you can ask, per task, whether it needs the whole bundle
// (humanoid ground) or just a hackable slice (non-humanoid wins). The crowd's
// price on each is the story: prediction markets as journalism.

export type Component = "force" | "adapt" | "general" | "tactile";

export const COMPONENTS: { key: Component; label: string; status: string; note: string }[] = [
  { key: "force", label: "Force & position", status: "solved", note: "Robot arms are already superhuman — not human-specific." },
  { key: "adapt", label: "Adaptability", status: "mostly hacked", note: "Soft, suction, and jamming grippers conform without fingers." },
  { key: "general", label: "Generality", status: "mostly hacked", note: "Tool-changers or shape-shifting beat one universal hand." },
  { key: "tactile", label: "Tactile sensing", status: "the wall", note: "Mechanoreception — the one genuine bottleneck." },
];

export type Verdict = "hackable-now" | "hackable-soon" | "contested" | "humanoid-ground";

export const VERDICTS: Record<Verdict, { label: string; color: string }> = {
  "hackable-now": { label: "Hackable now", color: "var(--yes)" },
  "hackable-soon": { label: "Hackable soon", color: "var(--accent)" },
  contested: { label: "Contested", color: "var(--warn)" },
  "humanoid-ground": { label: "Humanoid ground", color: "var(--no)" },
};

export type Task = {
  name: string;
  needs: Component[];
  verdict: Verdict;
  morphology: MorphKind;
  marketSlug?: string;
  note: string; // the one-line analysis — the "story"
};

export const TASKS: Task[] = [
  {
    name: "Move totes across a flat floor",
    needs: ["force"],
    verdict: "hackable-now",
    morphology: "wheeled",
    marketSlug: "amazon-bipedal-fleet-2029",
    note: "No dexterity at all — wheels win, and already have.",
  },
  {
    name: "Weld & bolt body structure",
    needs: ["force"],
    verdict: "hackable-now",
    morphology: "snakearm",
    note: "Precision and force; rigid arms out-perform any hand.",
  },
  {
    name: "Route a wiring harness in a cavity",
    needs: ["adapt", "general"],
    verdict: "hackable-soon",
    morphology: "snakearm",
    marketSlug: "wiring-harness-nonhumanoid-2031",
    note: "A snake-arm bends where a hand — or a humanoid shoulder — can't reach.",
  },
  {
    name: "Multi-task assembly cell",
    needs: ["general", "force"],
    verdict: "hackable-soon",
    morphology: "wheeled",
    marketSlug: "reconfigurable-line-2032",
    note: "Tool-changers or reconfiguration deliver generality without an android.",
  },
  {
    name: "Pick ripe produce",
    needs: ["adapt", "tactile"],
    verdict: "contested",
    morphology: "softgripper",
    marketSlug: "soft-gripper-default-2031",
    note: "Soft grippers handle the shape; the gentle-touch part is the open bet.",
  },
  {
    name: "Read touch as well as a fingertip",
    needs: ["tactile"],
    verdict: "contested",
    morphology: "tactile",
    marketSlug: "vision-tactile-parity-2030",
    note: "Vision-based tactile may hack mechanoreception optically — not copy skin.",
  },
  {
    name: "Feel a limp cable into a blind connector",
    needs: ["tactile", "adapt", "general"],
    verdict: "humanoid-ground",
    morphology: "tactile",
    marketSlug: "tactile-skin-parity-2032",
    note: "Blind, by feel, unstructured — the long tail where the hand still rules.",
  },
];
