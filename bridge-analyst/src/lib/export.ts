import type { GeoData, LoadData, AnalysisResult, SLSProps, SLSSpanResult } from '../types';
import jsPDF from 'jspdf';

const DECK_LABELS: Record<string, string> = {
  slab: 'Dalle pleine', box_girder: 'Caisson', i_beam: 'Poutre en I',
  t_beam: 'Poutre en T', arch: 'Arc', unknown: 'Inconnu',
};

const STRUCTURE_LABELS: Record<string, string> = {
  bridge: 'Pont', viaduct: 'Viaduc', culvert: 'Ponceau',
  pedestrian: 'Passerelle', other: 'Autre',
};

const MATERIAL_LABELS: Record<SLSProps['material'], string> = {
  concrete: 'Béton (η = 0.5)',
  steel: 'Acier (η = 1.0)',
  custom: 'Personnalisé',
};

export function buildExportText(
  geo: GeoData,
  loads: LoadData,
  analysis: AnalysisResult,
  slsProps?: SLSProps,
  slsResults?: SLSSpanResult[],
): string {
  const today = new Date().toLocaleDateString('fr-CA', { dateStyle: 'long' });
  const spanLen = (geo.total_length_m / geo.spans).toFixed(1);

  const pedStr = [
    loads.sidewalk_left ? `G: ${loads.sidewalk_left_w}m` : null,
    loads.sidewalk_right ? `D: ${loads.sidewalk_right_w}m` : null,
  ].filter(Boolean).join(' | ') || 'Aucun';

  let text = `BRIDGE ANALYST — FICHE OUVRAGE
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
M_max              : ${analysis.Mmax.toFixed(1)} kN·m`;

  if (slsProps && slsResults && slsResults.length > 0) {
    const isPed = geo.structure_type === 'pedestrian';
    const allOk = slsResults.every(r => r.ok);
    text += `

━━━━━━━━━━━━━━━━━━━━
VÉRIFICATION FLÈCHE ELS (CSA S6-19)
━━━━━━━━━━━━━━━━━━━━
Matériau           : ${MATERIAL_LABELS[slsProps.material]}
h                  : ${slsProps.h_mm} mm
E                  : ${slsProps.E_MPa} MPa
Limite             : ${isPed ? 'L/500 (passerelle)' : 'L/300 (trafic)'}
Résultat global    : ${allOk ? 'CONFORME ✓' : 'NON CONFORME ✗'}

Travée  L(m)   δ(mm)   Limite(mm)  Ratio  Statut`;
    for (const r of slsResults) {
      text += `\n  ${r.span}     ${r.L_m.toFixed(2)}   ${r.delta_mm.toFixed(1)}     ${r.limit_mm.toFixed(1)}       ${r.ratio.toFixed(2)}   ${r.ok ? '✓' : '✗'}`;
    }
  }

  text += `

━━━━━━━━━━━━━━━━━━━━
NOTE : Analyse préliminaire CUR (charge uniformément répartie).
Les combinaisons complètes de charges (camion CL-625, vent,
séisme, température) doivent être vérifiées pour la conception
finale selon CSA S6-19.
━━━━━━━━━━━━━━━━━━━━`;

  return text;
}

// ─── PDF helpers ────────────────────────────────────────────────────────────

function addPageIfNeeded(doc: jsPDF, y: number): number {
  if (y > 260) {
    doc.addPage();
    return 20;
  }
  return y;
}

function sectionHeader(doc: jsPDF, title: string, y: number, margin: number): number {
  y = addPageIfNeeded(doc, y);
  // Blue left bar
  doc.setFillColor(0, 122, 255);
  doc.rect(margin, y - 4, 3, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 122, 255);
  doc.text(title, margin + 6, y + 1);
  doc.setTextColor(15, 23, 42);
  return y + 10;
}

