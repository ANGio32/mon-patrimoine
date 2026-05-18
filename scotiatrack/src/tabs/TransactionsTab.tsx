import { useState } from 'react';
import type { Transaction } from '../lib/parser';
import { TransactionRow } from '../components/TransactionRow';

type Filter = 'all' | 'debit' | 'credit';

interface TransactionsTabProps {
  transactions: Transaction[];
  dailySalary: number;
}

export function TransactionsTab({ transactions, dailySalary }: TransactionsTabProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = transactions.filter(tx => {
    if (filter === 'debit' && tx.type !== 'debit') return false;
    if (filter === 'credit' && tx.type !== 'credit') return false;
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, tx) => {
    if (!acc[tx.date]) acc[tx.date] = [];
    acc[tx.date].push(tx);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: 'Manrope', fontSize: 13, fontWeight: 600,
    background: active ? '#0D0D0D' : '#ECECEA',
    color: active ? '#fff' : '#0D0D0D',
  });

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: '0 16px 12px' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff', borderRadius: 14, padding: '10px 14px', marginBottom: 12,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, fontFamily: 'Manrope', color: '#0D0D0D',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          <button style={pillStyle(filter === 'all')} onClick={() => setFilter('all')}>Tout</button>
          <button style={pillStyle(filter === 'debit')} onClick={() => setFilter('debit')}>Débits</button>
          <button style={pillStyle(filter === 'credit')} onClick={() => setFilter('credit')}>Crédits</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 18, margin: '0 16px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <p style={{ padding: 20, color: '#999', fontSize: 13, fontFamily: 'Manrope', textAlign: 'center' }}>
            Aucune transaction.
          </p>
        ) : (
          sortedDates.map(date =>
            grouped[date].map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} dailySalary={dailySalary} showDate={i === 0} />
            ))
          )
        )}
      </div>
    </div>
  );
}
