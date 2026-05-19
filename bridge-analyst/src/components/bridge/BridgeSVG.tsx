import type { GeoData } from '../../types';

const DECK_LABEL: Record<string, string> = {
  slab: 'DALLE', box_girder: 'CAISSON', i_beam: 'I-POUTRE',
  t_beam: 'T-POUTRE', arch: 'ARC', unknown: '—',
};

interface Props {
  geo: GeoData;
  className?: string;
}

export function BridgeSVG({ geo, className = '' }: Props) {
  const W = 340;
  const H = 130;
  const marginX = 24;
  const drawW = W - 2 * marginX;
  const deckY = 38;
  const deckH = 10;
  const groundY = 104;
  const abutW = 14;
  const pierW = 8;

  const spans = Math.max(1, geo.spans);

  // Support unequal spans
  const Ls = (geo.span_lengths && geo.span_lengths.length === spans)
    ? geo.span_lengths
    : Array(spans).fill(geo.total_length_m / spans);
  const totalL = Ls.reduce((a, b) => a + b, 0);

  // Compute cumulative span start positions (in metres)
  const spanStartMetres: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < spans; i++) {
    spanStartMetres.push(cumulative);
    cumulative += Ls[i];
  }

  // Helper: convert metres along bridge to screen X
  const mToScreenX = (m: number) =>
    marginX + abutW + (m / totalL) * (drawW - 2 * abutW);

  // Ground lines (hatching)
  const hatchCount = Math.ceil(drawW / 9) + 2;
  const hatchLines = Array.from({ length: hatchCount }, (_, i) => {
    const x = marginX - 4 + i * 9;
    return (
      <line key={i}
        x1={x} y1={groundY + 1}
        x2={x - 6} y2={groundY + 8}
        stroke="#B0B0B0" strokeWidth="0.8" strokeLinecap="round" />
    );
  });

  // Pier positions (at cumulative span boundaries, excluding start and end)
  const pierPositions = spanStartMetres.slice(1).map(m => mToScreenX(m));

  // Piers
  const pierElems = (geo.has_piers && spans > 1)
    ? pierPositions.map((cx, i) => {
        const px = cx - pierW / 2;
        const capY = groundY - 7;
        return (
          <g key={i}>
            {/* Pier shaft */}
            <rect x={px} y={deckY + deckH} width={pierW} height={capY - (deckY + deckH)}
              fill="#ECECEC" stroke="#9A9A9A" strokeWidth="0.8" />
            {/* Pier cap */}
            <rect x={px - 5} y={capY} width={pierW + 10} height={7} rx="1"
              fill="#DCDCDC" stroke="#9A9A9A" strokeWidth="0.8" />
          </g>
        );
      })
    : null;

  // Span dimension lines
  const dimY = deckY - 14;
  const spanDims = Array.from({ length: spans }, (_, i) => {
    const x0 = mToScreenX(spanStartMetres[i]);
    const x1 = mToScreenX(spanStartMetres[i] + Ls[i]);
    const cx = (x0 + x1) / 2;
    const spanLen = Ls[i].toFixed(1);
    return (
      <g key={i}>
        <line x1={x0 + 2} y1={dimY} x2={x1 - 2} y2={dimY} stroke="#007AFF" strokeWidth="0.8" />
        <line x1={x0 + 2} y1={dimY - 3} x2={x0 + 2} y2={dimY + 3} stroke="#007AFF" strokeWidth="0.8" />
        <line x1={x1 - 2} y1={dimY - 3} x2={x1 - 2} y2={dimY + 3} stroke="#007AFF" strokeWidth="0.8" />
        <text x={cx} y={dimY - 4} textAnchor="middle" fontSize="6.5" fill="#007AFF" fontFamily="monospace">
          {spanLen}m
        </text>
      </g>
    );
  });

  // Abutments
  const leftAbut = marginX;
  const rightAbut = marginX + drawW - abutW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-label="Schéma du pont">
      {/* Background */}
      <rect width={W} height={H} fill="#FAFAFA" rx="12" />

      {/* Ground line */}
      <line x1={marginX} y1={groundY} x2={marginX + drawW} y2={groundY} stroke="#9A9A9A" strokeWidth="1" />
      {hatchLines}

      {/* Piers */}
      {pierElems}

      {/* Abutments */}
      {geo.has_abutments !== false && (
        <>
          {/* Left */}
          <rect x={leftAbut} y={deckY + deckH} width={abutW} height={groundY - deckY - deckH - 7}
            fill="#DCDCDC" stroke="#9A9A9A" strokeWidth="0.8" />
          <rect x={leftAbut - 4} y={groundY - 7} width={abutW + 8} height={7} rx="1"
            fill="#C8C8C8" stroke="#9A9A9A" strokeWidth="0.8" />
          {/* Right */}
          <rect x={rightAbut} y={deckY + deckH} width={abutW} height={groundY - deckY - deckH - 7}
            fill="#DCDCDC" stroke="#9A9A9A" strokeWidth="0.8" />
          <rect x={rightAbut - 4} y={groundY - 7} width={abutW + 8} height={7} rx="1"
            fill="#C8C8C8" stroke="#9A9A9A" strokeWidth="0.8" />
        </>
      )}

      {/* Deck */}
      <rect x={marginX} y={deckY} width={drawW} height={deckH} rx="2"
        fill="#007AFF" fillOpacity="0.12" stroke="#007AFF" strokeWidth="1.2" />

      {/* Deck label */}
      <text x={marginX + drawW / 2} y={deckY + deckH / 2 + 2.5} textAnchor="middle"
        fontSize="6" fontWeight="600" fill="#007AFF" letterSpacing="0.5" fontFamily="monospace">
        {DECK_LABEL[geo.deck_type] ?? '?'}
      </text>

      {/* Span dimensions */}
      {spanDims}

      {/* Footer info */}
      <text x={marginX} y={H - 6} fontSize="6" fill="#8E8E93" fontFamily="monospace">
        L={geo.total_length_m}m
      </text>
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="6" fill="#8E8E93" fontFamily="monospace">
        l={geo.width_m}m
      </text>
      <text x={W - marginX} y={H - 6} textAnchor="end" fontSize="6" fill="#8E8E93" fontFamily="monospace">
        h={geo.clearance_m}m
      </text>
    </svg>
  );
}
