import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE, formatCalories } from '../utils/calculations';
import MacroRing from '../components/MacroRing';
import { BarChart2, TrendingDown, TrendingUp, Minus, Flame, Droplets } from 'lucide-react';
import { getLast7DaysLogs } from '../utils/storage';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';

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
  const isDeficit = deficit > 0;
  const isSurplus = deficit < -50;

  const weekLogs = getLast7DaysLogs();
  const weekData = weekLogs.map((log) => ({
    day: new Date(log.date + 'T12:00:00').toLocaleDateString('en', { weekday: 'short' }),
    calories: log.meals.reduce((s, m) => s + m.totalCalories, 0),
    target: targets.calories,
  }));

  const calPct = Math.min(consumed.calories / targets.calories, 1.05);
  const ringColor = calPct > 1 ? '#FF6B35' : calPct > 0.85 ? '#00D4AA' : '#7C3AED';

  const goalLabel = {
    lose_weight: 'Weight Loss',
    build_muscle: 'Muscle Gain',
    maintain: 'Maintenance',
  }[profile.goal];

  return (
    <div className="page-scroll pb-28">
      <div className="px-5 pt-8 pb-4">
        <p className="text-muted text-sm">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        <h1 className="text-2xl font-bold text-white">
          Hey {profile.name.split(' ')[0]} 👋
        </h1>
        <span className="inline-block mt-1 px-3 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-full">
          {goalLabel}
        </span>
      </div>

      {/* Calorie Card */}
      <div className="mx-5 bg-card border border-border rounded-3xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-muted text-xs font-medium uppercase tracking-wider">Calories Today</p>
            <p className="text-4xl font-black text-white">{formatCalories(consumed.calories)}</p>
            <p className="text-muted text-sm">of {formatCalories(targets.calories)} target</p>
          </div>
          <div className="relative w-24 h-24">
            <svg width="96" height="96" className="-rotate-90">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1E2540" strokeWidth="7" />
              <circle
                cx="48" cy="48" r="40"
                fill="none"
                stroke={ringColor}
                strokeWidth="7"
                strokeDasharray={`${calPct * 251} 251`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame size={28} style={{ color: ringColor }} />
            </div>
          </div>
        </div>

        {/* Deficit/Surplus Banner */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
          isSurplus ? 'bg-accent/10 text-accent' :
          isDeficit && consumed.calories > 0 ? 'bg-secondary/10 text-secondary' : 'bg-border/50 text-muted'
        }`}>
          {isSurplus ? <TrendingUp size={18} /> : isDeficit ? <TrendingDown size={18} /> : <Minus size={18} />}
          <span className="font-semibold text-sm">
            {Math.abs(deficit) < 50
              ? 'Right on target!'
              : isSurplus
              ? `${formatCalories(Math.abs(deficit))} kcal surplus`
              : `${formatCalories(deficit)} kcal remaining`}
          </span>
        </div>
      </div>

      {/* Macros */}
      <div className="mx-5 bg-card border border-border rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-primary" />
          <h2 className="text-white font-semibold">Macros</h2>
        </div>
        <div className="flex justify-around">
          <MacroRing consumed={consumed.protein} target={targets.protein} color="#7C3AED" label="Protein" />
          <MacroRing consumed={consumed.carbs} target={targets.carbs} color="#00D4AA" label="Carbs" />
          <MacroRing consumed={consumed.fat} target={targets.fat} color="#FF6B35" label="Fat" />
          <MacroRing consumed={consumed.calories} target={tdee} color="#F59E0B" label="vs TDEE" unit="kcal" />
        </div>
      </div>

      {/* Hydration reminder */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4 flex items-center gap-3">
        <Droplets size={22} className="text-blue-400 flex-shrink-0" />
        <div>
          <p className="text-white text-sm font-medium">Stay hydrated</p>
          <p className="text-muted text-xs">Aim for 2–3L of water today</p>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="mx-5 bg-card border border-border rounded-3xl p-5 mb-4">
        <h2 className="text-white font-semibold mb-4">This Week</h2>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={weekData} barSize={24}>
            <XAxis dataKey="day" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Bar dataKey="calories" radius={[6, 6, 0, 0]}>
              {weekData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.calories > entry.target ? '#FF6B35' : entry.calories > 0 ? '#7C3AED' : '#1E2540'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-end text-xs text-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> On target</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent inline-block" /> Over</span>
        </div>
      </div>

      {/* Today's Meals */}
      {todayLog.meals.length > 0 && (
        <div className="mx-5 mb-4">
          <h2 className="text-white font-semibold mb-3">Today's Meals</h2>
          <div className="space-y-2">
            {todayLog.meals.map((meal) => (
              <div key={meal.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-lg">
                  {meal.mealType === 'breakfast' ? '🌅' : meal.mealType === 'lunch' ? '☀️' : meal.mealType === 'dinner' ? '🌙' : '🍎'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize truncate">{meal.description || meal.mealType}</p>
                  <p className="text-muted text-xs">{meal.time} · {meal.items.length} item{meal.items.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm">{formatCalories(meal.totalCalories)}</p>
                  <p className="text-muted text-xs">kcal</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {todayLog.meals.length === 0 && (
        <div className="mx-5 bg-card border border-dashed border-border rounded-3xl p-8 text-center">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="text-white font-medium mb-1">No meals logged yet</p>
          <p className="text-muted text-sm">Tap + to log your first meal today</p>
        </div>
      )}
    </div>
  );
}
