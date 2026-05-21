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

// Short coaching cue shown below the figure
export const EXERCISE_CUES: Record<string, string> = {
  'jumping jacks': 'Jump feet out & sweep arms overhead simultaneously',
  'bodyweight squats': 'Sit back & down — knees track over toes',
  'push-ups': 'Lower chest to floor, elbows at 45°, back flat',
  'mountain climbers': 'Drive each knee to chest, hips level',
  'plank': 'Straight line head to heel — core braced',
  'high knees': 'Lift knees to hip height, pump arms fast',
  'burpees': 'Squat → jump back → push-up → jump up with arms',
  'bicycle crunches': 'Rotate elbow to opposite knee, control the twist',
  'lateral lunges': 'Step wide, sit into one hip, keep chest tall',
  'bench press': 'Lower bar to mid-chest, press up and slightly back',
  'pull-ups': 'Hang full, pull elbows to ribs, chin over bar',
  'barbell row': 'Hinge at hips, pull bar to lower chest, squeeze',
  'overhead press': 'Press straight up, lock out overhead, brace core',
  'barbell squat': 'Bar on traps, squat deep, drive through heels',
  'romanian deadlift': 'Hinge hips back, lower bar along legs, feel hamstrings',
  'walking lunges': 'Step forward, lower back knee toward floor',
  'calf raises': 'Rise on balls of feet, hold top for 1 sec',
  'tricep dips': 'Lower until elbows at 90°, push through palms',
  'lateral raises': 'Raise arms to shoulder height, slight bend in elbows',
};

const ANIMATIONS: Record<string, Pose[]> = {
  'jumping jacks': [
    {
      head:[50,8], neck:[50,16], hip:[50,40],
      lShoulder:[44,20], rShoulder:[56,20],
      lElbow:[37,28], rElbow:[63,28],
      lHand:[30,20], rHand:[70,20],
      lKnee:[44,54], rKnee:[56,54],
      lFoot:[38,68], rFoot:[62,68],
    },
    {
      head:[50,8], neck:[50,16], hip:[50,40],
      lShoulder:[44,20], rShoulder:[56,20],
      lElbow:[28,13], rElbow:[72,13],
      lHand:[20,6], rHand:[80,6],
      lKnee:[38,55], rKnee:[62,55],
      lFoot:[26,68], rFoot:[74,68],
    },
  ],
  'bodyweight squats': [
    {
      head:[50,8], neck:[50,16], hip:[50,38],
      lShoulder:[43,21], rShoulder:[57,21],
      lElbow:[38,30], rElbow:[62,30],
      lHand:[38,38], rHand:[62,38],
      lKnee:[44,50], rKnee:[56,50],
      lFoot:[42,62], rFoot:[58,62],
    },
    {
      head:[50,20], neck:[50,28], hip:[50,52],
      lShoulder:[42,33], rShoulder:[58,33],
      lElbow:[34,44], rElbow:[66,44],
      lHand:[28,54], rHand:[72,54],
      lKnee:[36,64], rKnee:[64,64],
      lFoot:[34,74], rFoot:[66,74],
    },
  ],
  'push-ups': [
    {
      head:[16,38], neck:[22,42], hip:[58,50],
      lShoulder:[28,42], rShoulder:[28,48],
      lElbow:[18,40], rElbow:[18,50],
      lHand:[10,42], rHand:[10,52],
      lKnee:[74,52], rKnee:[74,54],
      lFoot:[86,52], rFoot:[86,54],
    },
    {
      head:[18,30], neck:[24,34], hip:[58,42],
      lShoulder:[30,34], rShoulder:[30,40],
      lElbow:[20,32], rElbow:[20,42],
      lHand:[12,34], rHand:[12,44],
      lKnee:[74,44], rKnee:[74,46],
      lFoot:[86,44], rFoot:[86,46],
    },
  ],
  'mountain climbers': [
    {
      head:[16,32], neck:[22,36], hip:[56,44],
      lShoulder:[28,36], rShoulder:[28,42],
      lElbow:[18,34], rElbow:[18,44],
      lHand:[10,36], rHand:[10,46],
      lKnee:[48,54], rKnee:[70,46],
      lFoot:[42,66], rFoot:[80,46],
    },
    {
      head:[16,32], neck:[22,36], hip:[56,44],
      lShoulder:[28,36], rShoulder:[28,42],
      lElbow:[18,34], rElbow:[18,44],
      lHand:[10,36], rHand:[10,46],
      lKnee:[72,46], rKnee:[48,56],
      lFoot:[82,46], rFoot:[42,68],
    },
  ],
  'plank': [
    {
      head:[14,34], neck:[20,36], hip:[56,44],
      lShoulder:[26,36], rShoulder:[26,42],
      lElbow:[16,36], rElbow:[16,44],
      lHand:[8,38], rHand:[8,46],
      lKnee:[70,46], rKnee:[70,48],
      lFoot:[82,46], rFoot:[82,48],
    },
    {
      head:[14,34], neck:[20,36], hip:[56,44],
      lShoulder:[26,36], rShoulder:[26,42],
      lElbow:[16,36], rElbow:[16,44],
      lHand:[8,38], rHand:[8,46],
      lKnee:[70,46], rKnee:[70,48],
      lFoot:[82,46], rFoot:[82,48],
    },
  ],
  'high knees': [
    {
      head:[50,8], neck:[50,16], hip:[50,38],
      lShoulder:[43,20], rShoulder:[57,20],
      lElbow:[37,28], rElbow:[65,26],
      lHand:[33,36], rHand:[69,18],
      lKnee:[44,52], rKnee:[60,44],
      lFoot:[42,64], rFoot:[58,54],
    },
    {
      head:[50,8], neck:[50,16], hip:[50,38],
      lShoulder:[43,20], rShoulder:[57,20],
      lElbow:[35,26], rElbow:[63,28],
      lHand:[31,18], rHand:[67,36],
      lKnee:[40,44], rKnee:[56,52],
      lFoot:[38,54], rFoot:[54,64],
    },
  ],
  'burpees': [
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[36,28], rElbow:[64,28], lHand:[28,20], rHand:[72,20], lKnee:[43,52], rKnee:[57,52], lFoot:[38,66], rFoot:[62,66] },
    { head:[50,20], neck:[50,28], hip:[50,52], lShoulder:[42,33], rShoulder:[58,33], lElbow:[34,44], rElbow:[66,44], lHand:[30,54], rHand:[70,54], lKnee:[36,64], rKnee:[64,64], lFoot:[34,74], rFoot:[66,74] },
    { head:[16,36], neck:[22,40], hip:[58,48], lShoulder:[28,40], rShoulder:[28,46], lElbow:[18,38], rElbow:[18,48], lHand:[10,40], rHand:[10,50], lKnee:[72,50], rKnee:[72,52], lFoot:[84,50], rFoot:[84,52] },
    { head:[50,8], neck:[50,16], hip:[50,38], lShoulder:[43,20], rShoulder:[57,20], lElbow:[28,12], rElbow:[72,12], lHand:[20,5], rHand:[80,5], lKnee:[38,53], rKnee:[62,53], lFoot:[26,66], rFoot:[74,66] },
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
  showGround?: boolean;
}

