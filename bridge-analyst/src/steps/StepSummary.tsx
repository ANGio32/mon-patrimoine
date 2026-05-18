import { Card, SectionLabel, BigStat, Pill, InfoRow, GhostBtn } from '../components/ui';
import { BridgeSVG } from '../components/bridge/BridgeSVG';
import { useStore } from '../store';

const DECK_LABELS: Record<string, string> = {
  slab: 'Dalle pleine', box_girder: 'Caisson', i_beam: 'Poutre en I',
  t_beam: 'Poutre en T', arch: 'Arc', unknown: 'Inconnu',
};
const STRUCT_LABELS: Record<string, string> = {
  bridge: 'Pont', viaduct: 'Viaduc', culvert: 'Ponceau',
  pedestrian: 'Passerelle', other: 'Autre',
};

const PANEL_ITEMS = [
  { id: 'section', icon: '🧱', title: 'Vérification de section', sub: 'Béton armé CSA A23.3-19' },
  { id: 'truck', icon: '🚛', title: 'Camion CL-625', sub: 'Moment max par ligne d\'influence' },
  { id: 'special', icon: '🌬️', title: 'Charges spéciales', sub: 'Verglas, vent, séisme, collision' },
  { id: 'export', icon: '📄', title: 'Exporter la fiche', sub: 'Texte + PDF prêts à l\'emploi' },
];

export function StepSummary() {
  const { geo, loads, analysis, setActivePanel, setStep, reset } = useStore();

  if (!geo || !loads || !analysis) {
    return (
      <div className="py-8 text-center text-[#64748B]">
        <p>Données incomplètes.</p>
        <GhostBtn onClick={() => setStep(0)}>Recommencer</GhostBtn>
      </div>
    );
  }

  const { ld } = analysis;

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-4 py-1.5 mb-3">
          <span className="text-[#16A34A] font-semibold text-[13px]">✓ Analyse complète</span>
        </div>
        <h1 className="text-[26px] font-bold text-[#0F172A]">Résumé de l'ouvrage</h1>
      </div>

      {/* SVG */}
      <div className="bg-white rounded-2xl border border-[#E8EBF0] p-4 shadow-sm">
        <BridgeSVG geo={geo} className="w-full h-auto" />
        <div className="flex flex-wrap gap-2 mt-3">
          <Pill label="L" value={`${geo.total_length_m}m`} />
          <Pill label="l" value={`${geo.width_m}m`} />
          <Pill label="Travées" value={`${geo.spans}`} />
          <Pill label="h" value={`${geo.clearance_m}m`} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <BigStat label="V_max ULS" value={analysis.Vmax.toFixed(1)} unit="kN" color="accent" />
        <BigStat label="M_max ULS" value={analysis.Mmax.toFixed(1)} unit="kN·m" color="error" />
      </div>

      {/* Ouvrage */}
      <Card>
        <SectionLabel>Données de l'ouvrage</SectionLabel>
        <InfoRow label="Type" value={STRUCT_LABELS[geo.structure_type] ?? geo.structure_type} />
        <InfoRow label="Tablier" value={DECK_LABELS[geo.deck_type] ?? geo.deck_type} />
        <InfoRow label="Travées" value={`${geo.spans}`} />
        <InfoRow label="Longueur totale" value={`${geo.total_length_m} m`} />
        <InfoRow label="Largeur" value={`${geo.width_m} m`} />
        <InfoRow label="Dégagement" value={`${geo.clearance_m} m`} />
        <InfoRow label="Piles" value={geo.has_piers ? `${geo.pier_count}` : 'Non'} />
      </Card>

      {/* Charges ULS */}
      <Card>
        <SectionLabel>Charges ULS</SectionLabel>
        <InfoRow label="w_D (permanent)" value={`${ld.wD.toFixed(1)} kN/m`} mono />
        <InfoRow label="w_L (vive)" value={`${ld.wL.toFixed(1)} kN/m`} mono />
        <InfoRow label="w_ULS total" value={`${ld.wULS.toFixed(1)} kN/m`} mono />
        <InfoRow label="Voies" value={`${loads.num_lanes} × MPF=${ld.mpf}`} />
        <InfoRow label="Camion" value={loads.truck_class} />
        <InfoRow label="Province / Zone verglas" value={`${loads.province} / Zone ${loads.ice_zone}`} />
        <InfoRow label="Zone sismique" value={`${loads.seismic}`} />
      </Card>

      {/* Outils */}
      <Card>
        <SectionLabel>Outils & analyses</SectionLabel>
        <div className="flex flex-col gap-1">
          {PANEL_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePanel(item.id)}
              className="flex items-center gap-3 py-3 border-b border-[#E8EBF0] last:border-0 active:bg-[#F8FAFC] transition-colors w-full text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-xl shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#0F172A]">{item.title}</p>
                <p className="text-[12px] text-[#94A3B8]">{item.sub}</p>
              </div>
              <span className="text-[#2563EB] font-bold text-[18px]">›</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center gap-6">
        <GhostBtn onClick={() => setStep(3)}>← Modifier l'analyse</GhostBtn>
        <GhostBtn onClick={reset}>Nouvelle analyse</GhostBtn>
      </div>
    </div>
  );
}
