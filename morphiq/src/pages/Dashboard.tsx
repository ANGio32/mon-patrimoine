import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calculateTargets, calculateTDEE } from '../utils/calculations';
import { getLogForDate, getTodayKey, getLast7DaysLogs, loadChallenge, saveChallenge, clearChallenge, generateId } from '../utils/storage';
import type { DailyLog, WeeklyChallenge } from '../types';
import { generateWeeklyChallenge } from '../utils/gemini';
import { Sparkles, Loader, Trophy, CheckCircle, X, Coffee, Sun, Moon, Cookie, Dumbbell, UtensilsCrossed, Target } from 'lucide-react';

// ── Week strip ────────────────────────────────────────────────────────────────
function WeekStrip({ selected, onSelect }: { selected: string; onSelect: (key: string) => void }) {
  const today = new Date();
  const todayKey = getTodayKey();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 7 }, (_, i) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const isToday = key === todayKey;
        const isSelected = key === selected;
        const isFuture = d > today && !isToday;
        return (
          <button
            key={i}
            disabled={isFuture}
            onClick={() => onSelect(key)}
            className={`flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all active:scale-95 ${
              isSelected && isToday ? 'bg-[#3D4A2F]'
              : isSelected ? 'bg-purple'
              : 'hover:bg-section'
            } ${isFuture ? 'opacity-30' : ''}`}
          >
            <span className={`text-[9px] font-semibold tracking-wide ${isSelected ? 'text-white/60' : 'text-muted'}`}>
              {dayNames[d.getDay()]}
            </span>
            <span className={`text-sm font-black mt-0.5 ${isSelected ? 'text-white' : 'text-dim'}`}>
              {d.getDate()}
            </span>
            {/* Dot indicator if log exists */}
          </button>
        );
      })}
    </div>
  );
}

const MEAL_ICON: Record<string, React.ElementType> = { breakfast: Coffee, lunch: Sun, dinner: Moon, snack: Cookie };

const MEAL_THEME_COLORS: Record<string, { bg: string; badge: string }> = {
  breakfast: { bg: '#F4DBC2', badge: '#C97539' },
  lunch:     { bg: '#DCE3CE', badge: '#5A6B47' },
  dinner:    { bg: '#C9D5DE', badge: '#4A6C82' },
  snack:     { bg: '#E8D4C3', badge: '#8B5A3C' },
};
const MEAL_THEME_LABELS: Record<string, string> = {
  breakfast: 'Matin', lunch: 'Midi', dinner: 'Soir', snack: 'Collation',
};

