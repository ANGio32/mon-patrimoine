/**
 * ExerciseMedia — shows the stick-figure animation by default; lets the user
 * record themselves and replace the animation with their own video, per exercise.
 *
 * Future AI hook: pass an `onVideoFrame` callback — it will be called each
 * animation frame while the live camera is active (recording or reviewing),
 * giving a HTMLVideoElement ready for MediaPipe Pose / TensorFlow.js analysis.
 *
 * Props:
 *   exercise        – display name, e.g. "Bodyweight Squats"
 *   paused          – pauses the stick-figure animation (mirrors workout timer)
 *   size            – base px size forwarded to ExerciseAnimation
 *   // onVideoFrame?: (video: HTMLVideoElement) => void;  ← add when AI lands
 */

import { useState, useEffect, useRef } from 'react';
import {
  Video, RefreshCw, RotateCcw, CheckCircle,
  Circle, Square, X, AlertCircle,
} from 'lucide-react';
import { ExerciseAnimation } from './StickFigure';
import {
  saveExerciseVideo, loadExerciseVideo, deleteExerciseVideo, toExerciseId,
} from '../utils/exerciseVideos';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaView = 'animation' | 'camera' | 'preview' | 'saved';

interface Props {
  exercise: string;
  paused?:  boolean;
  size?:    number;
}

const MAX_REC_SEC = 30;

function fmt(s: number) { return `0:${String(s).padStart(2, '0')}`; }

