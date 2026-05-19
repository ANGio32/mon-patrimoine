import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, SectionLabel, BigStat, Pill, WarnBox, PrimaryBtn, GhostBtn, CheckBadge, Input, SelectInput } from '../components/ui';
import { useStore } from '../store';
import { computeLoads, computeBeam, computeDeflection, computeCamber } from '../lib/structural';
import { GAMMA_D, GAMMA_L } from '../constants';
import type { SLSProps } from '../types';

function fmt(n: number, dec = 1) { return n.toFixed(dec); }

const MATERIAL_E: Record<SLSProps['material'], number> = {
  concrete: 28000,
  steel: 200000,
  custom: 0,
};

export function StepAnalysis() {
  const { geo, loads, slsProps, setSLSProps, setAnalysis, setStep, saveSession } = useStore();

  const result = useMemo(() => {
    if (!geo || !loads) return null;
    const ld = computeLoads(geo, loads);
    const beam = computeBeam(geo.total_length_m, geo.spans, ld.wULS);
    const beamSLS = computeBeam(geo.total_length_m, geo.spans, ld.wSLS);
    return { ld, beam, beamSLS };
  }, [geo, loads]);

  const slsResults = useMemo(() => {
    if (!geo || !result) return null;
    const { ld, beamSLS } = result;
    const isPedestrian = geo.structure_type === 'pedestrian';
    return computeDeflection(
      geo.total_length_m, geo.spans, ld.wSLS, geo.width_m,
      beamSLS.supportMoments, slsProps.E_MPa, slsProps.h_mm,
      slsProps.material, isPedestrian, geo.span_lengths,
    );
  }, [geo, result, slsProps]);

  const camberResults = useMemo(() => {
    if (!geo || !result) return null;
    const { ld } = result;
    return computeCamber(
      geo.total_length_m, geo.spans, ld.wD, geo.width_m,
      slsProps.E_MPa, slsProps.h_mm, slsProps.material, geo.span_lengths,
    );
  }, [geo, result, slsProps]);

  if (!geo || !loads || !result) {
    return (
      <div className="py-8 text-center text-[#64748B]">
        Données manquantes. Recommencez depuis le début.
      </div>
    );
  }

  const { ld, beam } = result;

  const handleMaterialChange = (mat: string) => {
    const m = mat as SLSProps['material'];
    const E = m === 'custom' ? slsProps.E_MPa : MATERIAL_E[m];
    setSLSProps({ ...slsProps, material: m, E_MPa: E });
  };

  const allSLSOk = slsResults ? slsResults.every(r => r.ok) : true;

  const handleNext = () => {
    setAnalysis({
      Vmax: beam.Vmax,
      Mmax: beam.Mmax,
      ld,
      reactions: beam.reactions,
      beamResults: beam,
    });
    saveSession();
    setStep(4);
  };

  const isPedestrian = geo.structure_type === 'pedestrian';
  const limitLabel = isPedestrian ? 'L/500' : 'L/300';

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-[#0F172A] mb-1">Analyse structurale</h1>
        <p className="text-[13px] text-[#64748B]">CSA S6-19 — poutre continue, charge ULS</p>
      </div>

      {/* Decomposition */}
      <Card>
        <SectionLabel>Décomposition des charges</SectionLabel>

        <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8] mb-2">Permanentes (D)</p>
        <div className="flex flex-col gap-1 mb-3">
          {[
            ['Poids propre tablier', `${fmt(ld.w_self)} kN/m`],
            ['Revêtement bitumineux', `${fmt(ld.w_wear)} kN/m`],
            ['Glissières', `${fmt(ld.w_barrier)} kN/m`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-[13px]">
              <span className="text-[#64748B]">{l}</span>
              <span className="font-mono text-[#0F172A]">{v}</span>
            </div>
          ))}
          <div className="border-t border-[#E8EBF0] mt-1 pt-1 flex justify-between text-[13px] font-semibold">
            <span>w_D</span>
            <span className="font-mono">{fmt(ld.wD)} kN/m</span>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wide text-[#94A3B8] mb-2">Vives (L)</p>
        <div className="flex flex-col gap-1 mb-3">
          {[
            [`Voies (×${ld.nLanes}, MPF=${ld.mpf})`, `${fmt(ld.w_lanes)} kN/m`],
            ['Piétons', `${fmt(ld.w_ped)} kN/m`],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-[13px]">
              <span className="text-[#64748B]">{l}</span>
              <span className="font-mono text-[#0F172A]">{v}</span>
            </div>
          ))}
          <div className="border-t border-[#E8EBF0] mt-1 pt-1 flex justify-between text-[13px] font-semibold">
            <span>w_L</span>
            <span className="font-mono">{fmt(ld.wL)} kN/m</span>
          </div>
        </div>

        <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3">
          <div className="flex justify-between text-[13px] mb-1">
            <span className="text-[#1E40AF]">w_SLS</span>
            <span className="font-mono font-semibold text-[#1E40AF]">{fmt(ld.wSLS)} kN/m</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[13px] text-[#1E40AF]">
              w_ULS = {GAMMA_D}D + {GAMMA_L}L
            </span>
            <span className="font-mono font-bold text-[17px] text-[#2563EB]">{fmt(ld.wULS)} kN/m</span>
          </div>
          <p className="text-[11px] text-[#60A5FA] mt-1">CSA S6-19, combinaison 1</p>
        </div>
      </Card>

      {/* BigStats */}
      <div className="grid grid-cols-2 gap-3">
        <BigStat label="V_max" value={fmt(beam.Vmax)} unit="kN" color="accent" />
        <BigStat label="M_max" value={fmt(beam.Mmax)} unit="kN·m" color="error" />
      </div>

      {/* Reactions */}
      <Card>
        <SectionLabel>Réactions aux appuis</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {beam.reactions.map((r, i) => (
            <Pill key={i} label={i === 0 ? 'A1' : i === beam.reactions.length - 1 ? `A${i + 1}` : `P${i}`} value={`${fmt(r)} kN`} />
          ))}
        </div>
      </Card>

      {/* Diagram V */}
      <Card>
        <SectionLabel>Effort tranchant V(x)</SectionLabel>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={beam.vData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            {beam.suppX.map(x => (
              <ReferenceLine key={x} x={x} stroke="#BFDBFE" strokeDasharray="3 3" />
            ))}
            <ReferenceLine y={0} stroke="#E8EBF0" />
            <XAxis
              dataKey="x"
              tickFormatter={v => `${v}m`}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={42}
              tickFormatter={v => Math.round(v).toString()}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)} kN`, 'V(x)']}
              labelFormatter={l => `x = ${l} m`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8EBF0' }}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Diagram M */}
      <Card>
        <SectionLabel>Moment fléchissant M(x)</SectionLabel>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={beam.mData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            {beam.suppX.map(x => (
              <ReferenceLine key={x} x={x} stroke="#FECACA" strokeDasharray="3 3" />
            ))}
            <ReferenceLine y={0} stroke="#E8EBF0" />
            <XAxis
              dataKey="x"
              tickFormatter={v => `${v}m`}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
              interval="preserveStartEnd"
            />
            <YAxis
              width={42}
              tickFormatter={v => Math.round(v).toString()}
              tick={{ fontSize: 10, fill: '#94A3B8' }}
            />
            <Tooltip
              formatter={(v) => [`${Number(v).toFixed(1)} kN·m`, 'M(x)']}
              labelFormatter={l => `x = ${l} m`}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E8EBF0' }}
            />
            <Line
              type="monotone"
              dataKey="m"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* SLS Deflection */}
      <Card>
        <SectionLabel>Vérification flèche ELS — CSA S6-19</SectionLabel>

        <div className="flex flex-col gap-3 mb-4">
          <SelectInput
            label="Matériau du tablier"
            value={slsProps.material}
            onChange={handleMaterialChange}
            options={[
              { value: 'concrete', label: 'Béton (η = 0.5)' },
              { value: 'steel', label: 'Acier (η = 1.0)' },
              { value: 'custom', label: 'Personnalisé' },
            ]}
          />
          <Input
            label="Hauteur h"
            value={slsProps.h_mm}
            onChange={v => setSLSProps({ ...slsProps, h_mm: Math.max(50, Number(v) || 50) })}
            type="number"
            unit="mm"
            min={50}
            max={5000}
            step={50}
          />
          <Input
            label="Module E"
            value={slsProps.E_MPa}
            onChange={v => slsProps.material === 'custom' && setSLSProps({ ...slsProps, E_MPa: Math.max(1000, Number(v) || 1000) })}
            type="number"
            unit="MPa"
            min={1000}
            max={300000}
            step={500}
            hint={slsProps.material !== 'custom' ? 'Auto depuis le matériau' : undefined}
          />
        </div>

        {slsResults && slsResults.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E8EBF0' }}>
                    {['Travée', 'L (m)', 'δ (mm)', `Lim. ${limitLabel}`, 'Ratio', ''].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wide py-2 pr-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slsResults.map((r, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#F9F9F9' : 'transparent', borderBottom: '0.5px solid #F0F0F0' }}>
                      <td className="py-2 pr-2 font-semibold text-[#0F172A]">{r.span}</td>
                      <td className="py-2 pr-2 font-mono text-[#0F172A]">{r.L_m}</td>
                      <td className="py-2 pr-2 font-mono" style={{ color: r.ok ? '#34C759' : '#FF3B30', fontWeight: 600 }}>{r.delta_mm}</td>
                      <td className="py-2 pr-2 font-mono text-[#64748B]">{r.limit_mm}</td>
                      <td className="py-2 pr-2 font-mono" style={{ color: r.ok ? '#1A8A3C' : '#D70015' }}>{r.ratio}</td>
                      <td className="py-2">{r.ok
                        ? <span style={{ color: '#34C759', fontSize: 14 }}>✓</span>
                        : <span style={{ color: '#FF3B30', fontSize: 14 }}>✗</span>
                      }</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex justify-end">
              <CheckBadge ok={allSLSOk} label={allSLSOk ? 'Flèche OK' : 'Flèche NOK'} />
            </div>
          </>
        )}
      </Card>

      {/* Camber (contre-flèche) */}
      {camberResults && camberResults.length > 0 && (
        <Card>
          <SectionLabel>Contre-flèche recommandée</SectionLabel>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #E8EBF0' }}>
                  {['Travée', 'L (m)', 'δ_D (mm)'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-[#8E8E93] uppercase tracking-wide py-2 pr-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {camberResults.map((r, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 === 1 ? '#F9F9F9' : 'transparent', borderBottom: '0.5px solid #F0F0F0' }}>
                    <td className="py-2 pr-2 font-semibold text-[#0F172A]">{r.span}</td>
                    <td className="py-2 pr-2 font-mono text-[#0F172A]">{r.L_m}</td>
                    <td className="py-2 pr-2 font-mono font-bold" style={{ color: '#007AFF' }}>{r.delta_mm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-[#8E8E93] mt-3 leading-relaxed">
            Pré-cambrage sous charges permanentes (ELS). Valeur à spécifier dans les plans de fabrication.
          </p>
        </Card>
      )}

      <WarnBox>
        Modèle simplifié CUR (travées égales). Vérification camion CL-625 et combinaisons complètes requises pour la conception finale.
      </WarnBox>

      <PrimaryBtn onClick={handleNext}>Voir le résumé →</PrimaryBtn>
      <div className="flex justify-center">
        <GhostBtn onClick={() => setStep(2)}>← Retour</GhostBtn>
      </div>
    </div>
  );
}
