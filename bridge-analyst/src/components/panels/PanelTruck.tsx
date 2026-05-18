import { useMemo } from 'react';
import { Card, SectionLabel, GhostBtn, Pill, InfoRow, WarnBox, InfoBox } from '../ui';
import { useStore } from '../../store';
import { truckMaxMoment } from '../../lib/structural';
import { CL625 } from '../../constants';

export function PanelTruck() {
  const { analysis, geo, setActivePanel } = useStore();

  const truckM = useMemo(() => {
    if (!geo) return 0;
    const spanLen = geo.total_length_m / geo.spans;
    return truckMaxMoment(spanLen);
  }, [geo]);

  if (!analysis || !geo) return null;

  const spanLen = (geo.total_length_m / geo.spans).toFixed(1);
  const ratio = analysis.Mmax > 0 ? ((truckM / analysis.Mmax) * 100).toFixed(0) : '—';

  // SVG truck
  const drawW = 280;
  const scale = drawW / CL625.wheelbase;
  const truckY = 20;
  const bodyH = 24;
  const axleY = truckY + bodyH;

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center gap-3 mb-1">
        <GhostBtn onClick={() => setActivePanel(null)}>← Retour</GhostBtn>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Camion CL-625</h1>
      </div>

      {/* SVG */}
      <div className="bg-white rounded-2xl border border-[#E8EBF0] p-4 shadow-sm overflow-x-auto">
        <svg viewBox={`0 0 320 90`} className="w-full h-auto min-w-[280px]" aria-label="Camion CL-625">
          {/* Body */}
          <rect x={20} y={truckY} width={drawW} height={bodyH} rx={4} fill="#EFF6FF" stroke="#BFDBFE" strokeWidth={1.5} />
          <text x={20 + drawW / 2} y={truckY + bodyH / 2 + 4} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#2563EB">
            CL-625 — 625 kN total
          </text>

          {/* Axles */}
          {CL625.positions.map((pos, i) => {
            const ax = 20 + pos * scale;
            const load = CL625.loads[i];
            const nextPos = CL625.positions[i + 1];
            const spacing = nextPos !== undefined ? (nextPos - pos).toFixed(1) : null;
            return (
              <g key={i}>
                {/* Axle line */}
                <line x1={ax} y1={axleY} x2={ax} y2={axleY + 18} stroke="#94A3B8" strokeWidth={1.5} />
                {/* Wheels */}
                <circle cx={ax - 7} cy={axleY + 22} r={6} fill="#334155" />
                <circle cx={ax + 7} cy={axleY + 22} r={6} fill="#334155" />
                {/* Load */}
                <text x={ax} y={axleY + 38} textAnchor="middle" fontSize={8} fill="#0F172A" fontWeight="bold">
                  {load} kN
                </text>
                {/* Spacing */}
                {spacing && i < CL625.positions.length - 1 && (
                  <text
                    x={ax + (CL625.positions[i + 1] - pos) * scale / 2}
                    y={truckY - 5}
                    textAnchor="middle"
                    fontSize={7.5}
                    fill="#94A3B8"
                  >
                    {spacing} m
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill label="Empattement" value="18.0 m" />
        <Pill label="Charge totale" value="625 kN" />
      </div>

      {/* Result */}
      <Card>
        <SectionLabel>Moment max camion — L = {spanLen} m</SectionLabel>
        <InfoBox>
          <p className="text-[10px] font-bold uppercase text-[#60A5FA] mb-0.5">MOMENT MAX CAMION</p>
          <p className="text-[28px] font-mono font-bold text-[#2563EB] leading-tight">{truckM.toFixed(1)}</p>
          <p className="text-[12px] text-[#60A5FA]">kN·m — Position optimisée par ligne d'influence</p>
        </InfoBox>
        <div className="mt-3">
          <InfoRow label="Moment UDL (analyse continue)" value={`${analysis.Mmax.toFixed(1)} kN·m`} mono />
          <InfoRow label="Rapport camion / UDL" value={`${ratio}%`} mono />
          <InfoRow label="Travée analysée" value={`${spanLen} m`} />
          <InfoRow label="Position optimisée" value="Oui — pas de 0.05 m" />
        </div>
      </Card>

      <WarnBox>
        Le camion CL-625 doit être combiné avec la charge de voie et les MPF selon CSA S6-19 cl. 3.8.3. Ce résultat représente le moment de camion seul, sur une travée simple.
      </WarnBox>
    </div>
  );
}
