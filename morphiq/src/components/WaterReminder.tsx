import { useState, useEffect } from 'react';

export default function WaterReminder() {
  const [show, setShow] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [response, setResponse] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    const enabled = localStorage.getItem('morphiq_water_reminder') !== 'false';
    if (!enabled) return;

    const lastShown = localStorage.getItem('morphiq_water_last_shown');
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;

    if (!lastShown || now - parseInt(lastShown) > fourHours) {
      const timer = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleResponse(r: 'yes' | 'no') {
    setResponse(r);
    setAnswered(true);
    localStorage.setItem('morphiq_water_last_shown', String(Date.now()));
    setTimeout(() => setShow(false), 1600);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
        style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
      >
        {!answered ? (
          <>
            <div className="text-4xl text-center mb-4">💧</div>
            <h3 className="text-text font-bold text-lg text-center mb-1">Hey, quick check-in!</h3>
            <p className="text-dim text-sm text-center mb-6 leading-relaxed">
              Have you had a glass of water recently?<br />Staying hydrated makes a big difference!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleResponse('no')}
                className="flex-1 py-3.5 rounded-2xl bg-section border border-border text-text font-semibold text-sm active:scale-95 transition-all"
              >
                Not yet 😅
              </button>
              <button
                onClick={() => handleResponse('yes')}
                className="flex-1 py-3.5 rounded-2xl bg-green text-white font-semibold text-sm active:scale-95 transition-all shadow-lg"
              >
                Yes! 💪
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            {response === 'yes' ? (
              <>
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-text font-semibold">Awesome, keep it up!</p>
                <p className="text-dim text-sm mt-1">Great habit — your body thanks you.</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">🚰</div>
                <p className="text-text font-semibold">Time to hydrate!</p>
                <p className="text-dim text-sm mt-1">Go grab a glass — you'll feel better.</p>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