function tableRow(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  margin: number,
  contentW: number,
  alt: boolean,
): number {
  y = addPageIfNeeded(doc, y);
  if (alt) {
    doc.setFillColor(249, 249, 249);
    doc.rect(margin, y - 4, contentW, 7, 'F');
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(label, margin + 2, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(value, margin + contentW - 2, y, { align: 'right' });
  return y + 7;
}

// ─── Main export function ─────────────────────────────────────────────────

export async function exportPDF(
  geo: GeoData,
  loads: LoadData,
  analysis: AnalysisResult,
  slsProps?: SLSProps,
  slsResults?: SLSSpanResult[],
): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  const pageW = 210;
  const contentW = pageW - 2 * margin;
  const today = new Date().toLocaleDateString('fr-CA', { dateStyle: 'long' });
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // ── 1. Blue header bar ──────────────────────────────────────────────────
  doc.setFillColor(0, 122, 255);
  doc.rect(0, 0, pageW, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BRIDGE ANALYST', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(today, pageW - margin, 13, { align: 'right' });

  // ── 2. Title block ──────────────────────────────────────────────────────
  doc.setFillColor(245, 245, 247);
  doc.rect(0, 20, pageW, 18, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Rapport d\'analyse préliminaire — CSA S6-19', margin, 30);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Réf : BA-${dateStr}`, pageW - margin, 30, { align: 'right' });

  let y = 50;

  // ── 3. Geometry section ─────────────────────────────────────────────────
  y = sectionHeader(doc, 'GÉOMÉTRIE', y, margin);

  const spanLen = (geo.total_length_m / geo.spans).toFixed(1);
  const geoRows: [string, string][] = [
    ['Type de structure', STRUCTURE_LABELS[geo.structure_type] ?? geo.structure_type],
    ['Type de tablier', DECK_LABELS[geo.deck_type] ?? geo.deck_type],
    ['Nombre de travées', `${geo.spans}`],
    ['Portée par travée', `${spanLen} m`],
    ['Longueur totale', `${geo.total_length_m} m`],
    ['Largeur hors-tout', `${geo.width_m} m`],
    ['Dégagement vertical', `${geo.clearance_m} m`],
    ['Piles', geo.has_piers ? `${geo.pier_count}` : 'Non'],
    ['Culées', geo.has_abutments ? 'Oui' : 'Non'],
  ];
  geoRows.forEach(([lbl, val], i) => {
    y = tableRow(doc, lbl, val, y, margin, contentW, i % 2 === 1);
  });

  y += 4;

  // ── 4. Loads section ────────────────────────────────────────────────────
  y = sectionHeader(doc, 'CHARGES — CSA S6-19', y, margin);

  const pedStr = [
    loads.sidewalk_left ? `G: ${loads.sidewalk_left_w}m` : null,
    loads.sidewalk_right ? `D: ${loads.sidewalk_right_w}m` : null,
  ].filter(Boolean).join(' | ') || 'Aucun';

  const loadRows: [string, string][] = [
    ['Voies de circulation', `${loads.num_lanes}`],
    ['Classe de camion', loads.truck_class],
    ['Trottoirs', pedStr],
    ['Enrobé bitumineux', `${loads.wearing_surface_mm} mm`],
    ['Glissières', loads.has_barrier ? loads.barrier_type : 'Non'],
    ['Province', loads.province],
    ['Zone verglas', `Zone ${loads.ice_zone}`],
    ['Vitesse de vent q₁₀', `${loads.wind_speed} km/h`],
    ['Zone sismique', loads.seismic],
  ];
  loadRows.forEach(([lbl, val], i) => {
    y = tableRow(doc, lbl, val, y, margin, contentW, i % 2 === 1);
  });

  y += 4;

  // ── 5. ULS Results section ──────────────────────────────────────────────
  y = sectionHeader(doc, 'ANALYSE ULS (CUR, CSA S6-19)', y, margin);

  const ulsRows: [string, string][] = [
    ['w_D — Charges permanentes', `${analysis.ld.wD.toFixed(1)} kN/m`],
    ['w_L — Charges vives', `${analysis.ld.wL.toFixed(1)} kN/m`],
    ['w_SLS — Combinaison ELS', `${analysis.ld.wSLS.toFixed(1)} kN/m`],
    ['w_ULS — Combinaison ÉULS', `${analysis.ld.wULS.toFixed(1)} kN/m`],
  ];
  ulsRows.forEach(([lbl, val], i) => {
    y = tableRow(doc, lbl, val, y, margin, contentW, i % 2 === 1);
  });

  y += 6;

  // Big V_max / M_max boxes
  y = addPageIfNeeded(doc, y + 28);
  const boxW = (contentW - 8) / 2;

  // V_max box
  doc.setFillColor(234, 243, 255);
  doc.roundedRect(margin, y, boxW, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('V_max ULS', margin + boxW / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0, 122, 255);
  doc.text(`${analysis.Vmax.toFixed(1)}`, margin + boxW / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('kN', margin + boxW / 2, y + 24, { align: 'center' });

  // M_max box
  const mBoxX = margin + boxW + 8;
  doc.setFillColor(255, 242, 241);
  doc.roundedRect(mBoxX, y, boxW, 26, 3, 3, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('M_max ULS', mBoxX + boxW / 2, y + 7, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(215, 0, 21);
  doc.text(`${analysis.Mmax.toFixed(1)}`, mBoxX + boxW / 2, y + 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('kN·m', mBoxX + boxW / 2, y + 24, { align: 'center' });

  y += 34;

  // Reactions row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const reactStr = analysis.reactions
    .map((r, i) => {
      const lbl = i === 0 ? 'A1' : i === analysis.reactions.length - 1 ? `A${i + 1}` : `P${i}`;
      return `${lbl}: ${r.toFixed(1)} kN`;
    })
    .join('   ');
  y = addPageIfNeeded(doc, y + 5);
  doc.text(`Réactions : ${reactStr}`, margin, y);
  y += 8;

  // ── 6. SLS Deflection section (optional) ────────────────────────────────
  if (slsProps && slsResults && slsResults.length > 0) {
    y += 2;
    y = sectionHeader(doc, 'VÉRIFICATION FLÈCHE ELS (CSA S6-19)', y, margin);

    const isPed = geo.structure_type === 'pedestrian';
    const allOk = slsResults.every(r => r.ok);

    const slsInfoRows: [string, string][] = [
      ['Matériau du tablier', MATERIAL_LABELS[slsProps.material]],
      ['Hauteur h', `${slsProps.h_mm} mm`],
      ['Module d\'élasticité E', `${slsProps.E_MPa} MPa`],
      ['Limite déflexion', isPed ? 'L/500 (passerelle)' : 'L/300 (trafic)'],
    ];
    slsInfoRows.forEach(([lbl, val], i) => {
      y = tableRow(doc, lbl, val, y, margin, contentW, i % 2 === 1);
    });

    y += 4;

    // Global badge
    y = addPageIfNeeded(doc, y + 8);
    if (allOk) {
      doc.setFillColor(240, 255, 244);
      doc.setDrawColor(163, 230, 184);
    } else {
      doc.setFillColor(255, 242, 241);
      doc.setDrawColor(255, 187, 184);
    }
    doc.roundedRect(margin, y - 5, contentW, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(allOk ? 26 : 215, allOk ? 138 : 0, allOk ? 60 : 21);
    doc.text(
      allOk ? '✓  Vérification ELS — CONFORME' : '✗  Vérification ELS — NON CONFORME',
      pageW / 2, y + 1, { align: 'center' },
    );
    y += 12;

    // Table header
    y = addPageIfNeeded(doc, y + 8);
    doc.setFillColor(0, 122, 255);
    doc.rect(margin, y - 5, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const cols = [0, 20, 42, 68, 98, 122];
    const headers = ['Travée', 'L (m)', 'δ (mm)', 'Lim. (mm)', 'Ratio', 'Statut'];
    headers.forEach((h, i) => doc.text(h, margin + cols[i] + 2, y));
    y += 7;

    slsResults.forEach((r, i) => {
      y = addPageIfNeeded(doc, y + 7);
      if (i % 2 === 0) {
        doc.setFillColor(249, 249, 249);
        doc.rect(margin, y - 4, contentW, 7, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${r.span}`, margin + cols[0] + 2, y);
      doc.text(`${r.L_m.toFixed(2)}`, margin + cols[1] + 2, y);
      doc.setTextColor(r.ok ? 26 : 215, r.ok ? 138 : 0, r.ok ? 60 : 21);
      doc.setFont('helvetica', 'bold');
      doc.text(`${r.delta_mm.toFixed(1)}`, margin + cols[2] + 2, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${r.limit_mm.toFixed(1)}`, margin + cols[3] + 2, y);
      doc.setTextColor(15, 23, 42);
      doc.text(`${r.ratio.toFixed(2)}`, margin + cols[4] + 2, y);
      doc.setTextColor(r.ok ? 26 : 215, r.ok ? 138 : 0, r.ok ? 60 : 21);
      doc.setFont('helvetica', 'bold');
      doc.text(r.ok ? '✓' : '✗', margin + cols[5] + 2, y);
      y += 7;
    });
    y += 4;
  }

  // ── 7. Warning / disclaimer box ─────────────────────────────────────────
  y = addPageIfNeeded(doc, y + 20);
  doc.setFillColor(255, 248, 238);
  doc.setDrawColor(255, 204, 128);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'FD');

  // Orange left bar
  doc.setFillColor(255, 150, 50);
  doc.rect(margin, y, 3, 22, 'F');

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(122, 79, 0);

  const disclaimer = [
    'AVERTISSEMENT : Analyse préliminaire — modèle de poutre continue CUR (charges uniformément réparties).',
    'Les combinaisons complètes de charges (camion CL-625, vent, séisme, verglas, température différentielle)',
    'doivent être vérifiées conformément à CSA S6-19 pour toute conception finale.',
  ];
  disclaimer.forEach((line, i) => {
    doc.text(line, margin + 6, y + 6 + i * 6);
  });
  y += 28;

  // ── 8. Footer ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Bridge Analyst — CSA S6-19', margin, 277);
  doc.text('Page 1', pageW - margin, 277, { align: 'right' });

  // Thin line above footer
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 272, pageW - margin, 272);

  const fileName = `bridge-analyst-${geo.structure_type}-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}
