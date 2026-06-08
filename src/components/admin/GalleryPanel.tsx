import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CaptureRecord } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Play,
  Trash2,
  Cloud,
  CloudOff,
  Share2,
  X,
  RefreshCw,
  Loader,
  Download,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export function GalleryPanel() {
  const { captures, deleteCapture, markShared, uploadStates, retryUpload, syncFromCloud, isOnline } = useApp();
  const [selected, setSelected] = useState<CaptureRecord | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cloud' | 'local' | 'shared'>('all');

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try { await syncFromCloud(); } finally { setSyncing(false); }
  }, [syncFromCloud]);

  const getVideoUrl = (c: CaptureRecord): string | null => {
    if (c.videoUrl) return c.videoUrl;
    if (c.videoBlob) return URL.createObjectURL(c.videoBlob);
    return null;
  };

  const handleDownload = useCallback((c: CaptureRecord) => {
    if (!c.videoBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(c.videoBlob);
    a.download = `photobooth-360-${c.id.slice(0, 8)}.webm`;
    a.click();
  }, []);

  const filtered = captures.filter(c => {
    if (filter === 'cloud')  return c.uploadedToCloud;
    if (filter === 'local')  return !c.uploadedToCloud;
    if (filter === 'shared') return c.shared;
    return true;
  });

  const pendingCount = captures.filter(c => !c.uploadedToCloud && c.videoBlob).length;
  const errorCount = Object.values(uploadStates).filter(s => s.status === 'error').length;

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold">{captures.length} capture{captures.length !== 1 ? 's' : ''}</span>
          {pendingCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs border border-yellow-500/20">
              <CloudOff size={10} /> {pendingCount} en attente
            </span>
          )}
          {errorCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs border border-red-500/20">
              <AlertCircle size={10} /> {errorCount} erreur{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sync button */}
          {isSupabaseConfigured && (
            <button
              onClick={handleSync}
              disabled={syncing || !isOnline}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm disabled:opacity-40"
              title="Récupérer les captures depuis le cloud"
            >
              {syncing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync cloud
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto">
        {(['all', 'cloud', 'local', 'shared'] as const).map(f => (
          <button key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              filter === f
                ? 'theme-accent-bg border-transparent text-white'
                : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
            }`}>
            {{ all: 'Toutes', cloud: 'Cloud', local: 'Local', shared: 'Partagées' }[f]}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Play size={40} className="mb-3 opacity-30" />
          <p>{captures.length === 0 ? 'Aucune capture pour le moment' : 'Aucune capture dans ce filtre'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map(c => {
            const url = getVideoUrl(c);
            const uploadSt = uploadStates[c.id];
            const isUploading = uploadSt?.status === 'uploading';
            const hasError = uploadSt?.status === 'error';

            return (
              <div
                key={c.id}
                className="group relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-white/30 transition-all hover:scale-[1.02]"
                onClick={() => setSelected(c)}
              >
                {url ? (
                  <video src={url} className="w-full aspect-video object-cover" muted preload="metadata" />
                ) : (
                  <div className="w-full aspect-video bg-white/5 flex items-center justify-center">
                    <Play size={20} className="text-white/20" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white text-xs font-medium">{formatDate(c.createdAt)}</p>
                  <p className="text-white/50 text-xs">{c.duration}s</p>
                </div>

                {/* Status badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {isUploading ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-xs backdrop-blur-sm">
                      <Loader size={10} className="animate-spin" /> {uploadSt.progress}%
                    </span>
                  ) : hasError ? (
                    <span className="p-1 rounded-full bg-red-500/30 backdrop-blur-sm">
                      <AlertCircle size={10} className="text-red-400" />
                    </span>
                  ) : c.uploadedToCloud ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 backdrop-blur-sm">
                      <Cloud size={10} className="text-emerald-400" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-white/10 backdrop-blur-sm">
                      <CloudOff size={10} className="text-white/40" />
                    </span>
                  )}
                  {c.shared && (
                    <span className="p-1 rounded-full bg-blue-500/20 backdrop-blur-sm">
                      <Share2 size={10} className="text-blue-400" />
                    </span>
                  )}
                </div>

                {/* Upload progress bar */}
                {isUploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div
                      className="h-full theme-accent-bg transition-all duration-300"
                      style={{ width: `${uploadSt.progress}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
              onClick={() => setSelected(null)}
            >
              <X size={18} />
            </button>

            <video
              src={getVideoUrl(selected) || ''}
              className="w-full rounded-2xl max-h-[60vh] object-contain bg-black"
              controls autoPlay loop
            />

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">{formatDate(selected.createdAt)}</p>
                <p className="text-white/40 text-sm mt-0.5">
                  {selected.duration}s &bull; {selected.eventName}
                  {selected.uploadedToCloud && <span className="ml-2 text-emerald-400">· cloud</span>}
                </p>
                {uploadStates[selected.id]?.status === 'error' && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> Upload échoué
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* Retry upload */}
                {!selected.uploadedToCloud && uploadStates[selected.id]?.status !== 'uploading' && isOnline && (
                  <button
                    onClick={() => { retryUpload(selected.id); setSelected(s => s ? { ...s } : null); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 text-sm transition-colors"
                  >
                    <RotateCcw size={14} /> Upload
                  </button>
                )}
                {/* Download */}
                {selected.videoBlob && (
                  <button
                    onClick={() => handleDownload(selected)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/15 text-sm transition-colors"
                  >
                    <Download size={14} /> Télécharger
                  </button>
                )}
                {/* Share */}
                <button
                  onClick={() => { markShared(selected.id); setSelected(s => s ? { ...s, shared: true } : null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                    selected.shared
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/50'
                  }`}
                >
                  {selected.shared ? <CheckMark size={14} /> : <Share2 size={14} />}
                  {selected.shared ? 'Partagé' : 'Partager'}
                </button>
                {/* Delete */}
                <button
                  onClick={() => { deleteCapture(selected.id); setSelected(null); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 text-red-400 hover:bg-red-600/40 text-sm transition-colors"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
