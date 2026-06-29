export function Sparkline({
  points,
  width = 640,
  height = 120,
}: {
  points: number[]; // priceYes values in [0,1], chronological
  width?: number;
  height?: number;
}) {
  const series = points.length >= 2 ? points : [points[0] ?? 0.5, points[0] ?? 0.5];
  const pad = 4;
  const n = series.length;
  const x = (i: number) => pad + (i / (n - 1)) * (width - 2 * pad);
  const y = (v: number) => pad + (1 - v) * (height - 2 * pad);

  const line = series.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${height - pad} L${x(0).toFixed(1)},${height - pad} Z`;
  const last = series[n - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--yes)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--yes)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* 50% reference line */}
      <line
        x1={pad}
        x2={width - pad}
        y1={y(0.5)}
        y2={y(0.5)}
        stroke="var(--border)"
        strokeDasharray="3 4"
        strokeWidth="1"
      />
      <path d={area} fill="url(#sparkfill)" />
      <path d={line} fill="none" stroke="var(--yes)" strokeWidth="2" />
      <circle cx={x(n - 1)} cy={y(last)} r="3.5" fill="var(--yes)" />
    </svg>
  );
}
