import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Sparkles, Loader, CheckCircle, Play, Pause, SkipForward, X, Trophy } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWorkoutPlan } from '../utils/gemini';
import { saveWorkout, generateId, getTodayKey } from '../utils/storage';
import type { WorkoutSession, Exercise } from '../types';
import StickFigure from '../components/StickFigure';

const GOAL_PROGRAMS = {
  lose_weight: {
    tag: 'Fat Burn',
    sessions: [
      {
        name: 'Full Body Circuit A',
        durationMin: 45,
        exercises: [
          { name: 'Jumping Jacks', sets: 3, reps: 30, restSec: 30, muscleGroups: ['cardio'], durationSec: undefined },
          { name: 'Bodyweight Squats', sets: 3, reps: 20, restSec: 45, muscleGroups: ['legs', 'glutes'], durationSec: undefined },
          { name: 'Push-Ups', sets: 3, reps: 15, restSec: 45, muscleGroups: ['chest', 'triceps', 'shoulders'], durationSec: undefined },
          { name: 'Mountain Climbers', sets: 3, durationSec: 30, restSec: 30, muscleGroups: ['core', 'cardio'], reps: undefined },
          { name: 'Plank', sets: 3, durationSec: 45, restSec: 30, muscleGroups: ['core', 'shoulders'], reps: undefined },
        ] as Exercise[],
      },
      {
        name: 'Cardio & Core B',
        durationMin: 40,
        exercises: [
          { name: 'High Knees', sets: 4, durationSec: 30, restSec: 30, muscleGroups: ['cardio', 'legs'], reps: undefined },
          { name: 'Burpees', sets: 3, reps: 10, restSec: 60, muscleGroups: ['full body', 'cardio'], durationSec: undefined },
          { name: 'Bicycle Crunches', sets: 3, reps: 20, restSec: 30, muscleGroups: ['core', 'obliques'], durationSec: undefined },
          { name: 'Lateral Lunges', sets: 3, reps: 12, restSec: 45, muscleGroups: ['legs', 'glutes'], durationSec: undefined },
          { name: 'Jumping Jacks', sets: 3, durationSec: 60, restSec: 30, muscleGroups: ['cardio'], reps: undefined },
        ] as Exercise[],
      },
    ],
  },
  build_muscle: {
    tag: 'Hypertrophy',
    sessions: [
      {
        name: 'Push Day',
        durationMin: 55,
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, restSec: 90, muscleGroups: ['chest', 'triceps'], durationSec: undefined },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restSec: 75, muscleGroups: ['chest upper', 'shoulders'], durationSec: undefined },
          { name: 'Overhead Press', sets: 4, reps: 8, restSec: 90, muscleGroups: ['shoulders', 'triceps'], durationSec: undefined },
          { name: 'Lateral Raises', sets: 3, reps: 15, restSec: 60, muscleGroups: ['shoulders lateral'], durationSec: undefined },
          { name: 'Tricep Dips', sets: 3, reps: 12, restSec: 60, muscleGroups: ['triceps', 'chest'], durationSec: undefined },
        ] as Exercise[],
      },
      {
        name: 'Pull Day',
        durationMin: 55,
        exercises: [
          { name: 'Pull-Ups', sets: 4, reps: 8, restSec: 90, muscleGroups: ['back', 'biceps'], durationSec: undefined },
          { name: 'Barbell Row', sets: 4, reps: 8, restSec: 90, muscleGroups: ['back', 'rear delts'], durationSec: undefined },
          { name: 'Seated Cable Row', sets: 3, reps: 10, restSec: 75, muscleGroups: ['back middle'], durationSec: undefined },
          { name: 'Barbell Curl', sets: 3, reps: 10, restSec: 60, muscleGroups: ['biceps'], durationSec: undefined },
          { name: 'Hammer Curl', sets: 3, reps: 12, restSec: 60, muscleGroups: ['biceps', 'forearms'], durationSec: undefined },
        ] as Exercise[],
      },
      {
        name: 'Leg Day',
        durationMin: 60,
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: 6, restSec: 120, muscleGroups: ['quads', 'glutes'], durationSec: undefined },
          { name: 'Romanian Deadlift', sets: 4, reps: 8, restSec: 90, muscleGroups: ['hamstrings', 'glutes'], durationSec: undefined },
          { name: 'Leg Press', sets: 3, reps: 12, restSec: 75, muscleGroups: ['quads', 'glutes'], durationSec: undefined },
          { name: 'Walking Lunges', sets: 3, reps: 12, restSec: 60, muscleGroups: ['legs', 'balance'], durationSec: undefined },
          { name: 'Calf Raises', sets: 4, reps: 20, restSec: 45, muscleGroups: ['calves'], durationSec: undefined },
        ] as Exercise[],
      },
    ],
  },
  maintain: {
    tag: 'Balance',
    sessions: [
      {
        name: 'Full Body Strength',
        durationMin: 50,
        exercises: [
          { name: 'Bodyweight Squats', sets: 3, reps: 15, restSec: 60, muscleGroups: ['legs', 'glutes'], durationSec: undefined },
          { name: 'Push-Ups', sets: 3, reps: 15, restSec: 60, muscleGroups: ['chest', 'triceps'], durationSec: undefined },
          { name: 'Jumping Jacks', sets: 3, durationSec: 45, restSec: 30, muscleGroups: ['cardio'], reps: undefined },
          { name: 'Plank', sets: 3, durationSec: 45, restSec: 45, muscleGroups: ['core'], reps: undefined },
          { name: 'Mountain Climbers', sets: 3, durationSec: 30, restSec: 30, muscleGroups: ['cardio', 'core'], reps: undefined },
        ] as Exercise[],
      },
    ],
  },
};

