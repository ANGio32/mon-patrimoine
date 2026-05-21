import { useEffect, useState } from 'react';

type ExerciseName = string;

interface Pose {
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

export const EXERCISE_CUES: Record<string, string> = {
  'jumping jacks': 'Jump feet out & sweep arms overhead simultaneously',
  'bodyweight squats': 'Sit back & down — knees track over toes',
  'push-ups': 'Lower chest to floor, elbows at 45°, back flat',
  'mountain climbers': 'Drive each knee to chest, hips stay level',
  'plank': 'Straight line head to heel — core braced tight',
  'high knees': 'Lift knees to hip height, pump arms fast',
  'burpees': 'Squat → jump back → push-up → jump up with arms',
  'bicycle crunches': 'Rotate elbow to opposite knee, control the twist',
  'lateral lunges': 'Step wide, sit into one hip, chest tall',
  'bench press': 'Lower bar to mid-chest, press up and slightly back',
  'pull-ups': 'Hang full, pull elbows to ribs, chin over bar',
  'barbell row': 'Hinge at hips, pull bar to lower chest, squeeze',
  'overhead press': 'Press straight up, lock out overhead, brace core',
  'barbell squat': 'Bar on traps, squat deep, drive through heels',
  'romanian deadlift': 'Hinge hips back, lower bar along legs',
  'walking lunges': 'Step forward, lower back knee toward floor',
  'calf raises': 'Rise on balls of feet, hold top 1 sec',
  'tricep dips': 'Lower until elbows 90°, push through palms',
  'lateral raises': 'Raise arms to shoulder height, slight elbow bend',
};

export function getExerciseCue(exercise: string): string {
  const key = exercise.toLowerCase();
  for (const [k, cue] of Object.entries(EXERCISE_CUES)) {
    if (key.includes(k)) return cue;
  }
  return 'Focus on controlled movement and proper form';
}

// ── FRONT VIEW poses ──────────────────────────────────────────────────────────
const FRONT_ANIMATIONS: Record<string, Pose[]> = {
  'jumping jacks': [
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[44,20], rShoulder:[56,20], lElbow:[37,28], rElbow:[63,28], lHand:[30,20], rHand:[70,20], lKnee:[44,54], rKnee:[56,54], lFoot:[38,68], rFoot:[62,68] },
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[44,20], rShoulder:[56,20], lElbow:[28,12], rElbow:[72,12], lHand:[20,4], rHand:[80,4], lKnee:[38,55], rKnee:[62,55], lFoot:[26,68], rFoot:[74,68] },
  ],
  'bodyweight squats': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,21], rShoulder:[57,21], lElbow:[38,30], rElbow:[62,30], lHand:[38,38], rHand:[62,38], lKnee:[44,50], rKnee:[56,50], lFoot:[42,62], rFoot:[58,62] },
    { head:[50,20], neck:[50,28], hip:[50,52], lShoulder:[42,33], rShoulder:[58,33], lElbow:[34,44], rElbow:[66,44], lHand:[28,54], rHand:[72,54], lKnee:[36,64], rKnee:[64,64], lFoot:[34,74], rFoot:[66,74] },
  ],
  'push-ups': [
    { head:[16,36], neck:[22,40], hip:[60,48], lShoulder:[28,40], rShoulder:[28,46], lElbow:[18,38], rElbow:[18,48], lHand:[10,40], rHand:[10,50], lKnee:[74,50], rKnee:[74,52], lFoot:[86,50], rFoot:[86,52] },
    { head:[18,28], neck:[24,32], hip:[60,40], lShoulder:[30,32], rShoulder:[30,38], lElbow:[20,30], rElbow:[20,40], lHand:[12,32], rHand:[12,42], lKnee:[74,42], rKnee:[74,44], lFoot:[86,42], rFoot:[86,44] },
  ],
  'mountain climbers': [
    { head:[16,32], neck:[22,36], hip:[56,44], lShoulder:[28,36], rShoulder:[28,42], lElbow:[18,34], rElbow:[18,44], lHand:[10,36], rHand:[10,46], lKnee:[46,54], rKnee:[72,46], lFoot:[40,66], rFoot:[82,46] },
    { head:[16,32], neck:[22,36], hip:[56,44], lShoulder:[28,36], rShoulder:[28,42], lElbow:[18,34], rElbow:[18,44], lHand:[10,36], rHand:[10,46], lKnee:[72,46], rKnee:[46,54], lFoot:[82,46], rFoot:[40,66] },
  ],
  'plank': [
    { head:[14,34], neck:[20,38], hip:[58,46], lShoulder:[26,38], rShoulder:[26,44], lElbow:[16,36], rElbow:[16,46], lHand:[8,38], rHand:[8,48], lKnee:[72,48], rKnee:[72,50], lFoot:[84,48], rFoot:[84,50] },
    { head:[14,34], neck:[20,38], hip:[58,46], lShoulder:[26,38], rShoulder:[26,44], lElbow:[16,36], rElbow:[16,46], lHand:[8,38], rHand:[8,48], lKnee:[72,48], rKnee:[72,50], lFoot:[84,48], rFoot:[84,50] },
  ],
  'high knees': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[37,28], rElbow:[65,26], lHand:[33,36], rHand:[69,18], lKnee:[44,52], rKnee:[60,44], lFoot:[42,64], rFoot:[58,54] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[35,26], rElbow:[63,28], lHand:[31,18], rHand:[67,36], lKnee:[40,44], rKnee:[56,52], lFoot:[38,54], rFoot:[54,64] },
  ],
  'burpees': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[36,28], rElbow:[64,28], lHand:[28,20], rHand:[72,20], lKnee:[43,52], rKnee:[57,52], lFoot:[38,66], rFoot:[62,66] },
    { head:[50,20], neck:[50,28], hip:[50,52], lShoulder:[42,33], rShoulder:[58,33], lElbow:[34,44], rElbow:[66,44], lHand:[30,54], rHand:[70,54], lKnee:[36,64], rKnee:[64,64], lFoot:[34,74], rFoot:[66,74] },
    { head:[16,36], neck:[22,40], hip:[58,48], lShoulder:[28,40], rShoulder:[28,46], lElbow:[18,38], rElbow:[18,48], lHand:[10,40], rHand:[10,50], lKnee:[72,50], rKnee:[72,52], lFoot:[84,50], rFoot:[84,52] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[28,12], rElbow:[72,12], lHand:[20,4], rHand:[80,4], lKnee:[38,53], rKnee:[62,53], lFoot:[26,66], rFoot:[74,66] },
  ],
  'bicycle crunches': [
    { head:[50,14], neck:[50,20], hip:[50,42], lShoulder:[41,20], rShoulder:[59,20], lElbow:[34,28], rElbow:[68,16], lHand:[42,34], rHand:[62,12], lKnee:[60,52], rKnee:[42,44], lFoot:[64,62], rFoot:[36,52] },
    { head:[50,14], neck:[50,20], hip:[50,42], lShoulder:[41,20], rShoulder:[59,20], lElbow:[30,16], rElbow:[64,28], lHand:[34,12], rHand:[56,34], lKnee:[40,44], rKnee:[58,52], lFoot:[34,52], rFoot:[62,62] },
  ],
  'lateral lunges': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[40,30], rElbow:[60,30], lHand:[40,40], rHand:[60,40], lKnee:[34,52], rKnee:[58,50], lFoot:[26,64], rFoot:[58,64] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[40,30], rElbow:[60,30], lHand:[40,40], rHand:[60,40], lKnee:[42,50], rKnee:[66,52], lFoot:[42,64], rFoot:[74,64] },
  ],
  default: [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[40,30], rElbow:[60,30], lHand:[38,40], rHand:[62,40], lKnee:[45,52], rKnee:[55,52], lFoot:[42,64], rFoot:[58,64] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[40,28], rElbow:[60,28], lHand:[38,38], rHand:[62,38], lKnee:[45,50], rKnee:[55,50], lFoot:[42,62], rFoot:[58,62] },
  ],
};

