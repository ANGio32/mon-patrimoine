import { Card, SectionLabel, GhostBtn, InfoRow, InfoBox } from '../ui';
import { useStore } from '../../store';
import { ICE_ZONE_LABELS, ICE_ZONE_LOADS, SEISMIC_LABELS } from '../../constants';

export function PanelSpecial() {
  const { loads, setActivePanel } = useStore();
  if (!loads) return null;

  const windPressure = (0.000613 * loads.wind_speed * loads.wind_speed).toFixed(3);
  const iceLoad = ICE_ZONE_LOADS[loads.ice_zone];

  const windExpLabel: Record<string, string> = {
    A: 'A — Mer/lac ouvert',
    B: 'B — Terrain dégagé',
    C: 'C — Banlieue/boisé',
    D: 'D — Centre urbain',
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center gap-3 mb-1">
        <GhostBtn onClick={() => setActivePanel(null)}>← Retour</GhostBtn>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Charges spéciales</h1>
      </div>

      {/* Verglas */}
      <Card>
        <SectionLabel>Verglas — CSA S6 cl. 3.14</SectionLabel>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-bold text-[#0F172A]">Zone {loads.ice_zone}</span>
          <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full px-3 py-1 text-[12px] font-semibold">
            {loads.province}
          </span>
        </div>
        <p className="text-[13px] text-[#64748B] mb-3">{ICE_ZONE_LABELS[loads.ice_zone]}</p>
        <InfoBox>
          <div className="flex justify-between">
            <span>Charge indicative</span>
            <span className="font-mono font-bold">{iceLoad} kPa</span>
          </div>
        </InfoBox>
        <div className="mt-3 text-[12px] text-[#94A3B8]">
          <p>Application : sur les surfaces exposées du tablier et des éléments porteurs.</p>
          <p className="mt-1">Combinaison avec les charges vives selon CSA S6-19 Table 3.1.</p>
        </div>
      </Card>

      {/* Vent */}
      <Card>
        <SectionLabel>Vent — CSA S6 cl. 3.10</SectionLabel>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-[#EFF6FF] rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-[#60A5FA] mb-1">q₁₀</p>
            <p className="text-[20px] font-mono font-bold text-[#2563EB]">{loads.wind_speed}</p>
            <p className="text-[11px] text-[#60A5FA]">km/h</p>
          </div>
          <div className="bg-[#EFF6FF] rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-[#60A5FA] mb-1">Pression</p>
            <p className="text-[20px] font-mono font-bold text-[#2563EB]">{windPressure}</p>
            <p className="text-[11px] text-[#60A5FA]">kPa</p>
          </div>
        </div>
        <InfoRow label="Catégorie d'exposition" value={windExpLabel[loads.wind_exp] ?? loads.wind_exp} />
        <div className="mt-2 text-[12px] text-[#94A3B8]">
          Formule : p = 0.000613 × V² — Pression de référence au niveau du tablier.
        </div>
      </Card>

      {/* Séisme */}
      <Card>
        <SectionLabel>Séisme — CSA S6 Section 4</SectionLabel>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[22px] font-bold text-[#0F172A]">Zone {loads.seismic}</span>
        </div>
        <p className="text-[13px] text-[#64748B] mb-2">{SEISMIC_LABELS[loads.seismic]}</p>
        <div className="text-[12px] text-[#94A3B8] space-y-1">
          {loads.seismic === '1' && <p>Vérification sismique minimale, coefficients forfaitaires CSA S6.</p>}
          {loads.seismic === '2' && <p>Analyse statique équivalente selon CSA S6 cl. 4.4.7.</p>}
          {loads.seismic === '3' && <p>Analyse modale spectrale recommandée — spectre de réponse site-spécifique.</p>}
          {loads.seismic === '4' && <p>Analyse temporelle non-linéaire selon CSA S6 cl. 4.4.9. Déplacements de conception requis.</p>}
        </div>
      </Card>

      {/* Collision */}
      {loads.has_collision && (
        <Card className="border-[#FECACA]">
          <SectionLabel>Collision</SectionLabel>
          <div className="bg-[#FEF2F2] rounded-xl p-3 mb-3 flex items-center justify-between">
            <span className="text-[12px] text-[#991B1B] font-semibold">Force de collision</span>
            <span className="text-[24px] font-mono font-bold text-[#DC2626]">1800 kN</span>
          </div>
          <InfoRow label="Direction" value="Horizontale" />
          <InfoRow label="Application" value="Sur pile / culée" />
          <InfoRow label="Hauteur" value="1.2 m au-dessus chaussée" />
          <InfoRow label="Combinaison" value="Combinaison 6 — CSA S6 T.3.1" />
        </Card>
      )}
    </div>
  );
}
