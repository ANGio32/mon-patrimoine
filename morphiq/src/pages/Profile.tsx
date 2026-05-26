import { useState } from 'react';
import { Key, ChevronRight, Check, Info, Eye, EyeOff, LogOut, Droplets, Dumbbell, Home, Zap, Leaf, Heart, Activity, Shield, TrendingUp, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE, getBMI } from '../utils/calculations';
import { loadWeightLog, logWeight, loadAllLogs, type WeightEntry } from '../utils/storage';
import type { Goal, ActivityLevel, Equipment } from '../types';

// ─── Weight evolution chart (SVG area + line) ─────────────────────────────────

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 text-muted text-xs text-center px-4">
        {entries.length === 0
          ? 'Aucune pesée encore — ajoute ton poids ci-dessous pour démarrer ta courbe.'
          : 'Ajoute une 2ᵉ pesée pour voir ta courbe d’évolution.'}
      </div>
    );
  }

  const recent = entries.slice(-14);
  const vals = recent.map(e => e.weight);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 300, H = 110, pad = 10;

  const pts = recent.map((e, i) => ({
    x: pad + (i / (recent.length - 1)) * (W - pad * 2),
    y: pad + (1 - (e.weight - min) / range) * (H - pad * 2),
    e,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - pad} L ${pts[0].x.toFixed(1)} ${H - pad} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A6B47" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#5A6B47" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#weightFill)" />
      <path d={line} fill="none" stroke="#5A6B47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle
          key={p.e.date}
          cx={p.x}
          cy={p.y}
          r={i === pts.length - 1 ? 4 : 2.5}
          fill={i === pts.length - 1 ? '#5A6B47' : '#ffffff'}
          stroke="#5A6B47"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

// ─── Multi-metric bar chart (14 days) ─────────────────────────────────────────

function CalBarChart({ metric, target }: { metric: 'cal_in' | 'cal_out'; target: number }) {
  const allLogs = loadAllLogs();
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const log = allLogs[key];
    return {
      calIn: log ? log.meals.reduce((s, m) => s + m.totalCalories, 0) : 0,
      calOut: log ? log.workouts.reduce((s, w) => s + (w.durationMin || 0), 0) : 0,
      isToday: i === 13,
    };
  });

  const vals = days.map(d => metric === 'cal_in' ? d.calIn : d.calOut);
  const maxVal = Math.max(...vals, 1);

  return (
    <div className="flex items-end gap-1 h-24 px-1">
      {days.map((d, i) => {
        const val = metric === 'cal_in' ? d.calIn : d.calOut;
        const pct = (val / maxVal) * 100;
        let color: string;
        if (metric === 'cal_in') {
          if (val === 0) color = '#E5DDCB';
          else if (val > target) color = d.isToday ? '#F97316' : '#F9731660';
          else color = d.isToday ? '#5A6B47' : '#5A6B4740';
        } else {
          color = val === 0 ? '#E5DDCB' : d.isToday ? '#4A6C82' : '#4A6C8250';
        }
        return (
          <div key={i} className="flex-1">
            <div
              className="w-full rounded-t-lg transition-all duration-500"
              style={{ height: `${val > 0 ? Math.max(pct, 6) : 2}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

const CHART_METRICS: { id: 'weight' | 'cal_in' | 'cal_out'; label: string; activeBg: string }[] = [
  { id: 'weight',  label: 'Poids',          activeBg: '#5A6B47' },
  { id: 'cal_in',  label: 'Cal. mangées',   activeBg: '#F97316' },
  { id: 'cal_out', label: 'Cal. brûlées',   activeBg: '#4A6C82' },
];

const EQUIPMENT_OPTIONS: { value: Equipment; label: string; icon: LucideIcon; desc: string }[] = [
  { value: 'home', label: 'Home', icon: Home, desc: 'Bodyweight + outdoor' },
  { value: 'gym', label: 'Gym', icon: Dumbbell, desc: 'Full equipment' },
  { value: 'both', label: 'Both', icon: Zap, desc: 'Mix gym & home' },
];

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'Fat Loss',
  build_muscle: 'Muscle Gain',
  maintain: 'Maintenance',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

interface BMIInfo {
  icon: LucideIcon;
  cardBg: string;
  textColor: string;
  title: string;
  message: string;
}

function getBMIInfo(bmi: number): BMIInfo {
  if (bmi < 18.5) return {
    icon: Leaf,
    cardBg: 'bg-card-sky',
    textColor: 'text-blue',
    title: 'A little light',
    message: `At ${bmi}, your body is still growing into its full potential. Nourishing yourself well will help you feel energized and strong.`,
  };
  if (bmi < 25) return {
    icon: Heart,
    cardBg: 'bg-card-mint',
    textColor: 'text-green',
    title: 'Looking great!',
    message: `A BMI of ${bmi} puts you in the healthy range — well done! Your body is in a great place. Keep up your good habits!`,
  };
  if (bmi < 27) return {
    icon: Dumbbell,
    cardBg: 'bg-card-yellow',
    textColor: 'text-amber-700',
    title: 'Almost there',
    message: `You're at ${bmi}, just a little above ideal — totally normal. Small consistent steps in nutrition and movement go a long way!`,
  };
  if (bmi < 30) return {
    icon: Activity,
    cardBg: 'bg-card-orange',
    textColor: 'text-orange',
    title: 'On your journey',
    message: `Your BMI is ${bmi}. Every healthy choice you make today is a gift to your future self. You're on the right path!`,
  };
  return {
    icon: Shield,
    cardBg: 'bg-card-pink',
    textColor: 'text-pink-700',
    title: "Let's do this together",
    message: `At ${bmi}, your body would benefit from some extra care — and that's exactly why you're here! You took the first step. Let's build healthy habits one day at a time.`,
  };
}

export default function Profile() {
  const { state, setProfile, signOut } = useApp();
  const profile = state.profile;

  const [apiKey, setApiKey] = useState(profile?.geminiApiKey ?? '');
  const [editWeight, setEditWeight] = useState(String(profile?.weightKg ?? ''));
  const [savedKey, setSavedKey] = useState(false);
  const [savedWeight, setSavedWeight] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [waterReminder, setWaterReminder] = useState(
    localStorage.getItem('morphiq_water_reminder') !== 'false'
  );
  const [weights, setWeights] = useState<WeightEntry[]>(() => loadWeightLog());
  const [chartMetric, setChartMetric] = useState<'weight' | 'cal_in' | 'cal_out'>('weight');

  if (!profile) return null;
  const p = profile;

  const targets = calculateTargets(p);
  const tdee = calculateTDEE(p);
  const bmi = getBMI(p);
  const bmiInfo = getBMIInfo(bmi);

  function saveApiKey() {
    setProfile({ ...p, geminiApiKey: apiKey.trim() });
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  }

  function saveWeight() {
    const kg = parseFloat(editWeight);
    if (isNaN(kg)) return;
    setWeights(logWeight(kg));
    setProfile({ ...p, weightKg: kg });
    setSavedWeight(true);
    setTimeout(() => setSavedWeight(false), 2000);
  }

  function toggleWaterReminder() {
    const next = !waterReminder;
    setWaterReminder(next);
    localStorage.setItem('morphiq_water_reminder', String(next));
  }

  function setEquipment(eq: Equipment) {
    setProfile({ ...p, equipment: eq });
  }

  return (
    <div className="page bg-bg">
      <div className="px-5 pt-14 pb-5">
        <h1 className="text-3xl font-black text-text tracking-tight">Profile</h1>
      </div>

      {/* Identity card */}
      <div className="mx-5 mb-4 bg-white shadow-card rounded-[2rem] p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[1.25rem] bg-card-purple flex items-center justify-center text-2xl font-black text-purple">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-text font-black text-xl">{p.name}</p>
            <p className="text-muted text-xs mt-0.5">{p.sex === 'male' ? '♂' : '♀'} {p.age} yo · {p.weightKg} kg · {p.heightCm} cm</p>
            <span className="inline-block mt-1.5 px-2.5 py-1 bg-purple-bg text-purple text-[10px] font-bold rounded-full">{GOAL_LABELS[p.goal]}</span>
          </div>
        </div>

        {/* Colorful stat chips — inspired by the design */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-card-mint rounded-2xl p-3 text-center">
            <p className="text-green font-black text-base leading-none">{p.weightKg} kg</p>
            <p className="text-text/50 text-[10px] mt-1 font-semibold">Current</p>
          </div>
          <div className="bg-card-blue rounded-2xl p-3 text-center">
            <p className="text-blue font-black text-base leading-none">{ACTIVITY_LABELS[p.activityLevel]}</p>
            <p className="text-text/50 text-[10px] mt-1 font-semibold">Activity</p>
          </div>
          <div className="bg-card-yellow rounded-2xl p-3 text-center">
            <p className="text-amber-700 font-black text-base leading-none">{targets.calories}</p>
            <p className="text-text/50 text-[10px] mt-1 font-semibold">kcal/day</p>
          </div>
        </div>
      </div>

      {/* BMI card */}
      <div className={`mx-5 mb-4 ${bmiInfo.cardBg} rounded-[2rem] p-5`}>
        <div className="flex items-start gap-3">
          <bmiInfo.icon size={28} strokeWidth={1.5} className={`${bmiInfo.textColor} flex-shrink-0`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-black text-base ${bmiInfo.textColor}`}>{bmiInfo.title}</p>
              <span className={`px-2.5 py-0.5 bg-white/50 rounded-full text-[10px] font-bold ${bmiInfo.textColor}`}>BMI {bmi}</span>
            </div>
            <p className="text-text/60 text-xs leading-relaxed">{bmiInfo.message}</p>
          </div>
        </div>
      </div>

      {/* Evolution chart */}
      <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text font-black text-sm">Évolution</p>
          <TrendingUp size={16} className="text-purple" />
        </div>
        <div className="flex gap-1.5 mb-4">
          {CHART_METRICS.map(m => (
            <button
              key={m.id}
              onClick={() => setChartMetric(m.id)}
              className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all"
              style={chartMetric === m.id
                ? { backgroundColor: m.activeBg, color: '#ffffff' }
                : { backgroundColor: '#F4F2FA', color: '#9B97B8' }}
            >
              {m.label}
            </button>
          ))}
        </div>
        {chartMetric === 'weight' && <WeightChart entries={weights} />}
        {chartMetric === 'cal_in' && (
          <>
            <CalBarChart metric="cal_in" target={targets.calories} />
            <p className="text-muted text-[10px] text-center mt-2">
              Quota : {targets.calories} kcal/j —{' '}
              <span style={{ color: '#F97316' }} className="font-semibold">orange = dépassé</span>
            </p>
          </>
        )}
        {chartMetric === 'cal_out' && (
          <>
            <CalBarChart metric="cal_out" target={0} />
            <p className="text-muted text-[10px] text-center mt-2">Minutes d'activité par jour (14 derniers jours)</p>
          </>
        )}
      </div>

      {/* Macro targets */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-4">
        <p className="text-text font-black text-sm mb-3">Daily Macro Targets</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Protein', value: `${targets.protein}g`, bg: 'bg-card-mint', color: 'text-green' },
            { label: 'Carbs', value: `${targets.carbs}g`, bg: 'bg-card-blue', color: 'text-blue' },
            { label: 'Fat', value: `${targets.fat}g`, bg: 'bg-card-orange', color: 'text-orange' },
          ].map(m => (
            <div key={m.label} className={`${m.bg} rounded-2xl py-3`}>
              <p className={`font-black text-sm ${m.color}`}>{m.value}</p>
              <p className="text-text/50 text-[10px] mt-0.5 font-semibold">{m.label}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted">
          <span>TDEE: <strong className="text-text">{tdee} kcal</strong></span>
          <span>Target: <strong className="text-text">{targets.calories} kcal</strong></span>
        </div>
      </div>

      {/* Update weight */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-4">
        <p className="text-text font-black text-sm mb-3">Update Weight</p>
        <div className="flex gap-2">
          <input className="input-field flex-1" type="number" placeholder="Weight (kg)" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
          <button onClick={saveWeight} className="btn-primary px-5 py-3">
            {savedWeight ? <Check size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Equipment / Training Setup */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-4">
        <p className="text-text font-black text-sm mb-1">Training Setup</p>
        <p className="text-muted text-xs mb-3">Used by AI to tailor your workout programs</p>
        <div className="grid grid-cols-3 gap-2">
          {EQUIPMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEquipment(opt.value)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${p.equipment === opt.value ? 'border-purple bg-purple-bg' : 'border-border bg-section'}`}
            >
              <opt.icon size={20} strokeWidth={1.5} className={p.equipment === opt.value ? 'text-purple' : 'text-[#3D4A2F]'} />
              <span className={`text-xs font-bold ${p.equipment === opt.value ? 'text-purple' : 'text-text'}`}>{opt.label}</span>
              <span className="text-[10px] text-muted leading-tight text-center">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Water reminder toggle */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-card-sky flex items-center justify-center"><Droplets size={20} strokeWidth={1.5} className="text-blue" /></div>
            <div>
              <p className="text-text font-bold text-sm">Hydration Reminder</p>
              <p className="text-muted text-xs">Ask when you open the app</p>
            </div>
          </div>
          <button
            onClick={toggleWaterReminder}
            className={`w-13 h-7 rounded-full transition-all duration-200 flex items-center ${waterReminder ? 'bg-purple justify-end' : 'bg-section justify-start'} border border-border px-0.5`}
            style={{ width: 52, height: 28 }}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-purple" />
          <p className="text-text font-black text-sm">Gemini API Key</p>
        </div>
        <p className="text-muted text-xs mb-3">Free AI at aistudio.google.com · 2.5 Flash</p>
        <div className="flex gap-2 mb-2.5">
          <input className="input-field flex-1" type={showKey ? 'text' : 'password'} placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
          <button onClick={() => setShowKey(!showKey)} className="w-11 bg-section border border-border rounded-2xl flex items-center justify-center text-muted flex-shrink-0">
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        <button onClick={saveApiKey} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3.5">
          {savedKey ? <><Check size={15} /> Saved!</> : 'Save API Key'}
        </button>
        {p.geminiApiKey ? (
          <div className="mt-2.5 flex gap-2 text-green text-xs bg-green-bg px-3 py-2 rounded-xl">
            <Check size={12} className="mt-0.5 flex-shrink-0" /> AI features enabled
          </div>
        ) : (
          <div className="mt-2.5 flex gap-2 text-orange text-xs bg-orange-bg px-3 py-2 rounded-xl">
            <Info size={12} className="mt-0.5 flex-shrink-0" /> No key — AI features disabled. Tracking still works.
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="mx-5 mb-4">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border border-border bg-white shadow-card text-sm font-semibold text-muted active:scale-95 transition-all"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>

      {/* How to get key */}
      <div className="mx-5 bg-white shadow-card rounded-3xl p-4 mb-8">
        <p className="text-text font-bold text-xs mb-2">How to get a free Gemini key</p>
        <ol className="space-y-1.5 text-muted text-xs">
          {['Visit aistudio.google.com', 'Sign in with Google', 'Click "Get API Key" → "Create API Key"', 'Copy key (starts with AIza...)', 'Paste above and save'].map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-purple font-bold">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-muted text-xs mt-2 pt-2 border-t border-border">2.5 Flash: 5 req/min · 250K tokens/day (free)</p>
      </div>
    </div>
  );
}