// ── SIDE VIEW poses — figure faces RIGHT ─────────────────────────────────────
// l = back limb (far, drawn thinner), r = front limb (near, full opacity)
const SIDE_ANIMATIONS: Record<string, Pose[]> = {
  'jumping jacks': [
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[46,32], rElbow:[54,32], lHand:[46,42], rHand:[54,42], lKnee:[48,54], rKnee:[52,54], lFoot:[46,68], rFoot:[54,68] },
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[42,12], rElbow:[58,12], lHand:[38,4],  rHand:[62,4],  lKnee:[40,54], rKnee:[60,54], lFoot:[34,68], rFoot:[66,68] },
  ],
  'bodyweight squats': [
    { head:[52,8],  neck:[52,16], hip:[52,40], lShoulder:[50,22], rShoulder:[54,22], lElbow:[48,30], rElbow:[58,30], lHand:[46,38], rHand:[62,38], lKnee:[48,54], rKnee:[56,54], lFoot:[44,68], rFoot:[60,68] },
    { head:[56,22], neck:[56,30], hip:[54,52], lShoulder:[52,36], rShoulder:[58,36], lElbow:[46,44], rElbow:[66,44], lHand:[40,44], rHand:[74,42], lKnee:[44,64], rKnee:[66,64], lFoot:[38,74], rFoot:[68,74] },
  ],
  'push-ups': [
    { head:[16,34], neck:[22,38], hip:[62,46], lShoulder:[28,38], rShoulder:[30,42], lElbow:[18,36], rElbow:[20,44], lHand:[10,38], rHand:[12,46], lKnee:[76,48], rKnee:[76,50], lFoot:[88,48], rFoot:[88,50] },
    { head:[16,40], neck:[22,44], hip:[62,52], lShoulder:[28,44], rShoulder:[30,48], lElbow:[20,50], rElbow:[22,54], lHand:[12,52], rHand:[14,56], lKnee:[76,54], rKnee:[76,56], lFoot:[88,54], rFoot:[88,56] },
  ],
  'mountain climbers': [
    { head:[16,32], neck:[22,36], hip:[58,44], lShoulder:[28,36], rShoulder:[30,40], lElbow:[18,34], rElbow:[20,42], lHand:[10,36], rHand:[12,44], lKnee:[44,56], rKnee:[72,46], lFoot:[36,68], rFoot:[82,46] },
    { head:[16,32], neck:[22,36], hip:[58,44], lShoulder:[28,36], rShoulder:[30,40], lElbow:[18,34], rElbow:[20,42], lHand:[10,36], rHand:[12,44], lKnee:[72,46], rKnee:[44,56], lFoot:[82,46], rFoot:[36,68] },
  ],
  'plank': [
    { head:[14,34], neck:[20,38], hip:[60,46], lShoulder:[26,38], rShoulder:[28,42], lElbow:[16,36], rElbow:[18,44], lHand:[8,38], rHand:[10,46], lKnee:[74,48], rKnee:[74,50], lFoot:[86,48], rFoot:[86,50] },
    { head:[14,34], neck:[20,38], hip:[60,46], lShoulder:[26,38], rShoulder:[28,42], lElbow:[16,36], rElbow:[18,44], lHand:[8,38], rHand:[10,46], lKnee:[74,48], rKnee:[74,50], lFoot:[86,48], rFoot:[86,50] },
  ],
  'high knees': [
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[44,28], rElbow:[58,28], lHand:[40,36], rHand:[62,38], lKnee:[46,54], rKnee:[60,44], lFoot:[44,68], rFoot:[64,54] },
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[58,28], rElbow:[44,28], lHand:[62,36], rHand:[40,38], lKnee:[60,44], rKnee:[46,54], lFoot:[64,54], rFoot:[44,68] },
  ],
  'burpees': [
    { head:[50,8],  neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[42,12], rElbow:[58,12], lHand:[38,4],  rHand:[62,4],  lKnee:[48,52], rKnee:[52,52], lFoot:[46,66], rFoot:[54,66] },
    { head:[56,22], neck:[56,30], hip:[54,52], lShoulder:[52,36], rShoulder:[58,36], lElbow:[46,44], rElbow:[66,44], lHand:[40,44], rHand:[74,42], lKnee:[44,64], rKnee:[66,64], lFoot:[38,74], rFoot:[68,74] },
    { head:[14,34], neck:[20,38], hip:[60,46], lShoulder:[26,38], rShoulder:[28,42], lElbow:[16,36], rElbow:[18,44], lHand:[8,38],  rHand:[10,46], lKnee:[74,48], rKnee:[74,50], lFoot:[86,48], rFoot:[86,50] },
    { head:[50,4],  neck:[50,12], hip:[50,34], lShoulder:[48,16], rShoulder:[52,16], lElbow:[42,6],  rElbow:[58,6],  lHand:[38,0],  rHand:[62,0],  lKnee:[48,46], rKnee:[52,46], lFoot:[46,60], rFoot:[54,60] },
  ],
  'bicycle crunches': [
    { head:[50,14], neck:[50,22], hip:[50,44], lShoulder:[46,22], rShoulder:[54,22], lElbow:[40,18], rElbow:[62,28], lHand:[36,14], rHand:[58,36], lKnee:[58,52], rKnee:[40,44], lFoot:[64,62], rFoot:[34,54] },
    { head:[50,14], neck:[50,22], hip:[50,44], lShoulder:[46,22], rShoulder:[54,22], lElbow:[62,18], rElbow:[40,28], lHand:[66,14], rHand:[36,36], lKnee:[40,44], rKnee:[58,52], lFoot:[34,54], rFoot:[64,62] },
  ],
  'lateral lunges': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[48,22], rShoulder:[52,22], lElbow:[46,30], rElbow:[56,30], lHand:[44,40], rHand:[58,40], lKnee:[44,52], rKnee:[56,52], lFoot:[38,66], rFoot:[62,66] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[48,22], rShoulder:[52,22], lElbow:[46,30], rElbow:[56,30], lHand:[44,40], rHand:[58,40], lKnee:[38,54], rKnee:[62,52], lFoot:[30,66], rFoot:[66,66] },
  ],
  default: [
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[46,32], rElbow:[54,32], lHand:[46,42], rHand:[54,42], lKnee:[48,54], rKnee:[52,54], lFoot:[46,68], rFoot:[54,68] },
    { head:[50,8], neck:[50,16], hip:[50,40], lShoulder:[48,22], rShoulder:[52,22], lElbow:[46,30], rElbow:[54,30], lHand:[46,40], rHand:[54,40], lKnee:[48,52], rKnee:[52,52], lFoot:[46,66], rFoot:[54,66] },
  ],
};

