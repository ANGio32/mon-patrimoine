import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Loader, Star, ChevronRight, MapPin, Flame, Check, Lightbulb } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { analyzeRestaurantMenu } from '../utils/gemini';
import { calculateTargets } from '../utils/calculations';
import { saveMealEntry, generateId, getTodayKey } from '../utils/storage';
import type { MenuAnalysis, MenuDish } from '../utils/gemini';
import type { MealType } from '../types';

export default function MenuAnalyzer() {
  const { state, refreshToday } = useApp();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MenuAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logged, setLogged] = useState<string[]>([]);

  const hasKey = Boolean(state.profile?.geminiApiKey);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setPhoto(ev.target?.result as string);
      setAnalysis(null);
      setError('');
      setLogged([]);
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!photo || !state.profile?.geminiApiKey) return;
    setLoading(true);
    setError('');
    try {
      const targets = calculateTargets(state.profile);
      const result = await analyzeRestaurantMenu(
        state.profile.geminiApiKey,
        photo,
        state.profile.goal,
        targets
      );
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed. Check your API key.');
    } finally {
      setLoading(false);
    }
  }

  function logDish(dish: MenuDish) {
    if (!state.profile) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
    saveMealEntry({
      id: generateId(),
      date: getTodayKey(),
      time,
      mealType: 'lunch' as MealType,
      description: dish.name,
      items: [
        {
          name: dish.name,
          portionDescription: 'restaurant portion',
          calories: dish.estimatedCalories,
          protein: dish.estimatedProtein,
          carbs: dish.estimatedCarbs,
          fat: dish.estimatedFat,
        },
      ],
      totalCalories: dish.estimatedCalories,
      totalProtein: dish.estimatedProtein,
      totalCarbs: dish.estimatedCarbs,
      totalFat: dish.estimatedFat,
      aiAnalyzed: true,
    });
    refreshToday();
    setLogged(prev => [...prev, dish.name]);
  }

  const topPickDishes = analysis
    ? analysis.dishes.filter(d => analysis.topPicks.includes(d.name))
    : [];

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white shadow-card flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-text" />
        </button>
        <h1 className="text-xl font-black text-text flex-1">Restaurant Menu</h1>
        <span className="pill bg-card-orange text-orange text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <MapPin size={11} strokeWidth={1.5} /> Mode Déplacement
        </span>
      </div>

      {/* No API key warning */}
      {!hasKey && (
        <div className="px-5 mb-4">
          <div className="bg-card-orange rounded-3xl p-4 shadow-card">
            <p className="text-orange font-semibold text-sm">Clé API requise</p>
            <p className="text-orange/70 text-xs mt-1">
              Ajoutez votre clé Gemini API dans le Profil pour activer l'analyse IA.
            </p>
          </div>
        </div>
      )}

      {/* Photo area — before photo taken */}
      {photo === null && (
        <div className="px-5 mb-5">
          <div
            onClick={() => hasKey && fileRef.current?.click()}
            className={`flex flex-col items-center justify-center min-h-[40vh] rounded-3xl border-2 border-dashed border-muted/40 bg-white shadow-card gap-4 cursor-pointer transition-all active:scale-95 ${!hasKey ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <div className="w-16 h-16 rounded-2xl bg-card-orange flex items-center justify-center">
              <Camera size={28} className="text-orange" />
            </div>
            <div className="text-center px-6">
              <p className="text-text font-black text-lg">Photographiez le menu</p>
              <p className="text-muted text-sm mt-2 leading-relaxed">
                L'IA identifie les plats et recommande les meilleures options pour votre objectif
              </p>
            </div>
            {hasKey && (
              <button
                onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                className="btn-primary text-sm px-8"
              >
                Ouvrir l'appareil photo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo taken, not yet analyzed */}
      {photo !== null && !analysis && (
        <div className="px-5 mb-5 space-y-4">
          <img
            src={photo}
            alt="menu"
            className="w-full max-h-48 object-cover rounded-3xl shadow-card"
          />
          <button
            onClick={analyze}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <><Loader size={16} className="animate-spin" /> Analyse en cours...</>
            ) : (
              <>Analyser ce menu <ChevronRight size={16} /></>
            )}
          </button>
          {error && (
            <p className="text-red-400 text-xs text-center px-2">{error}</p>
          )}
        </div>
      )}

      {/* Analysis results */}
      {analysis && (
        <div className="px-5 space-y-5 pb-4">
          {/* Small photo + restaurant type */}
          <div className="flex items-center gap-3">
            <img
              src={photo!}
              alt="menu"
              className="w-16 h-16 object-cover rounded-2xl shadow-card flex-shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 bg-card-orange text-orange text-xs font-bold px-3 py-1.5 rounded-full">
                <MapPin size={12} />
                {analysis.restaurantType}
              </span>
              <p className="text-muted text-xs mt-1.5">{analysis.dishes.length} plats analysés</p>
            </div>
          </div>

          {/* Top picks section */}
          {topPickDishes.length > 0 && (
            <div>
              <p className="text-text font-black text-base mb-3 flex items-center gap-2"><Star size={16} strokeWidth={1.5} className="text-green" /> Meilleurs choix</p>
              <div className="space-y-3">
                {topPickDishes.map(dish => (
                  <div
                    key={dish.name}
                    className="bg-card-mint rounded-3xl p-4 shadow-card"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-green flex-shrink-0" fill="currentColor" />
                        <p className="text-text font-black text-sm">{dish.name}</p>
                      </div>
                    </div>
                    <p className="text-muted text-xs mb-3">{dish.description}</p>
                    {/* Macro chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="pill bg-white text-text text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Flame size={11} strokeWidth={1.5} /> {dish.estimatedCalories} kcal
                      </span>
                      <span className="pill bg-white text-purple text-xs px-2 py-0.5 rounded-full">
                        P {dish.estimatedProtein}g
                      </span>
                      <span className="pill bg-white text-blue text-xs px-2 py-0.5 rounded-full">
                        C {dish.estimatedCarbs}g
                      </span>
                      <span className="pill bg-white text-orange text-xs px-2 py-0.5 rounded-full">
                        F {dish.estimatedFat}g
                      </span>
                    </div>
                    <p className="text-green text-xs font-medium mb-3 flex items-center gap-1"><Check size={12} strokeWidth={2} /> {dish.recommendationReason}</p>
                    {logged.includes(dish.name) ? (
                      <div className="flex items-center gap-2 text-green text-xs font-bold">
                        <Check size={12} strokeWidth={2} /> Plat enregistré
                      </div>
                    ) : (
                      <button
                        onClick={() => logDish(dish)}
                        className="btn-primary text-xs w-full"
                      >
                        Log ce plat
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All dishes section */}
          <div>
            <p className="text-text font-black text-base mb-3">Tous les plats</p>
            <div className="space-y-2">
              {analysis.dishes.map(dish => {
                const isTop = analysis.topPicks.includes(dish.name);
                const dotColor =
                  dish.recommendation === 'best'
                    ? 'bg-green-400'
                    : dish.recommendation === 'good'
                    ? 'bg-blue-400'
                    : 'bg-orange-400';
                const cardBg =
                  dish.recommendation === 'best'
                    ? 'bg-card-mint'
                    : dish.recommendation === 'good'
                    ? 'bg-card-blue/30'
                    : 'bg-card-orange/30';
                return (
                  <div
                    key={dish.name}
                    className={`${cardBg} rounded-3xl p-4 shadow-card`}
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                      <p className="text-text font-bold text-sm flex-1">{dish.name}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 ml-4 mb-2">
                      <span className="text-muted text-xs">{dish.estimatedCalories} kcal</span>
                      <span className="text-muted text-xs">·</span>
                      <span className="text-muted text-xs">P {dish.estimatedProtein}g</span>
                      <span className="text-muted text-xs">·</span>
                      <span className="text-muted text-xs">C {dish.estimatedCarbs}g</span>
                      <span className="text-muted text-xs">·</span>
                      <span className="text-muted text-xs">F {dish.estimatedFat}g</span>
                    </div>
                    <p className="text-muted text-xs ml-4 mb-2">{dish.recommendationReason}</p>
                    {!isTop && (
                      logged.includes(dish.name) ? (
                        <div className="ml-4 flex items-center gap-1 text-green text-xs font-bold">
                          <Check size={12} strokeWidth={2} /> Enregistré
                        </div>
                      ) : (
                        <button
                          onClick={() => logDish(dish)}
                          className="ml-4 text-xs text-purple font-bold underline underline-offset-2"
                        >
                          Log
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* General tip */}
          <div className="bg-card-yellow rounded-3xl p-4 shadow-card flex gap-3">
            <Lightbulb size={18} strokeWidth={1.5} className="text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-dim text-sm leading-relaxed">{analysis.generalTip}</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
