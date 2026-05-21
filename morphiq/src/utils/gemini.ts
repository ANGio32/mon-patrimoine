import type { FoodItem, MealType, SportTimingAdvice, Goal } from '../types';

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

const FOOD_ANALYSIS_PROMPT = `Analyze this food image. Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "mealType": "breakfast|lunch|dinner|snack",
  "description": "brief meal description",
  "items": [
    {
      "name": "food name",
      "portionDescription": "e.g. 1 cup, 200g",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fat": 0
    }
  ],
  "totalCalories": 0,
  "totalProtein": 0,
  "totalCarbs": 0,
  "totalFat": 0,
  "qualityScore": 7,
  "healthNotes": "brief nutritional insight"
}`;

export async function analyzeFoodPhoto(
  apiKey: string,
  imageDataUrl: string
): Promise<GeminiFoodResult> {
  const base64 = imageDataUrl.split(',')[1];
  const mimeType = imageDataUrl.split(';')[0].split(':')[1];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: FOOD_ANALYSIS_PROMPT },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${response.status}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const text = data.candidates[0]?.content?.parts[0]?.text ?? '';
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean) as GeminiFoodResult;
}

export async function getSportTimingAdvice(
  apiKey: string,
  mealCalories: number,
  goal: Goal
): Promise<SportTimingAdvice> {
  const prompt = `Given a meal of ${mealCalories} calories and a fitness goal of "${goal.replace('_', ' ')}", provide sport timing advice. Return ONLY valid JSON:
{
  "waitBeforeExercise": "e.g. Wait 1.5 hours",
  "exerciseType": "e.g. Cardio or strength training recommended",
  "recoveryWindow": "e.g. Eat protein within 45 min after workout",
  "hydration": "e.g. Drink 500ml water before exercising",
  "tip": "one personalized tip"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  const text = data.candidates[0]?.content?.parts[0]?.text ?? '';
  const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean) as SportTimingAdvice;
}

export async function getMealSuggestions(
  apiKey: string,
  goal: Goal,
  remainingCalories: number,
  mealType: MealType
): Promise<string> {
  const prompt = `Suggest 3 ${mealType} ideas for someone with a "${goal.replace('_', ' ')}" goal who has ${remainingCalories} calories remaining today. Be concise, practical, and include rough calorie counts. Format as a numbered list.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text ?? '';
}

export async function getWorkoutPlan(
  apiKey: string,
  goal: Goal,
  daysPerWeek: number
): Promise<string> {
  const prompt = `Create a ${daysPerWeek}-day/week workout plan for someone wanting to "${goal.replace('_', ' ')}". Include exercise names, sets, reps, and rest times. Be specific and practical. Format clearly.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) throw new Error(`API error ${response.status}`);

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts[0]?.text ?? '';
}
