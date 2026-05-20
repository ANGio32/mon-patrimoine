import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { Transaction } from '../lib/parser';
import { DonutRing } from '../components/DonutRing';
import { formatCAD } from '../lib/format';
import { getCurrentMonth, getMonthTransactions, getTotalDebits, getLast6MonthsData, getLast7DaysData, getCategoryBreakdown, getTopMerchants, getMonthlyIncome, getPayDatesInMonth } from '../lib/stats';

interface AnalyticsTabProps {
  transactions: Transaction[];
  payAmount: number;
  nextPayDate: string;
  categoryBudgets: Record<string, number>;
}

export function AnalyticsTab({ transactions, payAmount, nextPayDate, categoryBudgets }: AnalyticsTabProps) {
  const [chartView, setChartView] = useState<'month' | 'week'>('month');
  const month = getCurrentMonth();
  const dailySalary = payAmount > 0 ? payAmount / 10 : 0;
  const monthTxs = getMonthTransactions(transactions, month);
  const spent = getTotalDebits(monthTxs);
  const monthlySalary = payAmount > 0 && nextPayDate ? getMonthlyIncome(nextPayDate, payAmount, month) : 0;
  const payDates = nextPayDate ? getPayDatesInMonth(nextPayDate, month) : [];
  const pct = monthlySalary > 0 ? Math.min(100, (spent / monthlySalary) * 100) : 0;
  const daysUsed = dailySalary > 0 ? spent / dailySalary : 0;
  const remaining = monthlySalary > 0 ? monthlySalary - spent : null;
  const chartData = chartView === 'month' ? getLast6MonthsData(transactions) : getLast7DaysData(transactions);
  const categories = getCategoryBreakdown(monthTxs);
  const maxCat = categories[0]?.total || 1;
  const merchants = getTopMerchants(monthTxs);

  return (
    <div style={{ padding: '0 16px calc(env(safe-area-inset-bottom, 0px) + 90px)' }}>
      {/* Budget ring */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 0 16px' }}>
          Budget du mois {payDates.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>({payDates.length} paye{payDates.length > 1 ? 's' : ''})</span>}
        </p>
        <div className="flex items-center gap-5">
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <DonutRing pct={pct} size={130} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: '#0D0D0D' }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 22, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#0D0D0D', margin: 0 }}>
              {formatCAD(spent)}
            </p>
            <p style={{ fontSize: 12, color: '#999', fontFamily: 'Manrope', margin: '4px 0 0' }}>dépensé ce mois</p>
            {dailySalary > 0 && (
              <p style={{ fontSize: 12, color: '#666', fontFamily: 'Manrope', marginTop: 6, fontWeight: 600 }}>
                ≈ {daysUsed.toFixed(1)} jours de travail
              </p>
            )}
            {remaining !== null && (
              <p style={{ fontSize: 12, fontFamily: 'Manrope', marginTop: 4, fontWeight: 700, color: remaining < 0 ? '#E53E3E' : '#16A34A' }}>
                {remaining >= 0 ? `${formatCAD(remaining)} restants` : `Dépassé de ${formatCAD(-remaining)}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart with week/month toggle */}
      <div style={{ background: '#fff', borderRadius: 18, padding: '16px 0 8px', marginBottom: 16 }}>
        <div className="flex justify-between items-center" style={{ margin: '0 16px 12px' }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: 0 }}>
            {chartView === 'month' ? 'Évolution 6 mois' : 'Cette semaine'}
          </p>
          <div style={{ display: 'flex', background: '#F2F1ED', borderRadius: 8, padding: 2 }}>
            <button onClick={() => setChartView('month')} style={toggleBtn(chartView === 'month')}>Mois</button>
            <button onClick={() => setChartView('week')} style={toggleBtn(chartView === 'week')}>Semaine</button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6B7280" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6B7280" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#999', fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => v === 0 ? '' : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${Math.round(v)}`}
              tick={{ fontSize: 9, fill: '#bbb', fontFamily: 'Manrope' }}
              axisLine={false} tickLine={false} width={28} tickCount={3}
            />
            <Tooltip
              formatter={(v) => [formatCAD(Number(v)), 'Dépenses']}
              contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="#6B7280" strokeWidth={2} fill="url(#areaGrad2)" dot={false} activeDot={{ r: 4, fill: '#6B7280' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top merchants */}
      {merchants.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 18, padding: 20, marginBottom: 16 }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 0 16px' }}>
            Top marchands
          </p>
          {merchants.map((m, i) => (
            <div key={m.name} className="flex justify-between items-center" style={{ marginBottom: i < merchants.length - 1 ? 14 : 0 }}>
              <div>
                <p style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D', margin: 0 }}>{m.name}</p>
                <p style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', margin: '2px 0 0' }}>
                  {m.count} transaction{m.count > 1 ? 's' : ''}
                </p>
              </div>
              <span style={{ fontSize: 14, fontFamily: 'Manrope', fontWeight: 700, color: '#0D0D0D' }}>{formatCAD(m.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Category breakdown with budget */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 20 }}>
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 0 16px' }}>
          Par catégorie
        </p>
        {categories.length === 0 ? (
          <p style={{ color: '#999', fontSize: 13, fontFamily: 'Manrope' }}>Aucune donnée.</p>
        ) : (
          categories.map(cat => {
            const budget = categoryBudgets[cat.category];
            const barPct = budget ? Math.min(100, (cat.total / budget) * 100) : (cat.total / maxCat) * 100;
            const overBudget = budget !== undefined && cat.total > budget;
            return (
              <div key={cat.category} style={{ marginBottom: 14 }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 5 }}>
                  <div className="flex items-center gap-2">
                    <span className="emoji-grayscale" style={{ fontSize: 16 }}>{cat.emoji}</span>
                    <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 600, color: '#0D0D0D' }}>{cat.category}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontFamily: 'Manrope', fontWeight: 700, color: overBudget ? '#E53E3E' : '#0D0D0D' }}>
                      {formatCAD(cat.total)}
                    </span>
                    {budget !== undefined && (
                      <span style={{ fontSize: 11, color: '#999', fontFamily: 'Manrope', marginLeft: 4 }}>/ {formatCAD(budget)}</span>
                    )}
                  </div>
                </div>
                <div style={{ height: 4, background: '#ECECEA', borderRadius: 2 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ height: '100%', borderRadius: 2, background: overBudget ? '#E53E3E' : '#0D0D0D', width: `${barPct}%` }}
                  />
                </div>
                {overBudget && budget !== undefined && (
                  <p style={{ fontSize: 11, color: '#E53E3E', fontFamily: 'Manrope', margin: '3px 0 0', fontWeight: 600 }}>
                    Dépassé de {formatCAD(cat.total - budget)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function toggleBtn(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
    background: active ? '#fff' : 'transparent',
    color: active ? '#0D0D0D' : '#999',
    fontFamily: 'Manrope', fontSize: 12, fontWeight: 600,
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.2s',
  };
}
