import { useState } from 'react';
import { Dumbbell, Sparkles, Loader, CheckCircle, Circle, Plus, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWorkoutPlan } from '../utils/gemini';
import { saveWorkout, generateId, getTodayKey } from '../utils/storage';
import type { WorkoutSession } from '../types';

const GOAL_PROGRAMS = {
  lose_weight: {
    label: 'Fat Burn Program',
    desc: 'High rep, low rest — maximize calorie burn',
    sessions: [
      {
        name: 'Full Body Circuit A',
        durationMin: 45,
        exercises: [
          { name: 'Jumping Jacks', sets: 3, reps: 30, restSec: 30, muscleGroups: ['cardio'] },
          { name: 'Bodyweight Squats', sets: 3, reps: 20, restSec: 45, muscleGroups: ['legs'] },
          { name: 'Push-Ups', sets: 3, reps: 15, restSec: 45, muscleGroups: ['chest', 'triceps'] },
          { name: 'Mountain Climbers', sets: 3, durationSec: 30, restSec: 30, muscleGroups: ['core', 'cardio'] },
          { name: 'Plank', sets: 3, durationSec: 45, restSec: 30, muscleGroups: ['core'] },
        ],
      },
      {
        name: 'Cardio + Core B',
        durationMin: 40,
        exercises: [
          { name: 'High Knees', sets: 4, durationSec: 30, restSec: 30, muscleGroups: ['cardio'] },
          { name: 'Burpees', sets: 3, reps: 10, restSec: 60, muscleGroups: ['full body'] },
          { name: 'Bicycle Crunches', sets: 3, reps: 20, restSec: 30, muscleGroups: ['core'] },
          { name: 'Lateral Lunges', sets: 3, reps: 12, restSec: 45, muscleGroups: ['legs'] },
          { name: 'Jump Rope (simulated)', sets: 3, durationSec: 60, restSec: 30, muscleGroups: ['cardio'] },
        ],
      },
    ],
  },
  build_muscle: {
    label: 'Hypertrophy Program',
    desc: 'Progressive overload for muscle growth',
    sessions: [
      {
        name: 'Push Day (Chest/Shoulders/Triceps)',
        durationMin: 55,
        exercises: [
          { name: 'Bench Press', sets: 4, reps: 8, restSec: 90, muscleGroups: ['chest'] },
          { name: 'Incline Dumbbell Press', sets: 3, reps: 10, restSec: 75, muscleGroups: ['chest'] },
          { name: 'Overhead Press', sets: 4, reps: 8, restSec: 90, muscleGroups: ['shoulders'] },
          { name: 'Lateral Raises', sets: 3, reps: 15, restSec: 60, muscleGroups: ['shoulders'] },
          { name: 'Tricep Dips', sets: 3, reps: 12, restSec: 60, muscleGroups: ['triceps'] },
        ],
      },
      {
        name: 'Pull Day (Back/Biceps)',
        durationMin: 55,
        exercises: [
          { name: 'Pull-Ups / Lat Pulldown', sets: 4, reps: 8, restSec: 90, muscleGroups: ['back'] },
          { name: 'Barbell Row', sets: 4, reps: 8, restSec: 90, muscleGroups: ['back'] },
          { name: 'Seated Cable Row', sets: 3, reps: 10, restSec: 75, muscleGroups: ['back'] },
          { name: 'Barbell Curl', sets: 3, reps: 10, restSec: 60, muscleGroups: ['biceps'] },
          { name: 'Hammer Curl', sets: 3, reps: 12, restSec: 60, muscleGroups: ['biceps'] },
        ],
      },
      {
        name: 'Leg Day',
        durationMin: 60,
        exercises: [
          { name: 'Barbell Squat', sets: 4, reps: 6, restSec: 120, muscleGroups: ['quads', 'glutes'] },
          { name: 'Romanian Deadlift', sets: 4, reps: 8, restSec: 90, muscleGroups: ['hamstrings', 'glutes'] },
          { name: 'Leg Press', sets: 3, reps: 12, restSec: 75, muscleGroups: ['quads'] },
          { name: 'Walking Lunges', sets: 3, reps: 12, restSec: 60, muscleGroups: ['legs'] },
          { name: 'Calf Raises', sets: 4, reps: 20, restSec: 45, muscleGroups: ['calves'] },
        ],
      },
    ],
  },
  maintain: {
    label: 'Balanced Fitness Program',
    desc: 'Strength + cardio for overall wellness',
    sessions: [
      {
        name: 'Full Body Strength A',
        durationMin: 50,
        exercises: [
          { name: 'Goblet Squat', sets: 3, reps: 12, restSec: 60, muscleGroups: ['legs'] },
          { name: 'Dumbbell Row', sets: 3, reps: 12, restSec: 60, muscleGroups: ['back'] },
          { name: 'Push-Ups', sets: 3, reps: 15, restSec: 60, muscleGroups: ['chest'] },
          { name: 'Romanian Deadlift', sets: 3, reps: 12, restSec: 75, muscleGroups: ['hamstrings'] },
          { name: 'Plank', sets: 3, durationSec: 45, restSec: 45, muscleGroups: ['core'] },
        ],
      },
      {
        name: 'Active Recovery / Cardio',
        durationMin: 35,
        exercises: [
          { name: 'Brisk Walk / Light Jog', sets: 1, durationSec: 1200, restSec: 0, muscleGroups: ['cardio'] },
          { name: 'Hip Flexor Stretch', sets: 2, durationSec: 60, restSec: 30, muscleGroups: ['flexibility'] },
          { name: 'Foam Rolling', sets: 1, durationSec: 300, restSec: 0, muscleGroups: ['recovery'] },
        ],
      },
    ],
  },
};

