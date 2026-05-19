import { useMemo, useState } from 'react';
import { Card, SectionLabel, GhostBtn, PrimaryBtn } from '../ui';
import { useStore } from '../../store';
import { buildExportText, exportPDF } from '../../lib/export';
import { computeLoads, computeBeam, computeDeflection } from '../../lib/structural';
import type { SLSSpanResult } from '../../types';

export function PanelExport() {
  const { geo, loads, analysis, slsProps, setActivePanel, saveToHistory } = useStore();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const defaultName = geo ? `Pont ${geo.spans}×${(geo.total_length_m / geo.spans).toFixed(1)}m` : 'Pont';
  const [saveName, setSaveName] = useState(defaultName);
  const [saved, setSaved] = useState(false);

  const slsResults = useMemo((): SLSSpanResult[] | undefined => {
    if (!geo || !loads || !analysis || !slsProps) return undefined;
    const ld = computeLoads(geo, loads);
    const beamSLS = computeBeam(geo.total_length_m, geo.spans, ld.wSLS);
    const isPedestrian = geo.structure_type === 'pedestrian';
    return computeDeflection(
      geo.total_length_m, geo.spans, ld.wSLS, geo.width_m,
      beamSLS.supportMoments, slsProps.E_MPa, slsProps.h_mm,
      slsProps.material, isPedestrian,
    );
  }, [geo, loads, analysis, slsProps]);

  if (!geo || !loads || !analysis) return null;

  const text = buildExportText(geo, loads, analysis, slsProps, slsResults);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePDF = async () => {
    setExporting(true);
    try {
      await exportPDF(geo, loads, analysis, slsProps, slsResults);
    } finally {
      setExporting(false);
    }
  };

  const handleSave = () => {
    saveToHistory(saveName || defaultName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex flex-col gap-5 py-4">
      <div className="flex items-center gap-3 mb-1">
        <GhostBtn onClick={() => setActivePanel(null)}>← Retour</GhostBtn>
        <h1 className="text-[20px] font-bold text-[#0F172A]">Exporter la fiche</h1>
      </div>

      <p className="text-[13px] text-[#64748B]">
        Colle directement dans un email, rapport Word ou message Teams.
      </p>

      {/* Preview */}
      <Card>
        <SectionLabel>Prévisualisation</SectionLabel>
        <pre className="text-[11px] text-[#64748B] font-mono whitespace-pre-wrap leading-relaxed bg-[#F8FAFC] rounded-xl p-3 overflow-x-auto max-h-64 overflow-y-auto">
          {text}
        </pre>
      </Card>

      {/* Actions */}
      <PrimaryBtn onClick={handleCopy}>
        {copied ? '✓ Copié !' : 'Copier le texte'}
      </PrimaryBtn>

      <button
        type="button"
        onClick={handlePDF}
        disabled={exporting}
        className="w-full h-12 rounded-2xl font-semibold text-[15px] text-white disabled:opacity-50 active:opacity-80 transition-opacity flex items-center justify-center gap-2"
        style={{ backgroundColor: '#007AFF' }}
      >
        {exporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Génération…
          </>
        ) : (
          'Exporter PDF'
        )}
      </button>

      {/* Save to history */}
      <Card>
        <SectionLabel>Sauvegarder dans l'historique</SectionLabel>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder={defaultName}
            className="flex-1 h-[44px] rounded-[10px] px-3 text-[16px] text-black focus:outline-none transition-all"
            style={{ border: '1px solid #C6C6C8', backgroundColor: '#F2F2F7' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#007AFF'; e.currentTarget.style.backgroundColor = '#fff'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#C6C6C8'; e.currentTarget.style.backgroundColor = '#F2F2F7'; }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saved}
            className="h-[44px] px-4 rounded-[10px] text-white text-[15px] font-semibold shrink-0 transition-opacity disabled:opacity-60 active:opacity-80"
            style={{ backgroundColor: '#007AFF' }}
          >
            {saved ? '✓' : 'Sauvegarder'}
          </button>
        </div>
        {saved && (
          <p className="text-[13px] mt-2" style={{ color: '#34C759' }}>
            ✓ Sauvegardé dans l'historique
          </p>
        )}
      </Card>

      <div className="rounded-xl bg-[#EAF3FF] border border-[#B3D4FF] p-3 text-[12px] text-[#004DB3]">
        <strong>Format PDF :</strong> A4, mise en page professionnelle avec en-tête Bridge Analyst. Le fichier est généré localement dans votre navigateur.
      </div>
    </div>
  );
}
