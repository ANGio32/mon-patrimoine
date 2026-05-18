import { useState, useRef } from 'react';
import { GhostBtn, ErrorBox } from '../components/ui';
import { analyzeStructurePlan, fileToBase64 } from '../lib/api';
import { useStore } from '../store';
import type { GeoData } from '../types';

const DEFAULTS: GeoData = {
  structure_type: 'bridge',
  spans: 3,
  total_length_m: 45,
  width_m: 12,
  clearance_m: 5.5,
  deck_type: 'i_beam',
  has_piers: true,
  pier_count: 2,
  has_abutments: true,
  has_walls: false,
};

export function StepUpload() {
  const { setStep, setGeo, setAIAnalysis } = useStore();
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Format non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 MB).');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const result = await analyzeStructurePlan(base64, mediaType);
      setAIAnalysis(result);
      setGeo({
        ...DEFAULTS,
        ...(result.detected as Partial<GeoData>),
        structure_type: (result.structure_type as GeoData['structure_type']) ?? DEFAULTS.structure_type,
      });
      setStep(1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erreur d'analyse : ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const skipToManual = () => {
    setGeo(DEFAULTS);
    setStep(1);
  };

  return (
    <div className="flex flex-col gap-6 py-8">
      {/* Hero */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-5 rounded-[22px] overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,122,255,0.25)' }}>
          <img src="/logo.svg" alt="Bridge Analyst" className="w-full h-full" />
        </div>
        <h1 className="text-[28px] font-bold tracking-[-0.5px] text-black mb-2">Bridge Analyst</h1>
        <p className="text-[15px] text-[#8E8E93]">Analyse préliminaire CSA S6-19</p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative rounded-[24px] flex flex-col items-center justify-center gap-4 py-14 px-6 cursor-pointer transition-all duration-200"
        style={{
          border: `2px dashed ${dragging ? '#007AFF' : '#C6C6C8'}`,
          backgroundColor: dragging ? '#EAF3FF' : '#fff',
          boxShadow: dragging ? '0 0 0 4px rgba(0,122,255,0.12)' : '0 1px 3px rgba(0,0,0,0.06)',
        }}
        aria-label="Zone de dépôt du plan"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-[#EAF3FF]" />
              <div className="absolute inset-0 rounded-full border-[3px] border-t-[#007AFF] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <img src="/logo.svg" alt="" className="absolute inset-2 rounded-full" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-black">Claude Vision analyse…</p>
              <p className="text-[13px] text-[#8E8E93] mt-1">Détection automatique des éléments</p>
            </div>
          </div>
        ) : (
          <>
            {/* Upload icon */}
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center"
              style={{ backgroundColor: '#EAF3FF' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 22V10M16 10l-5 5M16 10l5 5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 24h20" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[17px] font-semibold text-black">Importer un plan</p>
              <p className="text-[13px] text-[#8E8E93] mt-1">Photo ou fichier — JPEG · PNG · WebP</p>
              <p className="text-[12px] text-[#C6C6C8] mt-1">max 10 MB</p>
            </div>
          </>
        )}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[0.5px] bg-[#C6C6C8]" />
        <span className="text-[13px] text-[#8E8E93]">ou</span>
        <div className="flex-1 h-[0.5px] bg-[#C6C6C8]" />
      </div>

      <div className="flex justify-center">
        <GhostBtn onClick={skipToManual}>Saisir manuellement</GhostBtn>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 px-2">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-[2px] shrink-0">
          <path d="M8 1L2 4v4c0 3.3 2.5 6.4 6 7.2C11.5 14.4 14 11.3 14 8V4L8 1z" stroke="#34C759" strokeWidth="1.2" fill="none"/>
          <path d="M5.5 8l2 2 3-3" stroke="#34C759" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[12px] text-[#8E8E93] leading-relaxed">
          Plan transmis via proxy sécurisé. Aucune image conservée après l'analyse.
        </p>
      </div>
    </div>
  );
}