function getPoses(exercise: ExerciseName, view: 'front' | 'side'): Pose[] {
  const dict = view === 'side' ? SIDE_ANIMATIONS : FRONT_ANIMATIONS;
  const key = exercise.toLowerCase();
  for (const [k, poses] of Object.entries(dict)) {
    if (key.includes(k)) return poses;
  }
  return dict.default;
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function lerpPose(a: Pose, b: Pose, t: number): Pose {
  const l = (k: keyof Pose) => [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)] as [number, number];
  return { head:l('head'), neck:l('neck'), hip:l('hip'), lShoulder:l('lShoulder'), rShoulder:l('rShoulder'), lElbow:l('lElbow'), rElbow:l('rElbow'), lHand:l('lHand'), rHand:l('rHand'), lKnee:l('lKnee'), rKnee:l('rKnee'), lFoot:l('lFoot'), rFoot:l('rFoot') };
}

// ── Shared SVG renderer ───────────────────────────────────────────────────────
function PoseRenderer({ pose, color, size, showGround, isSide }: { pose: Pose; color: string; size: number; showGround?: boolean; isSide?: boolean }) {
  const s = (x: number) => (x / 100) * size;
  const groundY = Math.max(pose.lFoot[1], pose.rFoot[1]);
  const groundCX = (pose.lFoot[0] + pose.rFoot[0]) / 2;
  const shadowRx = Math.abs(pose.lFoot[0] - pose.rFoot[0]) / 2 + (isSide ? 5 : 8);

  const line = (a: [number,number], b: [number,number], w = 2.5, op = 1) => (
    <line x1={s(a[0])} y1={s(a[1])} x2={s(b[0])} y2={s(b[1])} stroke={color} strokeWidth={w} strokeLinecap="round" opacity={op} />
  );

  // In side view: l = back limb (thinner, 50% opacity), r = front limb (full)
  const backOp = isSide ? 0.45 : 1;
  const backW = isSide ? 2 : 2.5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {showGround && (
        <>
          <ellipse cx={s(groundCX)} cy={s(groundY)+5} rx={s(shadowRx)} ry={s(2.5)} fill={color} opacity={0.1} />
          <line x1={s(groundCX-shadowRx-4)} y1={s(groundY)+5} x2={s(groundCX+shadowRx+4)} y2={s(groundY)+5} stroke={color} strokeWidth={1.5} opacity={0.18} strokeLinecap="round" />
        </>
      )}
      {/* Body */}
      {line(pose.neck, pose.hip, 3)}
      {/* Head */}
      <circle cx={s(pose.head[0])} cy={s(pose.head[1])} r={s(6)} fill="none" stroke={color} strokeWidth={2.5} />
      {/* Shoulders */}
      {line(pose.lShoulder, pose.rShoulder, 2.5)}
      {/* Back arm (l) — drawn first so front arm appears on top */}
      {line(pose.lShoulder, pose.lElbow, backW, backOp)}
      {line(pose.lElbow, pose.lHand, backW, backOp)}
      {/* Back leg (l) */}
      {line(pose.hip, pose.lKnee, backW, backOp)}
      {line(pose.lKnee, pose.lFoot, backW, backOp)}
      {/* Front arm (r) */}
      {line(pose.rShoulder, pose.rElbow, 2.5)}
      {line(pose.rElbow, pose.rHand, 2.5)}
      {/* Front leg (r) */}
      {line(pose.hip, pose.rKnee, 2.5)}
      {line(pose.rKnee, pose.rFoot, 2.5)}
    </svg>
  );
}

