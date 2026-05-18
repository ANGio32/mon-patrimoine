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
      setError(`Erreur d'analyse : ${msg}. Essayez de saisir manuellement.`);
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
    <div className="flex flex-col gap-6 py-6">
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-[#0F172A] mb-1">Importer un plan</h1>
        <p className="text-[14px] text-[#64748B]">Claude Vision analyse votre plan de pont</p>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className="relative rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center gap-4 py-12 px-6 cursor-pointer transition-colors"
        style={{
          borderColor: dragging ? '#2563EB' : '#E8EBF0',
          backgroundColor: dragging ? '#EFF6FF' : '#FAFBFC',
        }}
        aria-label="Zone de dépôt du plan"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-[3px] border-[#BFDBFE] border-t-[#2563EB] rounded-full animate-spin" />
            <p className="text-[14px] font-medium text-[#2563EB]">Claude Vision inspecte le plan…</p>
          </div>
        ) : (
          <>
            <span className="text-5xl">🏗</span>
            <div className="text-center">
              <p className="text-[15px] font-semibold text-[#0F172A]">Glisser-déposer ou cliquer</p>
              <p className="text-[13px] text-[#94A3B8] mt-1">JPEG · PNG · WebP — max 10 MB</p>
            </div>
          </>
        )}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex flex-col items-center gap-2">
        <p className="text-[13px] text-[#94A3B8]">ou</p>
        <GhostBtn onClick={skipToManual}>Saisir manuellement →</GhostBtn>
      </div>

      {/* Info */}
      <div className="rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] p-3 text-[12px] text-[#1E40AF]">
        <strong>Note sécurité :</strong> Le plan est envoyé à Claude via un proxy sécurisé. Aucune image n'est conservée après l'analyse.
      </div>
    </div>
  );
}
