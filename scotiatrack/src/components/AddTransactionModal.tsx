import { useState } from 'react';
import type { Transaction } from '../lib/parser';

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

interface Props {
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export function AddTransactionModal({ onAdd, onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Autre');
  const [type, setType] = useState<'debit' | 'credit'>('debit');

  const cat = CATEGORIES.find(c => c.key === category) ?? CATEGORIES[CATEGORIES.length - 1];
  const valid = description.trim() !== '' && parseFloat(amount) > 0 && date !== '';

  function submit() {
    if (!valid) return;
    onAdd({
      date,
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      account: 'Manuel',
      raw: '',
      category,
      categoryEmoji: cat.emoji,
      manual: true,
    });
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 50 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 390, background: '#fff',
        borderRadius: '20px 20px 0 0',
        padding: '24px 20px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        zIndex: 51, boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#0D0D0D', margin: 0 }}>
            Ajouter une dépense
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#999', padding: 4, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Description">
            <input
              autoFocus
              type="text"
              placeholder="Tim Hortons, Uber, Maxi..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              style={inputStyle}
            />
          </Field>

          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="Montant ($)" style={{ flex: 1 }}>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                style={{ ...inputStyle, textAlign: 'right' }}
              />
            </Field>
            <Field label="Date" style={{ flex: 1 }}>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Catégorie">
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ ...inputStyle, WebkitAppearance: 'none', appearance: 'none' }}
            >
              {CATEGORIES.map(c => (
                <option key={c.key} value={c.key}>{c.emoji} {c.key}</option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'flex', gap: 8 }}>
            {(['debit', 'credit'] as const).map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                  cursor: 'pointer', fontFamily: 'Manrope', fontSize: 13, fontWeight: 600,
                  background: type === t ? '#0D0D0D' : '#F2F1ED',
                  color: type === t ? '#fff' : '#0D0D0D',
                }}
              >
                {t === 'debit' ? 'Débit' : 'Crédit'}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!valid}
          style={{
            marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 14,
            border: 'none', cursor: valid ? 'pointer' : 'default',
            fontFamily: 'Manrope', fontSize: 14, fontWeight: 700,
            background: '#0D0D0D', color: '#fff',
            opacity: valid ? 1 : 0.35,
          }}
        >
          Ajouter →
        </button>
      </div>
    </>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', display: 'block', marginBottom: 5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #ECECEA', fontSize: 14, fontFamily: 'Manrope',
  color: '#0D0D0D', outline: 'none', boxSizing: 'border-box',
  background: '#F9F9F7', fontWeight: 500,
};