// ─── Workout Player ─────────────────────────────────────────────────────────

interface PlayerProps {
  session: typeof GOAL_PROGRAMS.lose_weight.sessions[0];
  onDone: () => void;
  onClose: () => void;
}

function WorkoutPlayer({ session, onDone, onClose }: PlayerProps) {
  const exercises = session.exercises;
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<'exercise' | 'rest'>('exercise');
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ex = exercises[exIdx];
  const totalSets = ex?.sets ?? 1;
  const exDuration = ex?.durationSec ?? 40;
  const restDuration = ex?.restSec ?? 45;
  const phaseDuration = phase === 'exercise' ? exDuration : restDuration;

  useEffect(() => {
    setTimer(phaseDuration);
  }, [exIdx, setIdx, phase, phaseDuration]);

  useEffect(() => {
    if (!running || done) return;
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          advance();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, exIdx, setIdx, phase, done]);

  function advance() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (phase === 'exercise') {
      setPhase('rest');
    } else {
      // move to next set or exercise
      if (setIdx < totalSets - 1) {
        setSetIdx(s => s + 1);
        setPhase('exercise');
      } else if (exIdx < exercises.length - 1) {
        setExIdx(e => e + 1);
        setSetIdx(0);
        setPhase('exercise');
      } else {
        setDone(true);
      }
    }
  }

  function skip() { advance(); }

  const progress = timer / phaseDuration;
  const c = 2 * Math.PI * 42;
  const totalExercises = exercises.length;
  const overallProgress = (exIdx + setIdx / totalSets) / totalExercises;

  if (done) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-8 text-center">
        <Trophy size={64} className="text-amber-400 mb-6" />
        <h2 className="text-3xl font-black text-text mb-2">Workout done!</h2>
        <p className="text-dim mb-2">{session.name}</p>
        <p className="text-muted text-sm mb-10">{session.durationMin} min · {exercises.length} exercises</p>
        <button onClick={onDone} className="btn-primary w-full max-w-xs">Save & Continue</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-14 pb-3">
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-section border border-border flex items-center justify-center">
          <X size={18} className="text-text" />
        </button>
        <p className="text-dim text-sm font-medium">{session.name}</p>
        <div className="text-xs text-muted">{exIdx + 1}/{totalExercises}</div>
      </div>

      {/* Overall progress */}
      <div className="mx-5 h-1 bg-section rounded-full mb-6">
        <div className="h-full bg-purple rounded-full transition-all duration-500" style={{ width: `${overallProgress * 100}%` }} />
      </div>

      {/* Main display */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Phase label */}
        <div className={`pill mb-6 ${phase === 'rest' ? 'bg-card-orange text-orange' : 'bg-purple-bg text-purple'}`}>
          {phase === 'rest' ? '😮‍💨 Rest' : `Set ${setIdx + 1} / ${totalSets}`}
        </div>

        {/* Exercise name */}
        <h2 className="text-2xl font-black text-text mb-1 text-center tracking-tight">{ex?.name}</h2>
        <p className="text-dim text-sm mb-8 text-center">
          {ex?.reps ? `${ex.reps} reps` : `${exDuration}s`} · {ex?.muscleGroups.join(', ')}
        </p>

        {/* Stick figure */}
        <div className="mb-8">
          {phase === 'rest' ? (
            <div className="w-24 h-24 flex items-center justify-center">
              <span className="text-5xl">💧</span>
            </div>
          ) : (
            <div className="p-2">
              <StickFigure exercise={ex?.name ?? ''} size={120} />
            </div>
          )}
        </div>

        {/* Timer ring */}
        <div className="relative w-28 h-28 mb-8">
          <svg width={112} height={112} className="-rotate-90">
            <circle cx={56} cy={56} r={42} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={7} />
            <circle cx={56} cy={56} r={42} fill="none"
              stroke={phase === 'rest' ? '#EA580C' : '#7C3AED'}
              strokeWidth={7}
              strokeDasharray={`${progress * c} ${c}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-text">{timer}</span>
            <span className="text-muted text-xs">sec</span>
          </div>
        </div>

        {/* Upcoming */}
        {exIdx < exercises.length - 1 && phase === 'rest' && (
          <div className="bg-purple-bg rounded-2xl px-5 py-3 flex items-center gap-3">
            <StickFigure exercise={exercises[exIdx + 1]?.name ?? ''} size={40} />
            <div>
              <p className="text-muted text-xs">Up next</p>
              <p className="text-text text-sm font-medium">{exercises[exIdx + 1]?.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-5 pb-10">
        <button
          onClick={() => setRunning(r => !r)}
          className="w-14 h-14 rounded-full bg-section border border-border flex items-center justify-center"
        >
          {running ? <Pause size={22} className="text-text" /> : <Play size={22} className="text-text" />}
        </button>
        <button
          onClick={skip}
          className="w-14 h-14 rounded-full bg-[#1C1C1E] flex items-center justify-center shadow-lg"
        >
          <SkipForward size={22} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Fitness Page ───────────────────────────────────────────────────────

export default function Fitness() {
  const { state, refreshToday } = useApp();
  const [tab, setTab] = useState<'program' | 'ai'>('program');
  const [aiDays, setAiDays] = useState(4);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePlayer, setActivePlayer] = useState<typeof GOAL_PROGRAMS.lose_weight.sessions[0] | null>(null);

  const goal = state.profile?.goal ?? 'maintain';
  const program = GOAL_PROGRAMS[goal];

  function handleWorkoutDone(session: typeof GOAL_PROGRAMS.lose_weight.sessions[0]) {
    const workout: WorkoutSession = {
      id: generateId(),
      date: getTodayKey(),
      name: session.name,
      exercises: session.exercises,
      durationMin: session.durationMin,
      completed: true,
    };
    saveWorkout(workout);
    refreshToday();
    setActivePlayer(null);
  }

  async function generatePlan() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    setAiResult('');
    try {
      const text = await getWorkoutPlan(state.profile.geminiApiKey, goal, aiDays);
      setAiResult(text);
    } catch { setAiResult('Failed. Check your API key in Profile.'); }
    finally { setLoading(false); }
  }

  const todayWorkouts = state.todayLog.workouts;

  return (
    <>
      {activePlayer && (
        <WorkoutPlayer
          session={activePlayer}
          onDone={() => handleWorkoutDone(activePlayer)}
          onClose={() => setActivePlayer(null)}
        />
      )}

      <div className="page bg-bg">
        <div className="px-5 pt-14 pb-4">
          <h1 className="text-2xl font-black text-text tracking-tight">Fitness</h1>
          <p className="text-dim text-sm mt-1">{program.tag} Program</p>
        </div>

        {/* Done today */}
        {todayWorkouts.length > 0 && (
          <div className="px-5 mb-5">
            {todayWorkouts.map(w => (
              <div key={w.id} className="bg-card-mint rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green flex-shrink-0" />
                <div>
                  <p className="text-text font-medium text-sm">{w.name}</p>
                  <p className="text-dim text-xs">{w.durationMin} min · {w.exercises.length} exercises</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="px-5 mb-5">
          <div className="flex bg-white shadow-card rounded-2xl p-1 gap-1">
            {(['program', 'ai'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${tab === t ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}
              >
                {t === 'program' ? <><Dumbbell size={15} /> My Program</> : <><Sparkles size={15} /> AI Plan</>}
              </button>
            ))}
          </div>
        </div>

        {tab === 'program' && (
          <div className="px-5 space-y-4">
            {program.sessions.map((session, si) => (
              <div key={si} className="bg-white shadow-card rounded-3xl overflow-hidden">
                {/* Session header */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-text font-bold">{session.name}</h3>
                      <p className="text-muted text-xs mt-0.5">{session.durationMin} min · {session.exercises.length} exercises</p>
                    </div>
                    <button
                      onClick={() => setActivePlayer(session)}
                      className="flex items-center gap-2 bg-[#1C1C1E] px-4 py-2 rounded-xl text-white text-sm font-bold active:scale-95 transition-all"
                    >
                      <Play size={14} fill="white" /> Start
                    </button>
                  </div>

                  {/* Exercise previews with stick figures */}
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    {session.exercises.map((ex, ei) => (
                      <div key={ei} className="flex-shrink-0 flex flex-col items-center gap-1 w-16">
                        <div className="w-14 h-14 rounded-2xl bg-purple-bg flex items-center justify-center">
                          <StickFigure exercise={ex.name} size={44} />
                        </div>
                        <p className="text-muted text-[9px] text-center leading-tight line-clamp-2">{ex.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exercise list */}
                <div className="border-t border-border">
                  {session.exercises.map((ex, ei) => (
                    <div key={ei} className={`flex items-center gap-3 px-5 py-3 ${ei < session.exercises.length - 1 ? 'border-b border-border' : ''}`}>
                      <div className="w-8 h-8 rounded-xl bg-purple-bg flex items-center justify-center flex-shrink-0">
                        <StickFigure exercise={ex.name} size={28} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-text text-sm font-medium">{ex.name}</p>
                        <p className="text-muted text-xs mt-0.5">
                          {ex.sets} sets · {ex.reps ? `${ex.reps} reps` : `${ex.durationSec ?? 30}s`} · {ex.restSec}s rest
                        </p>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[100px]">
                        {ex.muscleGroups.slice(0, 2).map(m => (
                          <span key={m} className="pill bg-section text-dim border border-border text-[9px]">{m}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'ai' && (
          <div className="px-5">
            {!state.profile?.geminiApiKey ? (
              <div className="bg-white shadow-card rounded-2xl p-6 text-center">
                <Sparkles size={32} className="text-purple mx-auto mb-3" />
                <p className="text-text font-medium mb-1 text-sm">Requires Gemini API key</p>
                <p className="text-muted text-xs">Add it in Profile — it's free.</p>
              </div>
            ) : (
              <>
                <p className="text-dim text-sm mb-5">Generate a custom workout plan with AI, tailored to your exact goal.</p>
                <div className="mb-5">
                  <p className="text-dim text-xs font-medium mb-3 uppercase tracking-widest">Days per week</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(d => (
                      <button key={d} onClick={() => setAiDays(d)}
                        className={`w-11 h-11 rounded-2xl border-2 font-bold text-sm transition-all ${aiDays === d ? 'border-purple bg-purple-bg text-purple' : 'border-border text-muted bg-white'}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                <button onClick={generatePlan} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2 text-sm">
                  {loading ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Sparkles size={16} /> Generate Plan</>}
                </button>
                {aiResult && (
                  <div className="bg-white shadow-card rounded-2xl p-4">
                    <p className="text-dim text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