export default function StickFigure({ exercise, color = '#7C3AED', size = 96, showGround = true }: Props) {
  const poses = getPoses(exercise);
  const [t, setT] = useState(0);
  const [frameDir, setFrameDir] = useState(1);
  const [frameIdx, setFrameIdx] = useState(0);

  const isStatic = exercise.toLowerCase().includes('plank');
  const speed = exercise.toLowerCase().includes('jumping') || exercise.toLowerCase().includes('high') ? 40 : 55;

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

  // Ground level: lowest foot Y, clamped near bottom
  const groundY = Math.max(pose.lFoot[1], pose.rFoot[1]);
  const groundCX = (pose.lFoot[0] + pose.rFoot[0]) / 2;
  const shadowRx = Math.abs(pose.lFoot[0] - pose.rFoot[0]) / 2 + 8;

  const line = (a: [number, number], b: [number, number], width = 3) => (
    <line x1={s(a[0])} y1={s(a[1])} x2={s(b[0])} y2={s(b[1])} stroke={color} strokeWidth={width} strokeLinecap="round" />
  );

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {showGround && (
        <>
          {/* Ground shadow ellipse */}
          <ellipse
            cx={s(groundCX)}
            cy={s(groundY) + 5}
            rx={s(shadowRx)}
            ry={s(2.5)}
            fill={color}
            opacity={0.12}
          />
          {/* Ground line */}
          <line
            x1={s(groundCX - shadowRx - 4)}
            y1={s(groundY) + 5}
            x2={s(groundCX + shadowRx + 4)}
            y2={s(groundY) + 5}
            stroke={color}
            strokeWidth={1.5}
            opacity={0.2}
            strokeLinecap="round"
          />
        </>
      )}
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
      {/* Hips to knees */}
      {line(pose.hip, pose.lKnee, 2.5)}
      {line(pose.hip, pose.rKnee, 2.5)}
      {/* Knees to feet */}
      {line(pose.lKnee, pose.lFoot, 2.5)}
      {line(pose.rKnee, pose.rFoot, 2.5)}
    </svg>
  );
}
