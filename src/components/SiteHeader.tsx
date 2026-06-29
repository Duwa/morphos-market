"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function BotMark() {
  // Minimal non-humanoid robot silhouette: a sensor head on a mobile base.
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="6" y="3" width="20" height="13" rx="3" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="12.5" cy="9.5" r="2.2" fill="var(--accent)" />
      <circle cx="19.5" cy="9.5" r="2.2" fill="var(--accent)" />
      <path d="M16 3V0.5" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="16" cy="0.5" r="1.3" fill="var(--accent-bright)" />
      <rect x="3" y="19" width="26" height="7" rx="2" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="9" cy="29" r="2.6" stroke="var(--ink)" strokeWidth="1.6" />
      <circle cx="23" cy="29" r="2.6" stroke="var(--ink)" strokeWidth="1.6" />
    </svg>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [net, setNet] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((d) => alive && setNet(d.netWorth))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  const tabs = [
    { href: "/", label: "Markets" },
    { href: "/atlas", label: "Atlas" },
    { href: "/imagine", label: "Imagine" },
    { href: "/graduation", label: "Graduation" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <BotMark />
          <div className="leading-none">
            <div className="font-bold tracking-tight text-lg">MORPHOS</div>
            <div className="label mt-0.5">Morphology Markets</div>
          </div>
        </Link>

        <nav className="flex items-center gap-1 ml-2">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  active
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded border border-border bg-surface-2 tick">
          <span className="label">Net worth</span>
          <span className="mono font-semibold text-ink">
            {net === null ? "····" : net.toFixed(2)}
          </span>
          <span className="label">cr</span>
        </div>
      </div>
    </header>
  );
}
