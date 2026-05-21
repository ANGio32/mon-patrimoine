import { useState } from 'react';
import { Sparkles, Loader, Clock, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getMealSuggestions } from '../utils/gemini';
import { calculateTargets } from '../utils/calculations';
import type { MealType } from '../types';

interface Recipe {
  name: string;
  emoji: string;
  time: number;
  servings: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
  tips?: string;
}

const RECIPES: Recipe[] = [
  {
    name: 'Overnight Oats with Berries',
    emoji: '🫙', time: 10, servings: 1,
    cal: 420, protein: 20, carbs: 58, fat: 10,
    tags: ['breakfast', 'lose_weight', 'maintain', 'build_muscle'],
    ingredients: ['80g rolled oats', '200ml unsweetened almond milk', '1 scoop vanilla protein powder (optional)', '100g mixed berries (fresh or frozen)', '1 tbsp chia seeds', '1 tsp honey', 'Pinch of cinnamon'],
    steps: ['Combine oats, almond milk, chia seeds, and cinnamon in a jar or bowl.', 'Stir in protein powder if using.', 'Cover and refrigerate overnight (minimum 4 hours).', 'In the morning, top with berries and drizzle with honey.', 'Stir before eating and adjust thickness with a splash of milk.'],
    tips: 'Prep 3 jars on Sunday for the whole week. Add a tablespoon of nut butter for extra protein and satiety.',
  },
  {
    name: 'Grilled Chicken Power Bowl',
    emoji: '🥗', time: 25, servings: 1,
    cal: 510, protein: 48, carbs: 38, fat: 14,
    tags: ['lunch', 'dinner', 'build_muscle', 'maintain', 'lose_weight'],
    ingredients: ['200g chicken breast', '100g cooked quinoa', '80g baby spinach', '½ avocado, sliced', '100g cherry tomatoes, halved', '½ cucumber, diced', '2 tbsp olive oil', 'Juice of 1 lemon', '1 clove garlic, minced', 'Salt, pepper, paprika'],
    steps: ['Season chicken with salt, pepper, and paprika. Let rest 5 minutes.', 'Heat a grill pan over high heat. Cook chicken 6–7 min each side until cooked through. Rest 5 min, then slice.', 'While chicken rests, cook quinoa per packet instructions if not pre-cooked.', 'Whisk olive oil, lemon juice, and garlic for the dressing. Season to taste.', 'Assemble bowl: quinoa base, spinach, tomatoes, cucumber, avocado, chicken.', 'Drizzle dressing over everything and serve immediately.'],
    tips: 'Marinate chicken in lemon juice and garlic for 30 min ahead for extra flavour.',
  },
  {
    name: 'Baked Salmon & Sweet Potato',
    emoji: '🐟', time: 30, servings: 1,
    cal: 540, protein: 40, carbs: 42, fat: 18,
    tags: ['dinner', 'build_muscle', 'maintain'],
    ingredients: ['180g salmon fillet', '250g sweet potato, cubed', '200g tenderstem broccoli', '2 tbsp olive oil', '1 tbsp soy sauce (low sodium)', '1 tsp sesame oil', '1 tsp honey', '1 tsp grated ginger', '1 clove garlic, minced', 'Salt and pepper'],
    steps: ['Preheat oven to 200°C / 400°F.', 'Toss sweet potato cubes in 1 tbsp olive oil, salt, and pepper. Roast 15 min.', 'Mix soy sauce, sesame oil, honey, ginger, and garlic for the glaze.', 'After 15 min, add broccoli to the tray. Brush salmon with glaze.', 'Place salmon on a lined baking sheet. Bake everything 12–15 min until salmon flakes easily.', 'Serve salmon over sweet potato and broccoli. Drizzle remaining glaze.'],
    tips: 'Don\'t overcook the salmon — it should be slightly opaque in the very center for best texture.',
  },
  {
    name: 'Greek Yogurt Parfait',
    emoji: '🍯', time: 8, servings: 1,
    cal: 320, protein: 24, carbs: 35, fat: 7,
    tags: ['breakfast', 'snack', 'lose_weight', 'maintain'],
    ingredients: ['200g Greek yogurt (2% fat)', '80g granola (low sugar)', '100g mixed berries', '1 tbsp honey', '1 tbsp flaxseeds', '½ tsp vanilla extract'],
    steps: ['Mix vanilla extract into Greek yogurt.', 'In a glass or bowl, layer half the yogurt.', 'Add half the granola, then half the berries.', 'Repeat layers with remaining yogurt, granola, and berries.', 'Drizzle honey over the top and sprinkle flaxseeds.', 'Serve immediately to keep granola crunchy, or refrigerate up to 2 hours.'],
    tips: 'For a higher protein version, add a scoop of unflavoured protein powder to the yogurt.',
  },
  {
    name: 'Egg White Veggie Omelette',
    emoji: '🍳', time: 12, servings: 1,
    cal: 230, protein: 30, carbs: 9, fat: 8,
    tags: ['breakfast', 'lunch', 'lose_weight'],
    ingredients: ['5 egg whites (or 150ml carton egg whites)', '60g baby spinach', '½ red pepper, diced', '6 cherry tomatoes, halved', '40g feta cheese, crumbled', '1 tsp olive oil', 'Salt, pepper, dried oregano'],
    steps: ['Whisk egg whites with a pinch of salt and pepper until slightly frothy.', 'Heat olive oil in a non-stick pan over medium heat.', 'Sauté pepper 2 min until softened. Add spinach and cook 1 min until wilted.', 'Add tomatoes, stir briefly, then pour egg whites over vegetables.', 'Cook undisturbed 2–3 min until edges set. Scatter feta on top.', 'Fold omelette in half, cook 1 more minute, and slide onto a plate.'],
    tips: 'Room-temperature egg whites create a fluffier omelette than cold ones.',
  },
  {
    name: 'Quinoa & Chickpea Power Bowl',
    emoji: '🌾', time: 20, servings: 2,
    cal: 460, protein: 22, carbs: 58, fat: 14,
    tags: ['lunch', 'dinner', 'maintain', 'build_muscle'],
    ingredients: ['150g quinoa (dry)', '1 can (400g) chickpeas, drained', '2 tbsp olive oil', '1 tsp cumin', '1 tsp smoked paprika', '200g cucumber, diced', '200g cherry tomatoes', '60g feta, crumbled', '2 tbsp tahini', 'Juice of 1 lemon', '1 clove garlic, minced', 'Fresh parsley'],
    steps: ['Rinse quinoa and cook in 300ml salted water (18 min, then rest 5 min covered).', 'Pat chickpeas dry. Toss with 1 tbsp oil, cumin, paprika, salt. Roast at 200°C for 20 min until crispy.', 'Whisk tahini, lemon juice, garlic, 2 tbsp water, and a pinch of salt for the dressing.', 'Fluff quinoa with a fork. Divide into bowls.', 'Top with chickpeas, cucumber, tomatoes, and feta.', 'Drizzle tahini dressing generously. Garnish with parsley.'],
    tips: 'Roasted chickpeas stay crispy for 2 days at room temp — make a double batch!',
  },
  {
    name: 'Turkey & Veggie Stir-Fry',
    emoji: '🥢', time: 20, servings: 2,
    cal: 390, protein: 42, carbs: 28, fat: 11,
    tags: ['lunch', 'dinner', 'lose_weight', 'build_muscle'],
    ingredients: ['350g lean ground turkey', '1 red pepper, sliced', '1 yellow pepper, sliced', '200g snap peas', '3 cloves garlic, minced', '1 tbsp fresh ginger, grated', '3 tbsp soy sauce (low sodium)', '1 tbsp oyster sauce', '1 tsp sesame oil', '1 tbsp coconut oil', 'Sesame seeds, spring onion to serve'],
    steps: ['Heat coconut oil in a wok or large pan over high heat.', 'Cook turkey, breaking it up, until browned (5–6 min). Set aside.', 'Add peppers and snap peas to the same pan. Stir-fry 3–4 min until tender-crisp.', 'Push veg to sides, add garlic and ginger to the center. Fry 30 sec.', 'Return turkey to pan. Add soy sauce, oyster sauce, sesame oil. Toss 2 min.', 'Serve over rice or cauliflower rice. Top with sesame seeds and spring onion.'],
    tips: 'Very high heat is key for stir-fry — don\'t crowd the pan or it will steam instead of fry.',
  },
  {
    name: 'Avocado Protein Toast',
    emoji: '🥑', time: 10, servings: 1,
    cal: 380, protein: 18, carbs: 32, fat: 20,
    tags: ['breakfast', 'snack', 'maintain', 'build_muscle'],
    ingredients: ['2 slices whole grain sourdough', '1 ripe avocado', '2 eggs', '40g cottage cheese', 'Juice of ½ lemon', 'Chilli flakes, salt, black pepper', 'Microgreens or fresh rocket to serve'],
    steps: ['Toast the sourdough slices to your liking.', 'Mash avocado with lemon juice, salt, and pepper until slightly chunky.', 'Poach or fry eggs to your preference (2–3 min poached, 4 min fried).', 'Spread cottage cheese on toast, then top with avocado mash.', 'Add egg on top of each slice.', 'Finish with chilli flakes, black pepper, and microgreens.'],
    tips: 'Add a sprinkle of hemp seeds for an extra 5g protein boost.',
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
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const goal = state.profile?.goal ?? 'maintain';
  const targets = state.profile ? calculateTargets(state.profile) : null;
  const consumed = state.todayLog.meals.reduce((s, m) => s + m.totalCalories, 0);
  const remaining = targets ? targets.calories - consumed : 0;

  const filtered = RECIPES.filter(r =>
    (filter === 'all' || r.tags.includes(filter)) &&
    r.tags.includes(goal)
  );

  const mealFilters = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

  async function getSuggestions() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    setAiResult('');
    try {
      const text = await getMealSuggestions(state.profile.geminiApiKey, goal, remaining, aiMealType);
      setAiResult(text);
    } catch { setAiResult('Failed. Check your API key in Profile.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="page bg-bg">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-text tracking-tight">Nutrition</h1>
        <p className="text-dim text-sm mt-1">
          {remaining > 0 ? `${Math.round(remaining)} kcal remaining` : '🎯 Daily goal reached!'}
        </p>
      </div>

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex bg-card shadow-card border border-border rounded-2xl p-1 gap-1">
          <button onClick={() => setTab('recipes')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === 'recipes' ? 'bg-green text-white' : 'text-muted'}`}>
            Recipes
          </button>
          <button onClick={() => setTab('ai')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'ai' ? 'bg-green text-white' : 'text-muted'}`}>
            <Sparkles size={14} /> AI Suggestions
          </button>
        </div>
      </div>

      {tab === 'recipes' && (
        <>
          {/* Meal type filter */}
          <div className="px-5 mb-5">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-0">
              {mealFilters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl border text-xs font-medium capitalize transition-all ${
                    filter === f ? 'border-green bg-green-bg text-green-dark' : 'border-border text-muted bg-card'
                  }`}
                >{f === 'all' ? 'All' : f}</button>
              ))}
            </div>
          </div>

          <div className="px-5 space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted text-sm">No recipes found for this filter.</div>
            )}
            {filtered.map((r, i) => (
              <div key={i} className="bg-card shadow-card border border-border rounded-3xl overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)} className="w-full text-left p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text font-bold leading-tight">{r.name}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                        <span className="flex items-center gap-1"><Clock size={11} /> {r.time}m</span>
                        <span className="flex items-center gap-1"><Users size={11} /> {r.servings}</span>
                      </div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span className="text-orange font-semibold">{r.cal} kcal</span>
                        <span className="text-green">P {r.protein}g</span>
                        <span className="text-blue">C {r.carbs}g</span>
                        <span className="text-dim">F {r.fat}g</span>
                      </div>
                    </div>
                    {expanded === i ? <ChevronUp size={18} className="text-muted flex-shrink-0 mt-1" /> : <ChevronDown size={18} className="text-muted flex-shrink-0 mt-1" />}
                  </div>
                </button>

                {expanded === i && (
                  <div className="border-t border-border">
                    {/* Ingredients */}
                    <div className="px-5 pt-4 pb-3">
                      <p className="text-muted text-xs font-medium uppercase tracking-widest mb-3">Ingredients</p>
                      <ul className="space-y-1.5">
                        {r.ingredients.map((ing, ii) => (
                          <li key={ii} className="flex items-start gap-2 text-sm">
                            <span className="text-green mt-0.5 flex-shrink-0">·</span>
                            <span className="text-dim">{ing}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Steps */}
                    <div className="px-5 pb-4 border-t border-border pt-4">
                      <p className="text-muted text-xs font-medium uppercase tracking-widest mb-3">How to make it</p>
                      <ol className="space-y-3">
                        {r.steps.map((step, si) => (
                          <li key={si} className="flex gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-green-bg text-green-dark text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{si + 1}</span>
                            <span className="text-dim leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Tips */}
                    {r.tips && (
                      <div className="mx-5 mb-4 bg-green-bg border border-border rounded-2xl p-3">
                        <p className="text-green-dark text-xs leading-relaxed">💡 {r.tips}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'ai' && (
        <div className="px-5">
          {!state.profile?.geminiApiKey ? (
            <div className="bg-card shadow-card border border-border rounded-2xl p-6 text-center">
              <Sparkles size={32} className="text-green mx-auto mb-3" />
              <p className="text-text font-medium mb-1 text-sm">Requires Gemini API key</p>
              <p className="text-muted text-xs">Add it in Profile — it's free.</p>
            </div>
          ) : (
            <>
              <p className="text-dim text-sm mb-5">Get personalized meal ideas based on your goal and remaining calories.</p>
              <div className="flex gap-2 mb-5 flex-wrap">
                {MEAL_TYPE_OPTIONS.map(t => (
                  <button key={t.value} onClick={() => setAiMealType(t.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${aiMealType === t.value ? 'border-green bg-green-bg text-green-dark' : 'border-border text-muted bg-card'}`}
                  >{t.label}</button>
                ))}
              </div>
              <button onClick={getSuggestions} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2 text-sm">
                {loading ? <><Loader size={16} className="animate-spin" /> Thinking...</> : <><Sparkles size={16} /> Get Suggestions</>}
              </button>
              {aiResult && (
                <div className="bg-card shadow-card border border-border rounded-2xl p-4">
                  <p className="text-dim text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
