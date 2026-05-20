interface DonutRingProps {
  pct: number;
  size?: number;
}

export function DonutRing({ pct, size = 140 }: DonutRingProps) {
  const r = (size - 20) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#ECECEA" strokeWidth={12} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="#0D0D0D" strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="progress-ring"
      />
    </svg>
  );
}
