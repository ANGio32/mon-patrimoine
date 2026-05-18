import { useState } from 'react';
import { Card, SectionLabel, Input, SelectInput, Toggle, PrimaryBtn, GhostBtn, InfoBox } from '../components/ui';
import { useStore } from '../store';
import type { LoadData } from '../types';
import { PROVINCES } from '../constants';

const TRUCK_OPTS = [
  { value: 'CL-625', label: 'CL-625 (standard)' },
  { value: 'CL-625-ONT', label: 'CL-625-ONT (Ontario)' },
  { value: 'CL-W', label: 'CL-W (route forestière)' },
];

const BARRIER_OPTS = [
  { value: 'PCB', label: 'PCB — 8 kN/m' },
  { value: 'TL5', label: 'TL5 — 11 kN/m' },
  { value: 'steel', label: 'Acier — 4 kN/m' },
];

const SEISMIC_OPTS = ['1', '2', '3', '4'].map(v => ({ value: v, label: `Zone ${v}` }));
const ICE_OPTS = ['A', 'B', 'C', 'D', 'E'].map(v => ({ value: v, label: `Zone ${v}` }));
const WIND_EXP_OPTS = [
  { value: 'A', label: 'A — Mer/lac ouvert' },
  { value: 'B', label: 'B — Terrain ouvert' },
  { value: 'C', label: 'C — Banlieue/boisé' },
  { value: 'D', label: 'D — Centre urbain' },
];
const PROVINCE_OPTS = PROVINCES.map(p => ({ value: p, label: p }));

export function StepLoads() {
  const { loads, setLoads, setStep, saveSession } = useStore();
  const [data, setData] = useState<LoadData>({ ...loads });

  const update = <K extends keyof LoadData>(key: K, val: LoadData[K]) => {
    setData(d => ({ ...d, [key]: val }));
  };

  const num = (s: string, fallback: number, min?: number) => {
    const v = parseFloat(s);
    if (isNaN(v)) return fallback;
    return min !== undefined ? Math.max(min, v) : v;
  };

  const handleNext = () => {
    setLoads(data);
    saveSession();
    setStep(3);
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-[#0F172A] mb-1">Charges</h1>
        <p className="text-[13px] text-[#64748B]">CSA S6-19 — paramètres de chargement</p>
      </div>

      {/* Card 1 — Circulation */}
      <Card>
        <SectionLabel>Circulation</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nb de voies"
              value={data.num_lanes}
              type="number"
              min={1}
              max={6}
              onChange={v => update('num_lanes', num(v, 2, 1))}
            />
            <Input
              label="Largeur de voie"
              value={data.lane_width_m}
              type="number"
              unit="m"
              step={0.1}
              onChange={v => update('lane_width_m', num(v, 3.7))}
            />
          </div>
          <SelectInput
            label="Classe de camion"
            value={data.truck_class}
            onChange={v => update('truck_class', v as LoadData['truck_class'])}
            options={TRUCK_OPTS}
          />
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Tramway / LRT"
            checked={data.has_tram}
            onChange={v => update('has_tram', v)}
          />
          {data.has_tram && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Voies tram"
                value={data.tram_tracks}
                type="number"
                min={1}
                onChange={v => update('tram_tracks', num(v, 1, 1))}
              />
              <Input
                label="Charge/essieu"
                value={data.tram_axle_kn}
                type="number"
                unit="kN"
                onChange={v => update('tram_axle_kn', num(v, 150))}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Card 2 — Piétons */}
      <Card>
        <SectionLabel>Piétons</SectionLabel>
        <InfoBox>4.8 kPa — CSA S6 cl. 3.8.9</InfoBox>
        <div className="flex flex-col gap-3 mt-3">
          <Toggle
            label="Trottoir gauche"
            checked={data.sidewalk_left}
            onChange={v => update('sidewalk_left', v)}
          />
          {data.sidewalk_left && (
            <Input
              label="Largeur trottoir G"
              value={data.sidewalk_left_w}
              type="number"
              unit="m"
              step={0.1}
              min={0.5}
              onChange={v => update('sidewalk_left_w', num(v, 1.5))}
            />
          )}
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Trottoir droit"
            checked={data.sidewalk_right}
            onChange={v => update('sidewalk_right', v)}
          />
          {data.sidewalk_right && (
            <Input
              label="Largeur trottoir D"
              value={data.sidewalk_right_w}
              type="number"
              unit="m"
              step={0.1}
              min={0.5}
              onChange={v => update('sidewalk_right_w', num(v, 1.5))}
            />
          )}
        </div>
      </Card>

      {/* Card 3 — Permanentes */}
      <Card>
        <SectionLabel>Charges permanentes</SectionLabel>
        <div className="flex flex-col gap-3">
          <Input
            label="Enrobé bitumineux"
            value={data.wearing_surface_mm}
            type="number"
            unit="mm"
            min={0}
            hint="ρ = 2400 kg/m³"
            onChange={v => update('wearing_surface_mm', num(v, 75, 0))}
          />
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Glissières de sécurité"
            checked={data.has_barrier}
            onChange={v => update('has_barrier', v)}
          />
          {data.has_barrier && (
            <SelectInput
              label="Type de glissière"
              value={data.barrier_type}
              onChange={v => update('barrier_type', v as LoadData['barrier_type'])}
              options={BARRIER_OPTS}
            />
          )}
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Réseaux / utilités"
            checked={data.has_utilities}
            onChange={v => update('has_utilities', v)}
          />
          {data.has_utilities && (
            <Input
              label="Charge réseaux"
              value={data.utilities_kn_m}
              type="number"
              unit="kN/m"
              step={0.5}
              onChange={v => update('utilities_kn_m', num(v, 2))}
            />
          )}
        </div>
      </Card>

      {/* Card 4 — Environnement */}
      <Card>
        <SectionLabel>Environnement</SectionLabel>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <SelectInput
              label="Province"
              value={data.province}
              onChange={v => update('province', v)}
              options={PROVINCE_OPTS}
            />
            <SelectInput
              label="Zone verglas"
              value={data.ice_zone}
              onChange={v => update('ice_zone', v as LoadData['ice_zone'])}
              options={ICE_OPTS}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Vent q₁₀"
              value={data.wind_speed}
              type="number"
              unit="km/h"
              min={0}
              onChange={v => update('wind_speed', num(v, 140))}
            />
            <SelectInput
              label="Exposition vent"
              value={data.wind_exp}
              onChange={v => update('wind_exp', v as LoadData['wind_exp'])}
              options={WIND_EXP_OPTS}
            />
          </div>
          <SelectInput
            label="Zone sismique"
            value={data.seismic}
            onChange={v => update('seismic', v as LoadData['seismic'])}
            options={SEISMIC_OPTS}
          />
          <div className="border-t border-[#E8EBF0]" />
          <Toggle
            label="Collision pile / culée"
            subtitle="1800 kN — cl. 3.13"
            checked={data.has_collision}
            onChange={v => update('has_collision', v)}
          />
          <Toggle
            label="Charges de construction"
            checked={data.has_construction}
            onChange={v => update('has_construction', v)}
          />
        </div>
      </Card>

      <PrimaryBtn onClick={handleNext}>Analyser →</PrimaryBtn>
      <div className="flex justify-center">
        <GhostBtn onClick={() => setStep(1)}>← Retour</GhostBtn>
      </div>
    </div>
  );
}
