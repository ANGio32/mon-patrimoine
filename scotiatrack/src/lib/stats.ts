import type { Transaction } from './parser';

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export function getMonthTransactions(txs: Transaction[], month: string) {
  return txs.filter(t => t.date.startsWith(month));
}

export function getTotalDebits(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
}

export function getTotalCredits(txs: Transaction[]): number {
  return txs.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
}

export function getDailyAverage(txs: Transaction[], month: string): number {
  const debits = getMonthTransactions(txs, month).filter(t => t.type === 'debit');
  if (!debits.length) return 0;
  const dates = [...new Set(debits.map(t => t.date))];
  return getTotalDebits(debits) / dates.length;
}

export function getLast6MonthsData(txs: Transaction[]): { month: string; label: string; total: number }[] {
  const now = new Date();
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('fr-CA', { month: 'short' });
    const monthTxs = getMonthTransactions(txs, month).filter(t => t.type === 'debit');
    result.push({ month, label, total: getTotalDebits(monthTxs) });
  }
  return result;
}

export function getCategoryBreakdown(txs: Transaction[]) {
  const map: Record<string, { emoji: string; total: number }> = {};
  txs.filter(t => t.type === 'debit').forEach(t => {
    if (!map[t.category]) map[t.category] = { emoji: t.categoryEmoji, total: 0 };
    map[t.category].total += t.amount;
  });
  return Object.entries(map)
    .map(([category, { emoji, total }]) => ({ category, emoji, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

export function getWorkingDaysInMonth(month: string): number {
  const [year, m] = month.split('-').map(Number);
  const daysInMonth = new Date(year, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, m - 1, d).getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}
