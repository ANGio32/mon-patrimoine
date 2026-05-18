import { useState } from 'react';
import { Card, SectionLabel, GhostBtn, PrimaryBtn } from '../ui';
import { useStore } from '../../store';
import { buildExportText, exportPDF } from '../../lib/export';

export function PanelExport() {
  const { geo, loads, analysis, setActivePanel } = useStore();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (!geo || !loads || !analysis) return null;

  const text = buildExportText(geo, loads, analysis);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
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
      await exportPDF(text, geo);
    } finally {
      setExporting(false);
    }
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
        {copied ? '✓ Copié !' : '📋 Copier le texte'}
      </PrimaryBtn>

      <button
        type="button"
        onClick={handlePDF}
        disabled={exporting}
        className="w-full h-12 rounded-2xl border-[1.5px] border-[#E8EBF0] bg-white text-[#0F172A] font-semibold text-[14px] disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        {exporting ? (
          <><div className="w-4 h-4 border-2 border-[#E8EBF0] border-t-[#2563EB] rounded-full animate-spin" /> Génération…</>
        ) : (
          '📄 Exporter PDF'
        )}
      </button>

      <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3 text-[12px] text-[#1E40AF]">
        <strong>Format PDF :</strong> A4, mise en page structurée avec en-tête Bridge Analyst. Le fichier est généré localement dans votre navigateur.
      </div>
    </div>
  );
}
