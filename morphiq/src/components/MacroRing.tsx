interface Props {
  consumed: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
}

export default function MacroRing({ consumed, target, color, label, unit = 'g' }: Props) {
  const pct = Math.min(consumed / target, 1);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1E2540" strokeWidth="5" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <p className="text-xs text-muted text-center leading-tight">
        <span className="text-white font-medium">{Math.round(consumed)}{unit}</span>
        <br />{label}
      </p>
    </div>
  );
}
