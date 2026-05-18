import type { GeoData } from '../../types';

const DECK_LABEL: Record<string, string> = {
  slab: 'Dalle', box_girder: 'Caisson', i_beam: 'I', t_beam: 'T', arch: 'Arc', unknown: '?',
};

interface Props {
  geo: GeoData;
  className?: string;
}

export function BridgeSVG({ geo, className = '' }: Props) {
  const PX = 20;
  const drawW = 300;
  const deckY = 44;
  const deckH = 16;
  const groundY = 118;
  const abutW = 18;
  const pierW = 10;
  const viewH = 140;
  const viewW = 340;

  const spans = Math.max(1, geo.spans);
  const spanW = (drawW - 2 * abutW) / spans;
  const spanLen = spans > 0 ? (geo.total_length_m / spans).toFixed(1) : '—';

  // Ground hatch
  const hatchLines = Array.from({ length: 30 }, (_, i) => (
    <line key={i}
      x1={PX + i * 12} y1={groundY + 1}
      x2={PX + i * 12 - 8} y2={groundY + 9}
      stroke="#CBD5E1" strokeWidth="1" />
  ));

  // Piers
  const abutH = groundY - deckY - deckH;
  const pierElems = (geo.has_piers && spans > 1)
    ? Array.from({ length: spans - 1 }, (_, i) => {
        const k = i + 1;
        const px = PX + abutW + k * spanW - pierW / 2;
        return (
          <g key={k}>
            <rect x={px - 4} y={groundY - 6} width={pierW + 8} height={6} rx={2}
              fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
            <rect x={px} y={deckY + deckH} width={pierW} height={abutH - 6} rx={2}
              fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
          </g>
        );
      })
    : null;

  // Span labels
  const spanLabels = Array.from({ length: spans }, (_, i) => {
    const cx = PX + abutW + i * spanW + spanW / 2;
    return (
      <text key={i} x={cx} y={deckY - 6} textAnchor="middle" fontSize={7} fill="#94A3B8">
        {spanLen} m
      </text>
    );
  });

  const dimColor = '#C4B5FD';
  const arrowY = deckY - 18;

  return (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} className={className} aria-label="Schéma du pont">
      {/* Ground */}
      <rect x={PX} y={groundY} width={drawW} height={3} fill="#CBD5E1" />
      {hatchLines}

      {/* Piers */}
      {pierElems}

      {/* Abutments */}
      {geo.has_abutments !== false && (
        <>
          <rect x={PX} y={deckY + deckH} width={abutW} height={abutH} rx={2}
            fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
          <rect x={PX - 4} y={groundY - 6} width={abutW + 8} height={6} rx={2}
            fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
          <rect x={PX + drawW - abutW} y={deckY + deckH} width={abutW} height={abutH} rx={2}
            fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
          <rect x={PX + drawW - abutW - 4} y={groundY - 6} width={abutW + 8} height={6} rx={2}
            fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.8" />
        </>
      )}

      {/* Deck */}
      <rect x={PX} y={deckY} width={drawW} height={deckH} rx={3}
        fill="#2563EB" fillOpacity={0.85} />
      <text x={PX + drawW / 2} y={deckY + deckH / 2 + 2.5} textAnchor="middle"
        fontSize={7.5} fontWeight="bold" fill="white">
        {DECK_LABEL[geo.deck_type] ?? '?'}
      </text>

      {/* Span labels */}
      {spanLabels}

      {/* Dim line */}
      <line x1={PX} y1={arrowY} x2={PX + drawW} y2={arrowY} stroke={dimColor} strokeWidth={0.8} />
      <polygon points={`${PX},${arrowY} ${PX + 5},${arrowY - 2} ${PX + 5},${arrowY + 2}`} fill={dimColor} />
      <polygon points={`${PX + drawW},${arrowY} ${PX + drawW - 5},${arrowY - 2} ${PX + drawW - 5},${arrowY + 2}`} fill={dimColor} />

      {/* Dim text */}
      <text x={viewW - 16} y={groundY + 14} textAnchor="end" fontSize={7} fill="#94A3B8">
        L={geo.total_length_m}m · l={geo.width_m}m · h={geo.clearance_m}m
      </text>
    </svg>
  );
}
