import type { ReactNode } from 'react';
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

function PanelIcon({ id }: { id: string }): ReactNode {
  if (id === 'section') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="#007AFF" strokeWidth="1.4"/>
      <line x1="2" y1="7" x2="18" y2="7" stroke="#007AFF" strokeWidth="1.4"/>
      <line x1="2" y1="13" x2="18" y2="13" stroke="#007AFF" strokeWidth="1.4"/>
      <line x1="7" y1="7" x2="7" y2="18" stroke="#007AFF" strokeWidth="1.4"/>
    </svg>
  );
  if (id === 'truck') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="1" y="7" width="11" height="7" rx="1.2" stroke="#007AFF" strokeWidth="1.4"/>
      <path d="M12 10h3l2.5 2.5V15h-5.5V10z" stroke="#007AFF" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="5" cy="15.5" r="1.5" stroke="#007AFF" strokeWidth="1.2"/>
      <circle cx="15" cy="15.5" r="1.5" stroke="#007AFF" strokeWidth="1.2"/>
    </svg>
  );
  if (id === 'special') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="3.5" stroke="#007AFF" strokeWidth="1.4"/>
      <path d="M10 2v2.5M10 15.5V18M2 10h2.5M15.5 10H18" stroke="#007AFF" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M4.6 4.6l1.8 1.8M13.6 13.6l1.8 1.8M15.4 4.6l-1.8 1.8M6.4 13.6l-1.8 1.8" stroke="#007AFF" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
  // export
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12 2H5a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V7l-4-5z" stroke="#007AFF" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M12 2v5h5" stroke="#007AFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 12h6M7 9h3" stroke="#007AFF" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

const PANEL_ITEMS = [
  { id: 'section', title: 'Vérification de section', sub: 'Béton armé CSA A23.3-19' },
  { id: 'truck', title: 'Camion CL-625', sub: 'Moment max par ligne d\'influence' },
  { id: 'special', title: 'Charges spéciales', sub: 'Verglas, vent, séisme, collision' },
  { id: 'export', title: 'Exporter la fiche', sub: 'Texte + PDF prêts à l\'emploi' },
];

export function StepSummary() {
  const { geo, loads, analysis, setActivePanel, setStep, reset } = useStore();

  if (!geo || !loads || !analysis) {
    return (
      <div className="py-12 text-center">
        <p className="text-[#8E8E93] mb-4">Données incomplètes.</p>
        <GhostBtn onClick={() => setStep(0)}>Recommencer</GhostBtn>
      </div>
    );
  }

  const { ld } = analysis;

  return (
    <div className="flex flex-col gap-5 py-4">
      {/* Success badge */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-[7px] mb-4"
          style={{ backgroundColor: '#F0FFF4', border: '1px solid #A3E6B8' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="#34C759"/>
            <path d="M4 7l2.5 2.5L10 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[13px] font-semibold" style={{ color: '#1A8A3C' }}>Analyse complète</span>
        </div>
        <h1 className="text-[26px] font-bold tracking-[-0.5px] text-black">Résumé</h1>
      </div>

      {/* Bridge SVG */}
      <div className="bg-white rounded-[20px] p-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
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
        <InfoRow label="w_D permanent" value={`${ld.wD.toFixed(1)} kN/m`} mono />
        <InfoRow label="w_L vive" value={`${ld.wL.toFixed(1)} kN/m`} mono />
        <InfoRow label="w_ULS total" value={`${ld.wULS.toFixed(1)} kN/m`} mono />
        <InfoRow label="Voies" value={`${loads.num_lanes} × MPF ${ld.mpf}`} />
        <InfoRow label="Camion" value={loads.truck_class} />
        <InfoRow label="Province / Verglas" value={`${loads.province} / Zone ${loads.ice_zone}`} />
        <InfoRow label="Zone sismique" value={`${loads.seismic}`} />
      </Card>

      {/* Outils */}
      <Card>
        <SectionLabel>Outils & analyses</SectionLabel>
        <div>
          {PANEL_ITEMS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActivePanel(item.id)}
              className="flex items-center gap-4 w-full text-left active:opacity-60 transition-opacity py-[13px]"
              style={{ borderBottom: i < PANEL_ITEMS.length - 1 ? '0.5px solid #C6C6C8' : 'none' }}
            >
              <div className="w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#EAF3FF' }}>
                <PanelIcon id={item.id} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-black">{item.title}</p>
                <p className="text-[13px] text-[#8E8E93] mt-[1px]">{item.sub}</p>
              </div>
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 1l6 6-6 6" stroke="#C6C6C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex justify-center gap-6 pb-4">
        <GhostBtn onClick={() => setStep(3)}>← Analyse</GhostBtn>
        <GhostBtn onClick={reset}>Nouvelle analyse</GhostBtn>
      </div>
    </div>
  );
}
