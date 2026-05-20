import { useState, useEffect, useCallback, useRef } from 'react';
import { parseTransactions, type Transaction } from './parser';
import type { RawTransaction } from './parser';

const REFRESH_INTERVAL = 30_000;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      setTransactions(parseTransactions(json as RawTransaction[]));
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

  return { transactions, loading, error, lastSync, scriptUrl, saveUrl, refresh };
}
