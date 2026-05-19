import { useState } from 'react';
import { useStore } from '../store';
import { BridgeSVG } from '../components/bridge/BridgeSVG';

function timeAgo(ts: number): string {
  const h = (Date.now() - ts) / 3600000;
  if (h < 1) return 'Il y a <1h';
  if (h < 24) return `Il y a ${Math.floor(h)}h`;
  const d = h / 24;
  if (d < 7) return `Il y a ${Math.floor(d)}j`;
  return new Date(ts).toLocaleDateString('fr-CA');
}

export function HistoryView() {
  const { geo, analysis, step, history, setShowHistory, saveToHistory, deleteFromHistory, loadFromHistory } = useStore();

  const defaultName = geo ? `Pont ${geo.spans}×${(geo.total_length_m / geo.spans).toFixed(1)}m` : 'Pont';
  const [saveName, setSaveName] = useState(defaultName);
  const [saved, setSaved] = useState(false);

  const canSave = step >= 4 && !!geo && !!analysis;

  const handleSave = () => {
    if (!canSave) return;
    saveToHistory(saveName || defaultName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#F2F2F7' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 pt-safe"
        style={{ backgroundColor: 'rgba(242,242,247,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(0,0,0,0.12)' }}>
        <div className="max-w-[480px] mx-auto w-full px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="flex items-center gap-1 active:opacity-60 transition-opacity"
            style={{ color: '#007AFF' }}
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none">
              <path d="M8 2L2 8l6 6" stroke="#007AFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[16px]">Retour</span>
          </button>
          <span className="text-[15px] font-semibold text-black">Historique</span>
          <span className="w-16" />
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-4 py-4 flex flex-col gap-4">

        {/* Save current analysis */}
        {canSave && (
          <div className="bg-white rounded-[20px] p-5"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.6px] text-[#8E8E93] mb-4">
              Sauvegarder l'analyse actuelle
            </p>
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
          </div>
        )}

        {/* Empty state */}
        {history.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-[18px] flex items-center justify-center"
              style={{ backgroundColor: '#EAF3FF' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 8h20M6 16h14M6 24h10" stroke="#007AFF" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[17px] font-semibold text-black mb-2">Aucune analyse sauvegardée</p>
            <p className="text-[13px] text-[#8E8E93]">Complétez une analyse pour la sauvegarder ici.</p>
          </div>
        )}

        {/* History list */}
        {history.map(entry => (
          <div key={entry.id} className="bg-white rounded-[20px] p-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)' }}>
            <div className="flex gap-3 mb-3">
              {/* Bridge thumbnail */}
              <div className="shrink-0 rounded-[12px] overflow-hidden bg-[#F9F9F9]" style={{ width: 100 }}>
                <BridgeSVG geo={entry.geo} className="w-full h-auto" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-black truncate">{entry.name}</p>
                <p className="text-[12px] text-[#8E8E93] mt-[2px]">{timeAgo(entry.savedAt)}</p>
                <p className="text-[12px] text-[#8E8E93] mt-[2px]">
                  {entry.geo.spans} travée{entry.geo.spans > 1 ? 's' : ''} × {(entry.geo.total_length_m / entry.geo.spans).toFixed(1)}m
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-[11px] font-mono text-[#64748B]">V {entry.analysis.Vmax.toFixed(0)} kN</span>
                  <span className="text-[11px] font-mono text-[#64748B]">M {entry.analysis.Mmax.toFixed(0)} kN·m</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadFromHistory(entry)}
                className="flex-1 h-[38px] rounded-[10px] text-white text-[14px] font-semibold active:opacity-80 transition-opacity"
                style={{ backgroundColor: '#007AFF' }}
              >
                Charger
              </button>
              <button
                type="button"
                onClick={() => deleteFromHistory(entry.id)}
                className="flex-1 h-[38px] rounded-[10px] text-[14px] font-semibold border active:opacity-60 transition-opacity"
                style={{ color: '#FF3B30', borderColor: '#FF3B30', backgroundColor: 'transparent' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}

        <div className="pb-8" />
      </main>
    </div>
  );
}
