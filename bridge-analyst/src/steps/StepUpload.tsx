import { useState, useRef } from 'react';
import { GhostBtn, ErrorBox } from '../components/ui';
import { analyzeStructurePlan, analyzeCondition, fileToBase64 } from '../lib/api';
import { useStore } from '../store';
import type { GeoData, ConditionResult } from '../types';

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

const OVERALL_COLORS: Record<string, string> = {
  bon: '#34C759',
  acceptable: '#FF9500',
  'dégradé': '#FF3B30',
  critique: '#FF3B30',
};

export function StepUpload() {
  const { setStep, setGeo, setAIAnalysis, setConditionResult } = useStore();
  const [mode, setMode] = useState<'plan' | 'inspection'>('plan');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conditionData, setConditionData] = useState<ConditionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processPlanFile = async (file: File) => {
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

  const processInspectionFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Format non supporté. Utilisez JPEG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 MB).');
      return;
    }
    setError('');
    setConditionData(null);
    setLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const result = await analyzeCondition(base64, mediaType);
      setConditionResult(result);
      setConditionData(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Erreur d'analyse : ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const processFile = (file: File) => {
    if (mode === 'plan') {
      return processPlanFile(file);
    } else {
      return processInspectionFile(file);
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
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const skipToManual = () => {
    setGeo(DEFAULTS);
    setStep(1);
  };

  const handleModeSwitch = (newMode: 'plan' | 'inspection') => {
    setMode(newMode);
    setError('');
    setConditionData(null);
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

      {/* Mode toggle — segmented control */}
      <div className="flex rounded-[10px] p-[3px] gap-[3px]"
        style={{ backgroundColor: '#E5E5EA' }}>
        <button
          type="button"
          onClick={() => handleModeSwitch('plan')}
          className="flex-1 h-[36px] rounded-[8px] text-[14px] font-semibold transition-all duration-150"
          style={{
            backgroundColor: mode === 'plan' ? '#007AFF' : 'transparent',
            color: mode === 'plan' ? '#fff' : '#3C3C43',
          }}
        >
          Plan structurel
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('inspection')}
          className="flex-1 h-[36px] rounded-[8px] text-[14px] font-semibold transition-all duration-150"
          style={{
            backgroundColor: mode === 'inspection' ? '#007AFF' : 'transparent',
            color: mode === 'inspection' ? '#fff' : '#3C3C43',
          }}
        >
          Photo d'inspection
        </button>
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
        aria-label={mode === 'plan' ? 'Zone de dépôt du plan' : "Zone de dépôt de la photo d'inspection"}
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
              <p className="text-[13px] text-[#8E8E93] mt-1">
                {mode === 'plan' ? 'Détection automatique des éléments' : "Évaluation de l'état du pont"}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Upload icon */}
            <div className="w-16 h-16 rounded-[18px] flex items-center justify-center"
              style={{ backgroundColor: '#EAF3FF' }}>
              {mode === 'inspection' ? (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="14" r="5" stroke="#007AFF" strokeWidth="2"/>
                  <path d="M4 26c0-4.4 5.4-8 12-8s12 3.6 12 8" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M22 5h6M25 2v6" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 22V10M16 10l-5 5M16 10l5 5" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 24h20" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </div>
            <div className="text-center">
              <p className="text-[17px] font-semibold text-black">
                {mode === 'plan' ? 'Importer un plan' : "Importer une photo du pont"}
              </p>
              <p className="text-[13px] text-[#8E8E93] mt-1">Photo ou fichier — JPEG · PNG · WebP</p>
              <p className="text-[12px] text-[#C6C6C8] mt-1">max 10 MB</p>
            </div>
          </>
        )}
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      {/* Condition result (inspection mode) */}
      {conditionData && mode === 'inspection' && (
        <div className="flex flex-col gap-3">
          {/* Overall badge + score */}
          <div className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-4">
              <span
                className="text-[14px] font-bold px-3 py-[5px] rounded-full text-white"
                style={{ backgroundColor: OVERALL_COLORS[conditionData.overall] ?? '#8E8E93' }}
              >
                {conditionData.overall.charAt(0).toUpperCase() + conditionData.overall.slice(1)}
              </span>
              <span className="text-[15px] font-semibold text-black">
                Score : {conditionData.score}/10
              </span>
            </div>

            {/* Observations */}
            {conditionData.observations.length > 0 && (
              <div className="mb-3">
                <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-2">Observations</p>
                <ul className="flex flex-col gap-[6px]">
                  {conditionData.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px] text-black">
                      <span className="mt-[5px] w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: '#007AFF' }} />
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Urgent actions */}
            {conditionData.urgent_actions.length > 0 && (
              <div className="rounded-[12px] p-3 mb-3"
                style={{ backgroundColor: '#FFF2F1', border: '1px solid #FFD0CE' }}>
                <p className="text-[13px] font-semibold mb-2" style={{ color: '#FF3B30' }}>Actions urgentes</p>
                <ul className="flex flex-col gap-[5px]">
                  {conditionData.urgent_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[14px]" style={{ color: '#D70015' }}>
                      <span className="mt-[5px] w-[5px] h-[5px] rounded-full shrink-0 bg-[#FF3B30]" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {conditionData.notes && (
              <p className="text-[13px] text-[#8E8E93] leading-relaxed">{conditionData.notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Divider + manual entry (plan mode only) */}
      {mode === 'plan' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[0.5px] bg-[#C6C6C8]" />
            <span className="text-[13px] text-[#8E8E93]">ou</span>
            <div className="flex-1 h-[0.5px] bg-[#C6C6C8]" />
          </div>

          <div className="flex justify-center">
            <GhostBtn onClick={skipToManual}>Saisir manuellement</GhostBtn>
          </div>
        </>
      )}

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
