export interface GeoData {
  structure_type: 'bridge' | 'viaduct' | 'culvert' | 'pedestrian' | 'other';
  spans: number;
  total_length_m: number;
  width_m: number;
  clearance_m: number;
  deck_type: 'slab' | 'box_girder' | 'i_beam' | 't_beam' | 'arch' | 'unknown';
  has_piers: boolean;
  pier_count: number;
  has_abutments: boolean;
  has_walls: boolean;
  span_lengths?: number[];
}

export interface LoadData {
  num_lanes: number;
  lane_width_m: number;
  truck_class: 'CL-625' | 'CL-625-ONT' | 'CL-W';
  has_tram: boolean;
  tram_tracks: number;
  tram_axle_kn: number;
  sidewalk_left: boolean;
  sidewalk_left_w: number;
  sidewalk_right: boolean;
  sidewalk_right_w: number;
  wearing_surface_mm: number;
  has_barrier: boolean;
  barrier_type: 'PCB' | 'TL5' | 'steel';
  has_utilities: boolean;
  utilities_kn_m: number;
  province: string;
  ice_zone: 'A' | 'B' | 'C' | 'D' | 'E';
  wind_speed: number;
  wind_exp: 'A' | 'B' | 'C' | 'D';
  seismic: '1' | '2' | '3' | '4';
  has_collision: boolean;
  collision_kn: number;
  has_construction: boolean;
}

export interface LoadResults {
  w_self: number;
  w_wear: number;
  w_barrier: number;
  w_lanes: number;
  w_ped: number;
  wD: number;
  wL: number;
  wSLS: number;
  wULS: number;
  nLanes: number;
  mpf: number;
}

export interface BeamResults {
  vData: Array<{ x: number; v: number }>;
  mData: Array<{ x: number; m: number }>;
  reactions: number[];
  Vmax: number;
  Mmax: number;
  suppX: number[];
  supportMoments: number[];
}

export interface SectionResult {
  d: number;
  a: number;
  As: number;
  As_min: number;
  rho: number;
  rho_min: number;
  Vc: number;
  Vf: number;
  Mr: number;
  Mf: number;
  shearOK: boolean;
  flexOK: boolean;
  sufficient: boolean;
  suggestedBar: string;
}

export interface AnalysisResult {
  Vmax: number;
  Mmax: number;
  ld: LoadResults;
  reactions: number[];
  beamResults: BeamResults;
}

export interface AIAnalysis {
  structure_type: string;
  description: string;
  detected: Partial<GeoData>;
  confidence: 'low' | 'medium' | 'high';
  notes: string;
}

export interface SectionInput {
  b: number;
  h: number;
  cover: number;
  fc: number;
  fy: number;
}

export interface SessionData {
  step: number;
  geo?: GeoData;
  loads?: LoadData;
  analysis?: AnalysisResult;
  slsProps?: SLSProps;
  savedAt: number;
}

export interface SLSProps {
  material: 'concrete' | 'steel' | 'custom';
  h_mm: number;
  E_MPa: number;
}

export interface SLSSpanResult {
  span: number;
  L_m: number;
  delta_mm: number;
  limit_mm: number;
  ratio: number;
  ok: boolean;
}

export interface HistoryEntry {
  id: string;
  name: string;
  savedAt: number;
  geo: GeoData;
  loads: LoadData;
  analysis: AnalysisResult;
  slsProps?: SLSProps;
}

export interface ConditionResult {
  overall: 'bon' | 'acceptable' | 'dégradé' | 'critique';
  score: number;
  observations: string[];
  urgent_actions: string[];
  notes: string;
}
