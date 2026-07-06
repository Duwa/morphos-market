// Tamper-evidence for the event log. Each event is hashed together with the
// previous hash → a chain. Change any past event and every subsequent hash
// breaks. Server/test only (uses node:crypto); never import in a client file.

import { createHash } from "node:crypto";
import type { MarketEvent } from "./events";

export type Sealed = {
  seq: number;
  event: MarketEvent;
  prev: string;
  hash: string;
};

const GENESIS = "GENESIS";

function hashOf(prev: string, event: MarketEvent): string {
  return createHash("sha256")
    .update(`${prev}|${JSON.stringify(event)}`)
    .digest("hex");
}

// Generic chain link — used by the material provenance trail too.
export function hashLink(prev: string, payload: string): string {
  return createHash("sha256").update(`${prev}|${payload}`).digest("hex");
}

export const GENESIS_HASH = "GENESIS";

export function sealChain(events: MarketEvent[]): Sealed[] {
  let prev = GENESIS;
  return events.map((event, seq) => {
    const hash = hashOf(prev, event);
    const s: Sealed = { seq, event, prev, hash };
    prev = hash;
    return s;
  });
}

// The single hash that commits to the entire log (the chain head).
export function logHead(events: MarketEvent[]): string {
  const chain = sealChain(events);
  return chain.length ? chain[chain.length - 1].hash : GENESIS;
}

export function verifyChain(sealed: Sealed[]): boolean {
  let prev = GENESIS;
  for (const s of sealed) {
    if (s.prev !== prev) return false;
    if (s.hash !== hashOf(prev, s.event)) return false;
    prev = s.hash;
  }
  return true;
}
