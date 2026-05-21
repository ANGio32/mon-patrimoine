import type { UserProfile, Targets, ActivityLevel } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export function calculateBMR(profile: UserProfile): number {
  const { weightKg, heightCm, age, sex } = profile;
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateTDEE(profile: UserProfile): number {
  return Math.round(calculateBMR(profile) * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

export function calculateTargets(profile: UserProfile): Targets {
  const tdee = calculateTDEE(profile);
  let calories: number;

  switch (profile.goal) {
    case 'lose_weight':
      calories = Math.round(tdee * 0.8);
      break;
    case 'build_muscle':
      calories = Math.round(tdee * 1.1);
      break;
    default:
      calories = tdee;
  }

  let proteinG: number;
  switch (profile.goal) {
    case 'build_muscle':
      proteinG = Math.round(profile.weightKg * 2.2);
      break;
    case 'lose_weight':
      proteinG = Math.round(profile.weightKg * 2.0);
      break;
    default:
      proteinG = Math.round(profile.weightKg * 1.6);
  }

  const proteinCals = proteinG * 4;
  const fatCals = Math.round(calories * 0.25);
  const fatG = Math.round(fatCals / 9);
  const carbsCals = calories - proteinCals - fatCals;
  const carbsG = Math.round(carbsCals / 4);

  return {
    calories,
    protein: proteinG,
    carbs: Math.max(carbsG, 50),
    fat: fatG,
  };
}

export function calculateDeficit(consumed: number, target: number): number {
  return target - consumed;
}

export function getBMI(profile: UserProfile): number {
  const heightM = profile.heightCm / 100;
  return Math.round((profile.weightKg / (heightM * heightM)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

export function formatCalories(n: number): string {
  return Math.round(n).toLocaleString();
}
