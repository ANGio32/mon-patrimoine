import { useState } from 'react';
import { formatCAD } from '../lib/format';

const CATEGORIES = [
  { key: 'Restauration', emoji: '🍽' },
  { key: 'Transport', emoji: '🚗' },
  { key: 'Épicerie', emoji: '🛒' },
  { key: 'Shopping', emoji: '🛍' },
  { key: 'Abonnements', emoji: '📺' },
  { key: 'Utilités', emoji: '⚡' },
  { key: 'Transferts', emoji: '💸' },
  { key: 'Retrait', emoji: '🏧' },
  { key: 'Pharmacie', emoji: '💊' },
  { key: 'Autre', emoji: '💳' },
];

const APPS_SCRIPT_CODE = `function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("Feuille 1") || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return out([]);
    const rows = data.slice(1).map(r => {
      const raw = String(r[5] || "");
      const amtMatch = raw.match(/autorisation de ([\\d\\s,]+[\\d])\\s*\\$/i);
      const amount = amtMatch ? amtMatch[1].replace(/\\s/g, "").replace(",", ".") : String(r[2] || "");
      const merchMatch = raw.match(/auprès de (.+?) a été/i);
      const description = merchMatch ? merchMatch[1].trim() : String(r[1] || "");
      return {
        date: String(r[0] || ""),
        description: description,
        amount: amount,
        type: String(r[3] || "debit"),
        account: String(r[4] || ""),
        raw: raw
      };
    }).filter(r => {
      if (!r.date || r.date.trim() === "") return false;
      return parseFloat(r.amount) > 0;
    });
    return out(rows);
  } catch(e) { return out({error: e.message}); }
}
function out(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface SettingsTabProps {
  payAmount: number;
  nextPayDate: string;
  onSavePayAmount: (v: number) => void;
  onSaveNextPayDate: (d: string) => void;
  scriptUrl: string;
  onSaveUrl: (url: string) => void;
  onRefresh: () => void;
  lastSync: Date | null;
  connected: boolean;
  categoryBudgets: Record<string, number>;
  onSaveBudgets: (b: Record<string, number>) => void;
}

export function SettingsTab({ payAmount, nextPayDate, onSavePayAmount, onSaveNextPayDate, scriptUrl, onSaveUrl, onRefresh, lastSync, connected, categoryBudgets, onSaveBudgets }: SettingsTabProps) {
  const [editingPay, setEditingPay] = useState(false);
  const [payAmountInput, setPayAmountInput] = useState(String(payAmount || ''));
  const [nextPayDateInput, setNextPayDateInput] = useState(nextPayDate || '');
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(scriptUrl);
  const [copied, setCopied] = useState(false);
  const [paySaved, setPaySaved] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATEGORIES.map(c => [c.key, categoryBudgets[c.key] ? String(categoryBudgets[c.key]) : '']))
  );
  const [budgetSaved, setBudgetSaved] = useState(false);

  function savePay() {
    const v = parseFloat(payAmountInput);
    if (!isNaN(v) && v > 0 && nextPayDateInput) {
      onSavePayAmount(v);
      onSaveNextPayDate(nextPayDateInput);
      setEditingPay(false);
      setPaySaved(true);
      setTimeout(() => setPaySaved(false), 3000);
    }
  }

  function saveBudgets() {
    const result: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      const v = parseFloat(budgetInputs[cat.key]);
      if (!isNaN(v) && v > 0) result[cat.key] = v;
    }
    onSaveBudgets(result);
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 2000);
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
      {/* Pay settings */}
      <SectionTitle>Paye bi-hebdomadaire</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        {editingPay ? (
          <div>
            <label style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', display: 'block', marginBottom: 6 }}>
              Montant net par paye (CAD)
            </label>
            <input
              type="number"
              value={payAmountInput}
              onChange={e => setPayAmountInput(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #ECECEA', fontSize: 16, fontFamily: 'Manrope', fontWeight: 700, color: '#0D0D0D', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <label style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', display: 'block', marginBottom: 6 }}>
              Date de ta prochaine paye
            </label>
            <input
              type="date"
              value={nextPayDateInput}
              onChange={e => setNextPayDateInput(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid #ECECEA', fontSize: 14, fontFamily: 'Manrope', color: '#0D0D0D', outline: 'none', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <div className="flex gap-2">
              <button onClick={savePay} style={actionBtn('#0D0D0D', '#fff')}>Sauver</button>
              <button onClick={() => setEditingPay(false)} style={actionBtn('#ECECEA', '#0D0D0D')}>Annuler</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#0D0D0D', margin: 0 }}>
                  {payAmount > 0 ? formatCAD(payAmount) : '—'}
                </p>
                <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '4px 0 0' }}>
                  {nextPayDate ? `Prochaine: ${new Date(nextPayDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}` : 'toutes les 2 semaines'}
                </p>
              </div>
              <button onClick={() => { setPayAmountInput(String(payAmount || '')); setNextPayDateInput(nextPayDate || ''); setEditingPay(true); }} style={{ ...actionBtn('#ECECEA', '#0D0D0D'), fontSize: 12 }}>
                Modifier →
              </button>
            </div>
            {paySaved && (
              <div style={{ marginTop: 14, background: '#F2F1ED', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontFamily: 'Manrope', color: '#0D0D0D', margin: 0 }}>
                  Paye enregistrée. L'app anticipe maintenant tes revenus automatiquement.
                </p>
              </div>
            )}
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

      {/* Budget par catégorie */}
      <SectionTitle>Budgets mensuels</SectionTitle>
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '0 0 16px' }}>
          Plafond mensuel par catégorie. La barre vire au rouge si dépassé.
        </p>
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2">
              <span className="emoji-grayscale" style={{ fontSize: 15 }}>{cat.emoji}</span>
              <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D' }}>{cat.key}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                value={budgetInputs[cat.key]}
                onChange={e => setBudgetInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                placeholder="—"
                style={{
                  width: 72, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #ECECEA',
                  fontSize: 13, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D',
                  outline: 'none', textAlign: 'right', background: '#F9F9F7',
                }}
              />
              <span style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope' }}>$</span>
            </div>
          </div>
        ))}
        <button onClick={saveBudgets} style={{ ...actionBtn('#0D0D0D', '#fff'), marginTop: 6 }}>
          {budgetSaved ? '✓ Sauvé !' : 'Sauver les budgets'}
        </button>
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
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
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
