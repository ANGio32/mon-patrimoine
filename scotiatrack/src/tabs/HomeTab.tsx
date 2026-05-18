import type { Transaction } from '../lib/parser';
import { HeroCard } from '../components/HeroCard';
import { SparklineChart } from '../components/SparklineChart';
import { TransactionRow } from '../components/TransactionRow';
import { getCurrentMonth, getPreviousMonth, getMonthTransactions, getTotalDebits, getTotalCredits, getDailyAverage, getLast6MonthsData } from '../lib/stats';

interface HomeTabProps {
  transactions: Transaction[];
  dailySalary: number;
  onShowAll: () => void;
}

export function HomeTab({ transactions, dailySalary, onShowAll }: HomeTabProps) {
  const month = getCurrentMonth();
  const prevMonth = getPreviousMonth();
  const monthTxs = getMonthTransactions(transactions, month);
  const spent = getTotalDebits(monthTxs);
  const received = getTotalCredits(monthTxs);
  const dailyAvg = getDailyAverage(transactions, month);
  const lastTx = monthTxs.find(t => t.type === 'debit');
  const chartData = getLast6MonthsData(transactions);
  const recent = monthTxs.slice(0, 4);
  const prevSpent = getTotalDebits(getMonthTransactions(transactions, prevMonth));
  const delta = prevSpent > 0 ? ((spent - prevSpent) / prevSpent) * 100 : null;
  const prevMonthLabel = new Date(prevMonth + '-02').toLocaleDateString('fr-CA', { month: 'long' });

  return (
    <div style={{ paddingBottom: 90 }}>
      <HeroCard
        spent={spent}
        received={received}
        dailySalary={dailySalary}
        txCount={monthTxs.length}
        dailyAvg={dailyAvg}
        lastTxAmount={lastTx?.amount ?? 0}
      />

      {delta !== null && (
        <div style={{ margin: '12px 16px 0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 12, padding: '7px 12px' }}>
            <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 700, color: delta > 0 ? '#E53E3E' : '#16A34A' }}>
              {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(0)}%
            </span>
            <span style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope' }}>vs {prevMonthLabel}</span>
          </div>
        </div>
      )}

      <SparklineChart data={chartData} />

      <div style={{ margin: '20px 16px 0', background: '#fff', borderRadius: 18, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 16px 8px' }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: 0 }}>
            Récentes
          </p>
          <button
            onClick={onShowAll}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#999', fontFamily: 'Manrope', fontWeight: 600 }}
          >
            Tout voir →
          </button>
        </div>
        {recent.length === 0 ? (
          <p style={{ padding: '16px', color: '#999', fontSize: 13, fontFamily: 'Manrope' }}>Aucune transaction ce mois.</p>
        ) : (
          recent.map(tx => <TransactionRow key={tx.id} tx={tx} dailySalary={dailySalary} />)
        )}
      </div>
    </div>
  );
}