function bestMimeType(): string {
  for (const t of ['video/webm;codecs=vp9', 'video/webm', 'video/mp4']) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExerciseMedia({ exercise, paused = false, size = 120 }: Props) {
  const exerciseId = toExerciseId(exercise);

  const [view,       setView]       = useState<MediaView>('animation');
  const [savedUrl,   setSavedUrl]   = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob,setPreviewBlob]= useState<Blob | null>(null);
  const [recording,  setRecording]  = useState(false);
  const [recSec,     setRecSec]     = useState(0);
  const [camError,   setCamError]   = useState('');

  const liveRef    = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const recRef     = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Stop camera stream & timer (pure cleanup, no state) ───────────────────
  function releaseStream() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recRef.current?.stop();
    recRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => releaseStream(), []);

  // ── Load saved video when exercise changes ────────────────────────────────
  useEffect(() => {
    let alive = true;

    releaseStream();
    setRecording(false);
    setRecSec(0);
    setCamError('');
    setPreviewBlob(null);
    setPreviewUrl(prev  => { if (prev)  URL.revokeObjectURL(prev);  return null; });
    setSavedUrl(prev    => { if (prev)  URL.revokeObjectURL(prev);  return null; });
    setView('animation');

    loadExerciseVideo(exerciseId).then(blob => {
      if (!alive || !blob) return;
      const url = URL.createObjectURL(blob);
      setSavedUrl(url);
      setView('saved');
    });

    return () => { alive = false; };
  }, [exerciseId]);

  // ── Attach stream to <video> once camera view is mounted ──────────────────
  useEffect(() => {
    if (view === 'camera' && streamRef.current && liveRef.current) {
      liveRef.current.srcObject = streamRef.current;
      liveRef.current.play().catch(() => {});
    }
  }, [view]);

  // ── Camera ────────────────────────────────────────────────────────────────
  async function openCamera() {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      setView('camera');
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
        setCamError('Camera access denied — allow it in your browser settings.');
      } else {
        setCamError('Could not access camera.');
      }
    }
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  function startRecording() {
    if (!streamRef.current) return;
    const mimeType = bestMimeType();
    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined,
    );
    chunksRef.current = [];

    recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      setPreviewBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setRecording(false);
      setRecSec(0);
      setView('preview');
    };

    recorder.start();
    recRef.current = recorder;
    setRecording(true);
    setRecSec(0);

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setRecSec(elapsed);
      if (elapsed >= MAX_REC_SEC) stopRecording();
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recRef.current?.stop();
    recRef.current = null;
  }

  function cancelCamera() {
    releaseStream();
    setRecording(false);
    setRecSec(0);
    setView(savedUrl ? 'saved' : 'animation');
  }

  // ── Save / reset ──────────────────────────────────────────────────────────
  async function saveRecording() {
    if (!previewBlob) return;
    await saveExerciseVideo(exerciseId, previewBlob);
    const url = URL.createObjectURL(previewBlob);
    setSavedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    setPreviewBlob(null);
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setView('saved');
  }

  async function resetToAnimation() {
    await deleteExerciseVideo(exerciseId);
    setSavedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setView('animation');
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // ── ANIMATION ─────────────────────────────────────────────────────────────
  if (view === 'animation') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <ExerciseAnimation exercise={exercise} size={size} paused={paused} />

        <button
          onClick={openCamera}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-bg border border-purple/25 text-purple text-xs font-bold active:scale-95 transition-all"
        >
          <Video size={14} strokeWidth={1.5} />
          Record myself
        </button>

        {camError && (
          <p className="flex items-center gap-1.5 text-red-400 text-xs text-center px-4">
            <AlertCircle size={12} className="flex-shrink-0" /> {camError}
          </p>
        )}
      </div>
    );
  }

  // ── CAMERA ────────────────────────────────────────────────────────────────
  if (view === 'camera') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">

        {/* Live preview */}
        <div
          className="relative w-full rounded-3xl overflow-hidden bg-black shadow-xl"
          style={{ aspectRatio: '4/3' }}
        >
          <video
            ref={liveRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Recording badge */}
          {recording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-bold tabular-nums">{fmt(recSec)}</span>
            </div>
          )}

          {/* Time limit bar */}
          {recording && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
              <div
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${(recSec / MAX_REC_SEC) * 100}%` }}
              />
            </div>
          )}

          {/* Tap-to-start overlay when not yet recording */}
          {!recording && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center">
                <Circle size={28} className="text-white" fill="white" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!recording ? (
            <>
              <button
                onClick={cancelCamera}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-section border border-border text-muted text-xs font-bold active:scale-95 transition-all"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
              >
                <Circle size={13} fill="white" className="text-white" /> Start recording
              </button>
            </>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1C1C1E] text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
            >
              <Square size={13} fill="white" className="text-white" /> Stop  · {fmt(recSec)}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── PREVIEW ────────────────────────────────────────────────────────────────
  if (view === 'preview') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">

        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-black"
          style={{ aspectRatio: '4/3' }}
        >
          <video
            src={previewUrl ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="text-white text-[10px] font-bold">Preview</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCamera}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-section border border-border text-muted text-xs font-bold active:scale-95 transition-all"
          >
            <RefreshCw size={13} /> Record again
          </button>
          <button
            onClick={saveRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
          >
            <CheckCircle size={13} /> Use this video
          </button>
        </div>
      </div>
    );
  }

  // ── SAVED VIDEO ────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 w-full">

      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-black"
        style={{ aspectRatio: '4/3' }}
      >
        <video
          src={savedUrl ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {/* "My video" badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
          <Video size={10} className="text-white" />
          <span className="text-white text-[10px] font-bold">My video</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={resetToAnimation}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-section border border-border text-muted text-xs font-bold active:scale-95 transition-all"
        >
          <RotateCcw size={13} /> Default animation
        </button>
        <button
          onClick={openCamera}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-bg border border-purple/25 text-purple text-xs font-bold active:scale-95 transition-all"
        >
          <RefreshCw size={13} /> Re-record
        </button>
      </div>

      {camError && (
        <p className="flex items-center gap-1.5 text-red-400 text-xs text-center px-4">
          <AlertCircle size={12} className="flex-shrink-0" /> {camError}
        </p>
      )}
    </div>
  );
}
