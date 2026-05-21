import type { FoodItem, MealType, SportTimingAdvice, Goal, Equipment, AiProgramSession, DailyLog } from '../types';

interface GeminiFoodResult {
  mealType: MealType;
  description: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  qualityScore: number;
  healthNotes: string;
}

// Gemini 2.5 Flash for all calls (supports images + text, 5 RPM free)
const MODEL = 'gemini-2.5-flash';

const FOOD_ANALYSIS_PROMPT = `Analyze this food image and return ONLY a raw JSON object. No markdown, no code blocks, no explanation, no thinking — ONLY the JSON object:
{"mealType":"breakfast|lunch|dinner|snack","description":"brief meal description","items":[{"name":"food name","portionDescription":"e.g. 1 cup, 200g","calories":0,"protein":0,"carbs":0,"fat":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFat":0,"qualityScore":7,"healthNotes":"brief nutritional insight"}`;

// Extract JSON object robustly from model output (handles thinking tokens, markdown, extra text)
function extractJSON(raw: string): string {
  // Find first { and last } to extract the JSON object
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return raw.slice(start, end + 1);
  }
  return raw.trim();
}

// Collect only non-thinking text parts from Gemini response
interface GeminiPart { text?: string; thought?: boolean }
interface GeminiResponse {
  candidates: Array<{ content: { parts: GeminiPart[] } }>;
  error?: { message?: string };
}

async function callGemini(
  apiKey: string,
  contents: unknown[],
  maxTokens = 4096,
  temperature = 0.1
): Promise<string> {
  // Always disable thinking: faster, no token waste, clean output
  const generationConfig: Record<string, unknown> = {
    temperature,
    maxOutputTokens: maxTokens,
    thinkingConfig: { thinkingBudget: 0 },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    }
  );

  const data = await response.json() as GeminiResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `API error ${response.status}`);
  }

  // Filter out thinking parts, keep only actual response text
  const parts = data.candidates[0]?.content?.parts ?? [];
  const textParts = parts.filter(p => !p.thought && p.text).map(p => p.text ?? '');
  return textParts.join('').trim();
}

