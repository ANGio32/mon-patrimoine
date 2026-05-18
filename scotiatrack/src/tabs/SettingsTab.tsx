import { useState } from 'react';
import { formatCAD } from '../lib/format';

const APPS_SCRIPT_CODE = `function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Feuille 1") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return out([]);
    const rows = data.slice(1).filter(r => {
      if (!r[0] || String(r[0]).trim() === "") return false;
      const amt = parseFloat(String(r[2] || "").replace(/\\s/g,"").replace(",","."));
      return !isNaN(amt) && amt > 0;
    }).map(r => ({
      date: String(r[0] || ""),
      description: String(r[1] || ""),
      amount: String(r[2] || ""),
      type: String(r[3] || "debit"),
      account: String(r[4] || ""),
      raw: String(r[5] || "")
    }));
    return out(rows);
  } catch(e) { return out({error: e.message}); }
}
function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface SettingsTabProps {
  dailySalary: number;
  onSaveSalary: (v: number) => void;
  scriptUrl: string;
  onSaveUrl: (url: string) => void;
  onRefresh: () => void;
  lastSync: Date | null;
  connected: boolean;
}

export function SettingsTab({ dailySalary, onSaveSalary, scriptUrl, onSaveUrl, onRefresh, lastSync, connected }: SettingsTabProps) {
  const [editingSalary, setEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(String(dailySalary || ''));
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [copied, setCopied] = useState(false);
  const [savedInsight, setSavedInsight] = useState(false);

  function saveSalary() {
    const v = parseFloat(salaryInput);
    if (!isNaN(v) && v > 0) {
      onSaveSalary(v);
      setEditingSalary(false);
      setSavedInsight(true);
      setTimeout(() => setSavedInsight(false), 4000);
    }
  }

  function saveUrl() {
    onSaveUrl(urlInput.trim());
    setEditingUrl(false);
    onRefresh();
  }

  function copyCode() {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ padding: '0 16px 90px' }}>
      {/* Salary */}
      <SectionTitle>Salaire journalier</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        {editingSalary ? (
          <div>
            <label style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', display: 'block', marginBottom: 6 }}>
              Salaire net / jour (CAD)
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={salaryInput}
                onChange={e => setSalaryInput(e.target.value)}
                autoFocus
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 12, border: '1.5px solid #ECECEA',
                  fontSize: 16, fontFamily: 'Manrope', fontWeight: 700, color: '#0D0D0D', outline: 'none',
                }}
              />
              <button onClick={saveSalary} style={actionBtn('#0D0D0D', '#fff')}>Sauver</button>
              <button onClick={() => setEditingSalary(false)} style={actionBtn('#ECECEA', '#0D0D0D')}>Annuler</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <p style={{ fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0D0D0D', margin: 0 }}>
                {dailySalary > 0 ? formatCAD(dailySalary) : '—'}
              </p>
              <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '4px 0 0' }}>par jour de travail</p>
            </div>
            <button onClick={() => { setSalaryInput(String(dailySalary || '')); setEditingSalary(true); }} style={{ ...actionBtn('#ECECEA', '#0D0D0D'), fontSize: 12 }}>
              Modifier →
            </button>
          </div>
        )}

        {savedInsight && dailySalary > 0 && (
          <div style={{ marginTop: 14, background: '#F2F1ED', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 13, fontFamily: 'Manrope', color: '#0D0D0D', margin: 0 }}>
              💡 Chaque dépense sera maintenant exprimée en jours de travail.
            </p>
          </div>
        )}
      </div>

      {/* Connection */}
      <SectionTitle>Connexion Apps Script</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: connected ? '#0D0D0D' : '#ECECEA',
          }} className={connected ? 'pulse-dot' : ''} />
          <div>
            <p style={{ fontSize: 14, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D', margin: 0 }}>
              {connected ? 'Connecté' : 'Non connecté'}
            </p>
            {lastSync && (
              <p style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', margin: '2px 0 0' }}>
                Sync : {lastSync.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {editingUrl ? (
          <div>
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/..."
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: '1.5px solid #ECECEA', fontSize: 12, fontFamily: 'Manrope',
                color: '#0D0D0D', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
              }}
            />
            <div className="flex gap-2">
              <button onClick={saveUrl} style={actionBtn('#0D0D0D', '#fff')}>Sauver</button>
              <button onClick={() => setEditingUrl(false)} style={actionBtn('#ECECEA', '#0D0D0D')}>Annuler</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={onRefresh} style={{ ...actionBtn('#F2F1ED', '#0D0D0D'), fontSize: 12 }}>Actualiser</button>
            <button onClick={() => { setUrlInput(scriptUrl); setEditingUrl(true); }} style={{ ...actionBtn('#ECECEA', '#0D0D0D'), fontSize: 12 }}>
              Changer l'URL
            </button>
          </div>
        )}
      </div>

      {/* Apps Script code */}
      <SectionTitle>Code Apps Script</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '0 0 12px' }}>
          Copiez ce code dans votre Apps Script Google.
        </p>
        <pre style={{
          background: '#F2F1ED', borderRadius: 12, padding: 14,
          fontSize: 10, fontFamily: 'monospace', color: '#0D0D0D',
          overflow: 'auto', margin: '0 0 12px', whiteSpace: 'pre-wrap', lineHeight: 1.6,
        }}>
          {APPS_SCRIPT_CODE}
        </pre>
        <button onClick={copyCode} style={actionBtn('#0D0D0D', '#fff')}>
          {copied ? '✓ Copié !' : 'Copier le code'}
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700,
      color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em',
      margin: '20px 0 8px',
    }}>
      {children}
    </p>
  );
}

function actionBtn(bg: string, color: string): React.CSSProperties {
  return {
    padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
    background: bg, color, fontFamily: 'Manrope', fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap',
  };
}
