import { useEffect, useState } from 'react';
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

const STEPS = ['Import', 'Géométrie', 'Charges', 'Analyse', 'Résumé'];

const PANEL_TITLES: Record<string, string> = {
  section: 'Vérif. section',
  truck: 'Camion CL-625',
  special: 'Charges spéciales',
  export: 'Exporter',
};

const PANELS: Record<string, React.ReactNode> = {
  section: <PanelSection />,
  truck: <PanelTruck />,
  special: <PanelSpecial />,
  export: <PanelExport />,
};

function SessionBanner() {
  const { loadSession, reset } = useStore();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('bridge-analyst-session');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.step > 0 && Date.now() - data.savedAt < 24 * 60 * 60 * 1000) {
          setShown(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  if (!shown) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe">
      <div className="max-w-[480px] w-full mx-4 mb-4 bg-white rounded-[20px] p-4 flex items-center gap-3"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#EAF3FF' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 4v4l3 3" stroke="#007AFF" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-black">Analyse en cours</p>
          <p className="text-[12px] text-[#8E8E93]">Reprendre où vous en étiez ?</p>
        </div>
        <button type="button" onClick={() => { loadSession(); setShown(false); }}
          className="h-[34px] px-4 rounded-full text-white text-[14px] font-semibold"
          style={{ backgroundColor: '#007AFF' }}>
          Reprendre
        </button>
        <button type="button" onClick={() => { reset(); setShown(false); }}
          className="text-[#8E8E93] text-[13px] px-1">
          ✕
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const { step, activePanel, setActivePanel } = useStore();

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
    <div className="min-h-svh" style={{ backgroundColor: '#F2F2F7' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 pt-safe"
        style={{ backgroundColor: 'rgba(242,242,247,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.12)' }}>
        <div className="max-w-[480px] mx-auto w-full px-4 h-14 flex items-center justify-between">
          {/* Left: back button or logo */}
          {activePanel ? (
            <button type="button" onClick={() => setActivePanel(null)}
              className="flex items-center gap-1 active:opacity-60 transition-opacity"
              style={{ color: '#007AFF' }}>
              <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
                <path d="M8 2L2 8l6 6" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[16px]">Résumé</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="" width={28} height={28} className="rounded-[6px]" />
              <span className="font-semibold text-[16px] tracking-[-0.2px]">Bridge</span>
            </div>
          )}

          {/* Center: step name or panel title */}
          <span className="text-[15px] font-semibold text-black">
            {activePanel ? PANEL_TITLES[activePanel] : STEPS[step]}
          </span>

          {/* Right: CSA badge */}
          <span className="text-[11px] font-semibold text-[#8E8E93] tracking-wide">CSA S6-19</span>
        </div>

        {/* Step progress bar */}
        {!activePanel && (
          <div className="max-w-[480px] mx-auto px-4 pb-2">
            <div className="flex gap-[3px]">
              {STEPS.map((_, i) => (
                <div key={i} className="h-[3px] rounded-full flex-1 transition-all duration-300"
                  style={{
                    backgroundColor: i <= step ? '#007AFF' : '#C6C6C8',
                    opacity: i < step ? 0.4 : 1,
                  }} />
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-[480px] mx-auto px-4 pb-12">
        {content}
      </main>

      <SessionBanner />
    </div>
  );
}
