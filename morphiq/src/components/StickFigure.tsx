import { useEffect, useState } from 'react';

type ExerciseName = string;

interface Pose {
  // head center x,y; body endpoints; limb angles in degrees
  head: [number, number];
  neck: [number, number];
  hip: [number, number];
  lShoulder: [number, number];
  rShoulder: [number, number];
  lElbow: [number, number];
  rElbow: [number, number];
  lHand: [number, number];
  rHand: [number, number];
  lKnee: [number, number];
  rKnee: [number, number];
  lFoot: [number, number];
  rFoot: [number, number];
}

// Pre-computed keyframes for each exercise
const ANIMATIONS: Record<string, Pose[]> = {
  // ─── JUMPING JACKS ──────────────────────────────────────────
  'jumping jacks': [
    {
      head:[50,10], neck:[50,18], hip:[50,42],
      lShoulder:[44,22], rShoulder:[56,22],
      lElbow:[36,30], rElbow:[64,30],
      lHand:[28,22], rHand:[72,22],
      lKnee:[44,54], rKnee:[56,54],
      lFoot:[38,68], rFoot:[62,68],
    },
    {
      head:[50,10], neck:[50,18], hip:[50,42],
      lShoulder:[44,22], rShoulder:[56,22],
      lElbow:[30,16], rElbow:[70,16],
      lHand:[22,10], rHand:[78,10],
      lKnee:[40,55], rKnee:[60,55],
      lFoot:[28,68], rFoot:[72,68],
    },
  ],

  // ─── SQUATS ────────────────────────────────────────────────
  'bodyweight squats': [
    {
      head:[50,10], neck:[50,18], hip:[50,40],
      lShoulder:[43,23], rShoulder:[57,23],
      lElbow:[38,32], rElbow:[62,32],
      lHand:[38,40], rHand:[62,40],
      lKnee:[44,52], rKnee:[56,52],
      lFoot:[42,64], rFoot:[58,64],
    },
    {
      head:[50,20], neck:[50,28], hip:[50,50],
      lShoulder:[42,33], rShoulder:[58,33],
      lElbow:[34,42], rElbow:[66,42],
      lHand:[30,52], rHand:[70,52],
      lKnee:[38,62], rKnee:[62,62],
      lFoot:[36,72], rFoot:[64,72],
    },
  ],

  // ─── PUSH-UPS ──────────────────────────────────────────────
  'push-ups': [
    {
      head:[20,30], neck:[26,34], hip:[60,42],
      lShoulder:[32,36], rShoulder:[32,40],
      lElbow:[22,34], rElbow:[22,42],
      lHand:[14,36], rHand:[14,44],
      lKnee:[72,44], rKnee:[72,46],
      lFoot:[84,44], rFoot:[84,46],
    },
    {
      head:[20,22], neck:[26,26], hip:[60,36],
      lShoulder:[32,28], rShoulder:[32,32],
      lElbow:[22,26], rElbow:[22,34],
      lHand:[14,28], rHand:[14,36],
      lKnee:[72,38], rKnee:[72,40],
      lFoot:[84,38], rFoot:[84,40],
    },
  ],

  // ─── MOUNTAIN CLIMBERS ─────────────────────────────────────
  'mountain climbers': [
    {
      head:[20,26], neck:[26,30], hip:[58,36],
      lShoulder:[30,30], rShoulder:[30,34],
      lElbow:[20,30], rElbow:[20,36],
      lHand:[12,32], rHand:[12,38],
      lKnee:[50,46], rKnee:[68,38],
      lFoot:[44,58], rFoot:[78,38],
    },
    {
      head:[20,26], neck:[26,30], hip:[58,36],
      lShoulder:[30,30], rShoulder:[30,34],
      lElbow:[20,30], rElbow:[20,36],
      lHand:[12,32], rHand:[12,38],
      lKnee:[70,38], rKnee:[50,48],
      lFoot:[80,38], rFoot:[44,60],
    },
  ],

  // ─── PLANK ─────────────────────────────────────────────────
  'plank': [
    {
      head:[16,28], neck:[22,30], hip:[58,36],
      lShoulder:[28,30], rShoulder:[28,34],
      lElbow:[18,30], rElbow:[18,36],
      lHand:[10,32], rHand:[10,38],
      lKnee:[70,38], rKnee:[70,40],
      lFoot:[82,38], rFoot:[82,40],
    },
    {
      head:[16,28], neck:[22,30], hip:[58,36],
      lShoulder:[28,30], rShoulder:[28,34],
      lElbow:[18,30], rElbow:[18,36],
      lHand:[10,32], rHand:[10,38],
      lKnee:[70,38], rKnee:[70,40],
      lFoot:[82,38], rFoot:[82,40],
    },
  ],

  // ─── HIGH KNEES ────────────────────────────────────────────
  'high knees': [
    {
      head:[50,10], neck:[50,18], hip:[50,40],
      lShoulder:[44,22], rShoulder:[56,22],
      lElbow:[38,30], rElbow:[64,28],
      lHand:[34,38], rHand:[68,20],
      lKnee:[46,52], rKnee:[58,46],
      lFoot:[44,64], rFoot:[56,56],
    },
    {
      head:[50,10], neck:[50,18], hip:[50,40],
      lShoulder:[44,22], rShoulder:[56,22],
      lElbow:[36,28], rElbow:[62,30],
      lHand:[32,20], rHand:[66,38],
      lKnee:[42,46], rKnee:[54,52],
      lFoot:[40,56], rFoot:[52,64],
    },
  ],

  // ─── BURPEES (4 frames) ────────────────────────────────────
  'burpees': [
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[36,30], rElbow:[64,30], lHand:[28,22], rHand:[72,22], lKnee:[44,54], rKnee:[56,54], lFoot:[38,68], rFoot:[62,68] },
    { head:[50,20], neck:[50,28], hip:[50,50], lShoulder:[42,33], rShoulder:[58,33], lElbow:[34,42], rElbow:[66,42], lHand:[30,52], rHand:[70,52], lKnee:[38,62], rKnee:[62,62], lFoot:[36,72], rFoot:[64,72] },
    { head:[20,28], neck:[26,32], hip:[58,38], lShoulder:[30,32], rShoulder:[30,36], lElbow:[20,32], rElbow:[20,38], lHand:[12,34], rHand:[12,40], lKnee:[70,40], rKnee:[70,42], lFoot:[82,40], rFoot:[82,42] },
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[30,16], rElbow:[70,16], lHand:[22,10], rHand:[78,10], lKnee:[40,55], rKnee:[60,55], lFoot:[28,68], rFoot:[72,68] },
  ],

  // ─── BICYCLE CRUNCHES ─────────────────────────────────────
  'bicycle crunches': [
    { head:[50,16], neck:[50,22], hip:[50,44], lShoulder:[42,22], rShoulder:[58,22], lElbow:[36,30], rElbow:[68,18], lHand:[44,36], rHand:[64,14], lKnee:[58,52], rKnee:[44,46], lFoot:[62,62], rFoot:[38,54] },
    { head:[50,16], neck:[50,22], hip:[50,44], lShoulder:[42,22], rShoulder:[58,22], lElbow:[32,18], rElbow:[64,30], lHand:[36,14], rHand:[56,36], lKnee:[42,46], rKnee:[56,52], lFoot:[36,54], rFoot:[60,62] },
  ],

  // ─── LATERAL LUNGES ───────────────────────────────────────
  'lateral lunges': [
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[40,32], rElbow:[60,32], lHand:[40,42], rHand:[60,42], lKnee:[36,54], rKnee:[58,52], lFoot:[28,66], rFoot:[58,66] },
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[40,32], rElbow:[60,32], lHand:[40,42], rHand:[60,42], lKnee:[42,52], rKnee:[64,54], lFoot:[42,66], rFoot:[72,66] },
  ],

  // default standing
  default: [
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[40,32], rElbow:[60,32], lHand:[38,42], rHand:[62,42], lKnee:[45,54], rKnee:[55,54], lFoot:[42,66], rFoot:[58,66] },
    { head:[50,10], neck:[50,18], hip:[50,40], lShoulder:[44,22], rShoulder:[56,22], lElbow:[40,30], rElbow:[60,30], lHand:[38,40], rHand:[62,40], lKnee:[45,52], rKnee:[55,52], lFoot:[42,64], rFoot:[58,64] },
  ],
};

