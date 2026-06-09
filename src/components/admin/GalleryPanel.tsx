import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CaptureRecord } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import JSZip from 'jszip';
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
  Check,
  CheckSquare,
  Square,
  Archive,
} from 'lucide-react';

export function GalleryPanel() {
  const { captures, deleteCapture, markShared, uploadStates, retryUpload, syncFromCloud, isOnline } = useApp();
  const [selected, setSelected] = useState<CaptureRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cloud' | 'local' | 'shared'>('all');

  const filtered = captures.filter(c => {
    if (filter === 'cloud')  return c.uploadedToCloud;
    if (filter === 'local')  return !c.uploadedToCloud;
    if (filter === 'shared') return c.shared;
    return true;
  });

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try { await syncFromCloud(); } finally { setSyncing(false); }
  }, [syncFromCloud]);

  const handleExportZip = useCallback(async () => {
    if (selectedIds.size === 0) {
      alert('Veuillez sélectionner au moins une capture à exporter');
      return;
    }
    setExporting(true);
    try {
      const zip = new JSZip();
      for (const id of selectedIds) {
        const capture = captures.find(c => c.id === id);
        if (!capture) continue;
        // Try to get the blob: first try videoBlob, if not try to fetch from videoUrl
        let blob: Blob | null = capture.videoBlob ?? null;
        if (!blob && capture.videoUrl) {
          const res = await fetch(capture.videoUrl);
          if (res.ok) blob = await res.blob();
        }
        if (!blob) continue;
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const filename = `photobooth-360-${capture.id.slice(0, 8)}.${ext}`;
        zip.file(filename, blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photobooth-360-export-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [selectedIds, captures]);

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

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filtered.map(c => c.id)));
  }, [filtered]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

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
          <span className="text-white font-medium">{captures.length} capture{captures.length !== 1 ? 's' : ''}</span>
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
          {selectedIds.size > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 text-xs border border-purple-500/20">
              <CheckSquare size={10} /> {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Select/Deselect All */}
          {filtered.length > 0 && (
            <>
              {selectedIds.size === filtered.length ? (
                <button
                  onClick={deselectAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm"
                >
                  <CheckSquare size={14} /> Déselectionner tout
                </button>
              ) : (
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-all text-sm"
                >
                  <Square size={14} /> Sélectionner tout
                </button>
              )}
            </>
          )}

          {/* Export Zip */}
          {selectedIds.size > 0 && (
            <button
              onClick={handleExportZip}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-all text-sm disabled:opacity-50"
            >
              {exporting ? <Loader size={14} className="animate-spin" /> : <Archive size={14} />}
              Exporter ZIP
            </button>
          )}

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
            const isSelected = selectedIds.has(c.id);

            return (
              <div
                key={c.id}
                className={`group relative rounded-2xl overflow-hidden bg-white/5 border transition-all hover:scale-[1.02] ${
                  isSelected ? 'border-purple-500/60 shadow-lg shadow-purple-500/20' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* Select Checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}
                  className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  {isSelected ? <CheckSquare size={16} className="text-purple-400" /> : <Square size={16} className="text-white/60" />}
                </button>

                {url ? (
                  <video
                    src={url}
                    className="w-full aspect-video object-cover cursor-pointer"
                    muted
                    preload="metadata"
                    onClick={() => setSelected(c)}
                  />
                ) : (
                  <div
                    className="w-full aspect-video bg-white/5 flex items-center justify-center cursor-pointer"
                    onClick={() => setSelected(c)}
                  >
                    <Play size={20} className="text-white/20" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
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

      {/* ─── Detail Modal ─── */}
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
                  {selected.shared ? <Check size={14} /> : <Share2 size={14} />}
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
