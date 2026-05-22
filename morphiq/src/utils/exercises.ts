// All built-in exercises across every program, deduplicated by name.
// Imported by both Fitness.tsx and ExerciseVideosTab.tsx.

export interface ExerciseDef {
  name: string;
  muscleGroups: string[];
  category: 'cardio' | 'upper' | 'lower' | 'core' | 'full';
}

function cat(groups: string[]): ExerciseDef['category'] {
  const g = groups.join(' ');
  if (g.includes('cardio') && !g.match(/chest|back|shoulder|leg|glute|quad|hamstring|core/)) return 'cardio';
  if (g.match(/chest|tricep|shoulder|bicep|back|pull|push|delt|curl|press|row/)) return 'upper';
  if (g.match(/leg|glute|quad|hamstring|calf|lunge|squat/)) return 'lower';
  if (g.match(/core|ab|oblique|plank/)) return 'core';
  return 'full';
}

const raw: { name: string; muscleGroups: string[] }[] = [
  // ── Cardio / Full body ──────────────────────────────────────────────────────
  { name: 'Jumping Jacks',          muscleGroups: ['cardio'] },
  { name: 'High Knees',             muscleGroups: ['cardio', 'legs'] },
  { name: 'Burpees',                muscleGroups: ['full body', 'cardio'] },
  { name: 'Mountain Climbers',      muscleGroups: ['core', 'cardio'] },
  // ── Upper body ──────────────────────────────────────────────────────────────
  { name: 'Push-Ups',               muscleGroups: ['chest', 'triceps', 'shoulders'] },
  { name: 'Bench Press',            muscleGroups: ['chest', 'triceps'] },
  { name: 'Incline Dumbbell Press', muscleGroups: ['chest upper', 'shoulders'] },
  { name: 'Overhead Press',         muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Lateral Raises',         muscleGroups: ['shoulders lateral'] },
  { name: 'Tricep Dips',            muscleGroups: ['triceps', 'chest'] },
  { name: 'Pull-Ups',               muscleGroups: ['back', 'biceps'] },
  { name: 'Barbell Row',            muscleGroups: ['back', 'rear delts'] },
  { name: 'Seated Cable Row',       muscleGroups: ['back middle'] },
  { name: 'Barbell Curl',           muscleGroups: ['biceps'] },
  { name: 'Hammer Curl',            muscleGroups: ['biceps', 'forearms'] },
  // ── Lower body ──────────────────────────────────────────────────────────────
  { name: 'Bodyweight Squats',      muscleGroups: ['legs', 'glutes'] },
  { name: 'Barbell Squat',          muscleGroups: ['quads', 'glutes'] },
  { name: 'Romanian Deadlift',      muscleGroups: ['hamstrings', 'glutes'] },
  { name: 'Leg Press',              muscleGroups: ['quads', 'glutes'] },
  { name: 'Walking Lunges',         muscleGroups: ['legs', 'balance'] },
  { name: 'Lateral Lunges',         muscleGroups: ['legs', 'glutes'] },
  { name: 'Calf Raises',            muscleGroups: ['calves'] },
  // ── Core ────────────────────────────────────────────────────────────────────
  { name: 'Plank',                  muscleGroups: ['core', 'shoulders'] },
  { name: 'Bicycle Crunches',       muscleGroups: ['core', 'obliques'] },
];

// deduplicate by name
const seen = new Set<string>();
export const ALL_EXERCISES: ExerciseDef[] = raw
  .filter(e => { if (seen.has(e.name)) return false; seen.add(e.name); return true; })
  .map(e => ({ ...e, category: cat(e.muscleGroups) }));

export const CATEGORY_LABELS: Record<ExerciseDef['category'], string> = {
  cardio: 'Cardio',
  upper:  'Haut du corps',
  lower:  'Bas du corps',
  core:   'Abdos / Core',
  full:   'Corps entier',
};

export const CATEGORY_ORDER: ExerciseDef['category'][] = ['cardio', 'full', 'upper', 'lower', 'core'];
