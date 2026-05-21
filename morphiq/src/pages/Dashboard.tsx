import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE } from '../utils/calculations';
import { Flame, TrendingDown, TrendingUp, Minus, Droplets } from 'lucide-react';

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(value / target, 1);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-muted text-xs font-medium">{label}</span>
        <span className="text-dim text-xs font-semibold">{Math.round(value)}<span className="text-muted font-normal">/{Math.round(target)}g</span></span>
      </div>
      <div className="h-2 bg-section rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(consumed / target, 1.05);
  const size = 200;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const over = consumed > target;
  const color = over ? '#FF9500' : pct > 0.75 ? '#2FB960' : '#2FB960';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F2F2F7" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke}
          strokeDasharray={`${Math.min(pct, 1) * circ} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-black text-text tracking-tight leading-none">{Math.round(consumed).toLocaleString()}</span>
        <span className="text-muted text-sm mt-1">of {target.toLocaleString()} kcal</span>
        <Flame size={16} className={`mt-1 ${over ? 'text-orange' : 'text-green'}`} />
      </div>
    </div>
  );
}

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
  const isUnder = deficit > 50 && consumed.cal > 0;
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });
  const goalLabel = { lose_weight: 'Fat Loss', build_muscle: 'Muscle Gain', maintain: 'Maintenance' }[profile.goal];

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <p className="text-muted text-xs mb-1">{today}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-text">Hey {profile.name.split(' ')[0]} 👋</h1>
          <span className="pill bg-green-bg text-green-dark border border-green/20">{goalLabel}</span>
        </div>
      </div>

      {/* Calorie ring card */}
      <div className="mx-5 mt-4 bg-card rounded-3xl shadow-card p-5 mb-4">
        <div className="flex justify-center mb-4">
          <CalorieRing consumed={consumed.cal} target={targets.calories} />
        </div>
        {/* Status */}
        <div className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-sm font-semibold ${
          isOver ? 'bg-orange-bg text-orange' : isUnder ? 'bg-green-bg text-green-dark' : 'bg-section text-muted'
        }`}>
          {isOver ? <TrendingUp size={16} /> : isUnder ? <TrendingDown size={16} /> : <Minus size={16} />}
          {Math.abs(deficit) < 50
            ? 'Right on target! 🎯'
            : isOver ? `${Math.round(Math.abs(deficit))} kcal over today`
            : `${Math.round(deficit)} kcal remaining`}
        </div>
      </div>

      {/* Macros card */}
      <div className="mx-5 bg-card rounded-3xl shadow-card p-5 mb-4">
        <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-4">Macros</p>
        <div className="space-y-4">
          <MacroBar label="Protein" value={consumed.pro} target={targets.protein} color="#2FB960" />
          <MacroBar label="Carbs" value={consumed.carb} target={targets.carbs} color="#007AFF" />
          <MacroBar label="Fat" value={consumed.fat} target={targets.fat} color="#FF9500" />
        </div>
      </div>

      {/* Stats row */}
      <div className="mx-5 flex gap-3 mb-4">
        {[
          { label: 'TDEE', value: tdee.toLocaleString(), unit: 'kcal', color: 'text-purple' },
          { label: 'Meals', value: String(todayLog.meals.length), unit: 'today', color: 'text-blue' },
          { label: 'Workouts', value: String(todayLog.workouts.length), unit: 'done', color: 'text-green' },
        ].map(s => (
          <div key={s.label} className="flex-1 bg-card rounded-2xl shadow-card p-3.5 text-center">
            <p className={`font-black text-lg leading-none ${s.color}`}>{s.value}</p>
            <p className="text-muted text-[10px] mt-1">{s.unit}</p>
            <p className="text-muted text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Hydration tip */}
      <div className="mx-5 bg-card rounded-2xl shadow-card p-4 mb-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue/10 flex items-center justify-center flex-shrink-0">
          <Droplets size={18} className="text-blue" />
        </div>
        <div>
          <p className="text-dim text-sm font-semibold">Stay hydrated</p>
          <p className="text-muted text-xs">Aim for 2–3L of water today</p>
        </div>
      </div>

      {/* Today's meals */}
      <div className="mx-5 mb-4">
        <p className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Today's meals</p>
        {todayLog.meals.length === 0 ? (
          <div className="bg-card rounded-3xl shadow-card p-8 text-center">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-dim font-semibold text-sm mb-1">No meals logged yet</p>
            <p className="text-muted text-xs">Tap + to add your first meal</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayLog.meals.map(meal => (
              <div key={meal.id} className="bg-card rounded-2xl shadow-card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-green-bg flex items-center justify-center text-xl flex-shrink-0">
                  {MEAL_EMOJI[meal.mealType]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-dim font-semibold text-sm capitalize truncate">{meal.description}</p>
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
