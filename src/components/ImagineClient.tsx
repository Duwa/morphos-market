"use client";

import { useState } from "react";
import { RobotArt, type MorphKind } from "@/components/RobotArt";

type Submission = {
  id: string;
  formName: string;
  morphology: string;
  pitch: string;
  question: string | null;
  author: string;
  votes: number;
  createdAt: string;
};

const KINDS: { kind: MorphKind; label: string }[] = [
  { kind: "wheeled", label: "Wheeled" },
  { kind: "swarm", label: "Swarm" },
  { kind: "snakearm", label: "Snake-arm" },
  { kind: "quadruped", label: "Quadruped" },
  { kind: "softgripper", label: "Soft gripper" },
  { kind: "tactile", label: "Tactile" },
  { kind: "humanoid", label: "Humanoid" },
];

export function ImagineClient({ initial }: { initial: Submission[] }) {
  const [subs, setSubs] = useState<Submission[]>(initial);
  const [formName, setFormName] = useState("");
  const [morphology, setMorphology] = useState<MorphKind>("wheeled");
  const [pitch, setPitch] = useState("");
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  async function submit() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formName, morphology, pitch, question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error ?? "Could not submit");
        return;
      }
      setSubs((s) => [data, ...s]);
      setFormName("");
      setPitch("");
      setQuestion("");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function vote(id: string) {
    if (voted.has(id)) return;
    setVoted((v) => new Set(v).add(id));
    setSubs((s) => s.map((x) => (x.id === id ? { ...x, votes: x.votes + 1 } : x)));
    try {
      await fetch(`/api/submissions/${id}/vote`, { method: "POST" });
    } catch {
      /* optimistic; ignore */
    }
  }

  // keep list sorted by votes for display
  const sorted = [...subs].sort((a, b) => b.votes - a.votes);

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">
      {/* Submission form */}
      <div className="lg:sticky lg:top-20 self-start tick border border-border bg-surface p-5">
        <div className="label mb-3">Propose a form</div>

        <div className="relative h-28 mb-4 rounded bg-surface-2 border border-border scanline overflow-hidden">
          <RobotArt kind={morphology} className="absolute inset-0 p-2" />
        </div>

        <label className="label block mb-1">Form name</label>
        <input
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          placeholder="e.g. Wall-climbing octopod"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-3 text-ink focus:outline-none focus:border-accent"
        />

        <label className="label block mb-1">Closest shape</label>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              onClick={() => setMorphology(k.kind)}
              className="btn rounded py-1.5 text-[0.7rem]"
              style={{
                borderColor: morphology === k.kind ? "var(--accent)" : "var(--border)",
                background: morphology === k.kind ? "var(--surface-2)" : "var(--surface)",
                color: morphology === k.kind ? "var(--accent)" : "var(--muted)",
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        <label className="label block mb-1">Why this shape wins</label>
        <textarea
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          rows={3}
          placeholder="The argument for this morphology…"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-3 text-ink focus:outline-none focus:border-accent resize-none"
        />

        <label className="label block mb-1">A market you&apos;d want (optional)</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="By 2030, will…?"
          className="w-full border border-border bg-surface-2 rounded px-3 py-2 mb-4 text-ink focus:outline-none focus:border-accent"
        />

        {err && (
          <div className="text-sm mono mb-3 px-3 py-2 rounded border" style={{ color: "var(--no)", borderColor: "var(--no)", background: "var(--no-soft)" }}>
            {err}
          </div>
        )}

        <button
          onClick={submit}
          disabled={busy}
          className="btn rounded w-full py-3 bg-ink text-white border-transparent"
        >
          {busy ? "···" : "Submit form"}
        </button>
      </div>

      {/* Submission gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="label text-ink">Proposed forms</h2>
          <span className="label">{sorted.length} ideas</span>
        </div>

        {sorted.length === 0 ? (
          <div className="tick border border-border bg-surface p-10 text-center text-muted">
            No forms imagined yet. Be the first — what shape wins?
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {sorted.map((s) => (
              <div key={s.id} className="tick border border-border bg-surface flex flex-col">
                <div className="relative h-28 bg-surface-2 scanline border-b border-border overflow-hidden">
                  <RobotArt kind={s.morphology as MorphKind} className="absolute inset-0 p-2" />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-ink leading-snug">{s.formName}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed flex-1">{s.pitch}</p>
                  {s.question && (
                    <p className="mt-3 text-sm text-ink border-l-2 pl-3" style={{ borderColor: "var(--accent)" }}>
                      “{s.question}”
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="label">by {s.author}</span>
                    <button
                      onClick={() => vote(s.id)}
                      disabled={voted.has(s.id)}
                      className="btn rounded px-3 py-1.5 bg-surface-2 text-ink"
                    >
                      ▲ {s.votes}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