export default function Fitness() {
  const { state, refreshToday } = useApp();
  const [tab, setTab] = useState<'program' | 'ai'>('program');
  const [aiDays, setAiDays] = useState(4);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<number | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  const goal = state.profile?.goal ?? 'maintain';
  const program = GOAL_PROGRAMS[goal];

  function toggleExercise(i: number) {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function logWorkout(sessionIdx: number) {
    const session = program.sessions[sessionIdx];
    if (!session) return;
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
    setActiveSession(null);
    setCompletedExercises(new Set());
  }

  async function generatePlan() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    setAiResult('');
    try {
      const text = await getWorkoutPlan(state.profile.geminiApiKey, goal, aiDays);
      setAiResult(text);
    } catch {
      setAiResult('Failed. Check your API key in Profile.');
    } finally {
      setLoading(false);
    }
  }

  const todayWorkouts = state.todayLog.workouts;

  return (
    <div className="page-scroll pb-28">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-white">Fitness</h1>
        <p className="text-muted text-sm mt-1">{program.label} · {program.desc}</p>
      </div>

      {/* Today's Workouts */}
      {todayWorkouts.length > 0 && (
        <div className="px-5 mb-5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Zap size={18} className="text-secondary" /> Today's Activity
          </h2>
          <div className="space-y-2">
            {todayWorkouts.map((w) => (
              <div key={w.id} className="bg-secondary/10 border border-secondary/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={22} className="text-secondary flex-shrink-0" />
                <div>
                  <p className="text-white font-medium text-sm">{w.name}</p>
                  <p className="text-muted text-xs">{w.durationMin} min · {w.exercises.length} exercises</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 mb-5">
        <div className="flex bg-card border border-border rounded-2xl p-1 gap-1">
          <button
            onClick={() => setTab('program')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'program' ? 'bg-primary text-white' : 'text-muted'
            }`}
          >
            <Dumbbell size={16} /> My Program
          </button>
          <button
            onClick={() => setTab('ai')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              tab === 'ai' ? 'bg-primary text-white' : 'text-muted'
            }`}
          >
            <Sparkles size={16} /> AI Plan
          </button>
        </div>
      </div>

      {tab === 'program' && (
        <div className="px-5 space-y-4">
          {program.sessions.map((session, si) => (
            <div key={si} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => {
                  setActiveSession(activeSession === si ? null : si);
                  setCompletedExercises(new Set());
                }}
                className="w-full flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Dumbbell size={22} className="text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-semibold">{session.name}</p>
                  <p className="text-muted text-sm">{session.durationMin} min · {session.exercises.length} exercises</p>
                </div>
                <Plus size={18} className={`text-muted transition-transform ${activeSession === si ? 'rotate-45' : ''}`} />
              </button>

              {activeSession === si && (
                <div className="border-t border-border">
                  <div className="space-y-0">
                    {session.exercises.map((ex, ei) => (
                      <button
                        key={ei}
                        onClick={() => toggleExercise(ei)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          completedExercises.has(ei) ? 'bg-secondary/5' : ''
                        } ${ei < session.exercises.length - 1 ? 'border-b border-border' : ''}`}
                      >
                        {completedExercises.has(ei)
                          ? <CheckCircle size={20} className="text-secondary flex-shrink-0" />
                          : <Circle size={20} className="text-muted flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${completedExercises.has(ei) ? 'line-through text-muted' : 'text-white'}`}>
                            {ex.name}
                          </p>
                          <p className="text-muted text-xs">
                            {ex.sets} sets ·{' '}
                            {'reps' in ex && ex.reps ? `${ex.reps} reps` : `${'durationSec' in ex ? ex.durationSec : 0}s`} ·{' '}
                            {ex.restSec}s rest
                          </p>
                        </div>
                        <span className="text-xs text-muted capitalize">{ex.muscleGroups[0]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="p-4">
                    <button
                      onClick={() => logWorkout(si)}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} /> Log Workout Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'ai' && (
        <div className="px-5">
          {!state.profile?.geminiApiKey ? (
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Sparkles size={36} className="text-primary mx-auto mb-3" />
              <p className="text-white font-medium mb-1">AI Plan requires Gemini</p>
              <p className="text-muted text-sm">Add your free API key in Profile.</p>
            </div>
          ) : (
            <>
              <p className="text-muted text-sm mb-5">Generate a custom workout plan with AI, tailored to your exact goal.</p>
              <div className="mb-5">
                <p className="text-white text-sm font-medium mb-2">Days per week</p>
                <div className="flex gap-2">
                  {[2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      onClick={() => setAiDays(d)}
                      className={`w-10 h-10 rounded-xl border-2 font-bold text-sm transition-all ${
                        aiDays === d ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generatePlan} disabled={loading} className="btn-primary w-full mb-5 flex items-center justify-center gap-2">
                {loading ? <><Loader size={18} className="animate-spin" /> Generating...</> : <><Sparkles size={18} /> Generate Plan</>}
              </button>
              {aiResult && (
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{aiResult}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
