import type { GeoData, LoadData, LoadResults, BeamResults, SectionResult, SectionInput, SLSSpanResult } from '../types';
import {
  SELF_WEIGHT, BARRIER_WEIGHT, MPF, LANE_LOAD, PEDESTRIAN_LOAD,
  GAMMA_D, GAMMA_L, CL625,
} from '../constants';

function thomasSolve(a: number[], b: number[], c: number[], d: number[]): number[] {
  const n = d.length;
  const b_ = [...b], d_ = [...d], c_ = [...c];
  for (let i = 1; i < n; i++) {
    const m = a[i] / b_[i - 1];
    b_[i] -= m * c_[i - 1];
    d_[i] -= m * d_[i - 1];
  }
  const x = Array(n).fill(0);
  x[n - 1] = d_[n - 1] / b_[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = (d_[i] - c_[i] * x[i + 1]) / b_[i];
  return x;
}

export function computeLoads(geo: GeoData, loads: LoadData): LoadResults {
  const w_self = SELF_WEIGHT[geo.deck_type] * geo.width_m;
  const w_wear = (loads.wearing_surface_mm / 1000) * 2400 * 9.81 / 1000 * geo.width_m;
  const w_barrier = loads.has_barrier ? BARRIER_WEIGHT[loads.barrier_type] * 2 : 0;
  const utilities = loads.has_utilities ? loads.utilities_kn_m : 0;
  const wD = w_self + w_wear + w_barrier + utilities;

  const nLanes = loads.num_lanes;
  const mpfIdx = Math.min(nLanes - 1, 3);
  const mpf = MPF[mpfIdx];

  const pedLeft = loads.sidewalk_left ? PEDESTRIAN_LOAD * loads.sidewalk_left_w : 0;
  const pedRight = loads.sidewalk_right ? PEDESTRIAN_LOAD * loads.sidewalk_right_w : 0;
  const w_ped = pedLeft + pedRight;

  const w_lanes = nLanes * LANE_LOAD * mpf;
  const wL = w_lanes + w_ped;

  const wSLS = wD + wL;
  const wULS = GAMMA_D * wD + GAMMA_L * wL;

  return { w_self, w_wear, w_barrier, w_lanes, w_ped, wD, wL, wSLS, wULS, nLanes, mpf };
}

export function computeBeam(totalLen: number, spans: number, w: number): BeamResults {
  const n = spans;
  const L = totalLen / n;
  const Ls = Array(n).fill(L);

  let supportMoments: number[] = Array(n + 1).fill(0);

  if (n > 1) {
    // Three-moment equation (Clapeyron) for interior supports
    const interior = n - 1;
    const aArr: number[] = Array(interior).fill(0);
    const bArr: number[] = [];
    const cArr: number[] = Array(interior).fill(0);
    const dArr: number[] = [];

    for (let k = 0; k < interior; k++) {
      const Lk = Ls[k];
      const Lk1 = Ls[k + 1];
      aArr[k] = k > 0 ? Lk : 0;
      bArr.push(2 * (Lk + Lk1));
      cArr[k] = k < interior - 1 ? Lk1 : 0;
      dArr.push(-w / 4 * (Lk * Lk * Lk + Lk1 * Lk1 * Lk1));
    }

    const interiorMoments = thomasSolve(aArr, bArr, cArr, dArr);
    for (let k = 0; k < interior; k++) {
      supportMoments[k + 1] = interiorMoments[k];
    }
  }

  // Reactions
  const reactions: number[] = Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    const Li = Ls[i];
    const Mi = supportMoments[i];
    const Mi1 = supportMoments[i + 1];
    const rLeft = w * Li / 2 + (Mi - Mi1) / Li;
    const rRight = w * Li / 2 + (Mi1 - Mi) / Li;
    reactions[i] += rLeft;
    reactions[i + 1] += rRight;
  }

  const POINTS = 40;
  const vData: Array<{ x: number; v: number }> = [];
  const mData: Array<{ x: number; m: number }> = [];
  const suppX: number[] = [];

  let xOffset = 0;
  for (let i = 0; i < n; i++) {
    suppX.push(xOffset);
    const Li = Ls[i];
    const Mi = supportMoments[i];
    const rLeft = w * Li / 2 + (supportMoments[i] - supportMoments[i + 1]) / Li;
    for (let j = 0; j <= POINTS; j++) {
      const frac = j / POINTS;
      const x = frac * Li;
      const globalX = parseFloat((xOffset + x).toFixed(2));
      vData.push({ x: globalX, v: parseFloat((rLeft - w * x).toFixed(1)) });
      mData.push({ x: globalX, m: parseFloat((Mi + rLeft * x - w * x * x / 2).toFixed(1)) });
    }
    xOffset += Li;
  }
  suppX.push(xOffset);

  const Vmax = Math.max(...vData.map(d => Math.abs(d.v)));
  const Mmax = Math.max(...mData.map(d => Math.abs(d.m)));

  return { vData, mData, reactions, Vmax, Mmax, suppX, supportMoments };
}

