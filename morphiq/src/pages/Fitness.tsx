import { useState, useEffect, useRef } from 'react';
import { Dumbbell, Sparkles, Loader, CheckCircle, Play, Pause, SkipForward, X, Trophy, Trash2, Plus, Zap, Home, Droplets, Video } from 'lucide-react';
import ExerciseVideosTab from '../components/ExerciseVideosTab';
import { useApp } from '../context/AppContext';
import { generateStructuredProgram, getAdaptedSession } from '../utils/gemini';
import { saveWorkout, generateId, getTodayKey, saveAiProgram, loadAiPrograms, deleteAiProgram } from '../utils/storage';
import type { WorkoutSession, Exercise, AiProgram, AiProgramSession } from '../types';
import StickFigure, { EXERCISE_CUES } from '../components/StickFigure';
import ExerciseMedia from '../components/ExerciseMedia';

function getExerciseCue(name: string): string {
  const key = name.toLowerCase();
  for (const [k, cue] of Object.entries(EXERCISE_CUES)) {
    if (key.includes(k)) return cue;
  }
  return 'Focus on controlled movement and proper form';
}

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
  session: AiProgramSession;
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
  const totalExercises = exercises.length;
  const overallProgress = (exIdx + setIdx / totalSets) / totalExercises;

  if (done) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-24 h-24 rounded-3xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-6">
          <Trophy size={48} className="text-text" />
        </div>
        <h2 className="text-3xl font-black text-text mb-2">Workout done!</h2>
        <p className="text-dim mb-2">{session.name}</p>
        <p className="text-muted text-sm mb-10">{session.durationMin} min · {exercises.length} exercises</p>
        <button onClick={onDone} className="btn-primary w-full max-w-xs">Save & Continue</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(160deg, #EDE9FE 0%, #DDD6FE 60%, #C4B5FD 100%)' }}>
      {/* Hero: stick figure display */}
      <div className="relative flex-1 flex flex-col">
        {/* Top controls */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4">
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <X size={18} className="text-text" />
          </button>
          <p className="text-dim text-sm font-semibold bg-white/40 backdrop-blur-sm px-4 py-1.5 rounded-full">{session.name}</p>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-sm">
            <span className="text-text text-sm font-bold">{exIdx + 1}/{totalExercises}</span>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="mx-5 h-1 bg-white/30 rounded-full mb-4">
          <div className="h-full bg-purple rounded-full transition-all duration-700" style={{ width: `${overallProgress * 100}%` }} />
        </div>

        {/* Figure / rest display — centered in remaining hero space */}
        <div className="flex-1 flex items-center justify-center px-4">
          {phase === 'rest' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-3xl bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Droplets size={52} strokeWidth={1} className="text-purple/60" />
              </div>
              <p className="text-purple/70 text-sm text-center font-medium">Respirez · Hydratez-vous</p>
            </div>
          ) : (
            <div className="w-full max-w-xs">
              <ExerciseMedia exercise={ex?.name ?? ''} paused={!running} />
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-[2.5rem] shadow-2xl" style={{ minHeight: '46%' }}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-4">
          {/* Phase badge + counter */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`pill text-xs font-bold ${phase === 'rest' ? 'bg-card-orange text-orange' : 'bg-purple-bg text-purple'}`}>
              {phase === 'rest' ? 'Repos' : `Série ${setIdx + 1} / ${totalSets}`}
            </span>
            {phase === 'exercise' && (
              <span className="pill bg-section text-dim border border-border text-xs">
                {ex?.reps ? `${ex.reps} reps` : `${exDuration}s`}
              </span>
            )}
            {phase === 'exercise' && ex?.muscleGroups.slice(0, 2).map(m => (
              <span key={m} className="pill bg-section text-muted border border-border text-[10px]">{m}</span>
            ))}
          </div>

          {/* Exercise name */}
          <h2 className="text-2xl font-black text-text tracking-tight mb-3">
            {phase === 'rest' ? 'Temps de repos' : ex?.name}
          </h2>

          {/* Instruction cue or up-next */}
          {phase === 'exercise' ? (
            <div className="bg-purple-bg rounded-2xl px-4 py-3 mb-4">
              <p className="text-purple text-sm leading-relaxed">{getExerciseCue(ex?.name ?? '')}</p>
            </div>
          ) : (
            exIdx < exercises.length - 1 ? (
              <div className="flex items-center gap-3 bg-section rounded-2xl px-4 py-3 mb-4">
                <div className="bg-white rounded-xl flex items-center justify-center flex-shrink-0" style={{ width: 48, height: 48 }}>
                  <StickFigure exercise={exercises[exIdx + 1]?.name ?? ''} size={40} />
                </div>
                <div>
                  <p className="text-muted text-xs font-medium">Prochain exercice</p>
                  <p className="text-text text-sm font-bold">{exercises[exIdx + 1]?.name}</p>
                </div>
              </div>
            ) : (
              <div className="bg-card-mint rounded-2xl px-4 py-3 mb-4">
                <p className="text-green text-sm font-medium flex items-center gap-2"><Trophy size={14} className="flex-shrink-0" /> Dernier exercice — courage !</p>
              </div>
            )
          )}

          {/* Timer bar */}
          <div className="mb-5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-muted text-xs font-medium">{phase === 'rest' ? 'Repos' : 'Exercice'}</span>
              <span className="text-text font-black text-2xl leading-none">{timer}<span className="text-sm font-bold text-muted ml-1">s</span></span>
            </div>
            <div className="h-2.5 bg-section rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${phase === 'rest' ? 'bg-orange' : 'bg-purple'}`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setRunning(r => !r)}
              className="w-14 h-14 rounded-full bg-section border border-border flex items-center justify-center"
            >
              {running ? <Pause size={22} className="text-text" /> : <Play size={22} className="text-text" />}
            </button>
            <button
              onClick={skip}
              className="w-16 h-16 rounded-full bg-[#1C1C1E] flex items-center justify-center shadow-xl"
            >
              <SkipForward size={24} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Energy check modal ────────────────────────────────────────────────────────
const ENERGY_LEVELS = [
  { value: 1, label: 'Épuisé', color: 'bg-card-pink text-pink-700', desc: 'Séance de récupération' },
  { value: 2, label: 'Fatigué', color: 'bg-card-orange text-orange', desc: 'Circuit léger adapté' },
  { value: 3, label: 'Moyen', color: 'bg-card-yellow text-amber-700', desc: 'Séance allégée' },
  { value: 4, label: 'En forme', color: 'bg-card-mint text-green', desc: 'Séance normale' },
  { value: 5, label: 'Au top !', color: 'bg-purple-bg text-purple', desc: 'Séance complète' },
];

interface EnergyModalProps {
  session: AiProgramSession;
  apiKey?: string;
  onStart: (session: AiProgramSession) => void;
  onClose: () => void;
}

function EnergyCheckModal({ session, apiKey, onStart, onClose }: EnergyModalProps) {
  const [energy, setEnergy] = useState(4);
  const [adapting, setAdapting] = useState(false);
  const level = ENERGY_LEVELS[energy - 1];

  async function handleStart() {
    if (energy >= 4 || !apiKey) {
      onStart(session);
      return;
    }
    setAdapting(true);
    try {
      const adapted = await getAdaptedSession(
        apiKey,
        session.name,
        energy,
        session.exercises.map(e => e.name)
      );
      onStart(adapted);
    } catch {
      onStart(session);
    }
    setAdapting(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ background: 'rgba(28,28,30,0.5)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-md bg-white rounded-t-[2.5rem] p-6 pb-10 shadow-2xl" style={{ animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-text font-black text-lg">Comment vous sentez-vous ?</h3>
            <p className="text-muted text-xs mt-0.5">{session.name}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-2xl bg-section border border-border flex items-center justify-center">
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Slider track */}
        <div className="mb-5">
          <div className="flex justify-between mb-3">
            {ENERGY_LEVELS.map(l => (
              <button
                key={l.value}
                onClick={() => setEnergy(l.value)}
                className={`flex-1 mx-0.5 flex flex-col items-center py-3 rounded-2xl transition-all ${energy === l.value ? l.color + ' scale-105 shadow-md' : 'bg-section'}`}
              >
                <span className="text-base font-black">{l.value}</span>
                <span className={`text-[9px] font-bold mt-1 ${energy === l.value ? '' : 'text-muted'}`}>{l.label}</span>
              </button>
            ))}
          </div>

          {/* Adaptive message */}
          <div className={`rounded-2xl px-4 py-3 ${level.color}`}>
            <div className="flex items-center gap-2">
              <Zap size={14} />
              <span className="text-sm font-bold">{level.desc}</span>
            </div>
            <p className="text-xs mt-1 opacity-75">
              {energy <= 2
                ? "L'IA va adapter votre séance à une récupération douce."
                : energy === 3
                ? "La séance sera légèrement allégée pour vous ménager."
                : "Vous êtes prêt — séance complète lancée !"}
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={adapting}
          className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
        >
          {adapting
            ? <><Loader size={16} className="animate-spin" /> Adaptation en cours...</>
            : energy <= 3 && apiKey
            ? <><Zap size={16} /> Adapter et démarrer</>
            : <><Play size={16} fill="white" /> Démarrer</>
          }
        </button>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(60px); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  );
}

// ── Session card (shared between built-in and AI programs) ───────────────────
function SessionCard({ session, onStart }: { session: AiProgramSession; onStart: () => void }) {
  return (
    <div className="bg-white shadow-card rounded-3xl overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-text font-bold text-sm">{session.name}</h3>
            <p className="text-muted text-xs mt-0.5">{session.durationMin} min · {session.exercises.length} exercises</p>
          </div>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-[#1C1C1E] px-4 py-2 rounded-xl text-white text-sm font-bold active:scale-95 transition-all"
          >
            <Play size={14} fill="white" /> Start
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {session.exercises.map((ex, ei) => (
            <div key={ei} className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20">
              <div className="rounded-[18px] bg-white shadow-sm border border-gray-100 flex items-center justify-center" style={{ width: 72, height: 72 }}>
                <StickFigure exercise={ex.name} size={60} showGround />
              </div>
              <p className="text-muted text-[9px] text-center leading-tight line-clamp-2 font-medium">{ex.name}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        {session.exercises.map((ex, ei) => (
          <div key={ei} className={`flex items-center gap-3 px-5 py-3 ${ei < session.exercises.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0">
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
  );
}

// ─── Main Fitness Page ───────────────────────────────────────────────────────

export default function Fitness() {
  const { state, refreshToday } = useApp();
  const [tab, setTab] = useState<'program' | 'ai' | 'videos'>('program');
  const [aiDays, setAiDays] = useState(4);
  const [aiRequest, setAiRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiPrograms, setAiPrograms] = useState<AiProgram[]>(() => loadAiPrograms());
  const [activePlayer, setActivePlayer] = useState<AiProgramSession | null>(null);
  const [energySession, setEnergySession] = useState<AiProgramSession | null>(null);

  const goal = state.profile?.goal ?? 'maintain';
  const equipment = state.profile?.equipment ?? 'both';
  const program = GOAL_PROGRAMS[goal];

  function handleWorkoutDone(session: AiProgramSession) {
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

  async function generateProgram() {
    if (!state.profile?.geminiApiKey) return;
    setLoading(true);
    const req = aiRequest.trim() || `${aiDays} days/week workout, goal: ${goal.replace('_', ' ')}`;
    try {
      const result = await generateStructuredProgram(state.profile.geminiApiKey, req, equipment, aiDays);
      const newProgram: AiProgram = {
        id: generateId(),
        name: result.programName,
        createdAt: new Date().toISOString(),
        request: req,
        sessions: result.sessions,
      };
      saveAiProgram(newProgram);
      setAiPrograms(loadAiPrograms());
      setTab('program');
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : 'Check your API key in Profile.'}`);
    } finally { setLoading(false); }
  }

  function removeAiProgram(id: string) {
    deleteAiProgram(id);
    setAiPrograms(loadAiPrograms());
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
      {energySession && !activePlayer && (
        <EnergyCheckModal
          session={energySession}
          apiKey={state.profile?.geminiApiKey}
          onStart={(s) => { setActivePlayer(s); setEnergySession(null); }}
          onClose={() => setEnergySession(null)}
        />
      )}

      <div className="page bg-bg">
        <div className="px-5 pt-14 pb-4">
          <h1 className="text-2xl font-black text-text tracking-tight">Fitness</h1>
          <p className="text-dim text-sm mt-1">{program.tag} Program</p>
        </div>

        {/* Done today */}
        {todayWorkouts.length > 0 && (
          <div className="px-5 mb-5 space-y-2">
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
            <button onClick={() => setTab('program')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'program' ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}
            >
              <Dumbbell size={14} /> Programme
            </button>
            <button onClick={() => setTab('ai')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'ai' ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}
            >
              <Sparkles size={14} /> IA Coach
            </button>
            <button onClick={() => setTab('videos')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${tab === 'videos' ? 'bg-[#1C1C1E] text-white' : 'text-muted'}`}
            >
              <Video size={14} /> Mes vidéos
            </button>
          </div>
        </div>

        {tab === 'program' && (
          <div className="px-5 space-y-6">
            {/* Built-in program */}
            <div className="space-y-4">
              <p className="text-muted text-xs font-bold uppercase tracking-widest">Built-in · {program.tag}</p>
              {program.sessions.map((session, si) => (
                <SessionCard key={si} session={session} onStart={() => setEnergySession(session)} />
              ))}
            </div>

            {/* AI-generated programs */}
            {aiPrograms.map(ap => (
              <div key={ap.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-purple text-white rounded-full px-2 py-0.5 font-bold">AI</span>
                      <p className="text-text text-sm font-bold">{ap.name}</p>
                    </div>
                    <p className="text-muted text-xs mt-0.5 italic">"{ap.request}"</p>
                  </div>
                  <button onClick={() => removeAiProgram(ap.id)} className="w-8 h-8 rounded-xl bg-section border border-border flex items-center justify-center">
                    <Trash2 size={14} className="text-muted" />
                  </button>
                </div>
                {ap.sessions.map((session, si) => (
                  <SessionCard key={si} session={session} onStart={() => setEnergySession(session)} />
                ))}
              </div>
            ))}

            {/* Prompt to add AI program */}
            <button
              onClick={() => setTab('ai')}
              className="w-full py-4 rounded-3xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted text-sm font-medium active:scale-95 transition-all"
            >
              <Plus size={18} /> Generate AI Program
            </button>
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
                {/* Equipment badge */}
                <div className="mb-4 flex items-center gap-2 bg-white shadow-card rounded-2xl px-4 py-3">
                  {equipment === 'gym' ? <Dumbbell size={18} strokeWidth={1.5} className="text-[#1C1C1E]" /> : equipment === 'home' ? <Home size={18} strokeWidth={1.5} className="text-[#1C1C1E]" /> : <Zap size={18} strokeWidth={1.5} className="text-[#1C1C1E]" />}
                  <div>
                    <p className="text-text text-xs font-bold">{equipment === 'gym' ? 'Gym' : equipment === 'home' ? 'Home + Outdoor' : 'Gym + Home + Outdoor'}</p>
                    <p className="text-muted text-[10px]">Change in Profile → Training Setup</p>
                  </div>
                </div>

                {/* Natural language input */}
                <div className="mb-4">
                  <p className="text-dim text-xs font-bold uppercase tracking-widest mb-2">Describe your goal</p>
                  <textarea
                    className="w-full bg-white shadow-card rounded-2xl px-4 py-3 text-text text-sm resize-none border border-border focus:outline-none focus:border-purple transition-colors"
                    rows={3}
                    placeholder={'e.g. Lose weight in 2 weeks, I run on weekends\nor: 4 weeks of strength for football\nor: Build muscle, focus on upper body'}
                    value={aiRequest}
                    onChange={e => setAiRequest(e.target.value)}
                  />
                </div>

                {/* Days selector */}
                <div className="mb-5">
                  <p className="text-dim text-xs font-bold uppercase tracking-widest mb-3">Sessions per week</p>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(d => (
                      <button key={d} onClick={() => setAiDays(d)}
                        className={`w-11 h-11 rounded-2xl border-2 font-bold text-sm transition-all ${aiDays === d ? 'border-purple bg-purple-bg text-purple' : 'border-border text-muted bg-white'}`}
                      >{d}</button>
                    ))}
                  </div>
                </div>

                <button onClick={generateProgram} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                  {loading ? <><Loader size={16} className="animate-spin" /> Creating your program...</> : <><Sparkles size={16} /> Generate & Add to Program</>}
                </button>
                <p className="text-muted text-xs text-center mt-3">Added directly to "My Program" tab</p>

                {/* Inspiration examples */}
                <div className="mt-6">
                  <p className="text-dim text-xs font-bold uppercase tracking-widest mb-3">Need inspiration?</p>
                  <div className="space-y-2">
                    {[
                      'Lose weight in 2 weeks, I run on weekends',
                      '4 weeks strength training for football',
                      'Build muscle, mix gym and home workouts',
                      'Toning full body, beginner friendly',
                    ].map(ex => (
                      <button
                        key={ex}
                        onClick={() => setAiRequest(ex)}
                        className="w-full text-left px-4 py-2.5 bg-white shadow-card rounded-2xl text-dim text-xs border border-border active:scale-95 transition-all"
                      >
                        "{ex}"
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'videos' && <ExerciseVideosTab />}
      </div>
    </>
  );
}
