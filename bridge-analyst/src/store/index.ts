import { create } from 'zustand';
import type { GeoData, LoadData, AnalysisResult, AIAnalysis, SessionData } from '../types';

const STORAGE_KEY = 'bridge-analyst-session';
const DEFAULT_LOADS: LoadData = {
  num_lanes: 2,
  lane_width_m: 3.7,
  truck_class: 'CL-625',
  has_tram: false,
  tram_tracks: 1,
  tram_axle_kn: 150,
  sidewalk_left: false,
  sidewalk_left_w: 1.5,
  sidewalk_right: false,
  sidewalk_right_w: 1.5,
  wearing_surface_mm: 75,
  has_barrier: true,
  barrier_type: 'PCB',
  has_utilities: false,
  utilities_kn_m: 2,
  province: 'Québec',
  ice_zone: 'C',
  wind_speed: 140,
  wind_exp: 'B',
  seismic: '2',
  has_collision: false,
  collision_kn: 1800,
  has_construction: false,
};

interface AppState {
  step: number;
  geo: GeoData | null;
  loads: LoadData;
  analysis: AnalysisResult | null;
  aiAnalysis: AIAnalysis | null;
  activePanel: string | null;
  setStep: (s: number) => void;
  setGeo: (g: GeoData) => void;
  setLoads: (l: LoadData) => void;
  setAnalysis: (a: AnalysisResult) => void;
  setAIAnalysis: (ai: AIAnalysis) => void;
  setActivePanel: (p: string | null) => void;
  saveSession: () => void;
  loadSession: () => boolean;
  reset: () => void;
}

function loadFromStorage(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: SessionData = JSON.parse(raw);
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) return null;
    return { step: data.step, geo: data.geo, loads: data.loads ?? DEFAULT_LOADS, analysis: data.analysis };
  } catch {
    return null;
  }
}

export const useStore = create<AppState>((set, get) => ({
  step: 0,
  geo: null,
  loads: DEFAULT_LOADS,
  analysis: null,
  aiAnalysis: null,
  activePanel: null,
  setStep: (s) => set({ step: s }),
  setGeo: (g) => set({ geo: g }),
  setLoads: (l) => set({ loads: l }),
  setAnalysis: (a) => set({ analysis: a }),
  setAIAnalysis: (ai) => set({ aiAnalysis: ai }),
  setActivePanel: (p) => set({ activePanel: p }),
  saveSession: () => {
    const { step, geo, loads, analysis } = get();
    const data: SessionData = { step, geo: geo ?? undefined, loads, analysis: analysis ?? undefined, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
  },
  loadSession: () => {
    const saved = loadFromStorage();
    if (!saved) return false;
    set(saved as Partial<AppState>);
    return true;
  },
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ step: 0, geo: null, loads: DEFAULT_LOADS, analysis: null, aiAnalysis: null, activePanel: null });
  },
}));
