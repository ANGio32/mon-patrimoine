import { formatCAD } from '../lib/format';
import { getCurrentMonth, getMonthlyIncome, getPayDatesInMonth, getDaysUntilNextPay } from '../lib/stats';

interface HeroCardProps {
  spent: number;
  received: number;
  payAmount: number;
  nextPayDate: string;
  txCount: number;
  dailyAvg: number;
  lastTxAmount: number;
}

export function HeroCard({ spent, received, payAmount, nextPayDate, txCount, dailyAvg, lastTxAmount }: HeroCardProps) {
  const month = getCurrentMonth();
  const dailySalary = payAmount > 0 ? payAmount / 10 : 0;
  const monthlySalary = payAmount > 0 && nextPayDate ? getMonthlyIncome(nextPayDate, payAmount, month) : 0;
  const payDates = nextPayDate ? getPayDatesInMonth(nextPayDate, month) : [];
  const pct = monthlySalary > 0 ? Math.min(100, (spent / monthlySalary) * 100) : 0;
  const daysUsed = dailySalary > 0 ? (spent / dailySalary).toFixed(1) : null;
  const remaining = monthlySalary > 0 ? monthlySalary - spent : null;
  const daysUntilPay = nextPayDate ? getDaysUntilNextPay(nextPayDate) : -1;

  return (
    <div style={{
      background: '#0D0D0D', borderRadius: 24, padding: '24px 22px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)',
      color: '#fff', margin: '0 16px',
    }}>
      <div className="flex justify-between items-start">
        <div>
          <p style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Dépensé ce mois
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 36, fontWeight: 800, margin: '6px 0 0', lineHeight: 1.1, letterSpacing: '-1px' }}>
            {formatCAD(spent)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            Reçu
          </p>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, margin: '6px 0 0', color: '#E9E9E6' }}>
            {formatCAD(received)}
          </p>
        </div>
      </div>

      {monthlySalary > 0 && (
        <div style={{ marginTop: 20 }}>
          <div className="flex justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope' }}>
              Budget mensuel ({payDates.length} paye{payDates.length > 1 ? 's' : ''})
            </span>
            <span style={{ fontSize: 11, color: '#fff', fontFamily: 'Manrope', fontWeight: 600 }}>{pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 4, background: '#333', borderRadius: 2 }}>
            <div className="progress-bar-fill" style={{ height: '100%', borderRadius: 2, background: pct > 90 ? '#fff' : '#999', width: `${pct}%` }} />
          </div>
          <div className="flex justify-between" style={{ marginTop: 6 }}>
            {daysUsed && (
              <p style={{ fontSize: 11, color: '#666', fontFamily: 'Manrope', margin: 0 }}>≈ {daysUsed} j. de travail</p>
            )}
            {remaining !== null && (
              <p style={{ fontSize: 11, fontFamily: 'Manrope', margin: 0, fontWeight: 600, color: remaining < 0 ? '#fff' : '#666' }}>
                {remaining >= 0 ? `${formatCAD(remaining)} restants` : `Dépassé de ${formatCAD(-remaining)}`}
              </p>
            )}
          </div>
          {daysUntilPay >= 0 && (
            <p style={{ fontSize: 11, color: '#555', fontFamily: 'Manrope', marginTop: 6 }}>
              {daysUntilPay === 0 ? `Paye aujourd'hui — ${formatCAD(payAmount)}` : `Prochaine paye dans ${daysUntilPay} jour${daysUntilPay > 1 ? 's' : ''} — ${formatCAD(payAmount)}`}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3" style={{ marginTop: 20 }}>
        <StatChip label="Transactions" value={String(txCount)} />
        <StatChip label="Moy. / jour" value={formatCAD(dailyAvg)} />
        <StatChip label="Dernière" value={formatCAD(lastTxAmount)} />
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      flex: 1, background: '#1a1a1a', borderRadius: 14, padding: '10px 10px',
      textAlign: 'center',
    }}>
      <p style={{ fontSize: 10, color: '#666', fontFamily: 'Manrope', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 13, color: '#fff', fontFamily: 'Manrope', fontWeight: 700, margin: '4px 0 0', lineHeight: 1.1 }}>{value}</p>
    </div>
  );
}
