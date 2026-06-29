export function pct(p: number): string {
  return `${(p * 100).toFixed(0)}%`;
}

export function pct1(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function daysUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const d = Math.round(ms / (24 * 60 * 60 * 1000));
  if (d <= 0) return "closed";
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.round(d / 30)}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

export const CATEGORY_TONE: Record<string, string> = {
  Form: "var(--accent)",
  Sensing: "var(--warn)",
  Mobility: "var(--yes)",
  Manipulation: "var(--no)",
};
