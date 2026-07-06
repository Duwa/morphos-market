"use client";

import { useState } from "react";
import { RobotArt, type MorphKind } from "@/components/RobotArt";

type Cert = {
  stage: string | null;
  stageIndex: number;
  progress: number;
  graduated: boolean;
  chainValid: boolean;
  head: string;
  steps: { kind: string; detail: string; actor: string; done: boolean }[];
};
type Material = {
  slug: string;
  name: string;
  innovator: string;
  category: string;
  morphology: string;
  description: string;
  cert: Cert;
};

const KINDS: { kind: MorphKind; label: string }[] = [
  { kind: "tactile", label: "Tactile sensing" },
  { kind: "softgripper", label: "Soft actuation" },
  { kind: "snakearm", label: "Continuum" },
  { kind: "wheeled", label: "Structure" },
  { kind: "quadruped", label: "Locomotion" },
  { kind: "swarm", label: "Swarm" },
];

const STAGES = ["Registered", "Tested", "Adopted", "Graduated"];

export function MaterialsClient({ initial }: { initial: Material[] }) {
  const [mats, setMats] = useState(initial);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tactile sensing");
  const [morphology, setMorphology] = useState<MorphKind>("tactile");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function register() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, morphology, description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not register");
        return;
      }
      setMats((m) => [data, ...m]);
      setName("");
      setDescription("");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function advance(slug: string) {
    const res = await fetch(`/api/materials/${slug}/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    if (res.ok) setMats((list) => list.map((m) => (m.slug === slug ? { ...m, cert: data.cert } : m)));
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      {/* register form */}
      <div className="lg:sticky lg:top-20 self-start tick border border-border bg-surface p-5">
        <div className="label mb-3">Register a material</div>
        <div className="relative h-24 mb-4 rounded bg-surface-2 border border-border scanline overflow-hidden">
          <RobotArt kind={morphology} className="absolute inset-0 p-2" />
        </div>

        <label className="label block mb-1">Material name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. FlexSkin tactile membrane"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-3 text-ink focus:outline-none focus:border-accent" />

        <label className="label block mb-1">Domain</label>
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {KINDS.map((k) => (
            <button key={k.kind} onClick={() => { setMorphology(k.kind); setCategory(k.label); }}
              className="btn rounded py-1.5 text-[0.7rem]"
              style={{ borderColor: morphology === k.kind ? "var(--accent)" : "var(--border)", background: morphology === k.kind ? "var(--surface-2)" : "var(--surface)", color: morphology === k.kind ? "var(--accent)" : "var(--muted)" }}>
              {k.label}
            </button>
          ))}
        </div>

        <label className="label block mb-1">What it does</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="The property that makes a non-humanoid form viable…"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-4 text-ink focus:outline-none focus:border-accent resize-none" />

        {err && <div className="text-sm mono mb-3 px-3 py-2 rounded border" style={{ color: "var(--no)", borderColor: "var(--no)", background: "var(--no-soft)" }}>{err}</div>}
        <button onClick={register} disabled={busy} className="btn rounded w-full py-3 bg-ink text-white border-transparent">
          {busy ? "···" : "Register + start provenance"}
        </button>
      </div>

      {/* registry */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="label text-ink">Material provenance registry</h2>
          <span className="label">{mats.length} materials · {mats.filter((m) => m.cert.graduated).length} graduated</span>
        </div>

        {mats.length === 0 ? (
          <div className="tick border border-border bg-surface p-10 text-center text-muted">
            No materials yet. Register the innovation that makes a shape viable.
          </div>
        ) : (
          <div className="space-y-4">
            {mats.map((m) => {
              const next = STAGES[m.cert.stageIndex + 1];
              return (
                <div key={m.slug} className="tick border border-border bg-surface">
                  <div className="grid sm:grid-cols-[92px_1fr] gap-4 p-4">
                    <div className="hidden sm:block h-20 bg-surface-2 border border-border rounded scanline relative overflow-hidden">
                      <RobotArt kind={m.morphology as MorphKind} className="absolute inset-0 p-1" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-ink leading-snug">{m.name}</h3>
                          <div className="label mt-0.5">{m.category} · by {m.innovator}</div>
                        </div>
                        {m.cert.graduated ? (
                          <span className="btn rounded px-2.5 py-1 text-[0.7rem] shrink-0" style={{ background: "var(--yes)", color: "#fff", borderColor: "transparent" }}>✓ Graduated</span>
                        ) : (
                          <span className="label shrink-0">{Math.round(m.cert.progress * 100)}%</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted leading-relaxed">{m.description}</p>

                      {/* provenance chain */}
                      <div className="mt-4 flex flex-wrap items-center gap-1.5">
                        {STAGES.map((s, i) => {
                          const done = i <= m.cert.stageIndex;
                          return (
                            <span key={s} className="flex items-center gap-1.5">
                              <span className="mono text-[0.7rem] px-2 py-1 rounded border"
                                style={{ borderColor: done ? "var(--accent)" : "var(--border)", color: done ? "var(--accent)" : "var(--faint)", background: done ? "var(--surface-2)" : "var(--surface)" }}>
                                {done ? "✓" : "○"} {s}
                              </span>
                              {i < STAGES.length - 1 && <span className="label" style={{ color: done ? "var(--accent)" : "var(--faint)" }}>⛓</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* integrity + advance */}
                  <div className="border-t border-border px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-2 bg-surface-2">
                    <span className="label" style={{ color: m.cert.chainValid ? "var(--yes)" : "var(--no)" }}>
                      {m.cert.chainValid ? "✓ provenance verified" : "✗ chain broken"}
                    </span>
                    <span className="label mono truncate">head {m.cert.head.slice(0, 16)}…</span>
                    {next && (
                      <button onClick={() => advance(m.slug)} className="btn rounded px-3 py-1.5 ml-auto bg-ink text-white border-transparent text-[0.7rem]">
                        Advance → {next}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
