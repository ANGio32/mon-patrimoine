import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE } from '../utils/calculations';
import { Flame, TrendingDown, TrendingUp, Minus } from 'lucide-react';

function WeekStrip() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div key={i} className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all ${isToday ? 'bg-[#1C1C1E]' : ''}`}>
            <span className={`text-[9px] font-semibold tracking-wide ${isToday ? 'text-white/50' : 'text-muted'}`}>{dayNames[d.getDay()]}</span>
            <span className={`text-sm font-black mt-0.5 ${isToday ? 'text-white' : 'text-dim'}`}>{d.getDate()}</span>
          </div>
        );
      })}
    </div>
  );
}

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

const MEAL_CARD_COLORS = [
  'bg-card-purple text-purple',
  'bg-card-blue text-blue',
  'bg-card-yellow text-amber-700',
  'bg-card-mint text-green',
  'bg-card-pink text-pink-700',
  'bg-card-orange text-orange',
];
const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎',
};

export default function Dashboard() {
  const { state } = useApp();
  const { profile, todayLog } = state;
  if (!profile) return null;

  const targets = calculateTargets(profile);
  const tdee = calculateTDEE(profile);
  const consumed = {
    cal: todayLog.meals.reduce((s, m) => s + m.totalCalories, 0),
    pro: todayLog.meals.reduce((s, m) => s + m.totalProtein, 0),
    carb: todayLog.meals.reduce((s, m) => s + m.totalCarbs, 0),
    fat: todayLog.meals.reduce((s, m) => s + m.totalFat, 0),
  };
  const deficit = targets.calories - consumed.cal;
  const isOver = deficit < -50;
  const isGood = Math.abs(deficit) <= 50;
  const today = new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-card-purple flex items-center justify-center text-lg font-black text-purple flex-shrink-0">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-muted text-xs font-medium">{today}</p>
            <h1 className="text-xl font-black text-text leading-tight">Hello, {profile.name.split(' ')[0]}! 👋</h1>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="mx-5 mb-4 bg-white rounded-3xl p-3 shadow-card">
        <WeekStrip />
      </div>

      {/* Calorie hero card */}
      <div className="mx-5 mb-4 rounded-[2rem] p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #C084FC 100%)' }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white/65 text-xs font-semibold mb-2">Today's calories</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${
              isGood ? 'bg-white/20 text-white' : isOver ? 'bg-white/15 text-white' : 'bg-white/20 text-white'
            }`}>
              {isGood ? <><Minus size={11} /> On target! 🎯</> : isOver ? <><TrendingUp size={11} /> {Math.round(-deficit)} kcal over</> : <><TrendingDown size={11} /> {Math.round(deficit)} left</>}
            </div>
            {/* Mini macros */}
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
          { label: 'Meals', value: String(todayLog.meals.length), unit: 'logged', bg: 'bg-card-yellow', color: 'text-amber-700' },
          { label: 'Sessions', value: String(todayLog.workouts.length), unit: 'done', bg: 'bg-card-mint', color: 'text-green' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-3xl p-4 text-center`}>
            <p className={`font-black text-xl leading-none ${s.color}`}>{s.value}</p>
            <p className="text-text/50 text-[10px] mt-1 font-medium">{s.unit}</p>
            <p className="text-text/35 text-[9px] font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's meals */}
      <div className="mx-5 mb-4">
        <p className="text-text font-black text-base mb-3">Today's meals</p>
        {todayLog.meals.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-8 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-dim font-bold text-sm mb-1">No meals yet</p>
            <p className="text-muted text-xs">Tap + to log your first meal</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayLog.meals.map((meal, i) => (
              <div key={meal.id} className="bg-white rounded-3xl shadow-card p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${MEAL_CARD_COLORS[i % MEAL_CARD_COLORS.length].split(' ')[0]}`}>
                  {MEAL_EMOJI[meal.mealType]}
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
    </div>
  );
}
