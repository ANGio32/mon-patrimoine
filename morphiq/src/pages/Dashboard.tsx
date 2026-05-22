import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE } from '../utils/calculations';
import { getLogForDate, getTodayKey, getLast7DaysLogs, loadChallenge, saveChallenge, clearChallenge, generateId } from '../utils/storage';
import type { DailyLog, WeeklyChallenge } from '../types';
import { generateWeeklyChallenge } from '../utils/gemini';
import { Flame, TrendingDown, TrendingUp, Minus, Sparkles, Loader, Trophy, CheckCircle, X, Coffee, Sun, Moon, Cookie, Dumbbell, UtensilsCrossed, Target } from 'lucide-react';

// ── Week strip ────────────────────────────────────────────────────────────────
function WeekStrip({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const today = new Date();
  const todayKey = getTodayKey();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const isToday = key === todayKey;
        const isSelected = key === selected;
        const isFuture = d > today && !isToday;
        return (
          <button
            key={i}
            disabled={isFuture}
            onClick={() => onSelect(key)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all active:scale-95 ${
              isSelected && isToday ? 'bg-[#1C1C1E]'
              : isSelected ? 'bg-purple'
              : 'hover:bg-section'
            } ${isFuture ? 'opacity-30' : ''}`}
          >
            <span className={`text-[9px] font-semibold tracking-wide ${isSelected ? 'text-white/60' : 'text-muted'}`}>
              {dayNames[d.getDay()]}
            </span>
            <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-dim'}`}>
              {d.getDate()}
            </span>
            {/* Dot indicator if log exists */}
          </button>
        );
      })}
    </div>
  );
}

