// Material provenance: a causal, tamper-evident lifecycle.
// Stages advance in strict order — you cannot claim "Adopted" before "Tested".
// Each event hash-commits to the previous, so editing any past step breaks the
// chain (verify with verifyTrail). This is the HoTT event-monad applied to the
// supply chain: state (the current stage) is a fold of the ordered events.

import { hashLink, GENESIS_HASH } from "./seal";

export const STAGES = ["Registered", "Tested", "Adopted", "Graduated"] as const;
export type Stage = (typeof STAGES)[number];

export type ProvEvent = {
  seq: number;
  kind: string;
  detail: string;
  actor: string;
  prevHash: string;
  hash: string;
  createdAt?: string | Date;
};

// Canonical payload that gets hashed — stable field order.
export function payloadOf(e: {
  seq: number;
  kind: string;
  detail: string;
  actor: string;
}): string {
  return JSON.stringify({ seq: e.seq, kind: e.kind, detail: e.detail, actor: e.actor });
}

// The next allowed stage after the current one (null if already Graduated).
export function nextStage(current: Stage | null): Stage | null {
  if (current === null) return "Registered";
  const i = STAGES.indexOf(current);
  return i >= 0 && i < STAGES.length - 1 ? STAGES[i + 1] : null;
}

export function currentStage(events: { kind: string }[]): Stage | null {
  const stages = events.map((e) => e.kind).filter((k): k is Stage => (STAGES as readonly string[]).includes(k));
  return stages.length ? stages[stages.length - 1] : null;
}

// Recompute the chain and confirm every stored hash matches (tamper-evidence).
export function verifyTrail(events: ProvEvent[]): boolean {
  let prev = GENESIS_HASH;
  for (const e of events) {
    if (e.prevHash !== prev) return false;
    if (e.hash !== hashLink(prev, payloadOf(e))) return false;
    prev = e.hash;
  }
  return true;
}

export function head(events: ProvEvent[]): string {
  return events.length ? events[events.length - 1].hash : GENESIS_HASH;
}

export type Certificate = {
  stage: Stage | null;
  stageIndex: number;
  progress: number; // 0..1 across the 4 stages
  graduated: boolean;
  chainValid: boolean;
  head: string;
  steps: { kind: string; detail: string; actor: string; at?: string | Date; done: boolean }[];
};

export function certificate(events: ProvEvent[]): Certificate {
  const stage = currentStage(events);
  const stageIndex = stage ? STAGES.indexOf(stage) : -1;
  const doneKinds = new Set(events.map((e) => e.kind));
  return {
    stage,
    stageIndex,
    progress: (stageIndex + 1) / STAGES.length,
    graduated: stage === "Graduated",
    chainValid: verifyTrail(events),
    head: head(events),
    steps: STAGES.map((k) => {
      const ev = events.find((e) => e.kind === k);
      return {
        kind: k,
        detail: ev?.detail ?? "",
        actor: ev?.actor ?? "",
        at: ev?.createdAt,
        done: doneKinds.has(k),
      };
    }),
  };
}
