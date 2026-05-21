export type Goal = 'lose_weight' | 'build_muscle' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type Equipment = 'home' | 'gym' | 'both';

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  equipment?: Equipment;
  geminiApiKey: string;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface AiProgramSession {
  name: string;
  durationMin: number;
  exercises: Exercise[];
}

export interface AiProgram {
  id: string;
  name: string;
  createdAt: string;
  request: string;
  sessions: AiProgramSession[];
}

export interface FoodItem {
  name: string;
  portionDescription: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealEntry {
  id: string;
  date: string;
  time: string;
  mealType: MealType;
  description: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  photoDataUrl?: string;
  aiAnalyzed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  exercises: Exercise[];
  durationMin: number;
  completed: boolean;
  notes?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps?: number;
  durationSec?: number;
  restSec: number;
  muscleGroups: string[];
}

export interface DailyLog {
  date: string;
  meals: MealEntry[];
  workouts: WorkoutSession[];
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface SportTimingAdvice {
  waitBeforeExercise: string;
  exerciseType: string;
  recoveryWindow: string;
  hydration: string;
  tip: string;
}
