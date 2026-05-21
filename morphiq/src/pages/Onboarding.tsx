import { useState } from 'react';
import { Zap, ChevronRight, ChevronLeft } from 'lucide-react';
import type { UserProfile, Goal, ActivityLevel, Sex } from '../types';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const GOALS: { value: Goal; label: string; desc: string; emoji: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight', desc: 'Burn fat, feel lighter', emoji: '🔥' },
  { value: 'build_muscle', label: 'Build Muscle', desc: 'Gain strength & mass', emoji: '💪' },
  { value: 'maintain', label: 'Maintain', desc: 'Stay balanced & healthy', emoji: '⚖️' },
];

const ACTIVITIES: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'light', label: 'Light', desc: '1-3 days/week' },
  { value: 'moderate', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'active', label: 'Active', desc: '6-7 days/week' },
  { value: 'very_active', label: 'Very Active', desc: 'Twice a day' },
];

type Step = 'welcome' | 'goal' | 'body' | 'activity' | 'api' | 'done';

export default function Onboarding() {
  const { setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');

  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<Goal>('lose_weight');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [apiKey, setApiKey] = useState('');

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

  const steps: Step[] = ['welcome', 'goal', 'body', 'activity', 'api', 'done'];
  const idx = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {step !== 'welcome' && step !== 'done' && (
          <div className="flex gap-1 mb-8">
            {steps.slice(1, -1).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${i < idx ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        )}

        {step === 'welcome' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/20 mb-6">
              <Zap size={40} className="text-primary" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2">Morphiq</h1>
            <p className="text-muted text-lg mb-10">Transform your body.<br />Own your nutrition.</p>
            <button onClick={() => setStep('goal')} className="btn-primary w-full text-lg py-4">
              Get Started <ChevronRight size={20} className="inline" />
            </button>
          </div>
        )}

        {step === 'goal' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">What's your goal?</h2>
            <p className="text-muted mb-6">We'll tailor everything around it.</p>
            <div className="space-y-3 mb-8">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    goal === g.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <span className="text-3xl">{g.emoji}</span>
                  <div className="text-left">
                    <div className="text-white font-semibold">{g.label}</div>
                    <div className="text-muted text-sm">{g.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('body')} className="btn-primary w-full">
              Continue <ChevronRight size={18} className="inline" />
            </button>
          </div>
        )}

        {step === 'body' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">About you</h2>
            <p className="text-muted mb-6">To calculate your exact calorie targets.</p>
            <div className="space-y-4 mb-8">
              <input
                className="input-field"
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="flex gap-3">
                {(['male', 'female'] as Sex[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSex(s)}
                    className={`flex-1 py-3 rounded-xl border-2 capitalize font-medium transition-all ${
                      sex === s ? 'border-primary bg-primary/10 text-white' : 'border-border text-muted'
                    }`}
                  >
                    {s === 'male' ? '♂ Male' : '♀ Female'}
                  </button>
                ))}
              </div>
              <input
                className="input-field"
                type="number"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <div className="flex gap-3">
                <input
                  className="input-field flex-1"
                  type="number"
                  placeholder="Weight (kg)"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  className="input-field flex-1"
                  type="number"
                  placeholder="Height (cm)"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('goal')} className="btn-secondary flex-1">
                <ChevronLeft size={18} className="inline" /> Back
              </button>
              <button onClick={() => setStep('activity')} className="btn-primary flex-1">
                Continue <ChevronRight size={18} className="inline" />
              </button>
            </div>
          </div>
        )}

        {step === 'activity' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Activity level</h2>
            <p className="text-muted mb-6">How active are you currently?</p>
            <div className="space-y-2 mb-8">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setActivity(a.value)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    activity === a.value ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <span className={`font-medium ${activity === a.value ? 'text-white' : 'text-muted'}`}>{a.label}</span>
                  <span className="text-muted text-sm">{a.desc}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep('body')} className="btn-secondary flex-1">
                <ChevronLeft size={18} className="inline" /> Back
              </button>
              <button onClick={() => setStep('api')} className="btn-primary flex-1">
                Continue <ChevronRight size={18} className="inline" />
              </button>
            </div>
          </div>
        )}

        {step === 'api' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">AI Setup</h2>
            <p className="text-muted mb-4">Morphiq uses Google Gemini to analyze your meal photos. It's free!</p>
            <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-sm text-muted space-y-2">
              <p className="text-white font-medium">How to get a free API key:</p>
              <p>1. Go to <span className="text-secondary">aistudio.google.com</span></p>
              <p>2. Sign in with Google</p>
              <p>3. Click "Get API Key" → "Create API Key"</p>
              <p>4. Copy and paste it below</p>
            </div>
            <input
              className="input-field mb-3"
              placeholder="AIza... (your Gemini API key)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-muted text-xs mb-8">
              Key is stored only on your device. You can add it later in Profile.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setStep('activity')} className="btn-secondary flex-1">
                <ChevronLeft size={18} className="inline" /> Back
              </button>
              <button onClick={() => setStep('done')} className="btn-primary flex-1">
                {apiKey ? 'Continue' : 'Skip for now'} <ChevronRight size={18} className="inline" />
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <div className="text-6xl mb-6">🚀</div>
            <h2 className="text-2xl font-bold text-white mb-2">You're all set{name ? `, ${name}` : ''}!</h2>
            <p className="text-muted mb-10">Your journey starts now. Let's transform together.</p>
            <button onClick={finish} className="btn-primary w-full text-lg py-4">
              Open Morphiq
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
