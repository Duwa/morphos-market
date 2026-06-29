"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedMarket } from "@/lib/market";
import { pct1 } from "@/lib/format";

type Position = { yesShares: number; noShares: number };

export function TradePanel({
  initialMarket,
  initialPosition,
}: {
  initialMarket: SerializedMarket;
  initialPosition: Position;
}) {
  const router = useRouter();
  const [market, setMarket] = useState(initialMarket);
  const [position, setPosition] = useState(initialPosition);
  const [outcome, setOutcome] = useState<"YES" | "NO">("YES");
  const [budget, setBudget] = useState("25");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const closed = market.status !== "OPEN";
  const price = outcome === "YES" ? market.priceYes : market.priceNo;
  const budgetNum = parseFloat(budget) || 0;
  // Rough share estimate at current price (actual fill uses LMSR on the server).
  const estShares = price > 0 ? budgetNum / price : 0;

  async function trade(side: "BUY" | "SELL") {
    setBusy(true);
    setMsg(null);
    try {
      const body =
        side === "BUY"
          ? { marketId: market.id, outcome, side, budget: budgetNum }
          : { marketId: market.id, outcome, side };
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? "Trade failed" });
        return;
      }
      setMarket(data.market);
      setPosition(data.position);
      const f = data.filled;
      setMsg({
        kind: "ok",
        text:
          side === "BUY"
            ? `Bought ${f.shares.toFixed(2)} ${f.outcome} for ${f.cost.toFixed(2)} cr`
            : `Sold ${Math.abs(f.shares).toFixed(2)} ${f.outcome} for ${Math.abs(f.cost).toFixed(2)} cr`,
      });
      router.refresh(); // refresh header net worth + server data
    } catch {
      setMsg({ kind: "err", text: "Network error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tick border border-border bg-surface p-5">
      <div className="label mb-3">Trade contract</div>

      {/* Outcome selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(["YES", "NO"] as const).map((o) => {
          const active = outcome === o;
          const p = o === "YES" ? market.priceYes : market.priceNo;
          const color = o === "YES" ? "var(--yes)" : "var(--no)";
          return (
            <button
              key={o}
              onClick={() => setOutcome(o)}
              disabled={closed}
              className="btn rounded p-3 text-left"
              style={{
                borderColor: active ? color : "var(--border)",
                background: active ? (o === "YES" ? "var(--yes-soft)" : "var(--no-soft)") : "var(--surface)",
                color: active ? color : "var(--muted)",
              }}
            >
              <div className="text-sm">{o}</div>
              <div className="mono text-xl font-bold mt-1">{pct1(p)}</div>
            </button>
          );
        })}
      </div>

      {/* Budget input */}
      <label className="label block mb-1.5">Amount (credits)</label>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="number"
          min="0"
          step="1"
          value={budget}
          disabled={closed}
          onChange={(e) => setBudget(e.target.value)}
          className="mono w-full border border-border bg-surface-2 rounded px-3 py-2 text-ink focus:outline-none focus:border-accent"
        />
      </div>
      <div className="flex gap-1.5 mb-4">
        {[10, 25, 50, 100].map((v) => (
          <button
            key={v}
            onClick={() => setBudget(String(v))}
            disabled={closed}
            className="btn rounded px-2.5 py-1 text-muted bg-surface-2"
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm mb-4 mono text-muted">
        <span>≈ {estShares.toFixed(2)} shares</span>
        <span>payout {estShares.toFixed(2)} cr if {outcome}</span>
      </div>

      <button
        onClick={() => trade("BUY")}
        disabled={busy || closed || budgetNum <= 0}
        className="btn rounded w-full py-3 mb-2"
        style={{
          background: outcome === "YES" ? "var(--yes)" : "var(--no)",
          color: "#fff",
          borderColor: "transparent",
        }}
      >
        {busy ? "···" : `Buy ${outcome}`}
      </button>

      {/* Position + sell */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="label mb-2">Your position</div>
        <div className="grid grid-cols-2 gap-2 text-sm mono">
          <PosRow label="YES" shares={position.yesShares} color="var(--yes)" />
          <PosRow label="NO" shares={position.noShares} color="var(--no)" />
        </div>
        {(position.yesShares > 0.01 || position.noShares > 0.01) && !closed && (
          <button
            onClick={() => trade("SELL")}
            disabled={busy || (outcome === "YES" ? position.yesShares : position.noShares) < 0.01}
            className="btn rounded w-full py-2 mt-3 text-ink bg-surface-2"
          >
            Sell all {outcome}
          </button>
        )}
      </div>

      {msg && (
        <div
          className="mt-4 text-sm mono px-3 py-2 rounded border"
          style={{
            color: msg.kind === "ok" ? "var(--yes)" : "var(--no)",
            borderColor: msg.kind === "ok" ? "var(--yes)" : "var(--no)",
            background: msg.kind === "ok" ? "var(--yes-soft)" : "var(--no-soft)",
          }}
        >
          {msg.text}
        </div>
      )}

      {closed && (
        <div className="mt-4 text-sm mono text-muted">
          Market {market.status.toLowerCase()}
          {market.outcome ? ` · resolved ${market.outcome}` : ""}.
        </div>
      )}
    </div>
  );
}

function PosRow({ label, shares, color }: { label: string; shares: number; color: string }) {
  return (
    <div className="flex items-center justify-between border border-border rounded px-2.5 py-1.5 bg-surface-2">
      <span style={{ color }}>{label}</span>
      <span className="text-ink font-semibold">{shares.toFixed(2)}</span>
    </div>
  );
}
