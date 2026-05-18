import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '../lib/parser';
import { DonutRing } from '../components/DonutRing';
import { formatCAD } from '../lib/format';
import { getCurrentMonth, getMonthTransactions, getTotalDebits, getLast6MonthsData, getCategoryBreakdown } from '../lib/stats';

interface AnalyticsTabProps {
  transactions: Transaction[];
  dailySalary: number;
}

export function AnalyticsTab({ transactions, dailySalary }: AnalyticsTabProps) {
  const month = getCurrentMonth();
  const monthTxs = getMonthTransactions(transactions, month);
  const spent = getTotalDebits(monthTxs);
  const monthlySalary = dailySalary * 22;
  const pct = monthlySalary > 0 ? Math.min(100, (spent / monthlySalary) * 100) : 0;
  const daysUsed = dailySalary > 0 ? (spent / dailySalary) : 0;
  const chartData = getLast6MonthsData(transactions);
  const categories = getCategoryBreakdown(monthTxs);
  const maxCat = categories[0]?.total || 1;

  return (
    <div style={{ paddingBottom: 90, padding: '0 16px 90px' }}>
      {/* Budget ring */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 0 16px' }}>
          Budget du mois
        </p>
        <div className="flex items-center gap-5">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <DonutRing pct={pct} size={130} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#0D0D0D' }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 22, fontFamily: 'Syne, sans-serif', fontWeight: 800, color: '#0D0D0D', margin: 0 }}>
              {formatCAD(spent)}
            </p>
            <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '4px 0 0' }}>
              dépensé ce mois
            </p>
            {dailySalary > 0 && (
              <p style={{ fontSize: 12, color: '#666', fontFamily: 'Manrope', marginTop: 6, fontWeight: 600 }}>
                ≈ {daysUsed.toFixed(1)} jours de travail
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '16px 0 8px', marginBottom: 16 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 16px 12px' }}>
          Évolution 6 mois
        </p>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7280" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v) => [formatCAD(Number(v)), 'Dépenses']}
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="#6B7280" strokeWidth={2} fill="url(#areaGrad2)" dot={false} activeDot={{ r: 4, fill: '#6B7280' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Category breakdown */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 20 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 0 16px' }}>
          Par catégorie
        </p>
        {categories.length === 0 ? (
          <p style={{ color: '#999', fontSize: 13, fontFamily: 'Manrope' }}>Aucune donnée.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.category} style={{ marginBottom: 14 }}>
              <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                <div className="flex items-center gap-2">
                  <span className="emoji-grayscale" style={{ fontSize: 16 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D' }}>{cat.category}</span>
                </div>
                <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 700, color: '#0D0D0D' }}>
                  {formatCAD(cat.total)}
                </span>
              </div>
              <div style={{ height: 4, background: '#ECECEA', borderRadius: 2 }}>
                <div
                  className="progress-bar-fill"
                  style={{ height: '100%', borderRadius: 2, background: '#0D0D0D', width: `${(cat.total / maxCat) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
