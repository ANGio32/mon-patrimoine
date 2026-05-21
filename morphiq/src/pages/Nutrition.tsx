import { useState } from 'react';
import { Sparkles, ChefHat, BookOpen, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMealSuggestions } from '../utils/gemini';
import { calculateTargets } from '../utils/calculations';
import type { MealType } from '../types';

const RECIPES = [
  {
    name: 'High-Protein Oatmeal',
    cal: 420, protein: 32, carbs: 48, fat: 8,
    tags: ['build_muscle', 'maintain'],
    emoji: '🥣',
    steps: ['Cook 80g oats in water', 'Add 1 scoop whey protein', 'Top with banana & almonds'],
  },
  {
    name: 'Grilled Chicken & Veggies',
    cal: 380, protein: 45, carbs: 22, fat: 10,
    tags: ['lose_weight', 'build_muscle', 'maintain'],
    emoji: '🍗',
    steps: ['Season 200g chicken breast', 'Grill 15 min each side', 'Serve with roasted broccoli & peppers'],
  },
  {
    name: 'Salmon & Sweet Potato',
    cal: 520, protein: 38, carbs: 45, fat: 16,
    tags: ['build_muscle', 'maintain'],
    emoji: '🐟',
    steps: ['Season 180g salmon fillet', 'Bake at 200°C for 18 min', 'Serve with 200g roasted sweet potato'],
  },
  {
    name: 'Greek Yogurt Bowl',
    cal: 280, protein: 22, carbs: 28, fat: 6,
    tags: ['lose_weight', 'maintain'],
    emoji: '🍯',
    steps: ['250g Greek yogurt (2%)', 'Add mixed berries', 'Drizzle 1 tsp honey, add granola'],
  },
  {
    name: 'Egg White Omelette',
    cal: 220, protein: 28, carbs: 8, fat: 7,
    tags: ['lose_weight'],
    emoji: '🍳',
    steps: ['Whisk 5 egg whites', 'Add spinach, tomatoes, peppers', 'Cook 5 min on medium heat'],
  },
  {
    name: 'Quinoa Power Bowl',
    cal: 460, protein: 24, carbs: 55, fat: 14,
    tags: ['build_muscle', 'maintain'],
    emoji: '🥗',
    steps: ['Cook 100g quinoa', 'Top with chickpeas, avocado', 'Add lemon tahini dressing'],
  },
];

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function Nutrition() {
  const { state } = useApp();
  const [tab, setTab] = useState<'recipes' | 'ai'>('recipes');
  const [aiMealType, setAiMealType] = useState<MealType>('lunch');
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState<number | null>(null);

  const goal = state.profile?.goal ?? 'maintain';
  const targets = state.profile ? calculateTargets(state.profile) : null;
  const consumed = state.todayLog.meals.reduce((s, m) => s + m.totalCalories, 0);
  const remaining = targets ? targets.calories - consumed : 0;

  const filtered = RECIPES.filter((r) => r.tags.includes(goal));

  async function getSuggestions() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    setAiResult('');
    try {
      const text = await getMealSuggestions(
        state.profile.geminiApiKey,
        goal,
        remaining,
        aiMealType
      );
      setAiResult(text);
    } catch (e) {
      setAiResult('Failed to get suggestions. Check your API key in Profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-scroll pb-28">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Nutrition</h1>
        <p className="text-muted text-sm mt-1">{remaining > 0 ? `${Math.round(remaining)} kcal remaining today` : 'Daily goal reached!'}</p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex bg-card border border-border rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('recipes')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'recipes' ? 'bg-primary text-white' : 'text-muted'
            }`}
          >
            <BookOpen size={16} /> Recipes
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'ai' ? 'bg-primary text-white' : 'text-muted'
            }`}
          >
            <Sparkles size={16} /> AI Suggestions
          </button>
        </div>
      </div>

      {tab === 'recipes' && (
        <div className="px-5 space-y-3">
          <p className="text-muted text-xs uppercase tracking-wider font-medium">Tailored for your goal</p>
          {filtered.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedRecipe(expandedRecipe === i ? null : i)}
                className="w-full flex items-center gap-4 p-4"
              >
                <span className="text-3xl">{r.emoji}</span>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-semibold">{r.name}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    <span className="text-accent font-medium">{r.cal} kcal</span>
                    <span>P {r.protein}g</span>
                    <span>C {r.carbs}g</span>
                    <span>F {r.fat}g</span>
                  </div>
                </div>
                <ChefHat size={18} className="text-muted flex-shrink-0" />
              </button>
              {expandedRecipe === i && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-muted text-xs uppercase tracking-wider font-medium mt-3 mb-2">How to make it</p>
                  <ol className="space-y-2">
                    {r.steps.map((step, si) => (
                      <li key={si} className="flex gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {si + 1}
                        </span>
                        <span className="text-muted">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && (
        <div className="px-5">
          {!state.profile?.geminiApiKey ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Sparkles size={36} className="text-primary mx-auto mb-3" />
              <p className="text-white font-medium mb-1">AI Suggestions require Gemini</p>
              <p className="text-muted text-sm">Add your free API key in Profile to unlock AI-powered meal suggestions.</p>
            </div>
          ) : (
            <>
              <p className="text-muted text-sm mb-4">
                Get personalized meal ideas for your goal with {remaining > 0 ? `${Math.round(remaining)} kcal` : 'maintenance'} in mind.
              </p>
              <div className="flex gap-2 mb-4 flex-wrap">
                {MEAL_TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAiMealType(t.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                      aiMealType === t.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button onClick={getSuggestions} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2">
                {loading ? <><Loader size={18} className="animate-spin" /> Thinking...</> : <><Sparkles size={18} /> Get Suggestions</>}
              </button>
              {aiResult && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
