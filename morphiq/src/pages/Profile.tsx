import { useState } from 'react';
import { Key, Target, ChevronRight, Check, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE, getBMI } from '../utils/calculations';
import type { Goal, ActivityLevel } from '../types';

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: '🔥 Fat Loss',
  build_muscle: '💪 Muscle Gain',
  maintain: '⚡ Maintenance',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

interface BMIInfo {
  emoji: string;
  color: string;
  bg: string;
  title: string;
  message: string;
}

function getBMIInfo(bmi: number): BMIInfo {
  if (bmi < 18.5) return {
    emoji: '🌱',
    color: 'text-blue-300',
    bg: 'bg-blue-400/8 border-blue-400/15',
    title: 'A little light',
    message: `At ${bmi}, your body is still growing into its full potential. Nourishing yourself well will help you feel energized and strong — you're already on a great path.`,
  };
  if (bmi < 25) return {
    emoji: '✨',
    color: 'text-green',
    bg: 'bg-green/8 border-green/15',
    title: 'Looking great!',
    message: `A BMI of ${bmi} puts you in the healthy range — well done! Your body is in a great place. Keep up your good habits and enjoy how you feel.`,
  };
  if (bmi < 27) return {
    emoji: '💪',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/8 border-yellow-400/15',
    title: 'Almost there',
    message: `You're at ${bmi}, just a little above the ideal range — totally normal and very common. Small consistent steps in nutrition and movement go a long way. You've got this!`,
  };
  if (bmi < 30) return {
    emoji: '🌟',
    color: 'text-orange',
    bg: 'bg-orange/8 border-orange/15',
    title: 'On your journey',
    message: `Your BMI is ${bmi}. Your body has been working hard and it's time to give it a little extra love. Every healthy choice you make today is a gift to your future self.`,
  };
  return {
    emoji: '🤗',
    color: 'text-red-400',
    bg: 'bg-red-400/8 border-red-400/15',
    title: 'Let\'s do this together',
    message: `At ${bmi}, your body would benefit from some extra care and attention — and that's exactly why you're here! You took the first step by opening Morphiq. Let's build healthy habits one day at a time.`,
  };
}

export default function Profile() {
  const { state, setProfile } = useApp();
  const profile = state.profile;

  const [apiKey, setApiKey] = useState(profile?.geminiApiKey ?? '');
  const [editWeight, setEditWeight] = useState(String(profile?.weightKg ?? ''));
  const [savedKey, setSavedKey] = useState(false);
  const [savedWeight, setSavedWeight] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [waterReminder, setWaterReminder] = useState(
    localStorage.getItem('morphiq_water_reminder') !== 'false'
  );

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
    setProfile({ ...p, weightKg: kg });
    setSavedWeight(true);
    setTimeout(() => setSavedWeight(false), 2000);
  }

  function toggleWaterReminder() {
    const next = !waterReminder;
    setWaterReminder(next);
    localStorage.setItem('morphiq_water_reminder', String(next));
  }

  return (
    <div className="page">
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-black text-white tracking-tight">Profile</h1>
        <p className="text-dim text-sm mt-0.5">{GOAL_LABELS[p.goal]}</p>
      </div>

      {/* Identity */}
      <div className="mx-5 mb-4 bg-card border border-border rounded-3xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-2xl font-black text-primary-light">
            {p.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-bold text-lg">{p.name}</p>
            <p className="text-muted text-xs">{p.sex === 'male' ? '♂' : '♀'} {p.age} yo · {p.weightKg} kg · {p.heightCm} cm</p>
          </div>
        </div>
      </div>

      {/* BMI card — kind messaging */}
      <div className={`mx-5 mb-4 rounded-3xl border p-5 ${bmiInfo.bg}`}>
        <div className="flex items-start gap-3">
          <span className="text-3xl">{bmiInfo.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`font-bold ${bmiInfo.color}`}>{bmiInfo.title}</p>
              <span className={`pill text-[10px] ${bmiInfo.bg} ${bmiInfo.color}`}>BMI {bmi}</span>
            </div>
            <p className="text-dim text-xs leading-relaxed">{bmiInfo.message}</p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-5 grid grid-cols-2 gap-2.5 mb-4">
        {[
          { label: 'Daily Target', value: `${targets.calories} kcal` },
          { label: 'TDEE', value: `${tdee} kcal` },
          { label: 'Activity', value: ACTIVITY_LABELS[p.activityLevel] },
          { label: 'BMI', value: `${bmi}` },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-muted text-xs mb-1">{s.label}</p>
            <p className="text-white font-bold text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Macro targets */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={16} className="text-primary-light" />
          <p className="text-white text-sm font-semibold">Daily Macro Targets</p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Protein', value: `${targets.protein}g`, color: 'text-primary-light' },
            { label: 'Carbs', value: `${targets.carbs}g`, color: 'text-green' },
            { label: 'Fat', value: `${targets.fat}g`, color: 'text-orange' },
          ].map(m => (
            <div key={m.label} className="bg-surface rounded-xl py-3">
              <p className={`font-bold text-sm ${m.color}`}>{m.value}</p>
              <p className="text-muted text-xs mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Update weight */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <p className="text-white text-sm font-semibold mb-3">Update Weight</p>
        <div className="flex gap-2">
          <input className="input-field flex-1" type="number" placeholder="Weight (kg)" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
          <button onClick={saveWeight} className="btn-primary px-5">
            {savedWeight ? <Check size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Water reminder toggle */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-400/10 flex items-center justify-center">
              💧
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Hydration Reminder</p>
              <p className="text-muted text-xs">Ask if you've had water on app open</p>
            </div>
          </div>
          <button
            onClick={toggleWaterReminder}
            className={`w-12 h-6 rounded-full transition-all duration-200 flex items-center ${waterReminder ? 'bg-primary justify-end' : 'bg-surface justify-start'} border border-border px-0.5`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Key size={16} className="text-primary-light" />
          <p className="text-white text-sm font-semibold">Gemini API Key</p>
        </div>
        <p className="text-muted text-xs mb-3">Free AI at aistudio.google.com</p>
        <div className="flex gap-2 mb-2.5">
          <input className="input-field flex-1" type={showKey ? 'text' : 'password'} placeholder="AIza..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
          <button onClick={() => setShowKey(!showKey)} className="px-3 bg-surface border border-border rounded-2xl text-muted text-xs flex-shrink-0">
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <button onClick={saveApiKey} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
          {savedKey ? <><Check size={15} /> Saved!</> : 'Save API Key'}
        </button>
        {p.geminiApiKey ? (
          <div className="mt-2.5 flex gap-2 text-green text-xs bg-green/8 px-3 py-2 rounded-xl border border-green/15">
            <Check size={12} className="mt-0.5 flex-shrink-0" /> AI features enabled
          </div>
        ) : (
          <div className="mt-2.5 flex gap-2 text-orange/80 text-xs bg-orange/8 px-3 py-2 rounded-xl border border-orange/15">
            <Info size={12} className="mt-0.5 flex-shrink-0" /> No key — AI features disabled. Tracking still works.
          </div>
        )}
      </div>

      {/* How to get key */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-8">
        <p className="text-white text-xs font-semibold mb-2">How to get a free Gemini key</p>
        <ol className="space-y-1 text-muted text-xs">
          {['Visit aistudio.google.com', 'Sign in with Google', 'Click "Get API Key" → "Create API Key"', 'Copy key (starts with AIza...)', 'Paste above and save'].map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary-light">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-muted text-xs mt-2 pt-2 border-t border-border">Free tier: 15 req/min · 1M tokens/day</p>
      </div>
    </div>
  );
}