export async function analyzeFoodPhoto(
  apiKey: string,
  imageDataUrl: string
): Promise<GeminiFoodResult> {
  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const raw = await callGemini(
    apiKey,
    [{ parts: [{ text: FOOD_ANALYSIS_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
    2048,
    0.1
  );

  const json = extractJSON(raw);
  return JSON.parse(json) as GeminiFoodResult;
}

export async function getSportTimingAdvice(
  apiKey: string,
  mealCalories: number,
  goal: Goal
): Promise<SportTimingAdvice> {
  const prompt = `Given a meal of ${mealCalories} calories and a fitness goal of "${goal.replace('_', ' ')}", provide sport timing advice. Return ONLY a raw JSON object (no markdown, no explanation):
{"waitBeforeExercise":"e.g. Wait 1.5 hours","exerciseType":"e.g. Cardio or strength training recommended","recoveryWindow":"e.g. Eat protein within 45 min after workout","hydration":"e.g. Drink 500ml water before exercising","tip":"one personalized tip"}`;

  const raw = await callGemini(apiKey, [{ parts: [{ text: prompt }] }], 1024, 0.3);
  return JSON.parse(extractJSON(raw)) as SportTimingAdvice;
}

export async function getMealSuggestions(
  apiKey: string,
  goal: Goal,
  remainingCalories: number,
  mealType: MealType
): Promise<string> {
  const prompt = `Suggest 3 ${mealType} ideas for someone with a "${goal.replace('_', ' ')}" goal who has ${remainingCalories} calories remaining today. Be concise, practical, include rough calorie counts. Format as a numbered list.`;

  return callGemini(apiKey, [{ parts: [{ text: prompt }] }], 1024, 0.7);
}

export async function getWorkoutPlan(
  apiKey: string,
  goal: Goal,
  daysPerWeek: number
): Promise<string> {
  const prompt = `Create a ${daysPerWeek}-day/week workout plan for someone wanting to "${goal.replace('_', ' ')}". Include exercise names, sets, reps, and rest times. Be specific and practical. Format clearly.`;

  return callGemini(apiKey, [{ parts: [{ text: prompt }] }], 2048, 0.5);
}

export interface GeneratedRecipe {
  name: string;
  emoji: string;
  description: string;
  prepMin: number;
  cookMin: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  tips: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
}

export async function generateRecipeFromIngredients(
  apiKey: string,
  ingredients: string,
  goal: Goal
): Promise<GeneratedRecipe> {
  const prompt = `You are a nutritionist chef. Create one healthy recipe using these available ingredients: "${ingredients}". Goal: "${goal.replace('_', ' ')}".

Return ONLY a raw JSON object (no markdown):
{"name":"Recipe Name","emoji":"🍳","description":"brief description","prepMin":10,"cookMin":20,"servings":2,"ingredients":["200g ingredient","etc"],"steps":["Step 1","Step 2"],"tips":"one helpful tip","macros":{"calories":400,"protein":30,"carbs":35,"fat":12}}`;

  const raw = await callGemini(apiKey, [{ parts: [{ text: prompt }] }], 2048, 0.5);
  return JSON.parse(extractJSON(raw)) as GeneratedRecipe;
}

export interface MenuDish {
  name: string;
  description: string;
  estimatedCalories: number;
  estimatedProtein: number;
  estimatedCarbs: number;
  estimatedFat: number;
  recommendation: 'best' | 'good' | 'avoid';
  recommendationReason: string;
}

export interface MenuAnalysis {
  restaurantType: string;
  dishes: MenuDish[];
  topPicks: string[];
  generalTip: string;
}

export async function analyzeRestaurantMenu(
  apiKey: string,
  imageDataUrl: string,
  goal: Goal,
  targets: { calories: number; protein: number; carbs: number; fat: number }
): Promise<MenuAnalysis> {
  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const prompt = `You are a nutrition expert. Analyze this restaurant menu photo. The user's goal is "${goal.replace('_', ' ')}" with daily targets: ${targets.calories} kcal, ${targets.protein}g protein, ${targets.carbs}g carbs, ${targets.fat}g fat.

Identify every visible dish/item on the menu, estimate nutritional values, and recommend the best options for the user's goal.

Return ONLY a raw JSON object (no markdown, no explanation):
{"restaurantType":"e.g. French bistro, Italian, Sushi","dishes":[{"name":"dish name","description":"brief description of ingredients","estimatedCalories":450,"estimatedProtein":35,"estimatedCarbs":30,"estimatedFat":15,"recommendation":"best|good|avoid","recommendationReason":"short reason e.g. High protein, fits goal"}],"topPicks":["Dish Name 1","Dish Name 2"],"generalTip":"one practical tip for eating here aligned with the goal"}

Rules:
- recommendation "best": excellent for the goal (high protein, right calories, good macros)
- recommendation "good": acceptable, minor adjustments needed
- recommendation "avoid": high calories, poor macros for goal
- Estimate macros realistically based on typical restaurant portions
- topPicks: exactly 2-3 dish names from the "best" category`;

  const raw = await callGemini(
    apiKey,
    [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
    3000,
    0.1
  );

  return JSON.parse(extractJSON(raw)) as MenuAnalysis;
}

export async function getAdaptedSession(
  apiKey: string,
  sessionName: string,
  energyLevel: number, // 1 (exhausted) to 5 (full energy)
  originalExercises: string[]
): Promise<AiProgramSession> {
  const intensity = energyLevel <= 2 ? 'gentle recovery and mobility (no cardio, no weights, only stretching, foam rolling, breathing, light yoga)'
    : 'light active recovery (bodyweight only, low intensity, gentle cardio like walking, light stretching)';

  const prompt = `The user planned "${sessionName}" but their energy level is ${energyLevel}/5 today. Adapt it to ${intensity}.

Original exercises were: ${originalExercises.join(', ')}.

Return ONLY a raw JSON object:
{"name":"Recovery - ${sessionName}","durationMin":25,"exercises":[{"name":"exercise name","sets":2,"durationSec":45,"restSec":30,"muscleGroups":["mobility"]}]}

Rules: 4-6 gentle exercises, max 30 min, no heavy compound lifts, focus on recovery`;

  const raw = await callGemini(apiKey, [{ parts: [{ text: prompt }] }], 1024, 0.4);
  const parsed = JSON.parse(extractJSON(raw)) as RawAiSession;
  return {
    name: parsed.name ?? `Récupération — ${sessionName}`,
    durationMin: parsed.durationMin ?? 25,
    exercises: (parsed.exercises ?? []).map(e => ({
      name: e.name ?? 'Stretching',
      sets: e.sets ?? 2,
      reps: e.reps,
      durationSec: e.durationSec,
      restSec: e.restSec ?? 30,
      muscleGroups: e.muscleGroups ?? ['mobility'],
    })),
  };
}

export interface WeeklyChallengeResult {
  title: string;
  description: string;
  targetDays: number;
  emoji: string;
  reward: string;
}

export async function generateWeeklyChallenge(
  apiKey: string,
  goal: Goal,
  logs: DailyLog[]
): Promise<WeeklyChallengeResult> {
  const daysLogged = logs.filter(l => l.meals.length > 0).length;
  const avg = (fn: (l: DailyLog) => number) => {
    const active = logs.filter(l => l.meals.length > 0);
    if (!active.length) return 0;
    return Math.round(active.reduce((s, l) => s + fn(l), 0) / active.length);
  };
  const avgCal = avg(l => l.meals.reduce((s, m) => s + m.totalCalories, 0));
  const avgPro = avg(l => l.meals.reduce((s, m) => s + m.totalProtein, 0));
  const avgCarb = avg(l => l.meals.reduce((s, m) => s + m.totalCarbs, 0));
  const avgFat = avg(l => l.meals.reduce((s, m) => s + m.totalFat, 0));
  const avgMeals = avg(l => l.meals.length);

  const prompt = `Fitness coach analyzing 7-day nutrition log. Goal: "${goal.replace('_', ' ')}".
Stats (days logged: ${daysLogged}/7): avg ${avgCal} kcal/day, ${avgPro}g protein, ${avgCarb}g carbs, ${avgFat}g fat, ${avgMeals} meals/day.

Identify ONE recurring weakness (low protein, too few meals, excess calories at night, etc.) and create a motivating 7-day challenge.

Return ONLY a raw JSON object (no markdown):
{"title":"Challenge title (max 5 words)","description":"2 sentences: what to do and why it helps","targetDays":3,"emoji":"🎯","reward":"Recette Secrète : Smoothie Bol Protéiné"}

Rules: targetDays must be 3-5, reward must start with "Recette Secrète : " followed by a creative French recipe name, title must be specific and motivating`;

  const raw = await callGemini(apiKey, [{ parts: [{ text: prompt }] }], 512, 0.6);
  return JSON.parse(extractJSON(raw)) as WeeklyChallengeResult;
}

interface RawAiSession {
  name?: string;
  durationMin?: number;
  exercises?: Array<{
    name?: string;
    sets?: number;
    reps?: number;
    durationSec?: number;
    restSec?: number;
    muscleGroups?: string[];
  }>;
}

export async function generateStructuredProgram(
  apiKey: string,
  request: string,
  equipment: Equipment,
  daysPerWeek: number
): Promise<{ programName: string; sessions: AiProgramSession[] }> {
  const equipmentText = equipment === 'gym' ? 'gym with full equipment (barbells, dumbbells, machines, cables)'
    : equipment === 'home' ? 'home only (bodyweight, optional dumbbells/resistance bands) and outdoor running'
    : 'both gym and home/outdoor (mix gym sessions, home bodyweight, and outdoor runs)';

  const prompt = `You are an expert fitness coach. The user request: "${request}". Equipment: ${equipmentText}. Create a ${daysPerWeek}-session workout program.

Return ONLY a raw JSON object (no markdown, no explanation):
{"programName":"descriptive program name","sessions":[{"name":"e.g. Day 1 - Gym Upper Body","durationMin":45,"exercises":[{"name":"exercise name","sets":3,"reps":10,"restSec":60,"muscleGroups":["chest"]},{"name":"timed exercise","sets":3,"durationSec":30,"restSec":30,"muscleGroups":["cardio"]}]}]}

Rules:
- ${daysPerWeek} sessions total
- Mix location in session names: "Gym - ...", "Home - ...", "Outdoor Run", etc.
- 4-6 exercises per session
- Use "reps" OR "durationSec" per exercise (not both)
- Use real exercise names (Barbell Squat, Push-Ups, Jogging, Box Jumps, etc.)
- restSec: 30-120 seconds, durationMin: 30-60`;

  const raw = await callGemini(apiKey, [{ parts: [{ text: prompt }] }], 4096, 0.4);
  const parsed = JSON.parse(extractJSON(raw)) as { programName?: string; sessions?: RawAiSession[] };

  const sessions: AiProgramSession[] = (parsed.sessions ?? []).map((s: RawAiSession) => ({
    name: s.name ?? 'Session',
    durationMin: s.durationMin ?? 45,
    exercises: (s.exercises ?? []).map(e => ({
      name: e.name ?? 'Exercise',
      sets: e.sets ?? 3,
      reps: e.reps,
      durationSec: e.durationSec,
      restSec: e.restSec ?? 60,
      muscleGroups: e.muscleGroups ?? [],
    })),
  }));

  return { programName: parsed.programName ?? 'AI Program', sessions };
}
