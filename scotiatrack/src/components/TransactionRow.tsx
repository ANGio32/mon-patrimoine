import type { Transaction } from '../lib/parser';
import { formatCAD, formatDaysOfWork, formatDateLabel } from '../lib/format';

interface TransactionRowProps {
  tx: Transaction;
  dailySalary: number;
  showDate?: boolean;
}

export function TransactionRow({ tx, dailySalary, showDate }: TransactionRowProps) {
  const daysLabel = dailySalary > 0 ? formatDaysOfWork(tx.amount, dailySalary) : null;

  return (
    <>
      {showDate && (
        <p style={{
          fontSize: 11, color: '#999', fontFamily: 'Manrope', fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          margin: '14px 16px 6px', padding: 0,
        }}>
          {formatDateLabel(tx.date)}
        </p>
      )}
      <div className="flex items-center gap-3" style={{ padding: '10px 16px' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: '#ECECEA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0, filter: 'grayscale(1)',
        }}>
          {tx.categoryEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#0D0D0D', margin: 0, fontFamily: 'Manrope', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tx.description}
          </p>
          <p style={{ fontSize: 11, color: '#999', margin: '2px 0 0', fontFamily: 'Manrope' }}>
            {tx.account || tx.date}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, margin: 0, fontFamily: 'Manrope',
            color: tx.type === 'credit' ? '#0D0D0D' : '#0D0D0D',
          }}>
            {tx.type === 'credit' ? '+' : '−'}{formatCAD(tx.amount)}
          </p>
          {daysLabel && (
            <p style={{ fontSize: 10, color: '#999', margin: '2px 0 0', fontFamily: 'Manrope' }}>
              {daysLabel}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
