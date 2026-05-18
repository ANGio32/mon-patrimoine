import { useState } from 'react';
import { Card, SectionLabel, Input, SelectInput, PrimaryBtn, GhostBtn, CheckBadge, InfoRow, WarnBox, InfoBox } from '../ui';
import { useStore } from '../../store';
import { computeSection } from '../../lib/structural';
import type { SectionResult, SectionInput } from '../../types';

export function PanelSection() {
  const { analysis, geo, setActivePanel } = useStore();
  const [form, setForm] = useState<SectionInput>({ b: 1000, h: 700, cover: 60, fc: 35, fy: 400 });
  const [result, setResult] = useState<SectionResult | null>(null);

  if (!analysis || !geo) return null;

  const Mf_total = analysis.Mmax;
  const Vf_total = analysis.Vmax;

  const upd = <K extends keyof SectionInput>(k: K, v: SectionInput[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    setResult(null);
  };

  const num = (s: string, fb: number) => { const v = parseFloat(s); return isNaN(v) ? fb : v; };

  const calculate = () => {
    setResult(computeSection(form, Mf_total, Vf_total, geo.width_m));
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center gap-3 mb-1">
        <GhostBtn onClick={() => setActivePanel(null)}>← Retour</GhostBtn>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Vérification de section</h1>
      </div>

      <InfoBox>
        M_f = {Mf_total.toFixed(1)} kN·m total · V_f = {Vf_total.toFixed(1)} kN total<br />
        Résultats par mètre de largeur (bande de 1 m)
      </InfoBox>

      <Card>
        <SectionLabel>Paramètres de section</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Largeur b" value={form.b} type="number" unit="mm" onChange={v => upd('b', num(v, 1000))} />
            <Input label="Hauteur h" value={form.h} type="number" unit="mm" onChange={v => upd('h', num(v, 700))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Enrobage c" value={form.cover} type="number" unit="mm" onChange={v => upd('cover', num(v, 60))} />
            <Input label="f'c béton" value={form.fc} type="number" unit="MPa" onChange={v => upd('fc', num(v, 35))} />
          </div>
          <SelectInput
            label="fy acier"
            value={String(form.fy)}
            onChange={v => upd('fy', parseInt(v))}
            options={[{ value: '400', label: '400 MPa (standard)' }, { value: '500', label: '500 MPa (HR)' }]}
          />
        </div>
      </Card>

      <PrimaryBtn onClick={calculate}>Calculer →</PrimaryBtn>

      {result && (
        <>
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <CheckBadge ok={result.As >= result.As_min} label="As ≥ As_min" />
            <CheckBadge ok={result.Mr >= result.Mf} label="Mr ≥ Mf" />
            <CheckBadge ok={result.shearOK} label="Vc ≥ Vf" />
          </div>

          {/* Flexion */}
          <Card className={result.flexOK ? 'border-[#BBF7D0]' : 'border-[#FECACA]'}>
            <SectionLabel>Flexion</SectionLabel>
            <InfoRow label="Hauteur utile d" value={`${result.d} mm`} mono />
            <InfoRow label="Moment de design Mf" value={`${result.Mf.toFixed(1)} kN·m/m`} mono />
            <InfoRow label="As requis" value={`${result.As} mm²`} mono />
            <InfoRow label="As minimum" value={`${result.As_min} mm²`} mono />
            <InfoRow label="ρ calculé" value={`${result.rho.toFixed(3)}%`} mono />
            <InfoRow label="Profondeur bloc a" value={`${result.a} mm`} mono />
            <InfoRow label="Résistance Mr" value={`${result.Mr.toFixed(1)} kN·m/m`} mono />
            <div className="mt-3 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3">
              <p className="text-[10px] font-bold uppercase text-[#60A5FA] mb-1">ARMATURE SUGGÉRÉE</p>
              <p className="text-[16px] font-mono font-bold text-[#2563EB]">{result.suggestedBar}</p>
              <p className="text-[11px] text-[#60A5FA] mt-0.5">Indicatif — barres 25M, A_bar = 500 mm²</p>
            </div>
          </Card>

          {/* Cisaillement */}
          <Card className={result.shearOK ? 'border-[#BBF7D0]' : 'border-[#FDE68A]'}>
            <SectionLabel>Cisaillement</SectionLabel>
            <InfoRow label="Vf par mètre" value={`${result.Vf.toFixed(1)} kN/m`} mono />
            <InfoRow label="dv" value={`${Math.round(Math.max(0.9 * result.d, 0.72 * form.h))} mm`} mono />
            <InfoRow label="Vc (béton seul)" value={`${result.Vc.toFixed(1)} kN/m`} mono />
            {!result.shearOK && (
              <div className="mt-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-2 text-[12px] text-[#92400E]">
                Armature transversale Vs requise ≈ {(result.Vf - result.Vc).toFixed(1)} kN/m
              </div>
            )}
          </Card>

          <WarnBox>
            Vérification préliminaire CSA A23.3-19 simplifiée. Méthode générale requise pour conception finale CSA S6-19.
          </WarnBox>
        </>
      )}
    </div>
  );
}
