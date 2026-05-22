import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, X, Scale, Target, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateTargets } from '../utils/calculations';
import { getLast7DaysLogs } from '../utils/storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeightEntry {
  date: string;
  weight: number;
}

interface MeasurementEntry {
  date: string;
  waist?: number;
  chest?: number;
  hips?: number;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const WEIGHT_KEY = 'morphiq_weight_log';
const MEASURE_KEY = 'morphiq_measure_log';

function loadWeightLog(): WeightEntry[] {
  try { return JSON.parse(localStorage.getItem(WEIGHT_KEY) ?? '[]'); } catch { return []; }
}

function saveWeightLog(entries: WeightEntry[]) {
  localStorage.setItem(WEIGHT_KEY, JSON.stringify(entries));
}

function loadMeasureLog(): MeasurementEntry[] {
  try { return JSON.parse(localStorage.getItem(MEASURE_KEY) ?? '[]'); } catch { return []; }
}

function saveMeasureLog(entries: MeasurementEntry[]) {
  localStorage.setItem(MEASURE_KEY, JSON.stringify(entries));
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────

function BarChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length === 0) return (
    <div className="flex items-center justify-center h-28 text-muted text-sm">
      Aucune donnée encore
    </div>
  );
  const recent = entries.slice(-10);
  const vals = recent.map(e => e.weight);
  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-1.5 h-28 px-1">
      {recent.map((e, i) => {
        const pct = ((e.weight - min) / range) * 100;
        const isLast = i === recent.length - 1;
        return (
          <div key={e.date} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-[9px] font-bold ${isLast ? 'text-purple' : 'text-muted'}`}>
              {e.weight}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${isLast ? 'bg-purple' : 'bg-section'}`}
              style={{ height: `${Math.max(pct, 8)}%` }}
            />
            <span className="text-[8px] text-muted">
              {new Date(e.date + 'T12:00:00').toLocaleDateString('fr', { day: 'numeric', month: 'numeric' })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calorie streak mini chart ─────────────────────────────────────────────────

function CalStreak() {
  const logs = getLast7DaysLogs();
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const log = logs.find(l => l.date === key);
    const cal = log?.meals.reduce((s: number, m: { totalCalories: number }) => s + m.totalCalories, 0) ?? 0;
    return { day: dayNames[d.getDay()], cal };
  });

  const maxCal = Math.max(...days.map(d => d.cal), 1);

  return (
    <div className="flex items-end gap-1.5 h-20 px-1">
      {days.map((d, i) => {
        const pct = (d.cal / maxCal) * 100;
        const isToday = i === 6;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-purple' : d.cal > 0 ? 'bg-purple/30' : 'bg-section'}`}
              style={{ height: `${Math.max(pct, 6)}%` }}
            />
            <span className={`text-[9px] font-medium ${isToday ? 'text-purple' : 'text-muted'}`}>{d.day}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress page ────────────────────────────────────────────────────────────

export default function Progress() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { profile } = state;

  const [weights, setWeights] = useState<WeightEntry[]>(() => loadWeightLog());
  const [measures, setMeasures] = useState<MeasurementEntry[]>(() => loadMeasureLog());

  const [showWeightForm, setShowWeightForm] = useState(false);
  const [showMeasureForm, setShowMeasureForm] = useState(false);

  const [newWeight, setNewWeight] = useState('');
  const [newWaist, setNewWaist] = useState('');
  const [newChest, setNewChest] = useState('');
  const [newHips, setNewHips] = useState('');

  const targets = profile ? calculateTargets(profile) : null;
  const latestWeight = weights[weights.length - 1];
  const prevWeight = weights[weights.length - 2];
  const weightDelta = latestWeight && prevWeight ? latestWeight.weight - prevWeight.weight : null;

  function addWeight() {
    const w = parseFloat(newWeight);
    if (!w) return;
    const entry: WeightEntry = { date: todayKey(), weight: w };
    const updated = [...weights.filter(e => e.date !== todayKey()), entry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeights(updated);
    saveWeightLog(updated);
    setNewWeight('');
    setShowWeightForm(false);
  }

  function addMeasure() {
    const entry: MeasurementEntry = {
      date: todayKey(),
      waist: newWaist ? parseFloat(newWaist) : undefined,
      chest: newChest ? parseFloat(newChest) : undefined,
      hips: newHips ? parseFloat(newHips) : undefined,
    };
    if (!entry.waist && !entry.chest && !entry.hips) return;
    const updated = [...measures.filter(e => e.date !== todayKey()), entry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setMeasures(updated);
    saveMeasureLog(updated);
    setNewWaist(''); setNewChest(''); setNewHips('');
    setShowMeasureForm(false);
  }

  const latestMeasure = measures[measures.length - 1];

  return (
    <div className="page bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
        <div>
          <p className="text-muted text-xs font-medium">Suivi</p>
          <h1 className="text-2xl font-black text-text">Progrès</h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-2xl bg-white shadow-card border border-border flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="text-sm font-black text-purple">{profile?.name.charAt(0).toUpperCase()}</span>
        </button>
      </div>

      {/* Objective card */}
      {targets && (
        <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-card-purple flex items-center justify-center flex-shrink-0">
            <Target size={22} strokeWidth={1.5} className="text-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-text font-black text-sm">Objectif calorique</p>
            <p className="text-muted text-xs mt-0.5">{targets.calories} kcal · P {targets.protein}g · G {targets.carbs}g · L {targets.fat}g</p>
          </div>
          <button onClick={() => navigate('/profile')} className="text-muted">
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Calories this week */}
      <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-text font-black text-sm">Calories cette semaine</p>
          <TrendingUp size={16} className="text-purple" />
        </div>
        <CalStreak />
      </div>

      {/* Weight section */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-text font-black text-base">Poids</p>
          <button
            onClick={() => setShowWeightForm(v => !v)}
            className="w-8 h-8 rounded-xl bg-purple flex items-center justify-center active:scale-90 transition-transform"
          >
            {showWeightForm ? <X size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
          </button>
        </div>

        {showWeightForm && (
          <div className="bg-white shadow-card rounded-3xl p-4 mb-3 flex items-center gap-3">
            <input
              className="input-field flex-1"
              type="number"
              placeholder="Poids (kg)"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
            />
            <button onClick={addWeight} className="btn-primary text-sm py-3 px-4 whitespace-nowrap">
              Ajouter
            </button>
          </div>
        )}

        <div className="bg-white shadow-card rounded-3xl p-5">
          {latestWeight && (
            <div className="flex items-end gap-3 mb-4">
              <div>
                <p className="text-3xl font-black text-text">{latestWeight.weight}<span className="text-lg font-medium text-muted"> kg</span></p>
                <p className="text-muted text-xs mt-0.5">
                  {new Date(latestWeight.date + 'T12:00:00').toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              {weightDelta !== null && (
                <div className={`ml-2 mb-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  weightDelta < 0 ? 'bg-card-mint text-green' : weightDelta > 0 ? 'bg-orange-bg text-orange' : 'bg-section text-muted'
                }`}>
                  {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)} kg
                </div>
              )}
            </div>
          )}
          <BarChart entries={weights} />
        </div>
      </div>

      {/* Measurements section */}
      <div className="mx-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-text font-black text-base">Mensurations</p>
          <button
            onClick={() => setShowMeasureForm(v => !v)}
            className="w-8 h-8 rounded-xl bg-purple flex items-center justify-center active:scale-90 transition-transform"
          >
            {showMeasureForm ? <X size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
          </button>
        </div>

        {showMeasureForm && (
          <div className="bg-white shadow-card rounded-3xl p-4 mb-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-2">
              <input className="input-field text-center" type="number" placeholder="Tour de taille" value={newWaist} onChange={e => setNewWaist(e.target.value)} />
              <input className="input-field text-center" type="number" placeholder="Poitrine" value={newChest} onChange={e => setNewChest(e.target.value)} />
              <input className="input-field text-center" type="number" placeholder="Hanches" value={newHips} onChange={e => setNewHips(e.target.value)} />
            </div>
            <p className="text-muted text-xs text-center">Toutes les valeurs en cm</p>
            <button onClick={addMeasure} className="btn-primary w-full text-sm py-3">
              Enregistrer
            </button>
          </div>
        )}

        <div className="bg-white shadow-card rounded-3xl divide-y divide-border overflow-hidden">
          {latestMeasure ? (
            <>
              <div className="p-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Taille', val: latestMeasure.waist },
                  { label: 'Poitrine', val: latestMeasure.chest },
                  { label: 'Hanches', val: latestMeasure.hips },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center">
                    <p className="text-text font-black text-xl">{val ?? '—'}<span className="text-xs text-muted font-normal"> cm</span></p>
                    <p className="text-muted text-xs mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted text-[11px] text-center py-2">
                {new Date(latestMeasure.date + 'T12:00:00').toLocaleDateString('fr', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </>
          ) : (
            <div className="p-8 text-center">
              <Scale size={36} strokeWidth={1} className="text-muted mx-auto mb-2" />
              <p className="text-dim font-bold text-sm">Aucune mensuration</p>
              <p className="text-muted text-xs mt-1">Appuyez sur + pour ajouter</p>
            </div>
          )}
        </div>
      </div>

      {/* History list */}
      {weights.length > 1 && (
        <div className="mx-5 mb-4">
          <p className="text-text font-black text-base mb-3">Historique du poids</p>
          <div className="bg-white shadow-card rounded-3xl divide-y divide-border overflow-hidden">
            {[...weights].reverse().slice(0, 10).map(e => (
              <div key={e.date} className="flex items-center justify-between px-5 py-3">
                <p className="text-dim text-sm">
                  {new Date(e.date + 'T12:00:00').toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' })}
                </p>
                <p className="text-text font-black">{e.weight} <span className="text-muted text-xs font-normal">kg</span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
