/**
 * ExerciseMedia — stick-figure animation by default; lets the user record
 * themselves and replace it with their own video, per exercise.
 *
 * Features:
 *   - Front/rear camera toggle
 *   - 30-second recording with real-time MediaPipe pose analysis overlay
 *   - Preview with trim (in/out point selection via range sliders)
 *   - Saved video with "My video" badge + pose analysis option
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video, RefreshCw, RotateCcw, CheckCircle,
  Circle, Square, X, AlertCircle, FlipHorizontal2,
  Scissors, Activity,
} from 'lucide-react';
import { ExerciseAnimation } from './StickFigure';
import PoseAnalyzer from './PoseAnalyzer';
import {
  saveExerciseVideo, loadExerciseVideo, deleteExerciseVideo, toExerciseId,
} from '../utils/exerciseVideos';

// ─── Types ────────────────────────────────────────────────────────────────────

type MediaView = 'animation' | 'camera' | 'preview' | 'saved';
type FacingMode = 'environment' | 'user';

interface Props {
  exercise: string;
  paused?:  boolean;
  size?:    number;
}

interface TrimRange { start: number; end: number }

const MAX_REC_SEC = 30;

function fmt(s: number) { return `0:${String(Math.floor(s)).padStart(2, '0')}`; }

function bestMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  // iOS Safari only records as mp4
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const order = isIOS
    ? ['video/mp4;codecs=avc1', 'video/mp4']
    : ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'];
  for (const t of order) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExerciseMedia({ exercise, paused = false, size = 120 }: Props) {
  const exerciseId = toExerciseId(exercise);

  const [view,        setView]        = useState<MediaView>('animation');
  const [savedUrl,    setSavedUrl]    = useState<string | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewDur,  setPreviewDur]  = useState(0);
  const [trim,        setTrim]        = useState<TrimRange>({ start: 0, end: MAX_REC_SEC });
  const [recording,   setRecording]   = useState(false);
  const [recSec,      setRecSec]      = useState(0);
  const [facingMode,  setFacingMode]  = useState<FacingMode>('environment');
  const [camError,    setCamError]    = useState('');
  const [poseActive,  setPoseActive]  = useState(false);

  const liveRef    = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const savedRef   = useRef<HTMLVideoElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const recRef     = useRef<MediaRecorder | null>(null);
  const chunksRef  = useRef<Blob[]>([]);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup helpers ──────────────────────────────────────────────────────────
  function releaseStream() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    recRef.current?.stop();
    recRef.current = null;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }

  useEffect(() => () => releaseStream(), []);

  // ── Load saved video when exercise changes ───────────────────────────────────
  useEffect(() => {
    let alive = true;
    releaseStream();
    setRecording(false);
    setRecSec(0);
    setCamError('');
    setPreviewBlob(null);
    setPreviewDur(0);
    setTrim({ start: 0, end: MAX_REC_SEC });
    setPoseActive(false);
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setSavedUrl(prev  => { if (prev) URL.revokeObjectURL(prev); return null; });
    setView('animation');

    loadExerciseVideo(exerciseId).then(blob => {
      if (!alive || !blob) return;
      setSavedUrl(URL.createObjectURL(blob));
      setView('saved');
    });
    return () => { alive = false; };
  }, [exerciseId]);

  // ── Attach stream to live video (initial open + flip camera) ────────────────
  useEffect(() => {
    if (view === 'camera' && streamRef.current && liveRef.current) {
      liveRef.current.srcObject = streamRef.current;
      liveRef.current.play().catch(() => {});
    }
  // facingMode included so the effect re-runs after flipCamera sets a new stream
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, facingMode]);

  // ── Camera ───────────────────────────────────────────────────────────────────
  async function openCamera(facing: FacingMode = facingMode) {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(facing);
      setView('camera');
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      if (msg.includes('permission') || msg.includes('denied') || msg.includes('notallowed')) {
        setCamError('Caméra refusée — autorise-la dans les réglages du navigateur.');
      } else {
        setCamError('Impossible d\'accéder à la caméra.');
      }
    }
  }

  async function flipCamera() {
    const next: FacingMode = facingMode === 'environment' ? 'user' : 'environment';
    releaseStream();
    setRecording(false);
    setRecSec(0);
    await openCamera(next);
  }

  // ── Recording ────────────────────────────────────────────────────────────────
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
      const blob = new Blob(chunksRef.current, mimeType ? { type: mimeType } : undefined);
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

  // ── Preview duration detection ───────────────────────────────────────────────
  const onPreviewLoaded = useCallback(() => {
    const v = previewRef.current;
    if (!v) return;
    const dur = isFinite(v.duration) ? v.duration : MAX_REC_SEC;
    setPreviewDur(dur);
    setTrim({ start: 0, end: dur });
  }, []);

  // ── Trim-aware playback: pause at trimEnd ────────────────────────────────────
  useEffect(() => {
    const v = previewRef.current;
    if (!v || view !== 'preview') return;

    function onTimeUpdate() {
      if (v && v.currentTime >= trim.end) {
        v.currentTime = trim.start;
      }
    }
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => v.removeEventListener('timeupdate', onTimeUpdate);
  }, [trim, view]);

  // ── Save (with soft-trim metadata stored as JSON sidecar in IDB key + '_trim') ─
  async function saveRecording() {
    if (!previewBlob) return;
    await saveExerciseVideo(exerciseId, previewBlob);

    // Store trim points
    const meta = JSON.stringify(trim);
    try {
      localStorage.setItem(`morphiq_trim_${exerciseId}`, meta);
    } catch (_) { /* ignore quota errors */ }

    const url = URL.createObjectURL(previewBlob);
    setSavedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
    setPreviewBlob(null);
    setPreviewUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setView('saved');
  }

  async function resetToAnimation() {
    await deleteExerciseVideo(exerciseId);
    localStorage.removeItem(`morphiq_trim_${exerciseId}`);
    setSavedUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
    setView('animation');
  }

  // ── Apply saved trim on the saved-video player ──────────────────────────────
  const savedTrim: TrimRange | null = (() => {
    try {
      const raw = localStorage.getItem(`morphiq_trim_${exerciseId}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  useEffect(() => {
    const v = savedRef.current;
    if (!v || view !== 'saved' || !savedTrim) return;
    function onSavedLoaded() {
      if (v && savedTrim) v.currentTime = savedTrim.start;
    }
    function onSavedTime() {
      if (v && savedTrim && v.currentTime >= savedTrim.end) v.currentTime = savedTrim.start;
    }
    v.addEventListener('loadedmetadata', onSavedLoaded);
    v.addEventListener('timeupdate', onSavedTime);
    return () => {
      v.removeEventListener('loadedmetadata', onSavedLoaded);
      v.removeEventListener('timeupdate', onSavedTime);
    };
  }, [view, savedTrim]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  // ── ANIMATION ─────────────────────────────────────────────────────────────────
  if (view === 'animation') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <ExerciseAnimation exercise={exercise} size={size} paused={paused} />
        <button
          onClick={() => openCamera()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-bg border border-purple/25 text-purple text-xs font-bold active:scale-95 transition-all"
        >
          <Video size={14} strokeWidth={1.5} />
          Me filmer
        </button>
        {camError && (
          <p className="flex items-center gap-1.5 text-red-400 text-xs text-center px-4">
            <AlertCircle size={12} className="flex-shrink-0" /> {camError}
          </p>
        )}
      </div>
    );
  }

  // ── CAMERA ────────────────────────────────────────────────────────────────────
  if (view === 'camera') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          className="relative w-full rounded-3xl overflow-hidden bg-black shadow-xl"
          style={{ aspectRatio: '4/3' }}
        >
          <video
            ref={liveRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* Pose analysis overlay */}
          <PoseAnalyzer
            videoRef={liveRef}
            exercise={exercise}
            active={recording && poseActive}
          />

          {/* Recording badge */}
          {recording && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full z-20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-xs font-bold tabular-nums">{fmt(recSec)}</span>
            </div>
          )}

          {/* Flip camera button */}
          <button
            onClick={flipCamera}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 active:scale-90 transition-all"
          >
            <FlipHorizontal2 size={16} className="text-white" strokeWidth={1.5} />
          </button>

          {/* Pose analysis toggle (only while recording) */}
          {recording && (
            <button
              onClick={() => setPoseActive(p => !p)}
              className={`absolute bottom-10 right-3 w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center z-20 transition-all ${
                poseActive ? 'bg-purple' : 'bg-black/50'
              }`}
            >
              <Activity size={16} className="text-white" strokeWidth={1.5} />
            </button>
          )}

          {/* Time limit bar */}
          {recording && (
            <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20">
              <div
                className="h-full bg-red-500 transition-all duration-1000"
                style={{ width: `${(recSec / MAX_REC_SEC) * 100}%` }}
              />
            </div>
          )}

          {/* Tap-to-start indicator */}
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
                <X size={13} /> Annuler
              </button>
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-500 text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
              >
                <Circle size={13} fill="white" className="text-white" /> Démarrer
              </button>
            </>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#1C1C1E] text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
            >
              <Square size={13} fill="white" className="text-white" /> Arrêter · {fmt(recSec)}
            </button>
          )}
        </div>

        <p className="text-[10px] text-muted text-center">
          {facingMode === 'user' ? 'Caméra frontale' : 'Caméra arrière'} · Touche <Activity size={10} className="inline" /> pour l'analyse de mouvement
        </p>
      </div>
    );
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────────
  if (view === 'preview') {
    return (
      <div className="flex flex-col items-center gap-3 w-full">
        <div
          className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-black"
          style={{ aspectRatio: '4/3' }}
        >
          <video
            ref={previewRef}
            src={previewUrl ?? undefined}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={onPreviewLoaded}
          />
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
            <span className="text-white text-[10px] font-bold">Aperçu</span>
          </div>
        </div>

        {/* Trim controls */}
        {previewDur > 0 && (
          <div className="w-full bg-section rounded-2xl border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Scissors size={13} className="text-muted flex-shrink-0" strokeWidth={1.5} />
              <span className="text-xs font-bold text-text">Rogner la vidéo</span>
              <span className="ml-auto text-xs text-muted tabular-nums">
                {fmt(trim.start)} – {fmt(trim.end)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-8">Début</span>
                <input
                  type="range"
                  min={0}
                  max={previewDur}
                  step={0.1}
                  value={trim.start}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setTrim(t => ({ ...t, start: Math.min(v, t.end - 0.5) }));
                    if (previewRef.current) previewRef.current.currentTime = Math.min(parseFloat(e.target.value), trim.end - 0.5);
                  }}
                  className="flex-1 accent-purple"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-8">Fin</span>
                <input
                  type="range"
                  min={0}
                  max={previewDur}
                  step={0.1}
                  value={trim.end}
                  onChange={e => {
                    const v = parseFloat(e.target.value);
                    setTrim(t => ({ ...t, end: Math.max(v, t.start + 0.5) }));
                  }}
                  className="flex-1 accent-purple"
                />
              </div>
            </div>
            <p className="text-[10px] text-muted">Durée sélectionnée : {fmt(trim.end - trim.start)}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => openCamera()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-section border border-border text-muted text-xs font-bold active:scale-95 transition-all"
          >
            <RefreshCw size={13} /> Refaire
          </button>
          <button
            onClick={saveRecording}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple text-white text-xs font-bold shadow-lg active:scale-95 transition-all"
          >
            <CheckCircle size={13} /> Utiliser cette vidéo
          </button>
        </div>
      </div>
    );
  }

  // ── SAVED VIDEO ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className="relative w-full rounded-3xl overflow-hidden shadow-xl bg-black"
        style={{ aspectRatio: '4/3' }}
      >
        <video
          ref={savedRef}
          src={savedUrl ?? undefined}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {/* "My video" badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple/80 backdrop-blur-sm px-2.5 py-1 rounded-full z-10">
          <Video size={10} className="text-white" />
          <span className="text-white text-[10px] font-bold">Ma vidéo</span>
        </div>

        {/* Pose analysis overlay for saved video */}
        {poseActive && (
          <PoseAnalyzer
            videoRef={savedRef}
            exercise={exercise}
            active={poseActive}
          />
        )}
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        <button
          onClick={resetToAnimation}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-section border border-border text-muted text-xs font-bold active:scale-95 transition-all"
        >
          <RotateCcw size={13} /> Animation
        </button>
        <button
          onClick={() => openCamera()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-bg border border-purple/25 text-purple text-xs font-bold active:scale-95 transition-all"
        >
          <RefreshCw size={13} /> Re-filmer
        </button>
        <button
          onClick={() => setPoseActive(p => !p)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold active:scale-95 transition-all ${
            poseActive
              ? 'bg-purple text-white'
              : 'bg-section border border-border text-muted'
          }`}
        >
          <Activity size={13} strokeWidth={1.5} /> Analyse
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
