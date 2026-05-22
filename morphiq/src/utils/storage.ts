import type { UserProfile, MealEntry, WorkoutSession, DailyLog, AiProgram, WeeklyChallenge } from '../types';
import {
  upsertLog, upsertProfile, upsertProgram, removeProgram,
  upsertChallengeToDb, removeChallengeFromDb,
} from './supabase';

const KEYS = {
  profile: 'morphiq_profile',
  logs: 'morphiq_logs',
  aiPrograms: 'morphiq_ai_programs',
  challenge: 'morphiq_weekly_challenge',
};

// Module-level userId set by AppContext after auth
let _userId: string | null = null;
export function setCurrentUserId(id: string | null) { _userId = id; }

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  if (_userId) upsertProfile(_userId, profile).catch(console.error);
}

export function loadProfile(): UserProfile | null {
  const raw = localStorage.getItem(KEYS.profile);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export function loadAllLogs(): Record<string, DailyLog> {
  const raw = localStorage.getItem(KEYS.logs);
  return raw ? (JSON.parse(raw) as Record<string, DailyLog>) : {};
}

function saveLogs(logs: Record<string, DailyLog>): void {
  localStorage.setItem(KEYS.logs, JSON.stringify(logs));
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getLogForDate(date: string): DailyLog {
  const all = loadAllLogs();
  return all[date] ?? { date, meals: [], workouts: [] };
}

export function saveMealEntry(meal: MealEntry): void {
  const all = loadAllLogs();
  const log = all[meal.date] ?? { date: meal.date, meals: [], workouts: [] };
  const idx = log.meals.findIndex((m) => m.id === meal.id);
  if (idx >= 0) { log.meals[idx] = meal; } else { log.meals.push(meal); }
  all[meal.date] = log;
  saveLogs(all);
  if (_userId) upsertLog(_userId, log).catch(console.error);
}

export function deleteMealEntry(date: string, id: string): void {
  const all = loadAllLogs();
  if (all[date]) {
    all[date].meals = all[date].meals.filter((m) => m.id !== id);
    saveLogs(all);
    if (_userId) upsertLog(_userId, all[date]).catch(console.error);
  }
}

export function saveWorkout(workout: WorkoutSession): void {
  const all = loadAllLogs();
  const log = all[workout.date] ?? { date: workout.date, meals: [], workouts: [] };
  const idx = log.workouts.findIndex((w) => w.id === workout.id);
  if (idx >= 0) { log.workouts[idx] = workout; } else { log.workouts.push(workout); }
  all[workout.date] = log;
  saveLogs(all);
  if (_userId) upsertLog(_userId, log).catch(console.error);
}

export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function loadAiPrograms(): AiProgram[] {
  const raw = localStorage.getItem(KEYS.aiPrograms);
  return raw ? (JSON.parse(raw) as AiProgram[]) : [];
}

export function saveAiProgram(program: AiProgram): void {
  const all = loadAiPrograms();
  const idx = all.findIndex(p => p.id === program.id);
  if (idx >= 0) all[idx] = program; else all.unshift(program);
  localStorage.setItem(KEYS.aiPrograms, JSON.stringify(all));
  if (_userId) upsertProgram(_userId, program).catch(console.error);
}

export function deleteAiProgram(id: string): void {
  const all = loadAiPrograms().filter(p => p.id !== id);
  localStorage.setItem(KEYS.aiPrograms, JSON.stringify(all));
  if (_userId) removeProgram(_userId, id).catch(console.error);
}

export function loadChallenge(): WeeklyChallenge | null {
  const raw = localStorage.getItem(KEYS.challenge);
  return raw ? (JSON.parse(raw) as WeeklyChallenge) : null;
}

export function saveChallenge(challenge: WeeklyChallenge): void {
  localStorage.setItem(KEYS.challenge, JSON.stringify(challenge));
  if (_userId) upsertChallengeToDb(_userId, challenge).catch(console.error);
}

export function clearChallenge(): void {
  localStorage.removeItem(KEYS.challenge);
  if (_userId) removeChallengeFromDb(_userId).catch(console.error);
}

export function getLast7DaysLogs(): DailyLog[] {
  const all = loadAllLogs();
  const result: DailyLog[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(all[key] ?? { date: key, meals: [], workouts: [] });
  }
  return result;
}
