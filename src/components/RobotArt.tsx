// Original blueprint-style line-art of robot morphologies. No stock photos,
// no licensing — all hand-drawn SVG, on-theme with the grid aesthetic.

export type MorphKind =
  | "humanoid"
  | "wheeled"
  | "swarm"
  | "snakearm"
  | "quadruped"
  | "softgripper"
  | "tactile";

const S = {
  stroke: "var(--ink)",
  accent: "var(--accent)",
  accentBright: "var(--accent-bright)",
};

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 220 180" fill="none" className="w-full h-full" aria-hidden>
      {children}
    </svg>
  );
}

// faint blueprint baseline shared across drawings
function Ground() {
  return (
    <line
      x1="20"
      y1="160"
      x2="200"
      y2="160"
      stroke="var(--border-strong)"
      strokeWidth="1"
      strokeDasharray="2 5"
    />
  );
}

function Humanoid() {
  return (
    <Frame>
      <Ground />
      {/* head */}
      <rect x="92" y="20" width="36" height="28" rx="8" stroke={S.stroke} strokeWidth="2.2" />
      <circle cx="103" cy="34" r="3" fill={S.accent} />
      <circle cx="117" cy="34" r="3" fill={S.accent} />
      <path d="M110 20V12" stroke={S.stroke} strokeWidth="2.2" />
      <circle cx="110" cy="11" r="2" fill={S.accentBright} />
      {/* torso */}
      <rect x="88" y="52" width="44" height="50" rx="8" stroke={S.stroke} strokeWidth="2.2" />
      <line x1="110" y1="52" x2="110" y2="102" stroke="var(--border-strong)" strokeWidth="1.2" />
      {/* arms */}
      <path d="M88 60 L70 78 L72 100" stroke={S.stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M132 60 L150 78 L148 100" stroke={S.stroke} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="72" cy="102" r="4" stroke={S.stroke} strokeWidth="2" />
      <circle cx="148" cy="102" r="4" stroke={S.stroke} strokeWidth="2" />
      {/* legs */}
      <path d="M100 102 L98 134 L92 158" stroke={S.stroke} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M120 102 L122 134 L128 158" stroke={S.stroke} strokeWidth="2.2" strokeLinecap="round" />
    </Frame>
  );
}

function Wheeled() {
  return (
    <Frame>
      <Ground />
      {/* carried pod/shelf */}
      <rect x="78" y="30" width="64" height="40" rx="3" stroke={S.stroke} strokeWidth="2" strokeDasharray="4 4" />
      <line x1="78" y1="50" x2="142" y2="50" stroke="var(--border-strong)" strokeWidth="1" />
      {/* low drive base */}
      <rect x="60" y="92" width="100" height="34" rx="8" stroke={S.stroke} strokeWidth="2.4" />
      {/* sensor strip */}
      <rect x="70" y="100" width="40" height="10" rx="3" stroke={S.accent} strokeWidth="2" />
      <circle cx="148" cy="100" r="3" fill={S.accentBright} />
      {/* lift column to pod */}
      <line x1="110" y1="92" x2="110" y2="70" stroke={S.stroke} strokeWidth="2.2" />
      {/* wheels */}
      <circle cx="84" cy="138" r="14" stroke={S.stroke} strokeWidth="2.4" />
      <circle cx="84" cy="138" r="5" fill={S.accent} />
      <circle cx="136" cy="138" r="14" stroke={S.stroke} strokeWidth="2.4" />
      <circle cx="136" cy="138" r="5" fill={S.accent} />
    </Frame>
  );
}

function Swarm() {
  // a cluster of many small identical units
  const units = [
    [60, 70], [104, 56], [150, 74],
    [44, 116], [86, 104], [128, 112], [168, 120],
    [70, 142], [120, 146],
  ];
  return (
    <Frame>
      <Ground />
      {units.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 12} y={y - 9} width="24" height="18" rx="4" stroke={S.stroke} strokeWidth="1.8" />
          <circle cx={x} cy={y} r="2.5" fill={i % 3 === 0 ? S.accentBright : S.accent} />
          <line x1={x - 8} y1={y + 11} x2={x - 8} y2={y + 14} stroke={S.stroke} strokeWidth="1.4" />
          <line x1={x + 8} y1={y + 11} x2={x + 8} y2={y + 14} stroke={S.stroke} strokeWidth="1.4" />
        </g>
      ))}
      {/* faint coordination links */}
      <path d="M60 70 L104 56 L150 74 M86 104 L128 112 M70 142 L120 146"
        stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 4" opacity="0.5" />
    </Frame>
  );
}

