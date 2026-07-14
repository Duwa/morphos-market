import { loadReputation } from "@/lib/reputation-server";

export const dynamic = "force-dynamic";

export default async function ReputationPage() {
  const { stats } = await loadReputation();
  const ranked = stats.filter((s) => s.calls > 0);

  return (
    <div className="max-w-4xl mx-auto px-5 py-10">
      <div className="label mb-2">Reputation · who called it</div>
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl leading-tight">
        Known for being early and right.
      </h1>
      <p className="mt-4 max-w-2xl text-muted leading-relaxed">
        Reputation before money. You earn it by backing the winning side of a
        market that resolves — and more for getting in <span className="text-ink">early</span>, when the
        crowd disagreed. It can&apos;t be bought; it&apos;s computed from the trade log.
        Proven forecasters&apos; belief counts more when a market graduates.
      </p>

      {ranked.length === 0 ? (
        <div className="tick border border-border bg-surface p-10 text-center text-muted mt-8">
          No track records yet — reputation appears once markets resolve.
        </div>
      ) : (
        <div className="mt-8 border border-border bg-surface tick overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <Th>#</Th>
                <Th left>Operator</Th>
                <Th>Reputation</Th>
                <Th>Calls</Th>
                <Th>Right</Th>
                <Th>Hit rate</Th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => {
                const total = s.wins + s.losses;
                const hit = total ? Math.round((s.wins / total) * 100) : 0;
                return (
                  <tr key={s.userId} className="border-b border-border last:border-0 hover:bg-surface-2">
                    <Td><span className="mono text-faint">{i + 1}</span></Td>
                    <Td left>
                      <span className="font-medium text-ink">{s.handle}</span>
                      {i === 0 && <span className="label ml-2" style={{ color: "var(--accent)" }}>top caller</span>}
                    </Td>
                    <Td>
                      <span className="mono font-semibold" style={{ color: s.score >= 0 ? "var(--yes)" : "var(--no)" }}>
                        {s.score >= 0 ? "+" : ""}{s.score.toFixed(1)}
                      </span>
                    </Td>
                    <Td><span className="mono">{s.calls}</span></Td>
                    <Td><span className="mono">{s.wins}</span></Td>
                    <Td><span className="mono">{hit}%</span></Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children, left }: { children: React.ReactNode; left?: boolean }) {
  return <th className={`label px-4 py-3 ${left ? "text-left" : "text-center"}`}>{children}</th>;
}
function Td({ children, left }: { children: React.ReactNode; left?: boolean }) {
  return <td className={`px-4 py-2.5 ${left ? "text-left" : "text-center"}`}>{children}</td>;
}
