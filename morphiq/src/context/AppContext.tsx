import { createContext, useContext, useReducer, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { UserProfile, DailyLog } from '../types';
import {
  loadProfile, saveProfile, getLogForDate, getTodayKey,
  loadAllLogs, loadAiPrograms, loadChallenge, saveChallenge,
  setCurrentUserId,
} from '../utils/storage';
import {
  supabase, fetchProfile, upsertProfile, fetchAllLogs,
  fetchPrograms, fetchChallengeFromDb, upsertProgram, upsertLog,
} from '../utils/supabase';

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
  userId: string | null;
  authLoading: boolean;
  setProfile: (p: UserProfile) => void;
  refreshToday: () => void;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// Pull Supabase data into localStorage, dispatch profile update
async function syncFromSupabase(userId: string, dispatch: React.Dispatch<Action>) {
  try {
    const sbProfile = await fetchProfile(userId);

    if (sbProfile?.onboardingComplete) {
      // Supabase has authoritative data → hydrate localStorage
      dispatch({ type: 'SET_PROFILE', payload: sbProfile });

      const logs = await fetchAllLogs(userId);
      if (Object.keys(logs).length > 0) {
        localStorage.setItem('morphiq_logs', JSON.stringify(logs));
      }
      const programs = await fetchPrograms(userId);
      if (programs.length > 0) {
        localStorage.setItem('morphiq_ai_programs', JSON.stringify(programs));
      }
      const challenge = await fetchChallengeFromDb(userId);
      if (challenge) saveChallenge(challenge);
    } else {
      // No Supabase profile yet → migrate localStorage to Supabase
      const localProfile = loadProfile();
      if (localProfile) {
        await upsertProfile(userId, localProfile);
        if (localProfile.onboardingComplete) {
          dispatch({ type: 'SET_PROFILE', payload: localProfile });
        }
        // Migrate logs (photos stripped inside upsertLog)
        const localLogs = Object.values(loadAllLogs());
        await Promise.allSettled(localLogs.map(log => upsertLog(userId, log)));
        // Migrate programs
        const localPrograms = loadAiPrograms();
        await Promise.allSettled(localPrograms.map(p => upsertProgram(userId, p)));
        // Migrate challenge
        const localChallenge = loadChallenge();
        if (localChallenge) saveChallenge(localChallenge); // triggers upsertChallengeToDb via storage
      }
    }

    dispatch({ type: 'REFRESH_TODAY' });
  } catch (e) {
    console.error('Supabase sync error:', e);
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const todayKey = getTodayKey();
  const [state, dispatch] = useReducer(reducer, {
    profile: loadProfile(),
    todayLog: getLogForDate(todayKey),
    todayKey,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null;
      if (user) {
        setCurrentUserId(user.id);
        setUserId(user.id);
        await syncFromSupabase(user.id, dispatch);
      }
      setAuthLoading(false);
    });

    // Listen to sign-in / sign-out events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      setCurrentUserId(user?.id ?? null);
      setUserId(user?.id ?? null);

      if (event === 'SIGNED_IN' && user) {
        setAuthLoading(true);
        await syncFromSupabase(user.id, dispatch);
        setAuthLoading(false);
      }

      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'REFRESH_TODAY' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Minute tick to refresh today's log
  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'REFRESH_TODAY' }), 60_000);
    return () => clearInterval(id);
  }, []);

  const setProfile = useCallback((p: UserProfile) => {
    dispatch({ type: 'SET_PROFILE', payload: p });
    // Storage.ts saveProfile already syncs to Supabase via _userId
  }, []);

  const signOut = useCallback(async () => {
    setCurrentUserId(null);
    await supabase.auth.signOut();
  }, []);

  const value: AppContextValue = {
    state,
    userId,
    authLoading,
    setProfile,
    refreshToday: () => dispatch({ type: 'REFRESH_TODAY' }),
    signOut,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