function SnakeArm() {
  return (
    <Frame>
      <Ground />
      {/* base */}
      <rect x="36" y="120" width="48" height="30" rx="6" stroke={S.stroke} strokeWidth="2.4" />
      <circle cx="60" cy="118" r="6" stroke={S.stroke} strokeWidth="2" />
      {/* serpentine continuum body */}
      <path
        d="M60 116 C 60 90, 100 96, 104 72 C 108 48, 150 56, 158 40"
        stroke={S.stroke}
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.18"
      />
      <path
        d="M60 116 C 60 90, 100 96, 104 72 C 108 48, 150 56, 158 40"
        stroke={S.stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* segment ticks */}
      {[[66,104],[78,96],[96,82],[110,66],[128,54],[146,46]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="2" fill={S.accent} />
      ))}
      {/* sensor/gripper tip */}
      <circle cx="160" cy="38" r="5" stroke={S.accentBright} strokeWidth="2.2" />
      <path d="M160 33 V28 M156 41 L152 45 M164 41 L168 45" stroke={S.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </Frame>
  );
}

function Quadruped() {
  return (
    <Frame>
      <Ground />
      {/* body */}
      <rect x="70" y="64" width="84" height="30" rx="10" stroke={S.stroke} strokeWidth="2.4" />
      {/* head */}
      <rect x="150" y="58" width="26" height="22" rx="6" stroke={S.stroke} strokeWidth="2.2" />
      <circle cx="170" cy="68" r="3" fill={S.accent} />
      <path d="M166 58 V50" stroke={S.stroke} strokeWidth="2" />
      <circle cx="166" cy="49" r="2" fill={S.accentBright} />
      {/* legs: two-segment articulated */}
      <path d="M82 94 L76 122 L86 150" stroke={S.stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M104 94 L110 122 L100 150" stroke={S.stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M124 94 L118 122 L128 150" stroke={S.stroke} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M144 94 L150 122 L140 150" stroke={S.stroke} strokeWidth="2.4" strokeLinecap="round" />
      {/* joints */}
      {[[76,122],[110,122],[118,122],[150,122]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="3" fill={S.accent} />
      ))}
    </Frame>
  );
}

function SoftGripper() {
  return (
    <Frame>
      <Ground />
      {/* arm */}
      <path d="M30 150 L60 120 L92 96" stroke={S.stroke} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="60" cy="120" r="4" fill={S.accent} />
      {/* wrist */}
      <rect x="86" y="80" width="26" height="20" rx="6" stroke={S.stroke} strokeWidth="2.2" transform="rotate(-32 99 90)" />
      {/* soft compliant fingers wrapping an object */}
      <circle cx="138" cy="74" r="20" stroke="var(--border-strong)" strokeWidth="2" strokeDasharray="3 4" />
      <path d="M112 74 C 118 52, 138 50, 150 58" stroke={S.stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M112 80 C 120 96, 140 100, 152 92" stroke={S.stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M120 68 C 130 60, 146 62, 152 70" stroke={S.accent} strokeWidth="2.2" strokeLinecap="round" />
    </Frame>
  );
}

function Tactile() {
  // fingertip with mechanoreceptor sensor field
  return (
    <Frame>
      <Ground />
      {/* fingertip outline */}
      <path
        d="M88 150 L88 80 C 88 46, 132 46, 132 80 L132 150"
        stroke={S.stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* sensor dot field (mechanoreceptor density) */}
      {Array.from({ length: 5 }).flatMap((_, r) =>
        Array.from({ length: 4 }).map((_, c) => {
          const x = 96 + c * 9.5;
          const y = 64 + r * 11;
          const inside = !((r === 0 && (c === 0 || c === 3)));
          return inside ? (
            <circle key={`${r}-${c}`} cx={x} cy={y} r="2" fill={r % 2 ? S.accent : S.accentBright} />
          ) : null;
        })
      )}
      {/* concentric pressure rings */}
      <circle cx="110" cy="100" r="26" stroke={S.accent} strokeWidth="0.8" strokeDasharray="2 4" opacity="0.6" />
      <circle cx="110" cy="100" r="16" stroke={S.accent} strokeWidth="0.8" strokeDasharray="2 4" opacity="0.6" />
    </Frame>
  );
}

const MAP: Record<MorphKind, () => React.ReactElement> = {
  humanoid: Humanoid,
  wheeled: Wheeled,
  swarm: Swarm,
  snakearm: SnakeArm,
  quadruped: Quadruped,
  softgripper: SoftGripper,
  tactile: Tactile,
};

export function RobotArt({
  kind,
  className = "",
}: {
  kind: MorphKind;
  className?: string;
}) {
  const Art = MAP[kind] ?? Humanoid;
  return (
    <div className={className}>
      <Art />
    </div>
  );
}
