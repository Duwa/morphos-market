import Link from "next/link";
import type { SerializedMarket } from "@/lib/market";
import { pct, daysUntil, CATEGORY_TONE } from "@/lib/format";

export function MarketCard({ m }: { m: SerializedMarket }) {
  const tone = CATEGORY_TONE[m.category] ?? "var(--accent)";
  const resolved = m.status === "RESOLVED";

  return (
    <Link
      href={`/market/${m.slug}`}
      className="tick group block border border-border bg-surface p-4 hover:border-border-strong transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="label"
          style={{ color: tone }}
        >
          ▍{m.category}
        </span>
        <span className="label">
          {resolved ? `resolved ${m.outcome}` : `closes ${daysUntil(m.closesAt)}`}
        </span>
      </div>

      <h3 className="text-[0.95rem] leading-snug font-medium text-ink min-h-[3.6em] group-hover:text-accent transition-colors">
        {m.title}
      </h3>

      <div className="mt-4">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="label">YES probability</span>
          <span className="mono text-lg font-semibold" style={{ color: "var(--yes)" }}>
            {pct(m.priceYes)}
          </span>
        </div>
        <div className="meter">
          <span style={{ width: `${m.priceYes * 100}%` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between label">
        <span>vol {m.volume.toLocaleString()} cr</span>
        <span>no {pct(m.priceNo)}</span>
      </div>
    </Link>
  );
}
