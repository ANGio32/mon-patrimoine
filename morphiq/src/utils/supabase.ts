import { createClient } from '@supabase/supabase-js';
import type { UserProfile, DailyLog, AiProgram, WeeklyChallenge } from '../types';
import type { Goal, ActivityLevel, Sex, Equipment } from '../types';

const SUPABASE_URL = 'https://wjkdgggtmhnkstsgtbou.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_JXbzpyQvtPAzX4XBxxIerQ_eDUE9Vc8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Profile ───────────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  name: string | null;
  sex: string | null;
  age: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  activity_level: string | null;
  goal: string | null;
  equipment: string | null;
  gemini_api_key: string | null;
  onboarding_complete: boolean | null;
  created_at: string | null;
}

function rowToProfile(row: ProfileRow): UserProfile {
  return {
    name: row.name ?? '',
    sex: (row.sex as Sex) ?? 'male',
    age: row.age ?? 25,
    weightKg: row.weight_kg ?? 70,
    heightCm: row.height_cm ?? 170,
    activityLevel: (row.activity_level as ActivityLevel) ?? 'moderate',
    goal: (row.goal as Goal) ?? 'maintain',
    equipment: (row.equipment as Equipment) ?? undefined,
    geminiApiKey: row.gemini_api_key ?? '',
    onboardingComplete: row.onboarding_complete ?? false,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    sex: profile.sex,
    age: profile.age,
    weight_kg: profile.weightKg,
    height_cm: profile.heightCm,
    activity_level: profile.activityLevel,
    goal: profile.goal,
    equipment: profile.equipment ?? null,
    gemini_api_key: profile.geminiApiKey,
    onboarding_complete: profile.onboardingComplete,
    created_at: profile.createdAt,
  });
}

// ── Daily Logs ────────────────────────────────────────────────────────────────

function stripPhotos(log: DailyLog): DailyLog {
  return {
    ...log,
    meals: log.meals.map(m => ({ ...m, photoDataUrl: undefined })),
  };
}

export async function upsertLog(userId: string, log: DailyLog): Promise<void> {
  const clean = stripPhotos(log);
  await supabase.from('daily_logs').upsert(
    { user_id: userId, date: clean.date, meals: clean.meals, workouts: clean.workouts },
    { onConflict: 'user_id,date' }
  );
}

export async function fetchAllLogs(userId: string): Promise<Record<string, DailyLog>> {
  const { data } = await supabase
    .from('daily_logs')
    .select('date, meals, workouts')
    .eq('user_id', userId);
  if (!data) return {};
  const result: Record<string, DailyLog> = {};
  for (const row of data) {
    result[row.date as string] = {
      date: row.date as string,
      meals: row.meals as DailyLog['meals'],
      workouts: row.workouts as DailyLog['workouts'],
    };
  }
  return result;
}

// ── AI Programs ───────────────────────────────────────────────────────────────

export async function fetchPrograms(userId: string): Promise<AiProgram[]> {
  const { data } = await supabase
    .from('ai_programs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map(row => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
    request: row.request as string,
    sessions: row.sessions as AiProgram['sessions'],
  }));
}

export async function upsertProgram(userId: string, program: AiProgram): Promise<void> {
  await supabase.from('ai_programs').upsert({
    id: program.id,
    user_id: userId,
    name: program.name,
    request: program.request,
    sessions: program.sessions,
    created_at: program.createdAt,
  });
}

export async function removeProgram(userId: string, id: string): Promise<void> {
  await supabase.from('ai_programs').delete().eq('id', id).eq('user_id', userId);
}

// ── Weekly Challenge ──────────────────────────────────────────────────────────

export async function fetchChallengeFromDb(userId: string): Promise<WeeklyChallenge | null> {
  const { data } = await supabase
    .from('weekly_challenges')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!data) return null;
  return {
    id: data.id as string,
    weekStart: data.week_start as string,
    title: data.title as string,
    description: data.description as string,
    targetDays: data.target_days as number,
    completedDays: data.completed_days as string[],
    emoji: data.emoji as string,
    reward: data.reward as string,
    createdAt: data.created_at as string,
  };
}

export async function upsertChallengeToDb(userId: string, challenge: WeeklyChallenge): Promise<void> {
  await supabase.from('weekly_challenges').upsert({
    user_id: userId,
    id: challenge.id,
    week_start: challenge.weekStart,
    title: challenge.title,
    description: challenge.description,
    target_days: challenge.targetDays,
    completed_days: challenge.completedDays,
    emoji: challenge.emoji,
    reward: challenge.reward,
    created_at: challenge.createdAt,
  });
}

export async function removeChallengeFromDb(userId: string): Promise<void> {
  await supabase.from('weekly_challenges').delete().eq('user_id', userId);
}
