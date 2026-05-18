import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, SectionLabel, BigStat, Pill, WarnBox, PrimaryBtn, GhostBtn } from '../components/ui';
import { useStore } from '../store';
import { computeLoads, computeBeam } from '../lib/structural';
import { GAMMA_D, GAMMA_L } from '../constants';

function fmt(n: number, dec = 1) { return n.toFixed(dec); }

export function StepAnalysis() {
  const { geo, loads, setAnalysis, setStep, saveSession } = useStore();

  const result = useMemo(() => {
    if (!geo || !loads) return null;
    const ld = computeLoads(geo, loads);
    const beam = computeBeam(geo.total_length_m, geo.spans, ld.wULS);
    return { ld, beam };
  }, [geo, loads]);

  if (!geo || !loads || !result) {
    return (
      <div className="py-8 text-center text-[#64748B]">
        Données manquantes. Recommencez depuis le début.
      </div>
    );
  }

  const { ld, beam } = result;

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