// ── Weekly Challenge Card ─────────────────────────────────────────────────────
function WeeklyChallengeCard({ apiKey, goal }: { apiKey?: string; goal: string }) {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(() => loadChallenge());
  const [loading, setLoading] = useState(false);
  const todayKey = getTodayKey();
  const alreadyDoneToday = challenge?.completedDays.includes(todayKey) ?? false;

  async function generate() {
    if (!apiKey) return;
    setLoading(true);
    try {
      const logs = getLast7DaysLogs();
      const result = await generateWeeklyChallenge(apiKey, goal as Parameters<typeof generateWeeklyChallenge>[1], logs);
      const monday = new Date();
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const c: WeeklyChallenge = {
        id: generateId(),
        weekStart: monday.toISOString().slice(0, 10),
        title: result.title,
        description: result.description,
        targetDays: result.targetDays,
        completedDays: [],
        emoji: result.emoji,
        reward: result.reward,
        createdAt: new Date().toISOString(),
      };
      saveChallenge(c);
      setChallenge(c);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }

  function markToday() {
    if (!challenge || alreadyDoneToday) return;
    const updated = { ...challenge, completedDays: [...challenge.completedDays, todayKey] };
    saveChallenge(updated);
    setChallenge(updated);
  }

  function dismiss() {
    clearChallenge();
    setChallenge(null);
  }

  const progress = challenge ? Math.min(challenge.completedDays.length / challenge.targetDays, 1) : 0;
  const completed = challenge ? challenge.completedDays.length >= challenge.targetDays : false;

  if (!challenge) {
    if (!apiKey) return null;
    return (
      <div className="mx-5 mb-4 bg-white shadow-card rounded-3xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-card-yellow flex items-center justify-center"><Target size={20} strokeWidth={1.5} className="text-amber-700" /></div>
          <div>
            <p className="text-text font-black text-sm">Défi de la Semaine</p>
            <p className="text-muted text-xs">L'IA analyse votre semaine et crée un défi personnalisé</p>
          </div>
        </div>
        <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3">
          {loading ? <><Loader size={15} className="animate-spin" /> Analyse en cours...</> : <><Sparkles size={15} /> Générer mon défi</>}
        </button>
      </div>
    );
  }

  return (
    <div className={`mx-5 mb-4 rounded-3xl p-5 ${completed ? 'bg-card-yellow' : 'bg-white shadow-card'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center flex-shrink-0"><Sparkles size={18} strokeWidth={1.5} className="text-purple" /></div>
          <div>
            <p className="text-text font-black text-sm">{challenge.title}</p>
            <p className="text-muted text-xs mt-0.5">{challenge.completedDays.length}/{challenge.targetDays} jours complétés</p>
          </div>
        </div>
        <button onClick={dismiss} className="w-7 h-7 rounded-xl bg-section border border-border flex items-center justify-center flex-shrink-0">
          <X size={13} className="text-muted" />
        </button>
      </div>

      <p className="text-dim text-xs leading-relaxed mb-3">{challenge.description}</p>

      {/* Progress bar */}
      <div className="h-2 bg-section rounded-full mb-3 overflow-hidden">
        <div className="h-full bg-purple rounded-full transition-all duration-700" style={{ width: `${progress * 100}%` }} />
      </div>

      {completed ? (
        <div className="bg-white/70 rounded-2xl p-3 flex items-center gap-2">
          <Trophy size={16} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-amber-800 font-bold text-xs">Défi relevé !</p>
            <p className="text-amber-700 text-[10px] mt-0.5">{challenge.reward}</p>
          </div>
        </div>
      ) : alreadyDoneToday ? (
        <div className="flex items-center gap-2 py-2.5 px-4 bg-card-mint rounded-2xl">
          <CheckCircle size={15} className="text-green flex-shrink-0" />
          <p className="text-green text-xs font-bold">Journée validée !</p>
        </div>
      ) : (
        <button onClick={markToday} className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple rounded-2xl text-white text-sm font-bold active:scale-95 transition-all">
          <CheckCircle size={15} /> Valider aujourd'hui ✓
        </button>
      )}
    </div>
  );
}

// ── SVG Calorie Ring ──────────────────────────────────────────────────────────
function CalorieRingSVG({ current, goal }: { current: number; goal: number }) {
  const size = 180, stroke = 14;
  const pct = Math.min(1, current / goal);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="calring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7E9061"/>
            <stop offset="100%" stopColor="#5A6B47"/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ECE6D9" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="url(#calring)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - dash}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#8A8270', letterSpacing: 1.2 }}>CONSOMMÉ</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#1F1B14', lineHeight: 1.1, marginTop: 4 }}>{Math.round(current).toLocaleString()}</div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#4A4234', marginTop: 2 }}>/ {goal.toLocaleString()} kcal</div>
      </div>
    </div>
  );
}

// ── Macro pill ────────────────────────────────────────────────────────────────
function MacroPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex:1, background:color, borderRadius:999, padding:'8px 10px', textAlign:'center', color:'#fff', fontWeight:800, fontSize:12, display:'flex', flexDirection:'column', gap:1 }}>
      <div style={{ fontSize:10, opacity:0.85, fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:13, fontWeight:800 }}>{value}</div>
    </div>
  );
}

// ── Stat item ─────────────────────────────────────────────────────────────────
function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign:'center', flex:1 }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#1F1B14', lineHeight:1.1 }}>{value}</div>
      <div style={{ fontSize:10, color:'#8A8270', fontWeight:600, marginTop:3 }}>{label}</div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { state } = useApp();
  const { profile } = state;
  const navigate = useNavigate();
  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);

  if (!profile) return null;

  const isToday = selectedDate === todayKey;
  const log: DailyLog = isToday ? state.todayLog : getLogForDate(selectedDate);

  const targets = calculateTargets(profile);
  const tdee = calculateTDEE(profile);
  const consumed = {
    cal: log.meals.reduce((s, m) => s + m.totalCalories, 0),
    pro: log.meals.reduce((s, m) => s + m.totalProtein, 0),
    carb: log.meals.reduce((s, m) => s + m.totalCarbs, 0),
    fat: log.meals.reduce((s, m) => s + m.totalFat, 0),
  };
  const deficit = targets.calories - consumed.cal;
  const isOver = deficit < -50;
  const isGood = Math.abs(deficit) <= 50;

  const firstName = profile.name.split(' ')[0];

  const displayDate = isToday
    ? new Date().toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' })
    : new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr', { weekday: 'short', day: 'numeric', month: 'short' });

  // keep these in scope so TypeScript is happy (they were used in old render)
  void isOver; void isGood; void deficit;

  return (
    <div className="page bg-bg">

      {/* 1. HEADER — big greeting */}
      <div style={{padding: '12px 20px 18px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:28, fontWeight:900, color:'#1F1B14', letterSpacing:-0.5, lineHeight:1.1}}>
              Bonjour {firstName} <span style={{display:'inline-block', transform:'rotate(-8deg)'}}>👋</span>
            </div>
            <div style={{fontSize:13, color:'#4A4234', fontWeight:500, marginTop:4}}>
              Prêt à crusher la journée ?
            </div>
          </div>
          {/* Date chip — top right, white rounded card */}
          <div style={{background:'#fff', borderRadius:14, padding:'8px 12px', fontSize:11, fontWeight:700, color:'#1F1B14', boxShadow:'0 2px 8px rgba(31,27,20,0.06)', textTransform:'capitalize'}}>
            {displayDate}
          </div>
        </div>
      </div>

      {/* 2. WEEK STRIP — white card */}
      <div className="mx-5 mb-4 bg-white rounded-3xl p-3 shadow-card">
        <WeekStrip selected={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* 3. CALORIE RING CARD — SVG ring */}
      <div className="mx-5 mb-3 bg-white shadow-card rounded-[2rem] p-5">
        {/* Top row: label + % chip */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
          <div>
            <div style={{fontSize:11, fontWeight:700, color:'#8A8270', letterSpacing:1.2}}>OBJECTIF DU JOUR</div>
            <div style={{fontSize:16, fontWeight:800, color:'#1F1B14', marginTop:2}}>Calories</div>
          </div>
          {/* Green chip showing % */}
          <span style={{background:'#DCE3CE', color:'#5A6B47', borderRadius:999, padding:'7px 11px', fontSize:12, fontWeight:800, display:'inline-flex', alignItems:'center', gap:4}}>
            🔥 {Math.round((consumed.cal/targets.calories)*100)}%
          </span>
        </div>
        {/* SVG Ring */}
        <CalorieRingSVG current={consumed.cal} goal={targets.calories} />
        {/* Macro pills row */}
        <div style={{display:'flex', gap:8, marginTop:14}}>
          <MacroPill label="Prot" value={`${Math.round(consumed.pro)}g`} color="#10B981"/>
          <MacroPill label="Gluc" value={`${Math.round(consumed.carb)}g`} color="#3B82F6"/>
          <MacroPill label="Lip"  value={`${Math.round(consumed.fat)}g`}  color="#F59E0B"/>
        </div>
        {/* Bottom stats row */}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:14, padding:'0 4px'}}>
          <StatItem label="Restantes" value={`${Math.max(0, Math.round(targets.calories - consumed.cal)).toLocaleString()} kcal`}/>
          <div style={{width:1, background:'#E5DDCB', alignSelf:'stretch'}}/>
          <StatItem label="TDEE" value={`${tdee.toLocaleString()} kcal`}/>
          <div style={{width:1, background:'#E5DDCB', alignSelf:'stretch'}}/>
          <StatItem label="Repas" value={String(log.meals.length)}/>
        </div>
      </div>

      {/* 4. WEEKLY CHALLENGE — keep as-is */}
      {isToday && <WeeklyChallengeCard apiKey={profile.geminiApiKey} goal={profile.goal} />}

      {/* 5. MEALS SECTION */}
      <div className="mx-5 mb-4">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', margin:'20px 4px 12px'}}>
          <div style={{fontSize:16, fontWeight:800, color:'#1F1B14'}}>{isToday ? "Repas d'aujourd'hui" : 'Repas'}</div>
          <button onClick={() => navigate('/nutrition')} style={{background:'transparent', border:'none', color:'#5A6B47', fontSize:12, fontWeight:700, cursor:'pointer', padding:4}}>Voir tout</button>
        </div>
        {log.meals.length === 0 ? (
          <div style={{background:'#fff', borderRadius:24, boxShadow:'0 2px 16px rgba(31,27,20,0.07)', padding:'32px 20px', textAlign:'center'}}>
            <UtensilsCrossed size={40} strokeWidth={1} style={{color:'#8A8270', margin:'0 auto 12px'}} />
            <div style={{color:'#4A4234', fontWeight:700, fontSize:14, marginBottom:4}}>{isToday ? 'Aucun repas encore' : 'Aucun repas enregistré'}</div>
            <div style={{color:'#8A8270', fontSize:12}}>{isToday ? 'Appuyez sur + pour ajouter' : 'Rien de logué ce jour'}</div>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {log.meals.map(meal => {
              const mealThemeBg = MEAL_THEME_COLORS[meal.mealType]?.bg ?? '#ECE5D3';
              const mealThemeBadge = MEAL_THEME_COLORS[meal.mealType]?.badge ?? '#5A6B47';
              const mealThemeLabel = MEAL_THEME_LABELS[meal.mealType] ?? meal.mealType;
              const MealIcon = MEAL_ICON[meal.mealType] ?? Coffee;
              return (
                <div key={meal.id} style={{background:'#fff', borderRadius:24, boxShadow:'0 2px 16px rgba(31,27,20,0.07)', padding:12, display:'flex', alignItems:'center', gap:12}}>
                  {/* Colored theme icon square */}
                  <div style={{width:48, height:48, borderRadius:16, background:mealThemeBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <MealIcon size={22} strokeWidth={1.5} color="#1F1B14"/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:3}}>
                      <span style={{background:mealThemeBadge, color:'#fff', borderRadius:999, padding:'3px 8px', fontSize:10, fontWeight:700}}>{mealThemeLabel}</span>
                      <span style={{fontSize:11, color:'#8A8270', fontWeight:600}}>{meal.time}</span>
                    </div>
                    <div style={{fontSize:14, fontWeight:700, color:'#1F1B14', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{meal.description}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:16, fontWeight:800, color:'#1F1B14', lineHeight:1}}>{Math.round(meal.totalCalories)}</div>
                    <div style={{fontSize:10, color:'#8A8270', fontWeight:600, marginTop:2}}>kcal</div>
                  </div>
                </div>
              );
            })}
            {/* Add meal dashed button */}
            <button onClick={() => navigate('/log')} style={{border:'1.5px dashed #BFB29A', background:'transparent', borderRadius:16, padding:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'#5A6B47', fontWeight:700, fontSize:13, cursor:'pointer'}}>
              + Ajouter un repas
            </button>
          </div>
        )}
      </div>

      {/* 6. WORKOUTS — if any */}
      {log.workouts.length > 0 && (
        <div className="mx-5 mb-4">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', margin:'4px 4px 12px'}}>
            <div style={{fontSize:16, fontWeight:800, color:'#1F1B14'}}>Activité</div>
          </div>
          {log.workouts.map(w => (
            <div key={w.id} style={{background:'#fff', borderRadius:24, boxShadow:'0 2px 16px rgba(31,27,20,0.07)', padding:16, display:'flex', alignItems:'center', gap:14}}>
              <div style={{width:56, height:56, borderRadius:18, background:'#1F1B14', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                <Dumbbell size={28} color="#7E9061"/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:800, color:'#1F1B14'}}>{w.name} · {w.exercises.length} exos</div>
                <div style={{fontSize:12, color:'#8A8270', fontWeight:600, marginTop:2}}>{w.durationMin} min estimées</div>
              </div>
              <button onClick={() => navigate('/fitness')} style={{background:'#5A6B47', border:'none', color:'#fff', width:40, height:40, borderRadius:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20}}>
                ›
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
