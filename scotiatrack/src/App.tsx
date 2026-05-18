import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { SetupWizard } from './components/SetupWizard';
import { HomeTab } from './tabs/HomeTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { TransactionsTab } from './tabs/TransactionsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { useTransactions } from './lib/useTransactions';
import './index.css';

type Tab = 'home' | 'analytics' | 'transactions' | 'settings';

function usePaySettings() {
  const [payAmount, setPayAmount] = useState<number>(() => {
    const v = localStorage.getItem('payAmount');
    if (v) return parseFloat(v);
    const old = localStorage.getItem('dailySalary');
    return old ? parseFloat(old) * 10 : 0;
  });
  const [nextPayDate, setNextPayDate] = useState<string>(() => {
    return localStorage.getItem('nextPayDate') || '';
  });
  function savePayAmount(v: number) { localStorage.setItem('payAmount', String(v)); setPayAmount(v); }
  function saveNextPayDate(d: string) { localStorage.setItem('nextPayDate', d); setNextPayDate(d); }
  return { payAmount, nextPayDate, savePayAmount, saveNextPayDate };
}

function useCategoryBudgets() {
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const v = localStorage.getItem('scotiatrack-budgets');
      return v ? JSON.parse(v) : {};
    } catch { return {}; }
  });
  function save(b: Record<string, number>) {
    localStorage.setItem('scotiatrack-budgets', JSON.stringify(b));
    setBudgets(b);
  }
  return [budgets, save] as const;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const { transactions, loading, error, lastSync, scriptUrl, saveUrl, refresh } = useTransactions();
  const { payAmount, nextPayDate, savePayAmount, saveNextPayDate } = usePaySettings();
  const [categoryBudgets, saveBudgets] = useCategoryBudgets();

  if (!scriptUrl) {
    return (
      <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100svh', background: '#F2F1ED' }}>
        <SetupWizard onComplete={url => saveUrl(url)} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 390, margin: '0 auto', minHeight: '100svh', background: '#F2F1ED', position: 'relative' }}>
      <TopBar loading={loading} onRefresh={refresh} />

      {error && (
        <div style={{ margin: '0 16px 12px', padding: '10px 14px', borderRadius: 12, background: '#ECECEA', border: '1px solid #E9E9E6' }}>
          <p style={{ margin: 0, fontSize: 12, fontFamily: 'Manrope', color: '#0D0D0D' }}>
            ⚠️ Erreur : {error}
          </p>
        </div>
      )}

      <div style={{ overflowY: 'auto', height: 'calc(100svh - 70px)', paddingTop: 4 }}>
        {tab === 'home' && (
          <HomeTab transactions={transactions} payAmount={payAmount} nextPayDate={nextPayDate} onShowAll={() => setTab('transactions')} />
        )}
        {tab === 'analytics' && (
          <AnalyticsTab transactions={transactions} payAmount={payAmount} nextPayDate={nextPayDate} categoryBudgets={categoryBudgets} />
        )}
        {tab === 'transactions' && (
          <TransactionsTab transactions={transactions} payAmount={payAmount} />
        )}
        {tab === 'settings' && (
          <SettingsTab
            payAmount={payAmount}
            nextPayDate={nextPayDate}
            onSavePayAmount={savePayAmount}
            onSaveNextPayDate={saveNextPayDate}
            scriptUrl={scriptUrl}
            onSaveUrl={saveUrl}
            onRefresh={refresh}
            lastSync={lastSync}
            connected={transactions.length > 0 && !error}
            categoryBudgets={categoryBudgets}
            onSaveBudgets={saveBudgets}
          />
        )}
      </div>

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
