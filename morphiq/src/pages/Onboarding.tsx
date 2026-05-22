import { useState } from 'react';
import { ChevronRight, ChevronLeft, Flame, Dumbbell, Zap, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { UserProfile, Goal, ActivityLevel, Sex } from '../types';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const GOALS: { value: Goal; icon: LucideIcon; label: string; desc: string; bg: string; color: string }[] = [
  { value: 'lose_weight', icon: Flame, label: 'Lose Weight', desc: 'Burn fat & feel lighter', bg: 'bg-card-orange', color: 'text-orange' },
  { value: 'build_muscle', icon: Dumbbell, label: 'Build Muscle', desc: 'Gain strength & mass', bg: 'bg-card-blue', color: 'text-blue' },
  { value: 'maintain', icon: Zap, label: 'Stay Healthy', desc: 'Balance & maintain', bg: 'bg-card-mint', color: 'text-green' },
];

const ACTIVITIES: { value: ActivityLevel; label: string; sub: string }[] = [
  { value: 'sedentary', label: 'Sedentary', sub: 'Little exercise' },
  { value: 'light', label: 'Light', sub: '1–3 sessions / week' },
  { value: 'moderate', label: 'Moderate', sub: '3–5 sessions / week' },
  { value: 'active', label: 'Active', sub: '6–7 sessions / week' },
  { value: 'very_active', label: 'Very Active', sub: 'Twice a day' },
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

  function finish() {
    const profile: UserProfile = {
      name: name.trim() || 'You',
      sex, age: parseInt(age) || 25,
      weightKg: parseFloat(weight) || 70,
      heightCm: parseFloat(height) || 170,
      activityLevel: activity, goal,
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
        <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50" style={{ top: 'env(safe-area-inset-top)' }}>
          <div className="h-full bg-purple transition-all duration-500" style={{ width: `${(idx / (STEPS.length - 1)) * 100}%` }} />
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center px-6 py-16 max-w-md mx-auto w-full">

        {step === 'splash' && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-[28px] bg-purple flex items-center justify-center mx-auto mb-8 shadow-purple">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <path d="M22 5L27 17H39L29.5 24L33 36L22 29L11 36L14.5 24L5 17H17L22 5Z" fill="white" />
              </svg>
            </div>
            <h1 className="text-5xl font-black text-text mb-3 tracking-tight">Morphiq</h1>
            <p className="text-muted text-lg mb-12 leading-relaxed">Your body. Your rules.<br/>Nutrition & fitness, unified.</p>
            <button onClick={() => setStep('goal')} className="btn-primary w-full text-base">
              Get started <ChevronRight size={18} className="inline ml-1" />
            </button>
            <p className="text-muted text-xs mt-4">Takes 2 minutes · Free forever</p>
          </div>
        )}

        {step === 'goal' && (
          <div>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2">Step 1 of 4</p>
            <h2 className="text-3xl font-black text-text mb-1">What's your goal?</h2>
            <p className="text-muted mb-8">Everything will adapt to your answer.</p>
            <div className="space-y-3 mb-10">
              {GOALS.map(g => (
                <button key={g.value} onClick={() => setGoal(g.value)}
                  className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all text-left ${
                    goal === g.value
                      ? `${g.bg} border-2 border-transparent`
                      : 'bg-white border-2 border-border shadow-card'
                  }`}
                >
                  <g.icon size={28} strokeWidth={1.5} className={goal === g.value ? g.color : 'text-muted'} />
                  <div className="flex-1">
                    <p className={`font-black ${goal === g.value ? g.color : 'text-text'}`}>{g.label}</p>
                    <p className="text-muted text-sm mt-0.5">{g.desc}</p>
                  </div>
                  {goal === g.value && (
                    <div className="w-6 h-6 rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('body')} className="btn-primary w-full">Continue <ChevronRight size={16} className="inline ml-1" /></button>
          </div>
        )}

        {step === 'body' && (
          <div>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2">Step 2 of 4</p>
            <h2 className="text-3xl font-black text-text mb-1">About you</h2>
            <p className="text-muted mb-8">To calculate your personal calorie target.</p>
            <div className="space-y-3 mb-10">
              <input className="input-field" placeholder="Your first name" value={name} onChange={e => setName(e.target.value)} />
              <div className="flex gap-2">
                {(['male', 'female'] as Sex[]).map(s => (
                  <button key={s} onClick={() => setSex(s)}
                    className={`flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                      sex === s ? 'border-purple bg-purple-bg text-purple' : 'border-border bg-white text-muted'
                    }`}
                  >{s === 'male' ? '♂ Male' : '♀ Female'}</button>
                ))}
              </div>
              <input className="input-field" type="number" placeholder="Age (years)" value={age} onChange={e => setAge(e.target.value)} />
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input className="input-field pr-12" type="number" placeholder="Weight" value={weight} onChange={e => setWeight(e.target.value)} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">kg</span>
                </div>
                <div className="flex-1 relative">
                  <input className="input-field pr-12" type="number" placeholder="Height" value={height} onChange={e => setHeight(e.target.value)} />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm font-medium">cm</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('goal')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => setStep('activity')} className="btn-primary flex-1">Continue <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === 'activity' && (
          <div>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2">Step 3 of 4</p>
            <h2 className="text-3xl font-black text-text mb-1">Activity level</h2>
            <p className="text-muted mb-8">Be honest — it impacts your calorie needs.</p>
            <div className="space-y-2 mb-10">
              {ACTIVITIES.map(a => (
                <button key={a.value} onClick={() => setActivity(a.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    activity === a.value ? 'border-purple bg-purple-bg' : 'border-border bg-white shadow-card'
                  }`}
                >
                  <span className={`font-bold text-sm ${activity === a.value ? 'text-purple' : 'text-text'}`}>{a.label}</span>
                  <span className="text-muted text-xs">{a.sub}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('body')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => setStep('api')} className="btn-primary flex-1">Continue <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === 'api' && (
          <div>
            <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2">Step 4 of 4</p>
            <h2 className="text-3xl font-black text-text mb-1">AI Setup</h2>
            <p className="text-muted mb-6">Google Gemini 2.5 Flash analyzes your meal photos. 100% free.</p>
            <div className="bg-purple-bg rounded-2xl p-4 mb-5 space-y-2.5 text-sm">
              <p className="text-purple font-black mb-1">Get your free key in 30s</p>
              {['Go to aistudio.google.com', 'Sign in with Google', 'Click "Get API Key" → "Create API Key"', 'Paste below'].map((s, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-purple text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-dim text-sm">{s}</span>
                </div>
              ))}
            </div>
            <input className="input-field mb-2" placeholder="AIza... (your Gemini key)" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            <p className="text-muted text-xs mb-8">Stored only on your device. Never transmitted.</p>
            <div className="flex gap-2">
              <button onClick={() => setStep('activity')} className="btn-ghost"><ChevronLeft size={16} className="inline mr-1" />Back</button>
              <button onClick={() => setStep('ready')} className="btn-primary flex-1">{apiKey ? 'Continue' : 'Skip for now'} <ChevronRight size={16} className="inline ml-1" /></button>
            </div>
          </div>
        )}

        {step === 'ready' && (
          <div className="text-center">
            <div className="w-24 h-24 rounded-[28px] bg-purple flex items-center justify-center mx-auto mb-6 shadow-purple">
              <Sparkles size={44} strokeWidth={1.5} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-text mb-2">You're all set{name ? `, ${name}` : ''}!</h2>
            <p className="text-muted text-lg mb-12">Your personalized plan is ready.</p>
            <button onClick={finish} className="btn-primary w-full text-base">Open Morphiq</button>
          </div>
        )}
      </div>
    </div>
  );
}
