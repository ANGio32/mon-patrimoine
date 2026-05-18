import { useState } from 'react';
import { Card, SectionLabel, Input, SelectInput, Toggle, PrimaryBtn, GhostBtn, Pill, InfoBox } from '../components/ui';
import { BridgeSVG } from '../components/bridge/BridgeSVG';
import { useStore } from '../store';
import type { GeoData } from '../types';

const STRUCTURE_OPTS = [
  { value: 'bridge', label: 'Pont' },
  { value: 'viaduct', label: 'Viaduc' },
  { value: 'culvert', label: 'Ponceau' },
  { value: 'pedestrian', label: 'Passerelle' },
  { value: 'other', label: 'Autre' },
];

const DECK_OPTS = [
  { value: 'slab', label: 'Dalle pleine' },
  { value: 'box_girder', label: 'Caisson' },
  { value: 'i_beam', label: 'Poutre en I' },
  { value: 't_beam', label: 'Poutre en T' },
  { value: 'arch', label: 'Arc' },
  { value: 'unknown', label: 'Inconnu' },
];

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', label: 'Confiance faible' },
  medium: { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', label: 'Confiance modérée' },
  high:   { bg: '#F0FDF4', text: '#14532D', border: '#BBF7D0', label: 'Confiance élevée' },
};

export function StepGeometry() {
  const { geo, setGeo, aiAnalysis, setStep, saveSession } = useStore();

  const [data, setData] = useState<GeoData>(geo ?? {
    structure_type: 'bridge', spans: 3, total_length_m: 45, width_m: 12,
    clearance_m: 5.5, deck_type: 'i_beam', has_piers: true, pier_count: 2,
    has_abutments: true, has_walls: false,
  });

  const update = <K extends keyof GeoData>(key: K, val: GeoData[K]) => {
    setData(d => ({ ...d, [key]: val }));
  };

  const num = (s: string, fallback: number, min?: number) => {
    const v = parseFloat(s);
    if (isNaN(v)) return fallback;
    return min !== undefined ? Math.max(min, v) : v;
  };

  const spanLen = data.spans > 0 ? (data.total_length_m / data.spans).toFixed(1) : '—';

  const handleNext = () => {
    setGeo(data);
    saveSession();
    setStep(2);
  };

  const conf = aiAnalysis?.confidence ?? null;
  const confStyle = conf ? CONFIDENCE_COLORS[conf] : null;

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-[#0F172A] mb-1">Géométrie</h1>
        <p className="text-[13px] text-[#64748B]">Validez les données détectées par Claude Vision</p>
      </div>

      {/* AI confidence banner */}
      {aiAnalysis && confStyle && (
        <div
          className="rounded-xl border p-3"
          style={{ backgroundColor: confStyle.bg, borderColor: confStyle.border }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: confStyle.text }}>
              {confStyle.label}
            </span>
          </div>
          <p className="text-[13px]" style={{ color: confStyle.text }}>{aiAnalysis.description}</p>
          {aiAnalysis.notes && (
            <p className="text-[12px] mt-1 opacity-80" style={{ color: confStyle.text }}>{aiAnalysis.notes}</p>
          )}
        </div>
      )}

      {/* Live SVG */}
      <div className="bg-white rounded-2xl border border-[#E8EBF0] p-4 shadow-sm">
        <BridgeSVG geo={data} className="w-full h-auto" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Pill label="L" value={`${data.total_length_m}m`} />
          <Pill label="l" value={`${data.width_m}m`} />
          <Pill label="Travées" value={`${data.spans}`} />
          <Pill label="h" value={`${data.clearance_m}m`} />
        </div>
      </div>

      {/* Card 1: Type */}
      <Card>
        <SectionLabel>Type d'ouvrage</SectionLabel>
        <div className="flex flex-col gap-3">
          <SelectInput
            label="Type de structure"
            value={data.structure_type}
            onChange={v => update('structure_type', v as GeoData['structure_type'])}
            options={STRUCTURE_OPTS}
          />
          <SelectInput
            label="Type de tablier"
            value={data.deck_type}
            onChange={v => update('deck_type', v as GeoData['deck_type'])}
            options={DECK_OPTS}
          />
        </div>
      </Card>

      {/* Card 2: Dimensions */}
      <Card>
        <SectionLabel>Dimensions</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre de travées"
            value={data.spans}
            type="number"
            min={1}
            onChange={v => update('spans', num(v, 1, 1))}
          />
          <Input
            label="Longueur totale"
            value={data.total_length_m}
            type="number"
            unit="m"
            min={1}
            step={0.5}
            onChange={v => update('total_length_m', num(v, 10, 1))}
          />
          <Input
            label="Largeur hors-tout"
            value={data.width_m}
            type="number"
            unit="m"
            min={1}
            step={0.5}
            onChange={v => update('width_m', num(v, 6, 1))}
          />
          <Input
            label="Dégagement vertical"
            value={data.clearance_m}
            type="number"
            unit="m"
            min={0}
            step={0.1}
            onChange={v => update('clearance_m', num(v, 0))}
          />
        </div>
        <InfoBox>
          <div className="flex items-center justify-between">
            <span>Portée / travée calculée</span>
            <span className="font-mono font-bold">{spanLen} m</span>
          </div>
        </InfoBox>
      </Card>

      {/* Card 3: Elements */}
      <Card>
        <SectionLabel>Éléments structuraux</SectionLabel>
        <div className="flex flex-col gap-3">
          <Toggle
            label="Culées"
            checked={data.has_abutments}
            onChange={v => update('has_abutments', v)}
          />
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Piles"
            checked={data.has_piers}
            onChange={v => update('has_piers', v)}
          />
          {data.has_piers && (
            <Input
              label="Nombre de piles"
              value={data.pier_count}
              type="number"
              min={1}
              onChange={v => update('pier_count', num(v, 1, 1))}
            />
          )}
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Murs de soutènement"
            checked={data.has_walls}
            onChange={v => update('has_walls', v)}
          />
        </div>
      </Card>

      <PrimaryBtn onClick={handleNext}>Étape suivante →</PrimaryBtn>
      <div className="flex justify-center">
        <GhostBtn onClick={() => setStep(0)}>← Retour</GhostBtn>
      </div>
    </div>
  );
}
