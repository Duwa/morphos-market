import { hashLink, GENESIS_HASH } from "./seal";

// Canonical payload for a consumption-pull event, stable field order.
export function pullPayload(seq: number, actor: string, buildSlug: string): string {
  return JSON.stringify({ seq, actor, build: buildSlug });
}

export function verifyPulls(
  events: { seq: number; actor: string; prevHash: string; hash: string }[],
  buildSlug: string
): boolean {
  let prev = GENESIS_HASH;
  for (const e of events) {
    if (e.prevHash !== prev) return false;
    if (e.hash !== hashLink(prev, pullPayload(e.seq, e.actor, buildSlug))) return false;
    prev = e.hash;
  }
  return true;
}
