export type Goal = 'lose_weight' | 'build_muscle' | 'maintain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Sex = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface UserProfile {
  name: string;
  sex: Sex;
  age: number;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  geminiApiKey: string;
  onboardingComplete: boolean;
  createdAt: string;
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
