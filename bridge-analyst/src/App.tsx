import { useEffect } from 'react';
import { useStore } from './store';
import { StepUpload } from './steps/StepUpload';
import { StepGeometry } from './steps/StepGeometry';
import { StepLoads } from './steps/StepLoads';
import { StepAnalysis } from './steps/StepAnalysis';
import { StepSummary } from './steps/StepSummary';
import { PanelSection } from './components/panels/PanelSection';
import { PanelTruck } from './components/panels/PanelTruck';
import { PanelSpecial } from './components/panels/PanelSpecial';
import { PanelExport } from './components/panels/PanelExport';

const STEP_LABELS = ['Import', 'Géométrie', 'Charges', 'Analyse', 'Résumé'];

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {STEP_LABELS.map((_, i) => (
        <div
          key={i}
          className="h-[6px] rounded-full transition-all duration-200"
          style={{
            width: i === step ? 20 : 6,
            backgroundColor: i === step ? '#2563EB' : i < step ? '#BFDBFE' : '#E8EBF0',
          }}
          aria-label={`Étape ${i + 1}${i === step ? ' (active)' : ''}`}
        />
      ))}
    </div>
  );
}

const PANELS: Record<string, React.ReactNode> = {
  section: <PanelSection />,
  truck: <PanelTruck />,
  special: <PanelSpecial />,
  export: <PanelExport />,
};

import { useState } from 'react';

function SessionBanner() {
  const { loadSession, reset } = useStore();
  const [shown, setShown] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    const key = 'bridge-analyst-session';
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.step > 0 && Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
          setHasSaved(true);
          setShown(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  if (!shown || !hasSaved) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="max-w-[480px] w-full mx-4 mb-4 bg-white border border-[#E8EBF0] rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[#0F172A]">Analyse en cours détectée</p>
          <p className="text-[12px] text-[#64748B]">Reprendre où vous en étiez ?</p>
        </div>
        <button
          type="button"
          onClick={() => { loadSession(); setShown(false); }}
          className="bg-[#2563EB] text-white rounded-xl px-3 py-2 text-[13px] font-semibold"
        >
          Reprendre
        </button>
        <button
          type="button"
          onClick={() => { reset(); setShown(false); }}
          className="text-[#94A3B8] text-[13px] px-2"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { step, activePanel } = useStore();

  const content = activePanel ? (
    PANELS[activePanel] ?? null
  ) : (
    <>
      {step === 0 && <StepUpload />}
      {step === 1 && <StepGeometry />}
      {step === 2 && <StepLoads />}
      {step === 3 && <StepAnalysis />}
      {step === 4 && <StepSummary />}
    </>
  );

  return (
    <div className="min-h-svh bg-[#F5F6F8]">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E8EBF0] h-16 flex items-center">
        <div className="max-w-[480px] mx-auto w-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌉</span>
            <span className="font-bold text-[15px] text-[#0F172A]">Bridge Analyst</span>
          </div>
          {!activePanel && <ProgressDots step={step} />}
          {activePanel && (
            <span className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
              {activePanel === 'section' ? 'Section' :
               activePanel === 'truck' ? 'CL-625' :
               activePanel === 'special' ? 'Spéciales' : 'Export'}
            </span>
          )}
          <span className="text-[11px] text-[#94A3B8]">CSA S6-19</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 pb-10">
        {content}
      </main>

      <SessionBanner />
    </div>
  );
}