function getPoses(exercise: ExerciseName): Pose[] {
  const key = exercise.toLowerCase();
  for (const [k, poses] of Object.entries(ANIMATIONS)) {
    if (key.includes(k)) return poses;
  }
  return ANIMATIONS.default;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (ka: keyof Pose) => [lerp(a[ka][0], b[ka][0], t), lerp(a[ka][1], b[ka][1], t)] as [number, number];
  return {
    head: l('head'), neck: l('neck'), hip: l('hip'),
    lShoulder: l('lShoulder'), rShoulder: l('rShoulder'),
    lElbow: l('lElbow'), rElbow: l('rElbow'),
    lHand: l('lHand'), rHand: l('rHand'),
    lKnee: l('lKnee'), rKnee: l('rKnee'),
    lFoot: l('lFoot'), rFoot: l('rFoot'),
  };
}

interface Props {
  exercise: ExerciseName;
  color?: string;
  size?: number;
}

export default function StickFigure({ exercise, color = '#2FB960', size = 96 }: Props) {
  const poses = getPoses(exercise);
  const [t, setT] = useState(0);
  const [frameDir, setFrameDir] = useState(1);
  const [frameIdx, setFrameIdx] = useState(0);

  const isStatic = exercise.toLowerCase().includes('plank');
  const speed = exercise.toLowerCase().includes('jumping') || exercise.toLowerCase().includes('high') ? 40 : 60;

  useEffect(() => {
    if (isStatic) return;
    let prog = 0;
    const interval = setInterval(() => {
      prog += 2;
      if (prog >= 100) {
        prog = 0;
        setFrameIdx(prev => {
          const next = prev + frameDir;
          if (next >= poses.length - 1) setFrameDir(-1);
          if (next <= 0) setFrameDir(1);
          return Math.max(0, Math.min(poses.length - 1, next));
        });
      }
      setT(prog / 100);
    }, speed);
    return () => clearInterval(interval);
  }, [poses.length, frameDir, isStatic, speed]);

  const nextIdx = Math.max(0, Math.min(poses.length - 1, frameIdx + (frameDir > 0 ? 1 : -1)));
  const pose = lerpPose(poses[frameIdx], poses[nextIdx], t);

  const s = (x: number) => (x / 100) * size;

  const line = (a: [number, number], b: [number, number], width = 3) => (
    <line x1={s(a[0])} y1={s(a[1])} x2={s(b[0])} y2={s(b[1])} stroke={color} strokeWidth={width} strokeLinecap="round" />
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Body */}
      {line(pose.neck, pose.hip, 3)}
      {/* Head */}
      <circle cx={s(pose.head[0])} cy={s(pose.head[1])} r={s(6)} fill="none" stroke={color} strokeWidth={2.5} />
      {/* Shoulders */}
      {line(pose.lShoulder, pose.rShoulder, 2.5)}
      {/* Arms */}
      {line(pose.lShoulder, pose.lElbow, 2.5)}
      {line(pose.lElbow, pose.lHand, 2.5)}
      {line(pose.rShoulder, pose.rElbow, 2.5)}
      {line(pose.rElbow, pose.rHand, 2.5)}
      {/* Hips */}
      {line(pose.hip, pose.lKnee, 2.5)}
      {line(pose.hip, pose.rKnee, 2.5)}
      {/* Legs */}
      {line(pose.lKnee, pose.lFoot, 2.5)}
      {line(pose.rKnee, pose.rFoot, 2.5)}
    </svg>
  );
}
