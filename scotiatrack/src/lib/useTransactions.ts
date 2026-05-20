import { useState, useEffect, useCallback, useRef } from 'react';
import { parseTransactions, type Transaction } from './parser';
import type { RawTransaction } from './parser';

const REFRESH_INTERVAL = 30_000;
const MANUAL_KEY = 'scotiatrack-manual-transactions';

function loadManual(): Transaction[] {
  try {
    const v = localStorage.getItem(MANUAL_KEY);
    return v ? JSON.parse(v) : [];
  } catch { return []; }
}

export function useTransactions() {
  const [apiTransactions, setApiTransactions] = useState<Transaction[]>([]);
  const [manualTransactions, setManualTransactions] = useState<Transaction[]>(loadManual);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [scriptUrl, setScriptUrl] = useState<string>(() => localStorage.getItem('scriptUrl') || '');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (url: string) => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: RawTransaction[] | { error: string } = await res.json();
      if ('error' in json) throw new Error(json.error);
      setApiTransactions(parseTransactions(json as RawTransaction[]));
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUrl = useCallback((url: string) => {
    localStorage.setItem('scriptUrl', url);
    setScriptUrl(url);
  }, []);

  useEffect(() => {
    if (!scriptUrl) return;
    fetchData(scriptUrl);
    intervalRef.current = setInterval(() => fetchData(scriptUrl), REFRESH_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scriptUrl, fetchData]);

  const refresh = useCallback(() => fetchData(scriptUrl), [scriptUrl, fetchData]);

  const addManualTransaction = useCallback((t: Omit<Transaction, 'id'>) => {
    const newT: Transaction = { ...t, id: `manual-${Date.now()}`, manual: true };
    setManualTransactions(prev => {
      const updated = [newT, ...prev];
      localStorage.setItem(MANUAL_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteManualTransaction = useCallback((id: string) => {
    setManualTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      localStorage.setItem(MANUAL_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const transactions = [...apiTransactions, ...manualTransactions]
    .sort((a, b) => b.date.localeCompare(a.date));

  return { transactions, loading, error, lastSync, scriptUrl, saveUrl, refresh, addManualTransaction, deleteManualTransaction };
}