// ── Animation hook ────────────────────────────────────────────────────────────
function useAnimation(posesLength: number, exercise: string) {
  const [t, setT] = useState(0);
  const [frameDir, setFrameDir] = useState(1);
  const [frameIdx, setFrameIdx] = useState(0);

  const isStatic = exercise.toLowerCase().includes('plank');
  const speed = exercise.toLowerCase().includes('jumping') || exercise.toLowerCase().includes('high') ? 40 : 55;

  useEffect(() => {
    if (isStatic) return;
    let prog = 0;
    const iv = setInterval(() => {
      prog += 2;
      if (prog >= 100) {
        prog = 0;
        setFrameIdx(prev => {
          const next = prev + frameDir;
          if (next >= posesLength - 1) setFrameDir(-1);
          if (next <= 0) setFrameDir(1);
          return Math.max(0, Math.min(posesLength - 1, next));
        });
      }
      setT(prog / 100);
    }, speed);
    return () => clearInterval(iv);
  }, [posesLength, frameDir, isStatic, speed]);

  return { t, frameIdx, frameDir };
}

// ── Default export: single front-view figure (for thumbnails etc.) ────────────
interface Props {
  exercise: ExerciseName;
  color?: string;
  size?: number;
  showGround?: boolean;
}

export default function StickFigure({ exercise, color = '#7C3AED', size = 96, showGround = true }: Props) {
  const poses = getPoses(exercise, 'front');
  const { t, frameIdx, frameDir } = useAnimation(poses.length, exercise);
  const nextIdx = Math.max(0, Math.min(poses.length - 1, frameIdx + (frameDir > 0 ? 1 : -1)));
  const pose = lerpPose(poses[frameIdx], poses[nextIdx], t);
  return <PoseRenderer pose={pose} color={color} size={size} showGround={showGround} isSide={false} />;
}

