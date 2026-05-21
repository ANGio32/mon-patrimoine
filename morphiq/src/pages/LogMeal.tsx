import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Trash2, ChevronLeft, Sparkles, Clock, Dumbbell, Droplets, Lightbulb, AlertCircle, Loader } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeFoodPhoto, getSportTimingAdvice } from '../utils/gemini';
import { saveMealEntry, generateId, getTodayKey } from '../utils/storage';
import type { MealEntry, MealType, FoodItem, SportTimingAdvice } from '../types';

const TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
];

export default function LogMeal() {
  const { state, refreshToday } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [photo, setPhoto] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [timing, setTiming] = useState<SportTimingAdvice | null>(null);
  const [loadingTiming, setLoadingTiming] = useState(false);
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [pro, setPro] = useState('');
  const [carb, setCarb] = useState('');
  const [fat, setFat] = useState('');

  const hasKey = Boolean(state.profile?.geminiApiKey);
  const totals = {
    cal: items.reduce((s, i) => s + i.calories, 0),
    pro: items.reduce((s, i) => s + i.protein, 0),
    carb: items.reduce((s, i) => s + i.carbs, 0),
    fat: items.reduce((s, i) => s + i.fat, 0),
  };

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPhoto(ev.target?.result as string);
      setAnalyzeError('');
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!photo || !state.profile?.geminiApiKey) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const res = await analyzeFoodPhoto(state.profile.geminiApiKey, photo);
      setItems(res.items);
      setDescription(res.description);
      setMealType(res.mealType);
      fetchTiming(res.totalCalories);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed. Check your API key.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function fetchTiming(calories: number) {
    if (!state.profile?.geminiApiKey) return;
    setLoadingTiming(true);
    try {
      const advice = await getSportTimingAdvice(state.profile.geminiApiKey, calories, state.profile.goal);
      setTiming(advice);
    } catch { /* optional */ }
    finally { setLoadingTiming(false); }
  }

  function addItem() {
    if (!name || !cal) return;
    const newItems = [...items, { name, portionDescription: '1 serving', calories: parseFloat(cal)||0, protein: parseFloat(pro)||0, carbs: parseFloat(carb)||0, fat: parseFloat(fat)||0 }];
    setItems(newItems);
    setName(''); setCal(''); setPro(''); setCarb(''); setFat('');
    if (!timing && state.profile?.geminiApiKey) fetchTiming(newItems.reduce((s, i) => s + i.calories, 0));
  }

  function save() {
    if (items.length === 0) return;
    const now = new Date();
    const meal: MealEntry = {
      id: generateId(),
      date: getTodayKey(),
      time: now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
      mealType,
      description: description || mealType,
      items,
      totalCalories: totals.cal,
      totalProtein: totals.pro,
      totalCarbs: totals.carb,
      totalFat: totals.fat,
      photoDataUrl: photo ?? undefined,
      aiAnalyzed: Boolean(photo && hasKey),
    };
    saveMealEntry(meal);
    refreshToday();
    navigate('/');
  }

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-5">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-white shadow-card border border-border flex items-center justify-center">
          <ChevronLeft size={18} className="text-text" />
        </button>
        <h1 className="text-xl font-black text-text">Log Meal</h1>
      </div>

      {/* Meal type */}
      <div className="px-5 mb-5">
        <div className="flex gap-1.5">
          {TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => setMealType(t.value)}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                mealType === t.value ? 'border-purple bg-purple-bg text-purple' : 'border-border text-muted bg-white'
              }`}
            >
              <span className="text-xl mb-0.5">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Photo area */}
      <div className="px-5 mb-5">
        <div
          onClick={() => fileRef.current?.click()}
          className="relative rounded-3xl border border-border overflow-hidden cursor-pointer bg-white shadow-card"
          style={{ height: photo ? 220 : 110 }}
        >
          {photo ? (
            <img src={photo} alt="meal" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Camera size={24} className="text-muted" />
              <p className="text-dim text-sm">Photo your meal</p>
              <p className="text-muted text-xs">or upload from gallery</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        {photo && hasKey && (
          <button onClick={analyze} disabled={analyzing} className="btn-primary w-full mt-3 flex items-center justify-center gap-2 text-sm">
            {analyzing ? <><Loader size={16} className="animate-spin" /> Analyzing...</> : <><Sparkles size={16} /> Analyze with Gemini AI</>}
          </button>
        )}
        {photo && !hasKey && (
          <div className="mt-3 flex items-center gap-2 text-orange text-xs bg-orange-bg px-4 py-3 rounded-2xl border border-border">
            <AlertCircle size={14} className="flex-shrink-0" />
            Add your Gemini API key in Profile to enable AI analysis
          </div>
        )}
        {analyzeError && <p className="mt-2 text-red-400 text-xs text-center px-2">{analyzeError}</p>}
      </div>

      {/* Items */}
      {items.length > 0 && (
        <div className="px-5 mb-5">
          <p className="text-muted text-xs font-medium uppercase tracking-widest mb-3">Detected items</p>
          <div className="space-y-2 mb-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border shadow-card p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-text text-sm font-medium">{item.name}</p>
                  <p className="text-muted text-xs mt-0.5">{item.portionDescription}</p>
                  <div className="flex gap-3 mt-1.5 text-xs">
                    <span className="text-purple">P {Math.round(item.protein)}g</span>
                    <span className="text-blue">C {Math.round(item.carbs)}g</span>
                    <span className="text-orange">F {Math.round(item.fat)}g</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 flex items-start gap-2">
                  <div>
                    <p className="text-text font-semibold text-sm">{Math.round(item.calories)}</p>
                    <p className="text-muted text-xs">kcal</p>
                  </div>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-muted hover:text-red-400 transition-colors mt-0.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div className="bg-purple-bg rounded-2xl p-4 flex items-center justify-between">
            <div className="flex gap-4 text-xs text-dim">
              <span>P <strong className="text-text">{Math.round(totals.pro)}g</strong></span>
              <span>C <strong className="text-text">{Math.round(totals.carb)}g</strong></span>
              <span>F <strong className="text-text">{Math.round(totals.fat)}g</strong></span>
            </div>
            <span className="text-purple font-black text-lg">{Math.round(totals.cal)} kcal</span>
          </div>
        </div>
      )}

      {/* Add manually */}
      <div className="px-5 mb-5">
        <p className="text-muted text-xs font-medium uppercase tracking-widest mb-3">Add manually</p>
        <div className="bg-white rounded-2xl border border-border shadow-card p-4 space-y-2.5">
          <input className="input-field" placeholder="Food name" value={name} onChange={e => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Calories" value={cal} onChange={e => setCal(e.target.value)} />
            <input className="input-field" type="number" placeholder="Protein (g)" value={pro} onChange={e => setPro(e.target.value)} />
            <input className="input-field" type="number" placeholder="Carbs (g)" value={carb} onChange={e => setCarb(e.target.value)} />
            <input className="input-field" type="number" placeholder="Fat (g)" value={fat} onChange={e => setFat(e.target.value)} />
          </div>
          <button onClick={addItem} disabled={!name || !cal} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm disabled:opacity-30">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Sport timing */}
      {(timing || loadingTiming) && (
        <div className="px-5 mb-5">
          <p className="text-muted text-xs font-medium uppercase tracking-widest mb-3">Sport Timing</p>
          {loadingTiming ? (
            <div className="bg-white rounded-2xl border border-border shadow-card p-4 text-center text-dim text-sm flex items-center justify-center gap-2">
              <Loader size={14} className="animate-spin" /> Generating advice...
            </div>
          ) : timing ? (
            <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              {[
                { icon: <Clock size={15} />, label: 'Before exercise', value: timing.waitBeforeExercise, color: 'text-purple' },
                { icon: <Dumbbell size={15} />, label: 'Workout type', value: timing.exerciseType, color: 'text-purple' },
                { icon: <Clock size={15} />, label: 'Recovery', value: timing.recoveryWindow, color: 'text-orange' },
                { icon: <Droplets size={15} />, label: 'Hydration', value: timing.hydration, color: 'text-blue' },
              ].map((row, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < 3 ? 'border-b border-border' : ''}`}>
                  <span className={`mt-0.5 ${row.color}`}>{row.icon}</span>
                  <div>
                    <p className="text-text text-xs font-medium">{row.label}</p>
                    <p className="text-dim text-xs mt-0.5">{row.value}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-3 bg-purple-bg flex gap-2">
                <Lightbulb size={14} className="text-purple flex-shrink-0 mt-0.5" />
                <p className="text-purple text-xs">{timing.tip}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Description */}
      {items.length > 0 && (
        <div className="px-5 mb-5">
          <input className="input-field" placeholder="Meal description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
        </div>
      )}

      {/* Save */}
      <div className="px-5">
        <button onClick={save} disabled={items.length === 0} className="btn-primary w-full text-sm disabled:opacity-30">
          Save · {Math.round(totals.cal)} kcal
        </button>
      </div>
    </div>
  );
}