// ── Calorie ring ──────────────────────────────────────────────────────────────
function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(consumed / target, 1.05);
  const size = 160;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="white" strokeWidth={stroke}
          strokeDasharray={`${Math.min(pct, 1) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center text-white">
        <span className="text-3xl font-black leading-none">{Math.round(consumed).toLocaleString()}</span>
        <span className="text-white/55 text-[11px] mt-1">of {target.toLocaleString()} kcal</span>
        <Flame size={13} className="mt-1 text-white/70" />
      </div>
    </div>
  );
}


const MEAL_ICON = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

// ── Weekly Challenge Card ─────────────────────────────────────────────────────
function WeeklyChallengeCard({ apiKey, goal }: { apiKey?: string; goal: string }) {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(() => loadChallenge());
  const [loading, setLoading] = useState(false);
  const todayKey = getTodayKey();
  const alreadyDoneToday = challenge?.completedDays.includes(todayKey) ?? false;

  async function generate() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const logs = getLast7DaysLogs();
      const result = await generateWeeklyChallenge(apiKey, goal as Parameters<typeof generateWeeklyChallenge>[1], logs);
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const c: WeeklyChallenge = {
        id: generateId(),
        weekStart: monday.toISOString().slice(0, 10),
        title: result.title,
        description: result.description,
        targetDays: result.targetDays,
        completedDays: [],
        emoji: result.emoji,
        reward: result.reward,
        createdAt: new Date().toISOString(),
      };
      saveChallenge(c);
      setChallenge(c);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }

  function markToday() {
    if (!challenge || alreadyDoneToday) return;
    const updated = { ...challenge, completedDays: [...challenge.completedDays, todayKey] };
    saveChallenge(updated);
    setChallenge(updated);
  }

  function dismiss() {
    clearChallenge();
    setChallenge(null);
  }

  const progress = challenge ? Math.min(challenge.completedDays.length / challenge.targetDays, 1) : 0;
  const completed = challenge ? challenge.completedDays.length >= challenge.targetDays : false;

  if (!challenge) {
    if (!apiKey) return null;
    return (
      <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-card-yellow flex items-center justify-center"><Target size={20} strokeWidth={1.5} className="text-amber-700" /></div>
          <div>
            <p className="text-text font-black text-sm">Défi de la Semaine</p>
            <p className="text-muted text-xs">L'IA analyse votre semaine et crée un défi personnalisé</p>
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
          {loading ? <><Loader size={15} className="animate-spin" /> Analyse en cours...</> : <><Sparkles size={15} /> Générer mon défi</>}
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-5 mb-4 rounded-3xl p-5 ${completed ? 'bg-card-yellow' : 'bg-white shadow-card'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0"><Sparkles size={18} strokeWidth={1.5} className="text-purple" /></div>
          <div>
            <p className="text-text font-black text-sm">{challenge.title}</p>
            <p className="text-muted text-xs mt-0.5">{challenge.completedDays.length}/{challenge.targetDays} jours complétés</p>
          </div>
        </div>
        <button onClick={dismiss} className="w-7 h-7 rounded-xl bg-section border border-border flex items-center justify-center flex-shrink-0">
          <X size={13} className="text-muted" />
        </button>
      </div>

      <p className="text-dim text-xs leading-relaxed mb-3">{challenge.description}</p>

      {/* Progress bar */}
      <div className="h-2 bg-section rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-purple rounded-full transition-all duration-700" style={{ width: `${progress * 100}%` }} />
      </div>

      {completed ? (
        <div className="bg-white/70 rounded-2xl p-3 flex items-center gap-2">
          <Trophy size={16} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-bold text-xs">Défi relevé !</p>
            <p className="text-amber-700 text-[10px] mt-0.5">{challenge.reward}</p>
          </div>
        </div>
      ) : alreadyDoneToday ? (
        <div className="flex items-center gap-2 py-2.5 px-4 bg-card-mint rounded-2xl">
          <CheckCircle size={15} className="text-green flex-shrink-0" />
          <p className="text-green text-xs font-bold">Journée validée !</p>
        </div>
      ) : (
        <button onClick={markToday} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple rounded-2xl text-white text-sm font-bold active:scale-95 transition-all">
          <CheckCircle size={15} /> Valider aujourd'hui ✓
        </button>
      )}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useApp();
  const { profile } = state;
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);

  if (!profile) return null;

  const isToday = selectedDate === todayKey;
  const log: DailyLog = isToday ? state.todayLog : getLogForDate(selectedDate);

  const targets = calculateTargets(profile);
  const tdee = calculateTDEE(profile);
  const consumed = {
    cal: log.meals.reduce((s, m) => s + m.totalCalories, 0),
    pro: log.meals.reduce((s, m) => s + m.totalProtein, 0),
    carb: log.meals.reduce((s, m) => s + m.totalCarbs, 0),
    fat: log.meals.reduce((s, m) => s + m.totalFat, 0),
  };
  const deficit = targets.calories - consumed.cal;
  const isOver = deficit < -50;
  const isGood = Math.abs(deficit) <= 50;

  const displayDate = isToday
    ? new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' })
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-card-purple flex items-center justify-center text-lg font-black text-purple flex-shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-muted text-xs font-medium">{displayDate}</p>
            <h1 className="text-xl font-black text-text leading-tight">
              {isToday ? `Hello, ${profile.name.split(' ')[0]}!` : new Date(selectedDate + 'T12:00:00').toLocaleDateString('en', { weekday: 'long' })}
            </h1>
          </div>
        </div>
      </div>

      {/* Week strip — tappable */}
      <div className="mx-5 mb-4 bg-white rounded-3xl p-3 shadow-card">
        <WeekStrip selected={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* Calorie hero card */}
      <div className="mx-5 mb-4 rounded-[2rem] p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/65 text-xs font-semibold mb-2">
              {isToday ? "Today's calories" : "Calories this day"}
            </p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4 bg-white/20 text-white`}>
              {isGood ? <><Minus size={11} /> On target!</> : isOver ? <><TrendingUp size={11} /> {Math.round(-deficit)} kcal over</> : <><TrendingDown size={11} /> {Math.round(deficit)} left</>}
            </div>
            <div className="space-y-2">
              {[
                { label: 'Protein', val: consumed.pro, target: targets.protein },
                { label: 'Carbs', val: consumed.carb, target: targets.carbs },
                { label: 'Fat', val: consumed.fat, target: targets.fat },
              ].map(m => (
                <div key={m.label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-white/60 text-[10px]">{m.label}</span>
                    <span className="text-white/80 text-[10px] font-semibold">{Math.round(m.val)}/{Math.round(m.target)}g</span>
                  </div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(m.val / m.target, 1) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <CalorieRing consumed={consumed.cal} target={targets.calories} />
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-5 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'TDEE', value: tdee.toLocaleString(), unit: 'kcal', bg: 'bg-card-sky', color: 'text-blue' },
          { label: 'Meals', value: String(log.meals.length), unit: 'logged', bg: 'bg-card-yellow', color: 'text-amber-700' },
          { label: 'Sessions', value: String(log.workouts.length), unit: 'done', bg: 'bg-card-mint', color: 'text-green' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-3xl p-4 text-center`}>
            <p className={`font-black text-xl leading-none ${s.color}`}>{s.value}</p>
            <p className="text-text/50 text-[10px] mt-1 font-medium">{s.unit}</p>
            <p className="text-text/35 text-[9px] font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Weekly Challenge */}
      {isToday && (
        <WeeklyChallengeCard apiKey={profile.geminiApiKey} goal={profile.goal} />
      )}

      {/* Meals for selected day */}
      <div className="mx-5 mb-4">
        <p className="text-text font-black text-base mb-3">
          {isToday ? "Today's meals" : "Meals"}
        </p>
        {log.meals.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <UtensilsCrossed size={40} strokeWidth={1} className="text-muted mx-auto mb-3" />
            <p className="text-dim font-bold text-sm mb-1">{isToday ? 'No meals yet' : 'No meals logged'}</p>
            <p className="text-muted text-xs">{isToday ? 'Tap + to log your first meal' : 'Nothing was logged this day'}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {log.meals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
                  {(() => { const I = MEAL_ICON[meal.mealType] ?? Coffee; return <I size={18} strokeWidth={1.5} className="text-[#1C1C1E]" />; })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dim font-bold text-sm truncate capitalize">{meal.description}</p>
                  <p className="text-muted text-xs mt-0.5">{meal.time} · P {Math.round(meal.totalProtein)}g</p>
                </div>
                <div className="text-right">
                  <p className="text-text font-black">{Math.round(meal.totalCalories)}</p>
                  <p className="text-muted text-xs">kcal</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workouts for selected day */}
      {log.workouts.length > 0 && (
        <div className="mx-5 mb-4">
          <p className="text-text font-black text-base mb-3">Workouts</p>
          <div className="space-y-2.5">
            {log.workouts.map(w => (
              <div key={w.id} className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-[14px] bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0"><Dumbbell size={18} strokeWidth={1.5} className="text-[#1C1C1E]" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-dim font-bold text-sm truncate">{w.name}</p>
                  <p className="text-muted text-xs mt-0.5">{w.durationMin} min · {w.exercises.length} exercises</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
