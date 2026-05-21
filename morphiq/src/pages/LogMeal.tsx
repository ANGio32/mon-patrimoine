import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Plus, Trash2, ChevronLeft, Sparkles, Clock, Dumbbell, Droplets, Lightbulb, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeFoodPhoto, getSportTimingAdvice } from '../utils/gemini';
import { saveMealEntry, generateId, getTodayKey } from '../utils/storage';
import type { MealEntry, MealType, FoodItem, SportTimingAdvice } from '../types';

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
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
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [description, setDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [timing, setTiming] = useState<SportTimingAdvice | null>(null);
  const [loadingTiming, setLoadingTiming] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCal, setManualCal] = useState('');
  const [manualPro, setManualPro] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualFat, setManualFat] = useState('');

  const hasApiKey = Boolean(state.profile?.geminiApiKey);
  const totalCalories = items.reduce((s, i) => s + i.calories, 0);
  const totalProtein = items.reduce((s, i) => s + i.protein, 0);
  const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
  const totalFat = items.reduce((s, i) => s + i.fat, 0);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setPhotoDataUrl(url);
      setAnalyzeError('');
    };
    reader.readAsDataURL(file);
  }

  async function analyzePhoto() {
    if (!photoDataUrl || !state.profile?.geminiApiKey) return;
    setAnalyzing(true);
    setAnalyzeError('');
    try {
      const result = await analyzeFoodPhoto(state.profile.geminiApiKey, photoDataUrl);
      setItems(result.items);
      setDescription(result.description);
      setMealType(result.mealType);
      await fetchTiming(result.totalCalories);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : 'Analysis failed. Check your API key.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function fetchTiming(cal: number) {
    if (!state.profile?.geminiApiKey) return;
    setLoadingTiming(true);
    try {
      const advice = await getSportTimingAdvice(state.profile.geminiApiKey, cal, state.profile.goal);
      setTiming(advice);
    } catch {
      // timing is optional
    } finally {
      setLoadingTiming(false);
    }
  }

  function addManualItem() {
    if (!manualName || !manualCal) return;
    const item: FoodItem = {
      name: manualName,
      portionDescription: '1 serving',
      calories: parseFloat(manualCal) || 0,
      protein: parseFloat(manualPro) || 0,
      carbs: parseFloat(manualCarb) || 0,
      fat: parseFloat(manualFat) || 0,
    };
    const newItems = [...items, item];
    setItems(newItems);
    setManualName('');
    setManualCal('');
    setManualPro('');
    setManualCarb('');
    setManualFat('');
    if (!timing && state.profile?.geminiApiKey) {
      fetchTiming(newItems.reduce((s, i) => s + i.calories, 0));
    }
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
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
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      photoDataUrl: photoDataUrl ?? undefined,
      aiAnalyzed: Boolean(photoDataUrl && hasApiKey),
    };
    saveMealEntry(meal);
    refreshToday();
    navigate('/');
  }

  return (
    <div className="page-scroll pb-28">
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <h1 className="text-xl font-bold text-white">Log Meal</h1>
      </div>

      {/* Meal Type */}
      <div className="px-5 mb-4">
        <div className="flex gap-2">
          {MEAL_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setMealType(t.value)}
              className={`flex-1 flex flex-col items-center py-3 rounded-2xl border-2 transition-all ${
                mealType === t.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <span className="text-xl">{t.emoji}</span>
              <span className={`text-xs mt-1 ${mealType === t.value ? 'text-primary font-medium' : 'text-muted'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Photo */}
      <div className="px-5 mb-4">
        <div
          onClick={() => fileRef.current?.click()}
          className={`relative rounded-3xl border-2 border-dashed overflow-hidden cursor-pointer transition-all ${
            photoDataUrl ? 'border-secondary' : 'border-border bg-card'
          }`}
          style={{ height: photoDataUrl ? 220 : 120 }}
        >
          {photoDataUrl ? (
            <img src={photoDataUrl} alt="meal" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Camera size={28} className="text-muted" />
              <p className="text-muted text-sm">Take or upload a photo</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />

        {photoDataUrl && hasApiKey && (
          <button
            onClick={analyzePhoto}
            disabled={analyzing}
            className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            {analyzing ? 'Analyzing with AI...' : 'Analyze with Gemini AI'}
          </button>
        )}

        {photoDataUrl && !hasApiKey && (
          <div className="mt-3 flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 px-4 py-2 rounded-xl">
            <AlertCircle size={16} />
            Add your Gemini API key in Profile to enable AI analysis
          </div>
        )}

        {analyzeError && (
          <p className="mt-2 text-red-400 text-sm text-center">{analyzeError}</p>
        )}
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="px-5 mb-4">
          <h3 className="text-white font-semibold mb-3">Items ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{item.name}</p>
                  <p className="text-muted text-xs">{item.portionDescription}</p>
                  <div className="flex gap-3 mt-1 text-xs text-muted">
                    <span className="text-secondary">P {Math.round(item.protein)}g</span>
                    <span className="text-blue-400">C {Math.round(item.carbs)}g</span>
                    <span className="text-accent">F {Math.round(item.fat)}g</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold">{Math.round(item.calories)}</p>
                  <p className="text-muted text-xs">kcal</p>
                </div>
                <button onClick={() => removeItem(i)} className="text-red-400/70 hover:text-red-400 mt-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-3 bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-white font-semibold">Total</span>
              <span className="text-primary font-black text-lg">{Math.round(totalCalories)} kcal</span>
            </div>
            <div className="flex gap-4 mt-1 text-xs text-muted">
              <span>P <strong className="text-white">{Math.round(totalProtein)}g</strong></span>
              <span>C <strong className="text-white">{Math.round(totalCarbs)}g</strong></span>
              <span>F <strong className="text-white">{Math.round(totalFat)}g</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add */}
      <div className="px-5 mb-4">
        <h3 className="text-white font-semibold mb-3">Add Manually</h3>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <input className="input-field" placeholder="Food name" value={manualName} onChange={(e) => setManualName(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input className="input-field" type="number" placeholder="Calories" value={manualCal} onChange={(e) => setManualCal(e.target.value)} />
            <input className="input-field" type="number" placeholder="Protein (g)" value={manualPro} onChange={(e) => setManualPro(e.target.value)} />
            <input className="input-field" type="number" placeholder="Carbs (g)" value={manualCarb} onChange={(e) => setManualCarb(e.target.value)} />
            <input className="input-field" type="number" placeholder="Fat (g)" value={manualFat} onChange={(e) => setManualFat(e.target.value)} />
          </div>
          <button
            onClick={addManualItem}
            disabled={!manualName || !manualCal}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Sport Timing */}
      {(timing || loadingTiming) && (
        <div className="px-5 mb-4">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Dumbbell size={18} className="text-primary" /> Sport Timing
          </h3>
          {loadingTiming ? (
            <div className="bg-card border border-border rounded-2xl p-4 text-muted text-sm text-center">Generating advice...</div>
          ) : timing ? (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Before Exercise</p>
                  <p className="text-muted text-sm">{timing.waitBeforeExercise}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Dumbbell size={18} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Exercise Type</p>
                  <p className="text-muted text-sm">{timing.exerciseType}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Recovery Window</p>
                  <p className="text-muted text-sm">{timing.recoveryWindow}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Droplets size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium">Hydration</p>
                  <p className="text-muted text-sm">{timing.hydration}</p>
                </div>
              </div>
              <div className="bg-primary/10 rounded-xl p-3 flex gap-2">
                <Lightbulb size={16} className="text-primary flex-shrink-0 mt-0.5" />
                <p className="text-primary text-sm">{timing.tip}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Description */}
      {items.length > 0 && (
        <div className="px-5 mb-4">
          <input
            className="input-field"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      )}

      {/* Save Button */}
      <div className="px-5">
        <button
          onClick={save}
          disabled={items.length === 0}
          className="btn-primary w-full text-base py-4 disabled:opacity-40"
        >
          Save Meal · {Math.round(totalCalories)} kcal
        </button>
      </div>
    </div>
  );
}
