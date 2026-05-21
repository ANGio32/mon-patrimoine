import { useState } from 'react';
import { User, Key, Target, Activity, ChevronRight, Check, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE, getBMI, getBMICategory } from '../utils/calculations';
import type { Goal, ActivityLevel } from '../types';

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: '🔥 Lose Weight',
  build_muscle: '💪 Build Muscle',
  maintain: '⚖️ Maintain',
};

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  very_active: 'Very Active',
};

export default function Profile() {
  const { state, setProfile } = useApp();
  const profile = state.profile;

  const [apiKey, setApiKey] = useState(profile?.geminiApiKey ?? '');
  const [editWeight, setEditWeight] = useState(String(profile?.weightKg ?? ''));
  const [savedKey, setSavedKey] = useState(false);
  const [savedWeight, setSavedWeight] = useState(false);
  const [showKeyValue, setShowKeyValue] = useState(false);

  if (!profile) return null;

  const targets = calculateTargets(profile);
  const tdee = calculateTDEE(profile);
  const bmi = getBMI(profile);
  const bmiCat = getBMICategory(bmi);

  const p = profile;

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

  return (
    <div className="page-scroll pb-28">
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center">
            <User size={30} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
            <p className="text-muted text-sm">{GOAL_LABELS[profile.goal]}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-5 mb-5 grid grid-cols-2 gap-3">
        {[
          { label: 'Weight', value: `${profile.weightKg} kg` },
          { label: 'Height', value: `${profile.heightCm} cm` },
          { label: 'TDEE', value: `${tdee} kcal` },
          { label: 'BMI', value: `${bmi} · ${bmiCat}` },
          { label: 'Daily Target', value: `${targets.calories} kcal` },
          { label: 'Activity', value: ACTIVITY_LABELS[profile.activityLevel] },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-muted text-xs">{s.label}</p>
            <p className="text-white font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Macro Targets */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Target size={18} className="text-primary" />
          <h3 className="text-white font-semibold">Daily Macro Targets</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-bg rounded-xl p-3">
            <p className="text-secondary font-bold">{targets.protein}g</p>
            <p className="text-muted text-xs">Protein</p>
          </div>
          <div className="bg-bg rounded-xl p-3">
            <p className="text-blue-400 font-bold">{targets.carbs}g</p>
            <p className="text-muted text-xs">Carbs</p>
          </div>
          <div className="bg-bg rounded-xl p-3">
            <p className="text-accent font-bold">{targets.fat}g</p>
            <p className="text-muted text-xs">Fat</p>
          </div>
        </div>
      </div>

      {/* Update Weight */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={18} className="text-secondary" />
          <h3 className="text-white font-semibold">Update Weight</h3>
        </div>
        <div className="flex gap-3">
          <input
            className="input-field flex-1"
            type="number"
            placeholder="Weight (kg)"
            value={editWeight}
            onChange={(e) => setEditWeight(e.target.value)}
          />
          <button onClick={saveWeight} className="btn-primary px-5 flex items-center gap-2">
            {savedWeight ? <Check size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {/* API Key */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Key size={18} className="text-primary" />
          <h3 className="text-white font-semibold">Gemini API Key</h3>
        </div>
        <p className="text-muted text-xs mb-3">Required for AI food analysis & suggestions. Free at aistudio.google.com</p>
        <div className="flex gap-2 mb-3">
          <input
            className="input-field flex-1"
            type={showKeyValue ? 'text' : 'password'}
            placeholder="AIza..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            onClick={() => setShowKeyValue(!showKeyValue)}
            className="px-3 bg-bg border border-border rounded-xl text-muted text-xs"
          >
            {showKeyValue ? 'Hide' : 'Show'}
          </button>
        </div>
        <button onClick={saveApiKey} className="btn-primary w-full flex items-center justify-center gap-2">
          {savedKey ? <><Check size={18} /> Saved!</> : 'Save API Key'}
        </button>
        {!profile.geminiApiKey && (
          <div className="mt-3 flex gap-2 text-amber-400 text-xs bg-amber-400/10 px-3 py-2 rounded-xl">
            <Info size={14} className="flex-shrink-0 mt-0.5" />
            <span>No key set — AI features are disabled. Calorie tracking still works without it.</span>
          </div>
        )}
        {profile.geminiApiKey && (
          <div className="mt-3 flex gap-2 text-secondary text-xs bg-secondary/10 px-3 py-2 rounded-xl">
            <Check size={14} className="flex-shrink-0 mt-0.5" />
            <span>AI features enabled!</span>
          </div>
        )}
      </div>

      {/* How to get API key */}
      <div className="mx-5 bg-card border border-border rounded-2xl p-4 mb-5">
        <p className="text-white text-sm font-medium mb-2">How to get a free Gemini key</p>
        <ol className="space-y-1 text-muted text-sm">
          <li>1. Visit <span className="text-secondary">aistudio.google.com</span></li>
          <li>2. Sign in with your Google account</li>
          <li>3. Click <strong className="text-white">"Get API Key"</strong></li>
          <li>4. Click <strong className="text-white">"Create API Key"</strong></li>
          <li>5. Copy the key (starts with "AIza...")</li>
          <li>6. Paste it above and save</li>
        </ol>
        <p className="text-muted text-xs mt-2">Free tier: 15 requests/min, 1M tokens/day — more than enough!</p>
      </div>
    </div>
  );
}
