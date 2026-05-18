export const SELF_WEIGHT: Record<string, number> = {
  slab: 12,
  box_girder: 10,
  i_beam: 8,
  t_beam: 9,
  arch: 11,
  unknown: 10,
};

export const BARRIER_WEIGHT = { PCB: 8, TL5: 11, steel: 4 };

// CSA S6-19 Table 3.4 — multiple presence factors
export const MPF = [1.0, 1.0, 0.9, 0.8];

export const LANE_LOAD = 9.0; // kN/m per lane

export const PEDESTRIAN_LOAD = 4.8; // kPa

export const GAMMA_D = 1.25;
export const GAMMA_L = 1.70;

// CL-625 axle configuration — CSA S6-19 cl. 3.8.3
export const CL625 = {
  positions: [0, 3.6, 4.8, 11.4, 18.0],
  loads: [50, 175, 175, 175, 50],
  wheelbase: 18.0,
  total: 625,
};

export const ICE_ZONE_LABELS: Record<string, string> = {
  A: 'Légère — pas ou peu de verglas',
  B: 'Modérée — verglas occasionnel',
  C: 'Modérée à forte',
  D: 'Forte — verglas fréquent',
  E: 'Très forte — accumulation importante',
};

export const ICE_ZONE_LOADS: Record<string, number> = {
  A: 0,
  B: 0.15,
  C: 0.25,
  D: 0.40,
  E: 0.60,
};

export const SEISMIC_LABELS: Record<string, string> = {
  '1': 'Analyse statique simplifiée',
  '2': 'Vérification requise',
  '3': 'Analyse dynamique recommandée',
  '4': 'Conception parasismique rigoureuse',
};

export const PROVINCES = [
  'Alberta', 'Colombie-Britannique', 'Manitoba', 'Nouveau-Brunswick',
  'Terre-Neuve', 'Nouvelle-Écosse', 'Ontario', 'Île-du-Prince-Édouard',
  'Québec', 'Saskatchewan', 'Yukon', 'T.N.-O.', 'Nunavut',
];