// ── Named export: dual-view component for workout player ──────────────────────
interface DualProps {
  exercise: ExerciseName;
  color?: string;
  size?: number;
}

export function ExerciseAnimation({ exercise, color = '#7C3AED', size = 110 }: DualProps) {
  const frontPoses = getPoses(exercise, 'front');
  const sidePoses = getPoses(exercise, 'side');
  const { t, frameIdx, frameDir } = useAnimation(Math.max(frontPoses.length, sidePoses.length), exercise);

  const fIdx = Math.min(frameIdx, frontPoses.length - 1);
  const sIdx = Math.min(frameIdx, sidePoses.length - 1);
  const fNext = Math.max(0, Math.min(frontPoses.length - 1, fIdx + (frameDir > 0 ? 1 : -1)));
  const sNext = Math.max(0, Math.min(sidePoses.length - 1, sIdx + (frameDir > 0 ? 1 : -1)));

  const frontPose = lerpPose(frontPoses[fIdx], frontPoses[fNext], t);
  const sidePose = lerpPose(sidePoses[sIdx], sidePoses[sNext], t);

  return (
    <div className="flex gap-2 items-end justify-center w-full">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Front</span>
        <div className="bg-purple-bg rounded-2xl flex items-center justify-center" style={{ width: size + 16, height: size + 16 }}>
          <PoseRenderer pose={frontPose} color={color} size={size} showGround isSide={false} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Side</span>
        <div className="bg-card-blue/40 rounded-2xl flex items-center justify-center" style={{ width: size + 16, height: size + 16 }}>
          <PoseRenderer pose={sidePose} color={color} size={size} showGround isSide />
        </div>
      </div>
    </div>
  );
}
