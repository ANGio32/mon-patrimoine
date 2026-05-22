/**
 * ExerciseVideosTab — lists every built-in exercise.
 * For each one the user can record themselves directly from here.
 * Already-recorded exercises show a "Ma vidéo" badge and play inline.
 */

import { useState, useEffect } from 'react';
import { Video, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import ExerciseMedia from './ExerciseMedia';
import {
  listAllExerciseVideos,
  toExerciseId,
} from '../utils/exerciseVideos';
import {
  ALL_EXERCISES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ExerciseDef,
} from '../utils/exercises';

// ─── Exercise card ────────────────────────────────────────────────────────────

function ExerciseCard({
  exercise,
  hasSaved,
}: {
  exercise: ExerciseDef;
  hasSaved: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-section rounded-2xl border border-border overflow-hidden">
      {/* Header row — always visible */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-border/40 transition-all text-left"
        onClick={() => setOpen(o => !o)}
      >
        {/* Saved indicator dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasSaved ? 'bg-purple' : 'bg-border'}`} />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text leading-tight">{exercise.name}</p>
          <p className="text-[11px] text-muted mt-0.5 truncate">
            {exercise.muscleGroups.join(' · ')}
          </p>
        </div>

        {hasSaved && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-bg border border-purple/20 text-purple text-[10px] font-bold flex-shrink-0">
            <Video size={9} /> Ma vidéo
          </span>
        )}

        {open
          ? <ChevronUp size={16} className="text-muted flex-shrink-0" strokeWidth={1.5} />
          : <ChevronDown size={16} className="text-muted flex-shrink-0" strokeWidth={1.5} />
        }
      </button>

      {/* Expanded: full ExerciseMedia */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <ExerciseMedia exercise={exercise.name} size={100} />
        </div>
      )}
    </div>
  );
}

// ─── Category section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  exercises,
  savedIds,
}: {
  category: string;
  exercises: ExerciseDef[];
  savedIds: Set<string>;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const savedCount = exercises.filter(e => savedIds.has(toExerciseId(e.name))).length;

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-1 py-1 active:opacity-70"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-black text-text uppercase tracking-widest">{category}</p>
          {savedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-purple text-white text-[9px] font-bold">
              {savedCount} vidéo{savedCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {collapsed
          ? <ChevronDown size={14} className="text-muted" strokeWidth={1.5} />
          : <ChevronUp size={14} className="text-muted" strokeWidth={1.5} />
        }
      </button>

      {!collapsed && (
        <div className="flex flex-col gap-2">
          {exercises.map(ex => (
            <ExerciseCard
              key={ex.name}
              exercise={ex}
              hasSaved={savedIds.has(toExerciseId(ex.name))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function ExerciseVideosTab() {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);

  async function loadSaved() {
    setLoading(true);
    const list = await listAllExerciseVideos();
    setSavedIds(new Set(list.map(v => v.id)));
    // revoke object URLs — we only need the IDs here
    list.forEach(v => URL.revokeObjectURL(v.url));
    setLoading(false);
  }

  useEffect(() => { loadSaved(); }, []);

  // Group exercises by category in defined order
  const grouped = CATEGORY_ORDER.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat],
    items: ALL_EXERCISES.filter(e => e.category === cat),
  })).filter(g => g.items.length > 0);

  const totalSaved = savedIds.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={20} className="text-muted animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-5">
      {/* Summary header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-text">
            {ALL_EXERCISES.length} exercices
          </p>
          <p className="text-xs text-muted mt-0.5">
            {totalSaved > 0
              ? `${totalSaved} vidéo${totalSaved > 1 ? 's' : ''} enregistrée${totalSaved > 1 ? 's' : ''}`
              : 'Appuie sur un exercice pour te filmer'}
          </p>
        </div>
        <button
          onClick={loadSaved}
          className="p-2 rounded-xl bg-section border border-border active:scale-90 transition-all"
          title="Actualiser"
        >
          <RefreshCw size={14} className="text-muted" strokeWidth={1.5} />
        </button>
      </div>

      {/* Category groups */}
      {grouped.map(g => (
        <CategorySection
          key={g.cat}
          category={g.label}
          exercises={g.items}
          savedIds={savedIds}
        />
      ))}
    </div>
  );
}
