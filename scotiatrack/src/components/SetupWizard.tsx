import { useState } from 'react';

const APPS_SCRIPT_CODE = `function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Feuille 1") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return out([]);
    const rows = data.slice(1).map(r => ({
      date: String(r[0] || ""),
      description: String(r[1] || ""),
      amount: String(r[2] || ""),
      type: String(r[3] || "debit"),
      account: String(r[4] || ""),
      raw: String(r[5] || "")
    })).filter(r => r.date && r.date !== "");
    return out(rows);
  } catch(e) { return out({error: e.message}); }
}
function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface SetupWizardProps {
  onComplete: (url: string) => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const steps = [
    {
      title: 'Copiez le code',
      desc: 'Ouvrez Apps Script dans votre Google Sheet et collez ce code.',
      action: (
        <div>
          <pre style={{
            background: '#F2F1ED', borderRadius: 12, padding: 14, fontSize: 10,
            fontFamily: 'monospace', color: '#0D0D0D', overflow: 'auto',
            whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 14, maxHeight: 200,
          }}>
            {APPS_SCRIPT_CODE}
          </pre>
          <button onClick={copy} style={btn('#0D0D0D', '#fff')}>
            {copied ? '✓ Copié !' : 'Copier le code'}
          </button>
        </div>
      ),
    },
    {
      title: 'Déployez',
      desc: 'Dans Apps Script : Déployer → Nouveau déploiement → Application Web → Accès : Tout le monde.',
      action: null,
    },
    {
      title: "Collez l'URL",
      desc: "Copiez l'URL de déploiement et collez-la ici.",
      action: (
        <input
          type="url"
          placeholder="https://script.google.com/macros/s/..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 12,
            border: '1.5px solid #ECECEA', fontSize: 13, fontFamily: 'Manrope',
            color: '#0D0D0D', outline: 'none', boxSizing: 'border-box',
          }}
        />
      ),
    },
  ];

  const isLast = step === steps.length - 1;

  return (
    <div style={{
      minHeight: '100svh', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '0 24px',
    }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: '#0D0D0D', margin: '0 0 6px' }}>
          Sou
        </h1>
        <p style={{ fontSize: 14, color: '#999', fontFamily: 'Manrope', margin: 0 }}>
          Configuration initiale
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2" style={{ marginBottom: 32 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            height: 4, flex: 1, borderRadius: 2,
            background: i <= step ? '#0D0D0D' : '#ECECEA',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 20, padding: 24 }}>
        <p style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
          Étape {step + 1} / {steps.length}
        </p>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: '#0D0D0D', margin: '0 0 10px' }}>
          {steps[step].title}
        </h2>
        <p style={{ fontSize: 14, color: '#666', fontFamily: 'Manrope', margin: '0 0 20px', lineHeight: 1.6 }}>
          {steps[step].desc}
        </p>
        {steps[step].action}
      </div>

      <div className="flex gap-3" style={{ marginTop: 20 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={btn('#ECECEA', '#0D0D0D')}>
            Retour
          </button>
        )}
        <button
          onClick={() => {
            if (isLast) { if (url.trim()) onComplete(url.trim()); }
            else setStep(s => s + 1);
          }}
          disabled={isLast && !url.trim()}
          style={{ ...btn('#0D0D0D', '#fff'), flex: 1, opacity: isLast && !url.trim() ? 0.4 : 1 }}
        >
          {isLast ? 'Démarrer →' : 'Suivant →'}
        </button>
      </div>
    </div>
  );
}

function btn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '14px 20px', borderRadius: 14, border: 'none', cursor: 'pointer',
    background: bg, color, fontFamily: 'Manrope', fontSize: 14, fontWeight: 700,
  };
}
