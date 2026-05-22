/**
 * PoseAnalyzer — draws a real-time skeleton overlay on a live <video> element
 * using MediaPipe Pose Landmarker (WASM, runs in the browser).
 *
 * Usage:
 *   <PoseAnalyzer videoRef={liveRef} exercise="Bodyweight Squats" active={recording} />
 *
 * The overlay canvas is absolutely positioned to cover the video.
 * Feedback tips appear below the video (passed up via onFeedback prop).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { CheckCircle, AlertCircle, Activity } from 'lucide-react';

// ─── Angle helpers ────────────────────────────────────────────────────────────

interface Point { x: number; y: number; z?: number }

function angleDeg(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  if (mag === 0) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

// MediaPipe Pose landmark indices
const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,    RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,    RIGHT_WRIST: 16,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
};

// ─── Exercise-specific feedback rules ────────────────────────────────────────

interface FeedbackItem { ok: boolean; text: string }

type LandmarkList = { x: number; y: number; z: number; visibility?: number }[];

function analyzeSQUAT(lm: LandmarkList): FeedbackItem[] {
  const leftKneeAngle  = angleDeg(lm[LM.LEFT_HIP],  lm[LM.LEFT_KNEE],  lm[LM.LEFT_ANKLE]);
  const rightKneeAngle = angleDeg(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
  const kneeAngle      = Math.min(leftKneeAngle, rightKneeAngle);

  const leftHipAngle   = angleDeg(lm[LM.LEFT_SHOULDER],  lm[LM.LEFT_HIP],  lm[LM.LEFT_KNEE]);
  const rightHipAngle  = angleDeg(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]);
  const hipAngle       = (leftHipAngle + rightHipAngle) / 2;

  return [
    { ok: kneeAngle < 120, text: kneeAngle < 120 ? 'Bonne profondeur de squat' : 'Descend plus bas — vise 90° aux genoux' },
    { ok: hipAngle > 45,   text: hipAngle > 45   ? 'Dos bien incliné' : 'Penche le buste légèrement en avant' },
  ];
}

function analyzePUSHUP(lm: LandmarkList): FeedbackItem[] {
  const leftElbow  = angleDeg(lm[LM.LEFT_SHOULDER],  lm[LM.LEFT_ELBOW],  lm[LM.LEFT_WRIST]);
  const rightElbow = angleDeg(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_WRIST]);
  const elbowAngle = Math.min(leftElbow, rightElbow);

  const leftBody   = angleDeg(lm[LM.LEFT_SHOULDER],  lm[LM.LEFT_HIP],  lm[LM.LEFT_KNEE]);
  const rightBody  = angleDeg(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]);
  const bodyAngle  = (leftBody + rightBody) / 2;

  return [
    { ok: elbowAngle < 110, text: elbowAngle < 110 ? 'Bonne amplitude de mouvement' : 'Plie les coudes à 90°' },
    { ok: bodyAngle > 160,  text: bodyAngle > 160   ? 'Corps bien aligné' : 'Garde le corps droit — évite de cambrer' },
  ];
}

function analyzeLUNGE(lm: LandmarkList): FeedbackItem[] {
  const frontKnee = angleDeg(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
  const torso     = angleDeg(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
  return [
    { ok: frontKnee < 100, text: frontKnee < 100 ? 'Genou avant bien fléchi' : 'Fléchis davantage le genou avant' },
    { ok: torso > 150,     text: torso > 150      ? 'Buste droit' : 'Redresse le buste' },
  ];
}

function analyzeJUMPINGJACK(lm: LandmarkList): FeedbackItem[] {
  const armSpread = Math.abs(lm[LM.LEFT_WRIST].y - lm[LM.LEFT_SHOULDER].y);
  const legSpread = Math.abs(lm[LM.LEFT_ANKLE].x - lm[LM.RIGHT_ANKLE].x);
  return [
    { ok: armSpread < 0.1, text: armSpread < 0.1 ? 'Bras bien levés' : 'Monte les bras jusqu\'en haut' },
    { ok: legSpread > 0.25, text: legSpread > 0.25 ? 'Bon écart des jambes' : 'Écarte davantage les pieds' },
  ];
}

function analyzeGENERIC(lm: LandmarkList): FeedbackItem[] {
  const shoulderY = (lm[LM.LEFT_SHOULDER].y + lm[LM.RIGHT_SHOULDER].y) / 2;
  const hipY      = (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2;
  const posture   = hipY - shoulderY;
  return [
    { ok: posture > 0.1, text: posture > 0.1 ? 'Bonne posture générale' : 'Vérifie ton alignement' },
  ];
}

function getFeedback(exercise: string, lm: LandmarkList): FeedbackItem[] {
  const e = exercise.toLowerCase();
  if (e.includes('squat'))                              return analyzeSQUAT(lm);
  if (e.includes('push') || e.includes('pompe'))        return analyzePUSHUP(lm);
  if (e.includes('lunge') || e.includes('fente'))       return analyzeLUNGE(lm);
  if (e.includes('jumping') || e.includes('écart'))     return analyzeJUMPINGJACK(lm);
  return analyzeGENERIC(lm);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  exercise: string;
  active: boolean;
  onFeedback?: (items: FeedbackItem[]) => void;
}

let landmarkerSingleton: PoseLandmarker | null = null;
let landmarkerLoading = false;

async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarkerSingleton) return landmarkerSingleton;
  if (landmarkerLoading) {
    // poll until loaded
    await new Promise<void>(res => {
      const t = setInterval(() => { if (landmarkerSingleton) { clearInterval(t); res(); } }, 100);
    });
    return landmarkerSingleton!;
  }
  landmarkerLoading = true;
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
  );
  landmarkerSingleton = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  landmarkerLoading = false;
  return landmarkerSingleton;
}

export default function PoseAnalyzer({ videoRef, exercise, active, onFeedback }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);
  const [ready, setReady]       = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [error, setError]       = useState('');

  const runLoop = useCallback(async (lm: PoseLandmarker) => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(() => runLoop(lm));
      return;
    }

    canvas.width  = video.videoWidth  || canvas.offsetWidth;
    canvas.height = video.videoHeight || canvas.offsetHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const result = lm.detectForVideo(video, performance.now());

    if (result.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(ctx);
      drawingUtils.drawLandmarks(result.landmarks[0], {
        color: '#7C3AED',
        lineWidth: 2,
        radius: 4,
      });
      drawingUtils.drawConnectors(result.landmarks[0], PoseLandmarker.POSE_CONNECTIONS, {
        color: '#A78BFA',
        lineWidth: 2,
      });

      const fb = getFeedback(exercise, result.landmarks[0] as LandmarkList);
      setFeedback(fb);
      onFeedback?.(fb);
    }

    rafRef.current = requestAnimationFrame(() => runLoop(lm));
  }, [videoRef, exercise, onFeedback]);

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let cancelled = false;
    getPoseLandmarker()
      .then(lm => {
        if (cancelled) return;
        setReady(true);
        rafRef.current = requestAnimationFrame(() => runLoop(lm));
      })
      .catch(() => setError('Analyse de pose indisponible'));

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, runLoop]);

  if (error) return null;

  return (
    <>
      {/* Skeleton overlay — covers the video exactly */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 10 }}
      />

      {/* Loading indicator */}
      {active && !ready && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full" style={{ zIndex: 11 }}>
          <Activity size={11} className="text-purple animate-pulse" />
          <span className="text-white text-[10px] font-semibold">Analyse…</span>
        </div>
      )}

      {/* Feedback pills — shown below the overlay */}
      {active && ready && feedback.length > 0 && (
        <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-1.5 px-4" style={{ zIndex: 11 }}>
          {feedback.map((f, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm text-xs font-semibold ${
                f.ok ? 'bg-green-500/80 text-white' : 'bg-amber-500/80 text-white'
              }`}
            >
              {f.ok
                ? <CheckCircle size={12} strokeWidth={2} />
                : <AlertCircle size={12} strokeWidth={2} />}
              {f.text}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export type { FeedbackItem };
