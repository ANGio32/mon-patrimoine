import type { FoodItem, MealType, SportTimingAdvice, Goal, Equipment, AiProgramSession } from '../types';

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
