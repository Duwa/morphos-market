"use client";

import { useState } from "react";
import Link from "next/link";
import { RobotArt, type MorphKind } from "@/components/RobotArt";

type BomRow = { part: string; qty: number; materialSlug: string };
type Build = {
  slug: string;
  name: string;
  author: string;
  morphology: string;
  summary: string;
  steps: string[];
  pulls: number;
  bom: { part: string; qty: number; materialSlug: string | null }[];
  pullValid: boolean;
  pullHead: string;
};
type MatOpt = { slug: string; name: string };

const KINDS: MorphKind[] = ["wheeled", "swarm", "snakearm", "quadruped", "softgripper", "tactile", "humanoid"];

export function BuildClient({ initial, materials }: { initial: Build[]; materials: MatOpt[] }) {
  const [builds, setBuilds] = useState(initial);
  const [name, setName] = useState("");
  const [morphology, setMorphology] = useState<MorphKind>("wheeled");
  const [summary, setSummary] = useState("");
  const [steps, setSteps] = useState("");
  const [bom, setBom] = useState<BomRow[]>([{ part: "", qty: 1, materialSlug: "" }]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pulled, setPulled] = useState<Set<string>>(new Set());

  const matName = (slug: string) => materials.find((m) => m.slug === slug)?.name ?? slug;

  function setRow(i: number, patch: Partial<BomRow>) {
    setBom((rows) => rows.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  }

  async function publish() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, morphology, summary, steps, bom }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not publish");
        return;
      }
      setBuilds((b) => [data, ...b]);
      setName("");
      setSummary("");
      setSteps("");
      setBom([{ part: "", qty: 1, materialSlug: "" }]);
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function buildThis(slug: string) {
    setPulled((p) => new Set(p).add(slug));
    setBuilds((list) => list.map((b) => (b.slug === slug ? { ...b, pulls: b.pulls + 1 } : b)));
    try {
      const res = await fetch(`/api/builds/${slug}/pull`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setBuilds((list) => list.map((b) => (b.slug === slug ? { ...b, pulls: data.pulls, pullHead: data.pullHead } : b)));
    } catch {
      /* optimistic */
    }
  }

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      {/* publish form */}
      <div className="lg:sticky lg:top-20 self-start tick border border-border bg-surface p-5">
        <div className="label mb-3">Publish a build</div>
        <div className="relative h-24 mb-4 rounded bg-surface-2 border border-border scanline overflow-hidden">
          <RobotArt kind={morphology} className="absolute inset-0 p-2" />
        </div>

        <label className="label block mb-1">Build name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Desk swarm scout"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-3 text-ink focus:outline-none focus:border-accent" />

        <label className="label block mb-1">Shape</label>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {KINDS.map((k) => (
            <button key={k} onClick={() => setMorphology(k)} className="btn rounded py-1.5 text-[0.65rem]"
              style={{ borderColor: morphology === k ? "var(--accent)" : "var(--border)", background: morphology === k ? "var(--surface-2)" : "var(--surface)", color: morphology === k ? "var(--accent)" : "var(--muted)" }}>
              {k}
            </button>
          ))}
        </div>

        <label className="label block mb-1">Summary</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} placeholder="What it does, in one line…"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-3 text-ink focus:outline-none focus:border-accent resize-none" />

        {/* open BOM */}
        <label className="label block mb-1">Open bill of materials</label>
        <div className="space-y-1.5 mb-2">
          {bom.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_44px] gap-1.5">
              <input value={r.part} onChange={(e) => setRow(i, { part: e.target.value })} placeholder="part"
                className="border border-border bg-surface-2 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent" />
              <input type="number" min="1" value={r.qty} onChange={(e) => setRow(i, { qty: +e.target.value })}
                className="mono border border-border bg-surface-2 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-accent" />
              <select value={r.materialSlug} onChange={(e) => setRow(i, { materialSlug: e.target.value })}
                className="col-span-2 border border-border bg-surface-2 rounded px-2 py-1.5 text-xs text-muted focus:outline-none focus:border-accent">
                <option value="">↳ link a registered material (optional)</option>
                {materials.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={() => setBom((b) => [...b, { part: "", qty: 1, materialSlug: "" }])} className="btn rounded px-2.5 py-1 text-muted bg-surface-2 mb-3 text-[0.7rem]">+ add part</button>

        <label className="label block mb-1">Steps (one per line)</label>
        <textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} placeholder={"Print the chassis\nMount the drive units\n…"}
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-4 text-ink focus:outline-none focus:border-accent resize-none" />

        {err && <div className="text-sm mono mb-3 px-3 py-2 rounded border" style={{ color: "var(--no)", borderColor: "var(--no)", background: "var(--no-soft)" }}>{err}</div>}
        <button onClick={publish} disabled={busy} className="btn rounded w-full py-3 bg-ink text-white border-transparent">
          {busy ? "···" : "Publish build"}
        </button>
      </div>

      {/* build gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="label text-ink">Open builds</h2>
          <span className="label">{builds.length} builds · {builds.reduce((s, b) => s + b.pulls, 0)} pulls</span>
        </div>

        {builds.length === 0 ? (
          <div className="tick border border-border bg-surface p-10 text-center text-muted">
            No builds yet. Publish one — open BOM, real steps, buildable by anyone.
          </div>
        ) : (
          <div className="space-y-4">
            {builds.map((b) => (
              <div key={b.slug} className="tick border border-border bg-surface p-4">
                <div className="grid sm:grid-cols-[92px_1fr] gap-4">
                  <div className="hidden sm:block h-20 bg-surface-2 border border-border rounded scanline relative overflow-hidden">
                    <RobotArt kind={b.morphology as MorphKind} className="absolute inset-0 p-1" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-ink leading-snug">{b.name}</h3>
                        <div className="label mt-0.5">by {b.author}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mono text-lg font-semibold" style={{ color: "var(--yes)" }}>{b.pulls}</div>
                        <div className="label">pulls</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted leading-relaxed">{b.summary}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  {/* BOM */}
                  <div>
                    <div className="label mb-1.5">Bill of materials</div>
                    <div className="border border-border rounded divide-y divide-border bg-surface-2">
                      {b.bom.length === 0 && <div className="px-3 py-2 label">no parts listed</div>}
                      {b.bom.map((it, i) => (
                        <div key={i} className="px-3 py-1.5 flex items-center gap-2 text-sm">
                          <span className="mono text-muted w-8">{it.qty}×</span>
                          <span className="text-ink flex-1 truncate">{it.part}</span>
                          {it.materialSlug && (
                            <Link href={`/materials`} className="label shrink-0" style={{ color: "var(--accent)" }} title={matName(it.materialSlug)}>
                              ▍verified material
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* steps */}
                  <div>
                    <div className="label mb-1.5">Steps</div>
                    <ol className="text-sm text-muted space-y-1 list-decimal list-inside">
                      {b.steps.length === 0 && <li className="label list-none">no steps yet</li>}
                      {b.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="label" style={{ color: b.pullValid ? "var(--yes)" : "var(--no)" }}>
                    {b.pullValid ? "✓ pull log verified" : "✗ pull log broken"}
                  </span>
                  <span className="label mono truncate">head {b.pullHead.slice(0, 14)}…</span>
                  <button onClick={() => buildThis(b.slug)} disabled={pulled.has(b.slug)}
                    className="btn rounded px-4 py-2 ml-auto bg-ink text-white border-transparent">
                    {pulled.has(b.slug) ? "✓ pulled" : "🔧 Build this"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
