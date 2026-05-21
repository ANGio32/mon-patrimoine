import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { UserProfile, Goal, ActivityLevel, Sex } from '../types';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const GOALS: { value: Goal; emoji: string; label: string; desc: string; color: string }[] = [
  { value: 'lose_weight', emoji: '🔥', label: 'Lose Weight', desc: 'Burn fat & feel lighter', color: '#F97316' },
  { value: 'build_muscle', emoji: '💪', label: 'Build Muscle', desc: 'Gain strength & mass', color: '#8B5CF6' },
  { value: 'maintain', emoji: '⚡', label: 'Maintain', desc: 'Stay balanced & healthy', color: '#22C55E' },
];

const ACTIVITIES: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Desk job, little exercise' },
  { value: 'light', label: 'Light', sub: '1–3 workouts / week' },
  { value: 'moderate', label: 'Moderate', sub: '3–5 workouts / week' },
  { value: 'active', label: 'Active', sub: '6–7 workouts / week' },
  { value: 'very_active', label: 'Very Active', sub: 'Twice a day training' },
];

type Step = 'splash' | 'goal' | 'body' | 'activity' | 'api' | 'ready';
const STEPS: Step[] = ['splash', 'goal', 'body', 'activity', 'api', 'ready'];

export default function Onboarding() {
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('splash');
  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [sex, setSex] = useState<Sex>('male');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [apiKey, setApiKey] = useState('');

  const idx = STEPS.indexOf(step);
  const progress = idx / (STEPS.length - 1);

  function next(to: Step) { setStep(to); }

  function finish() {
    const profile: UserProfile = {
      name: name.trim() || 'You',
      sex,
      age: parseInt(age) || 25,
      weightKg: parseFloat(weight) || 70,
      heightCm: parseFloat(height) || 170,
      activityLevel: activity,
      goal,
      geminiApiKey: apiKey.trim(),
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };
    setProfile(profile);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar */}
      {step !== 'splash' && step !== 'ready' && (
        <div className="fixed top-0 left-0 right-0 h-0.5 bg-surface z-50">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-md mx-auto w-full">

        {/* SPLASH */}
        {step === 'splash' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/15 flex items-center justify-center mx-auto mb-8 border border-primary/20">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M18 4L22 14H32L24 20L27 30L18 24L9 30L12 20L4 14H14L18 4Z" fill="#8B5CF6" />
              </svg>
            </div>
            <h1 className="text-5xl font-black text-white mb-3 tracking-tight">Morphiq</h1>
            <p className="text-dim text-lg mb-12">Your body. Your rules.<br />Transform through nutrition & sport.</p>
            <button onClick={() => next('goal')} className="btn-primary w-full text-base">
              Get started
            </button>
            <p className="text-muted text-xs mt-4">Takes 2 minutes to set up</p>
          </div>
        )}

        {/* GOAL */}
        {step === 'goal' && (
          <div>
            <p className="text-muted text-sm mb-2 font-medium uppercase tracking-widest">Step 1</p>
            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">What's your goal?</h2>
            <p className="text-dim mb-8">Everything adapts to it.</p>
            <div className="space-y-3 mb-10">
              {GOALS.map(g => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all duration-150 text-left ${
                    goal === g.value
                      ? 'border-white/20 bg-white/5'
                      : 'border-border bg-card/50'
                  }`}
                >
                  <span className="text-3xl w-10 text-center">{g.emoji}</span>
                  <div className="flex-1">
                    <div className="text-white font-semibold">{g.label}</div>
                    <div className="text-dim text-sm mt-0.5">{g.desc}</div>
                  </div>
                  {goal === g.value && (
                    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-bg" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => next('body')} className="btn-primary w-full">Continue <ChevronRight size={16} className="inline ml-1" /></button>
          </div>
        )}

        {/* BODY */}
        {step === 'body' && (
          <div>
            <p className="text-muted text-sm mb-2 font-medium uppercase tracking-widest">Step 2</p>
            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">About you</h2>
            <p className="text-dim mb-8">To calculate your exact targets.</p>
            <div className="space-y-3 mb-10">
              <input className="input-field" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              <div className="flex gap-2">
                {(['male', 'female'] as Sex[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 py-3.5 rounded-2xl border font-medium text-sm transition-all ${
                      sex === s ? 'border-white/20 bg-white/5 text-white' : 'border-border text-muted bg-card/50'
                    }`}
                  >
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
              <input className="input-field" type="number" placeholder="Age" value={age} onChange={e => setAge(e.target.value)} />
              <div className="flex gap-2">
                <input className="input-field" type="number" placeholder="Weight (kg)" value={weight} onChange={e => setWeight(e.target.value)} />
                <input className="input-field" type="number" placeholder="Height (cm)" value={height} onChange={e => setHeight(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => next('goal')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => next('activity')} className="btn-primary flex-1">Continue <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {/* ACTIVITY */}
        {step === 'activity' && (
          <div>
            <p className="text-muted text-sm mb-2 font-medium uppercase tracking-widest">Step 3</p>
            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">Activity level</h2>
            <p className="text-dim mb-8">Be honest — it impacts your calories.</p>
            <div className="space-y-2 mb-10">
              {ACTIVITIES.map(a => (
                <button
                  key={a.value}
                  onClick={() => setActivity(a.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                    activity === a.value ? 'border-white/20 bg-white/5' : 'border-border bg-card/50'
                  }`}
                >
                  <span className={`font-medium text-sm ${activity === a.value ? 'text-white' : 'text-dim'}`}>{a.label}</span>
                  <span className="text-muted text-xs">{a.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => next('body')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => next('api')} className="btn-primary flex-1">Continue <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {/* API */}
        {step === 'api' && (
          <div>
            <p className="text-muted text-sm mb-2 font-medium uppercase tracking-widest">Step 4</p>
            <h2 className="text-3xl font-black text-white mb-1 tracking-tight">AI Setup</h2>
            <p className="text-dim mb-6">Morphiq uses Google Gemini to analyze your meal photos. 100% free.</p>

            <div className="bg-card rounded-2xl border border-border p-4 mb-5 space-y-1.5 text-sm">
              <p className="text-white font-medium mb-2">Get your free key in 30 seconds</p>
              {['Go to aistudio.google.com', 'Sign in with Google', 'Click "Get API Key" → "Create API Key"', 'Paste it below'].map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-dim">{s}</span>
                </div>
              ))}
            </div>

            <input className="input-field mb-2" placeholder="AIza... (paste your key)" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            <p className="text-muted text-xs mb-8">Stored only on your device. Never sent anywhere else.</p>

            <div className="flex gap-2">
              <button onClick={() => next('activity')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => next('ready')} className="btn-primary flex-1">{apiKey ? 'Continue' : 'Skip for now'} <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {/* READY */}
        {step === 'ready' && (
          <div className="text-center">
            <div className="text-7xl mb-6">🚀</div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">You're all set{name ? `, ${name}` : ''}!</h2>
            <p className="text-dim mb-12">Your personalized plan is ready.<br />Let's transform together.</p>
            <button onClick={finish} className="btn-primary w-full text-base">Open Morphiq</button>
          </div>
        )}
      </div>
    </div>
  );
}
