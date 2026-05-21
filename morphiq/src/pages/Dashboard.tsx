import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE } from '../utils/calculations';
import { Flame, TrendingDown, TrendingUp, Minus } from 'lucide-react';

function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = Math.min(value / target, 1);
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-dim text-xs font-medium">{label}</span>
        <span className="text-white text-xs font-semibold">{Math.round(value)}<span className="text-muted font-normal">/{Math.round(target)}g</span></span>
      </div>
      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(consumed / target, 1);
  const size = 200;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const over = consumed > target;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle, ${over ? '#F9731615' : '#8B5CF615'} 0%, transparent 70%)` }} />
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={over ? '#F97316' : pct > 0.8 ? '#22C55E' : '#8B5CF6'}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black text-white tracking-tight leading-none">{Math.round(consumed).toLocaleString()}</span>
          <span className="text-muted text-sm mt-1">of {target.toLocaleString()} kcal</span>
        </div>
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
    calories: todayLog.meals.reduce((s, m) => s + m.totalCalories, 0),
    protein: todayLog.meals.reduce((s, m) => s + m.totalProtein, 0),
    carbs: todayLog.meals.reduce((s, m) => s + m.totalCarbs, 0),
    fat: todayLog.meals.reduce((s, m) => s + m.totalFat, 0),
  };
  const deficit = targets.calories - consumed.calories;
  const isOver = deficit < -50;
  const isUnder = deficit > 50;

  const goalLabel = { lose_weight: 'Fat Loss', build_muscle: 'Muscle Gain', maintain: 'Maintenance' }[profile.goal];
  const today = new Date().toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="page">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-start justify-between">
        <div>
          <p className="text-muted text-xs mb-0.5">{today}</p>
          <h1 className="text-xl font-bold text-white">Hey {profile.name.split(' ')[0]} 👋</h1>
        </div>
        <span className="pill bg-primary/10 text-primary-light border border-primary/20">{goalLabel}</span>
      </div>

      {/* Calorie ring */}
      <div className="flex justify-center py-6">
        <CalorieRing consumed={consumed.calories} target={targets.calories} />
      </div>

      {/* Status pill */}
      <div className="flex justify-center mb-6">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          isOver ? 'bg-orange/10 text-orange' : isUnder ? 'bg-green/10 text-green' : 'bg-white/5 text-dim'
        }`}>
          {isOver ? <TrendingUp size={15} /> : isUnder ? <TrendingDown size={15} /> : <Minus size={15} />}
          {Math.abs(deficit) < 50
            ? 'Right on target'
            : isOver ? `${Math.round(Math.abs(deficit))} kcal over`
            : `${Math.round(deficit)} kcal remaining`}
        </div>
      </div>

      {/* Macros */}
      <div className="mx-5 bg-card rounded-3xl border border-border p-5 mb-4">
        <p className="text-muted text-xs font-medium uppercase tracking-widest mb-4">Macros</p>
        <div className="space-y-4">
          <MacroBar label="Protein" value={consumed.protein} target={targets.protein} color="#8B5CF6" />
          <MacroBar label="Carbs" value={consumed.carbs} target={targets.carbs} color="#22C55E" />
          <MacroBar label="Fat" value={consumed.fat} target={targets.fat} color="#F97316" />
        </div>
      </div>

      {/* TDEE reference */}
      <div className="mx-5 flex gap-3 mb-4">
        <div className="flex-1 bg-card rounded-2xl border border-border p-4">
          <p className="text-muted text-xs mb-1">TDEE</p>
          <p className="text-white font-bold">{tdee.toLocaleString()} <span className="text-muted font-normal text-xs">kcal</span></p>
        </div>
        <div className="flex-1 bg-card rounded-2xl border border-border p-4">
          <p className="text-muted text-xs mb-1">Burned</p>
          <p className="text-white font-bold">{state.todayLog.workouts.length > 0 ? '~300' : '0'} <span className="text-muted font-normal text-xs">kcal</span></p>
        </div>
        <div className="flex-1 bg-card rounded-2xl border border-border p-4">
          <p className="text-muted text-xs mb-1">Meals</p>
          <p className="text-white font-bold">{todayLog.meals.length}</p>
        </div>
      </div>

      {/* Meals */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-muted text-xs font-medium uppercase tracking-widest">Today's meals</p>
          {consumed.calories > 0 && (
            <span className="text-dim text-xs">{Math.round(consumed.calories)} kcal total</span>
          )}
        </div>

        {todayLog.meals.length === 0 ? (
          <div className="bg-card rounded-3xl border border-dashed border-border p-8 text-center">
            <div className="text-4xl mb-3">🍽️</div>
            <p className="text-white font-medium text-sm mb-1">No meals logged yet</p>
            <p className="text-muted text-xs">Tap + to add your first meal</p>
          </div>
        ) : (
          <div className="space-y-2">
            {todayLog.meals.map(meal => (
              <div key={meal.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{MEAL_EMOJI[meal.mealType]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize truncate">{meal.description}</p>
                  <p className="text-muted text-xs mt-0.5">{meal.time} · {meal.items.length} item{meal.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold text-sm">{Math.round(meal.totalCalories)}</p>
                  <p className="text-muted text-xs">kcal</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flame tip */}
      {consumed.calories > 0 && (
        <div className="mx-5 bg-card rounded-2xl border border-border p-4 flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center flex-shrink-0">
            <Flame size={16} className="text-orange" />
          </div>
          <p className="text-dim text-xs leading-relaxed">
            {isOver
              ? 'You\'ve exceeded your target. Light activity after dinner can help balance it out.'
              : `${Math.round(deficit)} kcal left — you're doing great. Stay consistent!`}
          </p>
        </div>
      )}
    </div>
  );
}
