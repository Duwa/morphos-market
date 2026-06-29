import { priceYes } from "./lmsr";

type MarketRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  closesAt: Date;
  resolvesAt: Date;
  b: number;
  qYes: number;
  qNo: number;
  volume: number;
  status: string;
  outcome: string | null;
  createdAt: Date;
};

// Shape sent to the client: hides raw LMSR internals behind derived prices.
export function serializeMarket(m: MarketRow) {
  const p = priceYes(m.qYes, m.qNo, m.b);
  return {
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    category: m.category,
    closesAt: m.closesAt.toISOString(),
    resolvesAt: m.resolvesAt.toISOString(),
    volume: Math.round(m.volume),
    status: m.status,
    outcome: m.outcome,
    priceYes: p,
    priceNo: 1 - p,
    b: m.b,
    qYes: m.qYes,
    qNo: m.qNo,
  };
}

export type SerializedMarket = ReturnType<typeof serializeMarket>;
