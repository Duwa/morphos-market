import { prisma } from "./prisma";
import { computeReputation, scoreByUser, type RepStat } from "./reputation";

// Load reputation from every resolved market's trade log. Returns both the
// per-user score map (for weighting graduation) and the ranked stats (for the
// leaderboard), joined to handles.
export async function loadReputation() {
  const resolved = await prisma.market.findMany({
    where: { status: "RESOLVED", NOT: { outcome: null } },
    include: { trades: { orderBy: { createdAt: "asc" } } },
  });
  const input = resolved.map((m) => ({
    outcome: m.outcome as string,
    trades: m.trades.map((t) => ({
      userId: t.userId,
      outcome: t.outcome,
      shares: t.shares,
      priceYes: t.priceYes,
    })),
  }));
  const map = computeReputation(input);
  const scores = scoreByUser(map);

  // join handles for display
  const ids = [...map.keys()];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, handle: true } })
    : [];
  const handle: Record<string, string> = {};
  for (const u of users) handle[u.id] = u.handle;

  const stats = [...map.values()]
    .map((s: RepStat) => ({ ...s, handle: handle[s.userId] ?? s.userId }))
    .sort((a, b) => b.score - a.score);

  return { scores, stats };
}
