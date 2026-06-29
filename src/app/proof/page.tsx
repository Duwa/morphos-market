"use client";

// The HoTT idea, made tangible. Everything here runs the SAME pure core
// (src/lib/events.ts) the tests and the live app use. Poke the market and
// watch: state is rebuilt by replay, the hash chain breaks if you edit the
// past, and illegal moves are refused by the causal guard.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  replay,
  pathCost,
  marketPrice,
  START_BALANCE,
  type MarketEvent,
} from "@/lib/events";

const M = "demo";
const U = "you";
const B = 100;
const create: MarketEvent = { kind: "Create", market: M, b: B };

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function detail(e: MarketEvent): string {
  if (e.kind === "Create") return `b=${e.b}`;
  if (e.kind === "Trade")
    return `${e.shares >= 0 ? "buy" : "sell"} ${Math.abs(e.shares)} ${e.outcome}`;
  if (e.kind === "Resolve") return `→ ${e.outcome}`;
  return "";
}

export default function ProofPage() {
  const [events, setEvents] = useState<MarketEvent[]>([create]);
  const [sealed, setSealed] = useState<string[]>([]);
  const [live, setLive] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  // seal the initial Create on mount
  useEffect(() => {
    (async () => {
      const h = await sha256("GENESIS|" + JSON.stringify(create));
      setSealed([h]);
    })();
  }, []);

  // recompute the live chain whenever events change
  useEffect(() => {
    (async () => {
      let prev = "GENESIS";
      const out: string[] = [];
      for (const e of events) {
        const h = await sha256(prev + "|" + JSON.stringify(e));
        out.push(h);
        prev = h;
      }
      setLive(out);
    })();
  }, [events]);

  // derived state = the replay fold (path-DEpendent possibility, path-INdependent value)
  const state = useMemo(() => {
    try {
      const w = replay(events);
      const m = w.markets.get(M)!;
      const p = w.pos.get(`${U}|${M}`) ?? { yes: 0, no: 0 };
      const bal = w.bal.get(U) ?? START_BALANCE;
      return { ok: true as const, price: marketPrice(m), pos: p, net: START_BALANCE - bal };
    } catch (e) {
      return { ok: false as const, msg: (e as Error).message };
    }
  }, [events]);

  // always-on invariant proofs (cheap, synchronous)
  const proofs = useMemo(() => {
    const c: MarketEvent = { kind: "Create", market: "s", b: 100 };
    const t = (shares: number): MarketEvent => ({ kind: "Trade", market: "s", user: "u", outcome: "YES", shares });
    const single = pathCost([c, t(100)], "u");
    const split = pathCost([c, t(50), t(50)], "u");
    const loop = pathCost([c, t(80), t(-80)], "u");
    return {
      single,
      split,
      pathOk: Math.abs(single - split) < 1e-9,
      loop,
      loopOk: Math.abs(loop) < 1e-9,
    };
  }, []);

  const broken = events.map((_, k) => sealed[k] && live[k] && sealed[k] !== live[k]);
  const brokenCount = broken.filter(Boolean).length;

  const addEvent = useCallback(
    async (e: MarketEvent) => {
      setErr(null);
      try {
        replay([...events, e]); // causal guard — throws on illegal move
      } catch (ex) {
        setErr((ex as Error).message);
        return;
      }
      const prev = sealed.length ? sealed[sealed.length - 1] : "GENESIS";
      const h = await sha256(prev + "|" + JSON.stringify(e));
      setEvents((v) => [...v, e]);
      setSealed((v) => [...v, h]);
    },
    [events, sealed]
  );

  function tamper(idx: number) {
    // edit a PAST event without re-sealing → the chain must break from here on
    setEvents((v) =>
      v.map((e, i) =>
        i === idx && e.kind === "Trade" ? { ...e, shares: e.shares + 25 } : e
      )
    );
  }

  async function reset() {
    setErr(null);
    setEvents([create]);
    const h = await sha256("GENESIS|" + JSON.stringify(create));
    setSealed([h]);
  }

  const trade = (outcome: "YES" | "NO", shares: number): MarketEvent => ({
    kind: "Trade",
    market: M,
    user: U,
    outcome,
    shares,
  });

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="label mb-2">Proof · the engine, live</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        Feel the math. Break it if you can.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        This market runs the exact same pure core as the real app and the test
        suite. State is rebuilt by replaying the event log. Trade, then try to
        tamper with a past event — the tamper-evident chain will snap. Try an
        illegal move — causality will refuse it.
      </p>

      {/* always-true invariants */}
      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <ProofChip
          ok={proofs.pathOk}
          title="Path-independence"
          line={`buy 100 = ${proofs.single.toFixed(4)} · buy 50+50 = ${proofs.split.toFixed(4)}`}
        />
        <ProofChip
          ok={proofs.loopOk}
          title="Loops cost zero"
          line={`buy 80 then sell 80 = ${proofs.loop.toFixed(6)} cr`}
        />
        <ProofChip
          ok={brokenCount === 0}
          title={brokenCount === 0 ? "Chain intact" : `Chain broken (${brokenCount})`}
          line={brokenCount === 0 ? "every event verifies" : "tampered — downstream invalid"}
        />
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6 mt-8">
        {/* state + controls */}
        <div className="lg:sticky lg:top-20 self-start tick border border-border bg-surface p-5">
          <div className="label mb-1">Replayed state</div>
          {state.ok ? (
            <>
              <div className="mono text-4xl font-bold" style={{ color: "var(--yes)" }}>
                {(state.price * 100).toFixed(1)}%
              </div>
              <div className="label mt-1">YES probability (folded from {events.length} events)</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Stat k="YES" v={state.pos.yes.toFixed(0)} c="var(--yes)" />
                <Stat k="NO" v={state.pos.no.toFixed(0)} c="var(--no)" />
                <Stat k="net cost" v={state.net.toFixed(1)} c="var(--ink)" />
              </div>
            </>
          ) : (
            <div className="mono text-sm" style={{ color: "var(--no)" }}>
              replay rejected log: {state.msg}
            </div>
          )}

          <div className="label mt-5 mb-2">Make an event</div>
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => addEvent(trade("YES", 25))} bg="var(--yes)">buy 25 YES</Btn>
            <Btn onClick={() => addEvent(trade("NO", 25))} bg="var(--no)">buy 25 NO</Btn>
            <Btn onClick={() => addEvent(trade("YES", -25))}>sell 25 YES</Btn>
            <Btn onClick={() => addEvent(trade("NO", -25))}>sell 25 NO</Btn>
          </div>
          <button onClick={() => addEvent({ kind: "Resolve", market: M, outcome: "YES" })} className="btn rounded w-full py-2 mt-2 bg-surface-2 text-ink">
            resolve YES (truncate)
          </button>

          {err && (
            <div className="mt-4 text-sm mono px-3 py-2 rounded border" style={{ color: "var(--no)", borderColor: "var(--no)", background: "var(--no-soft)" }}>
              ✗ causality refused: {err}
            </div>
          )}

          <button onClick={reset} className="btn rounded w-full py-2 mt-4 text-muted bg-surface">
            reset log
          </button>
        </div>

        {/* the causal event chain */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="label text-ink">Causal event log (hash-chained)</h2>
            <span className="label">{events.length} events</span>
          </div>
          <div className="space-y-2">
            {events.map((e, k) => {
              const isBroken = broken[k];
              return (
                <div key={k}>
                  {k > 0 && (
                    <div className="flex items-center gap-2 pl-4 h-4">
                      <span className="label" style={{ color: isBroken ? "var(--no)" : "var(--accent)" }}>
                        {isBroken ? "⛓ broken" : "⛓"}
                      </span>
                    </div>
                  )}
                  <div
                    className="tick border bg-surface p-3 flex items-center gap-3"
                    style={{ borderColor: isBroken ? "var(--no)" : "var(--border)", background: isBroken ? "var(--no-soft)" : "var(--surface)" }}
                  >
                    <span className="mono text-xs text-faint w-6">{k}</span>
                    <div className="min-w-0 flex-1">
                      <span className="mono text-sm font-semibold text-ink">{e.kind}</span>
                      <span className="mono text-sm text-muted"> · {detail(e)}</span>
                      <div className="mono text-[0.7rem] truncate" style={{ color: isBroken ? "var(--no)" : "var(--faint)" }}>
                        {(live[k] ?? "").slice(0, 24)}…
                      </div>
                    </div>
                    {e.kind === "Trade" && (
                      <button onClick={() => tamper(k)} className="btn rounded px-2 py-1 text-[0.7rem] bg-surface-2 text-muted" title="edit this past event">
                        ✎ tamper
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {brokenCount > 0 && (
            <p className="mt-4 text-sm mono" style={{ color: "var(--no)" }}>
              You edited event #{broken.findIndex(Boolean)}. Its recomputed hash no longer
              matches what was sealed — and because each hash commits to the one before
              it, every later event is invalidated too. That&apos;s tamper-evidence.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProofChip({ ok, title, line }: { ok: boolean; title: string; line: string }) {
  return (
    <div className="tick border bg-surface p-3" style={{ borderColor: ok ? "var(--yes)" : "var(--no)" }}>
      <div className="flex items-center gap-2">
        <span className="mono font-bold" style={{ color: ok ? "var(--yes)" : "var(--no)" }}>{ok ? "✓" : "✗"}</span>
        <span className="text-sm font-semibold text-ink">{title}</span>
      </div>
      <div className="mono text-[0.7rem] text-muted mt-1">{line}</div>
    </div>
  );
}

function Stat({ k, v, c }: { k: string; v: string; c: string }) {
  return (
    <div className="border border-border rounded py-2 bg-surface-2">
      <div className="mono text-lg font-semibold" style={{ color: c }}>{v}</div>
      <div className="label">{k}</div>
    </div>
  );
}

function Btn({ children, onClick, bg }: { children: React.ReactNode; onClick: () => void; bg?: string }) {
  return (
    <button
      onClick={onClick}
      className="btn rounded py-2"
      style={bg ? { background: bg, color: "#fff", borderColor: "transparent" } : { background: "var(--surface-2)", color: "var(--ink)" }}
    >
      {children}
    </button>
  );
}
