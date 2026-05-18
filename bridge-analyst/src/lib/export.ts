import type { GeoData, LoadData, AnalysisResult } from '../types';
import jsPDF from 'jspdf';

const DECK_LABELS: Record<string, string> = {
  slab: 'Dalle pleine', box_girder: 'Caisson', i_beam: 'Poutre en I',
  t_beam: 'Poutre en T', arch: 'Arc', unknown: 'Inconnu',
};

const STRUCTURE_LABELS: Record<string, string> = {
  bridge: 'Pont', viaduct: 'Viaduc', culvert: 'Ponceau',
  pedestrian: 'Passerelle', other: 'Autre',
};

export function buildExportText(geo: GeoData, loads: LoadData, analysis: AnalysisResult): string {
  const today = new Date().toLocaleDateString('fr-CA', { dateStyle: 'long' });
  const spanLen = (geo.total_length_m / geo.spans).toFixed(1);

  const pedStr = [
    loads.sidewalk_left ? `G: ${loads.sidewalk_left_w}m` : null,
    loads.sidewalk_right ? `D: ${loads.sidewalk_right_w}m` : null,
  ].filter(Boolean).join(' | ') || 'Aucun';

  return `BRIDGE ANALYST — FICHE OUVRAGE
Date : ${today}
Norme : CSA S6-19

━━━━━━━━━━━━━━━━━━━━
GÉOMÉTRIE
━━━━━━━━━━━━━━━━━━━━
Type               : ${STRUCTURE_LABELS[geo.structure_type] ?? geo.structure_type}
Tablier            : ${DECK_LABELS[geo.deck_type] ?? geo.deck_type}
Travées            : ${geo.spans}
Portée / travée    : ${spanLen} m
Longueur totale    : ${geo.total_length_m} m
Largeur hors-tout  : ${geo.width_m} m
Dégagement vert.   : ${geo.clearance_m} m
Piles              : ${geo.has_piers ? geo.pier_count : 'Non'}
Culées             : ${geo.has_abutments ? 'Oui' : 'Non'}
Murs               : ${geo.has_walls ? 'Oui' : 'Non'}

━━━━━━━━━━━━━━━━━━━━
CHARGES — CSA S6-19
━━━━━━━━━━━━━━━━━━━━
Voies circulation  : ${loads.num_lanes}
Classe camion      : ${loads.truck_class}
Tramway            : ${loads.has_tram ? `Oui (${loads.tram_tracks} voie(s), ${loads.tram_axle_kn} kN/essieu)` : 'Non'}
Trottoirs          : ${pedStr}
Enrobé             : ${loads.wearing_surface_mm} mm
Glissières         : ${loads.has_barrier ? loads.barrier_type : 'Non'}
Province           : ${loads.province}
Zone verglas       : Zone ${loads.ice_zone}
Vent q₁₀           : ${loads.wind_speed} km/h
Zone sismique      : ${loads.seismic}

━━━━━━━━━━━━━━━━━━━━
ANALYSE (CUR, ÉULS)
━━━━━━━━━━━━━━━━━━━━
w_D (permanent)    : ${analysis.ld.wD.toFixed(1)} kN/m
w_L (vive)         : ${analysis.ld.wL.toFixed(1)} kN/m
w_ULS              : ${analysis.ld.wULS.toFixed(1)} kN/m
V_max              : ${analysis.Vmax.toFixed(1)} kN
M_max              : ${analysis.Mmax.toFixed(1)} kN·m

━━━━━━━━━━━━━━━━━━━━
NOTE : Analyse préliminaire CUR (charge uniformément répartie).
Les combinaisons complètes de charges (camion CL-625, vent,
séisme, température) doivent être vérifiées pour la conception
finale selon CSA S6-19.
━━━━━━━━━━━━━━━━━━━━`;
}

export async function exportPDF(text: string, geo: GeoData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageW = 210;
  const contentW = pageW - 2 * margin;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BRIDGE ANALYST', margin, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Analyse préliminaire CSA S6-19', pageW - margin, 12, { align: 'right' });

  doc.setTextColor(15, 23, 42);

  let y = 28;
  const lines = text.split('\n');
  for (const line of lines) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (line.startsWith('━')) {
      doc.setDrawColor(232, 235, 240);
      doc.line(margin, y - 1, margin + contentW, y - 1);
      y += 1;
      continue;
    }
    if (line === '') { y += 3; continue; }

    const isSectionHeader = /^[A-ZÉÈÊ]/.test(line) && !line.includes(':') && line.trim().length > 2;
    if (isSectionHeader && line !== 'BRIDGE ANALYST — FICHE OUVRAGE') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(37, 99, 235);
    } else if (line.startsWith('Date') || line.startsWith('Norme')) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
    } else if (line.startsWith('BRIDGE ANALYST')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
    } else if (line.startsWith('NOTE')) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
    }

    const wrapped = doc.splitTextToSize(line, contentW);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5;
  }

  const fileName = `bridge-analyst-${geo.structure_type}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
