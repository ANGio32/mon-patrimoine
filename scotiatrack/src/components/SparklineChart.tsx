import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCAD } from '../lib/format';

interface SparklineChartProps {
  data: { month: string; label: string; total: number }[];
}

export function SparklineChart({ data }: SparklineChartProps) {
  return (
    <div style={{ margin: '20px 16px 0', background: '#fff', borderRadius: 18, padding: '16px 0 8px' }}>
      <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#0D0D0D', margin: '0 16px 12px' }}>
        6 derniers mois
      </p>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={data} margin={{ top: 4, right: 16, left: 16, bottom: 0 }}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D0D0D" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#0D0D0D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#999', fontFamily: 'Manrope' }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            formatter={(v) => [formatCAD(Number(v)), 'Dépenses']}
            contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12, fontFamily: 'Manrope' }}
          />
          <Area
            type="monotone" dataKey="total"
            stroke="#0D0D0D" strokeWidth={2}
            fill="url(#areaGrad)"
            dot={false} activeDot={{ r: 4, fill: '#0D0D0D' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