export function truckMaxMoment(L: number): number {
  const { positions, loads } = CL625;
  const step = 0.05;
  let maxM = 0;

  for (let x0 = -CL625.wheelbase; x0 <= L; x0 += step) {
    // RA from all axles on the span
    let RA = 0;
    for (let k = 0; k < positions.length; k++) {
      const xk = x0 + positions[k];
      if (xk >= 0 && xk <= L) {
        RA += loads[k] * (L - xk) / L;
      }
    }
    // Find max M at each x
    for (let xi = 0; xi <= L; xi += step) {
      let M = RA * xi;
      for (let k = 0; k < positions.length; k++) {
        const xk = x0 + positions[k];
        if (xk >= 0 && xk <= xi) {
          M -= loads[k] * (xi - xk);
        }
      }
      if (M > maxM) maxM = M;
    }
  }

  return parseFloat(maxM.toFixed(1));
}

export function computeSection(input: SectionInput, Mf_total: number, Vf_total: number, width_m: number): SectionResult {
  const { b, h, cover, fc, fy } = input;
  const PHI_S = 0.90;
  const PHI_C = 0.75;
  const alpha1 = Math.max(0.67, 0.85 - 0.0015 * fc);

  // Mf and Vf per metre width
  const Mf = Mf_total / width_m; // kN·m/m
  const Vf = Vf_total / width_m; // kN/m

  const barDia = 25; // assume 25M bar
  const d = h - cover - barDia / 2;

  // Iterate for As
  let a = 0;
  let As = 0;
  for (let i = 0; i < 5; i++) {
    As = (Mf * 1e6) / (PHI_S * fy * (d - a / 2));
    a = (PHI_S * As * fy) / (alpha1 * PHI_C * fc * b);
  }

  const Mr = (PHI_S * As * fy * (d - a / 2)) / 1e6;

  const rho_min = Math.max(0.003, 1.4 / fy);
  const As_min = rho_min * b * d;
  const rho = (As / (b * d)) * 100;

  const dv = Math.max(0.9 * d, 0.72 * h);
  const Vc = (PHI_C * 0.18 * Math.sqrt(fc) * b * dv) / 1000;

  const flexOK = Mr >= Mf && As >= As_min;
  const shearOK = Vc >= Vf;
  const sufficient = flexOK && shearOK;

  // Suggest bar spacing: 500mm² per 25M bar
  const barArea = 500;
  const spacing = Math.floor((b * barArea) / As);
  const suggestedBar = `15M25 @ ${Math.max(75, Math.min(spacing, 300))}mm c/c`;

  return {
    d: Math.round(d),
    a: Math.round(a),
    As: Math.round(As),
    As_min: Math.round(As_min),
    rho: parseFloat(rho.toFixed(3)),
    rho_min: parseFloat((rho_min * 100).toFixed(3)),
    Vc: parseFloat(Vc.toFixed(1)),
    Vf: parseFloat(Vf.toFixed(1)),
    Mr: parseFloat(Mr.toFixed(1)),
    Mf: parseFloat(Mf.toFixed(1)),
    shearOK,
    flexOK,
    sufficient,
    suggestedBar,
  };
}

export function computeDeflection(
  totalLen: number, spans: number, wSLS: number, width_m: number,
  supportMoments: number[], E_MPa: number, h_mm: number,
  material: 'concrete' | 'steel' | 'custom', isPedestrian: boolean
): SLSSpanResult[] {
  const n = Math.max(1, spans);
  const L = totalLen / n;
  const w = wSLS / width_m;
  const I_gross = 1000 * Math.pow(h_mm, 3) / 12;
  const eta = material === 'concrete' ? 0.5 : 1.0;
  const I_eff = I_gross * eta;
  const EI = (E_MPa * 1000) * (I_eff * 1e-12);
  const limitFactor = isPedestrian ? 500 : 300;
  return Array.from({ length: n }, (_, i) => {
    const MA = Math.abs(supportMoments[i] ?? 0) / width_m;
    const MB = Math.abs(supportMoments[i + 1] ?? 0) / width_m;
    const dUDL = (5 * w * Math.pow(L, 4)) / (384 * EI);
    const dMom = ((MA + MB) * L * L) / (16 * EI);
    const delta_mm = Math.max(0.1, dUDL - dMom) * 1000;
    const limit_mm = (L * 1000) / limitFactor;
    return {
      span: i + 1, L_m: parseFloat(L.toFixed(2)),
      delta_mm: parseFloat(delta_mm.toFixed(1)),
      limit_mm: parseFloat(limit_mm.toFixed(1)),
      ratio: parseFloat((delta_mm / limit_mm).toFixed(2)),
      ok: delta_mm <= limit_mm,
    };
  });
}
