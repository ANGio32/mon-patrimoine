import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { UserProfile, DailyLog } from '../types';
import { loadProfile, saveProfile, getLogForDate, getTodayKey } from '../utils/storage';

interface AppState {
  profile: UserProfile | null;
  todayLog: DailyLog;
  todayKey: string;
}

type Action =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'REFRESH_TODAY' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      saveProfile(action.payload);
      return { ...state, profile: action.payload };
    case 'REFRESH_TODAY': {
      const key = getTodayKey();
      return { ...state, todayKey: key, todayLog: getLogForDate(key) };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  setProfile: (p: UserProfile) => void;
  refreshToday: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const todayKey = getTodayKey();
  const [state, dispatch] = useReducer(reducer, {
    profile: loadProfile(),
    todayLog: getLogForDate(todayKey),
    todayKey,
  });

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: 'REFRESH_TODAY' });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const value: AppContextValue = {
    state,
    setProfile: (p) => dispatch({ type: 'SET_PROFILE', payload: p }),
    refreshToday: () => dispatch({ type: 'REFRESH_TODAY' }),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
