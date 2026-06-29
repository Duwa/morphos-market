import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { priceYes } from "@/lib/lmsr";
import { getOrCreateUser } from "@/lib/session";
import { pct1 } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const user = await getOrCreateUser();
  const positions = await prisma.position.findMany({
    where: { userId: user.id },
    include: { market: true },
  });

  const holdings = positions
    .filter((p) => p.yesShares > 1e-6 || p.noShares > 1e-6)
    .map((p) => {
      const pYes = priceYes(p.market.qYes, p.market.qNo, p.market.b);
      const resolved = p.market.status === "RESOLVED";
      const yesValue = resolved
        ? p.market.outcome === "YES"
          ? p.yesShares
          : 0
        : p.yesShares * pYes;
      const noValue = resolved
        ? p.market.outcome === "NO"
          ? p.noShares
          : 0
        : p.noShares * (1 - pYes);
      return {
        slug: p.market.slug,
        title: p.market.title,
        status: p.market.status,
        outcome: p.market.outcome,
        pYes,
        yesShares: p.yesShares,
        noShares: p.noShares,
        value: yesValue + noValue,
      };
    })
    .sort((a, b) => b.value - a.value);

  const positionsValue = holdings.reduce((s, h) => s + h.value, 0);
  const netWorth = user.balance + positionsValue;

  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <div className="label mb-1">Operator {user.handle}</div>
      <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
        <Card k="Net worth" v={`${netWorth.toFixed(2)} cr`} big />
        <Card k="Cash balance" v={`${user.balance.toFixed(2)} cr`} />
        <Card k="Positions value" v={`${positionsValue.toFixed(2)} cr`} />
      </div>

      <h2 className="label text-ink mt-10 mb-3">Holdings</h2>
      {holdings.length === 0 ? (
        <div className="tick border border-border bg-surface p-8 text-center">
          <p className="text-muted">No open positions yet.</p>
          <Link href="/" className="btn inline-block mt-4 rounded px-4 py-2 bg-ink text-white border-transparent">
            Browse markets
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-surface divide-y divide-border">
          {holdings.map((h) => (
            <Link
              key={h.slug}
              href={`/market/${h.slug}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink truncate">{h.title}</div>
                <div className="label mt-1">
                  {h.status === "RESOLVED" ? `resolved ${h.outcome}` : `YES ${pct1(h.pYes)}`}
                </div>
              </div>
              <div className="mono text-sm text-right shrink-0">
                {h.yesShares > 0.01 && (
                  <div style={{ color: "var(--yes)" }}>{h.yesShares.toFixed(1)} YES</div>
                )}
                {h.noShares > 0.01 && (
                  <div style={{ color: "var(--no)" }}>{h.noShares.toFixed(1)} NO</div>
                )}
              </div>
              <div className="mono text-base font-semibold text-ink w-24 text-right shrink-0">
                {h.value.toFixed(2)} cr
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ k, v, big }: { k: string; v: string; big?: boolean }) {
  return (
    <div className="tick border border-border bg-surface p-4">
      <div className="label">{k}</div>
      <div className={`mono font-bold text-ink mt-1 ${big ? "text-2xl" : "text-xl"}`}>{v}</div>
    </div>
  );
}
