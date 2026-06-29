# MORPHOS — Robot Morphology Prediction Market

A play-money prediction market for betting on **what shape automation actually takes**.

The thesis: the humanoid form is a human bias. Replicating the density and bandwidth
of biological mechanoreceptors (the touch behind dexterous hands) is brutally hard, so
the winning morphologies may be wheeled bases, swarms, continuum/snake arms, quadrupeds,
and soft grippers — not androids. Each market is a **binary YES/NO milestone** question.

## Stack

- **Next.js 16** (App Router, React 19, Turbopack) + TypeScript
- **Tailwind v4** — clean sci-fi / blueprint aesthetic
- **Prisma 6 + SQLite** — persisted markets, positions, trade history
- **LMSR automated market maker** (`src/lib/lmsr.ts`) — Hanson's logarithmic
  market scoring rule. Prices always sum to 1 and move with order flow; `b`
  controls liquidity. Numerically stable (log-sum-exp).

## How it works

- Each visitor gets a cookie-based play-money account (1,000 credits).
- Buy YES or NO shares in a market; the AMM quotes a price and moves it as you trade.
- A winning share pays out 1 credit when the market resolves.
- Net worth = cash balance + mark-to-market value of open positions.

## Run it

```bash
npm install
npm run db:push     # create the SQLite schema (dev.db)
npm run db:seed     # load the 8 milestone markets
npm run dev         # http://localhost:3000
```

`npm run db:reset` wipes and re-seeds. `npm run db:studio` opens Prisma Studio.

## API

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/markets` | GET | List markets with live prices |
| `/api/markets/[id]` | GET | Single market (id or slug) + your position + price history |
| `/api/trade` | POST | Execute a trade `{ marketId, outcome, side, budget?, shares? }` |
| `/api/portfolio` | GET | Your balance, holdings, net worth |
| `/api/markets/[id]/resolve` | POST | Resolve a market `{ outcome }` and pay out winners |

## Notes / next steps

- Identity is a lightweight httpOnly cookie — no real auth yet.
- `resolve` is unauthenticated (admin endpoint stub); gate it before any real use.
- Markets are seeded; add a creation UI + an oracle/resolution source to go further.
