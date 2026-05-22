/**
 * ExerciseVideosTab — shows all per-exercise self-recorded videos in one place.
 * Displayed as a dedicated tab in the Fitness page.
 */

import { useState, useEffect } from 'react';
import { Trash2, Play, Video, Activity, RefreshCw } from 'lucide-react';
import { listAllExerciseVideos, deleteExerciseVideo, type SavedVideoMeta } from '../utils/exerciseVideos';
import PoseAnalyzer from './PoseAnalyzer';

function prettyName(id: string): string {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function VideoCard({ meta, onDeleted }: { meta: SavedVideoMeta; onDeleted: () => void }) {
  const [playing,    setPlaying]    = useState(false);
  const [poseActive, setPoseActive] = useState(false);
  const videoRef = { current: null as HTMLVideoElement | null };

  async function handleDelete() {
    URL.revokeObjectURL(meta.url);
    await deleteExerciseVideo(meta.id);
    onDeleted();
  }

  return (
    <div className="bg-section rounded-2xl border border-border overflow-hidden">
      {/* Video */}
      <div className="relative w-full bg-black" style={{ aspectRatio: '4/3' }}>
        <video
          ref={el => { videoRef.current = el; }}
          src={meta.url}
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {/* Skeleton overlay */}
        {poseActive && (
          <PoseAnalyzer
            videoRef={videoRef as React.RefObject<HTMLVideoElement>}
            exercise={meta.id}
            active={poseActive && playing}
          />
        )}

        {/* Play/Pause */}
        <button
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            playing ? v.pause() : v.play();
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {!playing && (
            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center">
              <Play size={22} className="text-white ml-1" fill="white" strokeWidth={0} />
            </div>
          )}
        </button>

        {/* "My video" badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-purple/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
          <Video size={9} className="text-white" />
          <span className="text-white text-[9px] font-bold">Ma vidéo</span>
        </div>
      </div>

      {/* Info row */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <p className="text-sm font-bold text-text flex-1 truncate">{prettyName(meta.id)}</p>
        <button
          onClick={() => setPoseActive(p => !p)}
          className={`p-2 rounded-xl transition-all active:scale-90 ${
            poseActive ? 'bg-purple text-white' : 'bg-bg border border-border text-muted'
          }`}
          title="Analyse de mouvement"
        >
          <Activity size={14} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleDelete}
          className="p-2 rounded-xl bg-bg border border-border text-red-400 active:scale-90 transition-all"
          title="Supprimer"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

export default function ExerciseVideosTab() {
  const [videos,   setVideos]   = useState<SavedVideoMeta[]>([]);
  const [loading,  setLoading]  = useState(true);

  async function load() {
    setLoading(true);
    const list = await listAllExerciseVideos();
    setVideos(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
    return () => {
      // revoke object URLs on unmount to avoid memory leaks
      setVideos(prev => { prev.forEach(v => URL.revokeObjectURL(v.url)); return []; });
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw size={22} className="text-muted animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 px-8">
        <div className="w-16 h-16 rounded-[20px] bg-section border border-border flex items-center justify-center">
          <Video size={28} strokeWidth={1.5} className="text-muted" />
        </div>
        <p className="text-sm font-bold text-text text-center">Aucune vidéo enregistrée</p>
        <p className="text-xs text-muted text-center leading-relaxed">
          Pendant un entraînement, appuie sur "Me filmer" pour t'enregistrer sur chaque exercice.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{videos.length} exercice{videos.length > 1 ? 's' : ''} enregistré{videos.length > 1 ? 's' : ''}</p>
        <button onClick={load} className="p-1.5 rounded-lg bg-section border border-border active:scale-90">
          <RefreshCw size={13} className="text-muted" strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {videos.map(v => (
          <VideoCard
            key={v.id}
            meta={v}
            onDeleted={() => {
              setVideos(prev => prev.filter(x => x.id !== v.id));
            }}
          />
        ))}
      </div>
    </div>
  );
}
