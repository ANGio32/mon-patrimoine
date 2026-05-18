import type { Transaction } from '../lib/parser';
import { HeroCard } from '../components/HeroCard';
import { SparklineChart } from '../components/SparklineChart';
import { TransactionRow } from '../components/TransactionRow';
import { getCurrentMonth, getMonthTransactions, getTotalDebits, getTotalCredits, getDailyAverage, getLast6MonthsData } from '../lib/stats';

interface HomeTabProps {
  transactions: Transaction[];
  dailySalary: number;
  onShowAll: () => void;
}

export function HomeTab({ transactions, dailySalary, onShowAll }: HomeTabProps) {
  const month = getCurrentMonth();
  const monthTxs = getMonthTransactions(transactions, month);
  const spent = getTotalDebits(monthTxs);
  const received = getTotalCredits(monthTxs);
  const dailyAvg = getDailyAverage(transactions, month);
  const lastTx = monthTxs.find(t => t.type === 'debit');
  const chartData = getLast6MonthsData(transactions);
  const recent = monthTxs.slice(0, 4);

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

      <SparklineChart data={chartData} />

      <div style={{ margin: '20px 16px 0', background: '#fff', borderRadius: 18, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '16px 16px 8px' }}>
          <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: 0 }}>
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
