import type { GeoData, LoadData } from '../../types';

interface Props {
  geo: GeoData;
  loads: LoadData;
  className?: string;
}

export function CrossSectionSVG({ geo, loads, className }: Props) {
  const W = 340;
  const H = 100;

  // Layout constants
  const marginX = 16;
  const drawW = W - 2 * marginX;
  const deckY = 22;
  const deckH = 14;
  const barrierH = 8;
  const barrierW = 4;
  const labelY = H - 18;
  const footerY = H - 6;

  // Deck rectangle full width of drawing area
  const deckX = marginX;

  // Sidewalk widths in proportion to total bridge width
  const totalW = geo.width_m;
  const swLeftW = loads.sidewalk_left ? loads.sidewalk_left_w : 0;
  const swRightW = loads.sidewalk_right ? loads.sidewalk_right_w : 0;
  const roadwayW = totalW - swLeftW - swRightW;

  const pxPerM = drawW / totalW;

  const swLeftPx = swLeftW * pxPerM;
  const roadwayPx = roadwayW * pxPerM;
  const swRightPx = swRightW * pxPerM;

  // Roadway starts after left sidewalk
  const roadX = deckX + swLeftPx;

  // Lane lines
  const numLanes = loads.num_lanes;
  const lanePx = roadwayPx / Math.max(1, numLanes);

  const laneLines = Array.from({ length: numLanes - 1 }, (_, i) => {
    const x = roadX + (i + 1) * lanePx;
    return (
      <line
        key={i}
        x1={x} y1={deckY + 1}
        x2={x} y2={deckY + deckH - 1}
        stroke="#007AFF"
        strokeWidth="0.8"
        strokeDasharray="4 3"
        opacity="0.5"
      />
    );
  });

  // Hatch pattern for sidewalks (diagonal lines)
  const hatchId = 'sw-hatch';

  // Barrier triangles (left and right)
  const barrierLeft = (
    <polygon
      points={`${deckX},${deckY} ${deckX + barrierW},${deckY} ${deckX + barrierW / 2},${deckY - barrierH}`}
      fill="#4A4A4A"
    />
  );
  const barrierRight = (
    <polygon
      points={`${deckX + drawW},${deckY} ${deckX + drawW - barrierW},${deckY} ${deckX + drawW - barrierW / 2},${deckY - barrierH}`}
      fill="#4A4A4A"
    />
  );

  // Width labels
  const labelFontSize = 6;

  // Build label segments
  type LabelSeg = { x: number; w: number; label: string; color: string };
  const segments: LabelSeg[] = [];
  if (swLeftW > 0) {
    segments.push({ x: deckX, w: swLeftPx, label: `T.G. ${swLeftW}m`, color: '#64748B' });
  }
  segments.push({ x: roadX, w: roadwayPx, label: `Chaussée ${roadwayW.toFixed(1)}m`, color: '#007AFF' });
  if (swRightW > 0) {
    segments.push({ x: roadX + roadwayPx, w: swRightPx, label: `T.D. ${swRightW}m`, color: '#64748B' });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-label="Coupe transversale du pont">
      <defs>
        <pattern id={hatchId} patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#94A3B8" strokeWidth="1" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="#FAFAFA" rx="12" />

      {/* Full deck rectangle */}
      <rect
        x={deckX} y={deckY}
        width={drawW} height={deckH}
        fill="#DBEAFE" stroke="#007AFF" strokeWidth="1.2" rx="2"
      />

      {/* Left sidewalk overlay */}
      {swLeftW > 0 && (
        <rect
          x={deckX} y={deckY}
          width={swLeftPx} height={deckH}
          fill={`url(#${hatchId})`}
          opacity="0.6"
        />
      )}

      {/* Right sidewalk overlay */}
      {swRightW > 0 && (
        <rect
          x={roadX + roadwayPx} y={deckY}
          width={swRightPx} height={deckH}
          fill={`url(#${hatchId})`}
          opacity="0.6"
        />
      )}

      {/* Lane division lines */}
      {laneLines}

      {/* Barrier symbols */}
      {loads.has_barrier && barrierLeft}
      {loads.has_barrier && barrierRight}

      {/* Dimension line */}
      <line x1={deckX} y1={labelY} x2={deckX + drawW} y2={labelY} stroke="#94A3B8" strokeWidth="0.6" />
      <line x1={deckX} y1={labelY - 3} x2={deckX} y2={labelY + 3} stroke="#94A3B8" strokeWidth="0.6" />
      <line x1={deckX + drawW} y1={labelY - 3} x2={deckX + drawW} y2={labelY + 3} stroke="#94A3B8" strokeWidth="0.6" />

      {/* Segment labels */}
      {segments.map((seg, i) => (
        <text
          key={i}
          x={seg.x + seg.w / 2}
          y={labelY - 4}
          textAnchor="middle"
          fontSize={labelFontSize}
          fill={seg.color}
          fontFamily="monospace"
        >
          {seg.label}
        </text>
      ))}

      {/* Footer */}
      <text x={W / 2} y={footerY} textAnchor="middle" fontSize="6" fill="#8E8E93" fontFamily="monospace">
        {`l_tot=${totalW}m  |  ${numLanes} voie${numLanes > 1 ? 's' : ''}  |  ${loads.truck_class}`}
      </text>
    </svg>
  );
}
