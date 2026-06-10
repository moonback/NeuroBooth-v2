import { useState, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { CaptureRecord } from '../../types';
import { isSupabaseConfigured } from '../../lib/supabase';
import JSZip from 'jszip';
import {
  Play, Trash2, Cloud, CloudOff, Share2, X, RefreshCw, Loader,
  Download, RotateCcw, AlertCircle, Check, CheckSquare, Square, Archive,
} from 'lucide-react';
import { AdminCard, AdminBadge, AdminButton, AdminEmptyState } from './ui';

export function GalleryPanel() {
  const { captures, deleteCapture, clearAllCaptures, markShared, uploadStates, retryUpload, syncFromCloud, isOnline } = useApp();
  const [selected, setSelected] = useState<CaptureRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'cloud' | 'local' | 'shared'>('all');

  const filtered = captures.filter(c => {
    if (filter === 'cloud') return c.uploadedToCloud;
    if (filter === 'local') return !c.uploadedToCloud;
    if (filter === 'shared') return c.shared;
    return true;
  });

  const handleClearAll = useCallback(async () => {
    if (captures.length === 0) return;
    if (!window.confirm('Vider complètement la galerie ? Cette action est irréversible.')) return;
    setIsClearing(true);
    try {
      await clearAllCaptures();
      setSelectedIds(new Set());
    } finally {
      setIsClearing(false);
    }
  }, [captures.length, clearAllCaptures]);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try { await syncFromCloud(); } finally { setSyncing(false); }
  }, [syncFromCloud]);

  const handleExportZip = useCallback(async () => {
    if (selectedIds.size === 0) { alert('Sélectionnez au moins une capture'); return; }
    setExporting(true);
    try {
      const zip = new JSZip();
      for (const id of selectedIds) {
        const capture = captures.find(c => c.id === id);
        if (!capture) continue;
        let blob: Blob | null = capture.videoBlob ?? null;
        if (!blob && capture.videoUrl) {
          const res = await fetch(capture.videoUrl);
          if (res.ok) blob = await res.blob();
        }
        if (!blob) continue;
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        zip.file(`photobooth-360-${capture.id.slice(0, 8)}.${ext}`, blob);
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

  const pendingCount = captures.filter(c => !c.uploadedToCloud && c.videoBlob).length;
  const errorCount = Object.values(uploadStates).filter(s => s.status === 'error').length;

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <AdminCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white font-semibold">{captures.length} capture{captures.length !== 1 ? 's' : ''}</span>
            {pendingCount > 0 && <AdminBadge tone="warning"><CloudOff size={10} /> {pendingCount} en attente</AdminBadge>}
            {errorCount > 0 && <AdminBadge tone="error"><AlertCircle size={10} /> {errorCount} erreur{errorCount > 1 ? 's' : ''}</AdminBadge>}
            {selectedIds.size > 0 && <AdminBadge tone="purple"><CheckSquare size={10} /> {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}</AdminBadge>}
          </div>
          <div className="flex flex-wrap gap-2">
            {filtered.length > 0 && (
              <AdminButton size="sm" onClick={selectedIds.size === filtered.length ? () => setSelectedIds(new Set()) : () => setSelectedIds(new Set(filtered.map(c => c.id)))}>
                {selectedIds.size === filtered.length ? <><CheckSquare size={14} /> Tout désélect.</> : <><Square size={14} /> Tout sélect.</>}
              </AdminButton>
            )}
            {selectedIds.size > 0 && (
              <AdminButton size="sm" variant="primary" onClick={handleExportZip} disabled={exporting}>
                {exporting ? <Loader size={14} className="animate-spin" /> : <Archive size={14} />} ZIP
              </AdminButton>
            )}
            {isSupabaseConfigured && (
              <AdminButton size="sm" onClick={handleSync} disabled={syncing || !isOnline}>
                {syncing ? <Loader size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync
              </AdminButton>
            )}
            {captures.length > 0 && (
              <AdminButton size="sm" variant="danger" onClick={handleClearAll} disabled={isClearing}>
                {isClearing ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />} Vider
              </AdminButton>
            )}
          </div>
        </div>
      </AdminCard>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {(['all', 'cloud', 'local', 'shared'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`touch-target px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              filter === f ? 'theme-accent-bg border-transparent text-white' : 'border-white/[0.06] text-white/40 hover:text-white/70'
            }`}
          >
            {{ all: 'Toutes', cloud: 'Cloud', local: 'Local', shared: 'Partagées' }[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <AdminEmptyState
          icon={<Play size={24} />}
          title={captures.length === 0 ? 'Aucune capture pour le moment' : 'Aucune capture dans ce filtre'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(c => {
            const url = getVideoUrl(c);
            const uploadSt = uploadStates[c.id];
            const isUploading = uploadSt?.status === 'uploading';
            const hasError = uploadSt?.status === 'error';
            const isSelected = selectedIds.has(c.id);

            return (
              <div
                key={c.id}
                className={`group relative rounded-2xl overflow-hidden bg-[#0d0d0d] border transition-all hover:scale-[1.01] ${
                  isSelected ? 'border-purple-500/50 shadow-lg shadow-purple-500/10' : 'border-white/[0.06] hover:border-white/15'
                }`}
              >
                <button
                  onClick={e => { e.stopPropagation(); toggleSelect(c.id); }}
                  className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                >
                  {isSelected ? <CheckSquare size={15} className="text-purple-400" /> : <Square size={15} className="text-white/50" />}
                </button>

                {url ? (
                  <video src={url} className="w-full aspect-video object-cover cursor-pointer" muted preload="metadata" onClick={() => setSelected(c)} />
                ) : (
                  <div className="w-full aspect-video bg-white/[0.03] flex items-center justify-center cursor-pointer" onClick={() => setSelected(c)}>
                    <Play size={20} className="text-white/15" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-white text-xs font-medium">{formatDate(c.createdAt)}</p>
                  <p className="text-white/50 text-[10px]">{c.duration}s</p>
                </div>

                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {isUploading ? (
                    <AdminBadge tone="accent"><Loader size={9} className="animate-spin" /> {uploadSt.progress}%</AdminBadge>
                  ) : hasError ? (
                    <AdminBadge tone="error"><AlertCircle size={9} /></AdminBadge>
                  ) : c.uploadedToCloud ? (
                    <AdminBadge tone="success"><Cloud size={9} /></AdminBadge>
                  ) : (
                    <AdminBadge tone="neutral"><CloudOff size={9} /></AdminBadge>
                  )}
                  {c.shared && <AdminBadge tone="purple"><Share2 size={9} /></AdminBadge>}
                </div>

                {isUploading && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div className="h-full theme-accent-bg transition-all" style={{ width: `${uploadSt.progress}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <video src={getVideoUrl(selected) || ''} className="w-full rounded-2xl max-h-[60vh] object-contain bg-black" controls autoPlay loop />
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">{formatDate(selected.createdAt)}</p>
                <p className="text-white/40 text-sm mt-0.5">
                  {selected.duration}s · {selected.eventName}
                  {selected.uploadedToCloud && <span className="ml-2 text-emerald-400">· cloud</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!selected.uploadedToCloud && uploadStates[selected.id]?.status !== 'uploading' && isOnline && (
                  <AdminButton size="sm" onClick={() => { retryUpload(selected.id); setSelected(s => s ? { ...s } : null); }}>
                    <RotateCcw size={14} /> Upload
                  </AdminButton>
                )}
                {selected.videoBlob && (
                  <AdminButton size="sm" onClick={() => handleDownload(selected)}>
                    <Download size={14} /> Télécharger
                  </AdminButton>
                )}
                <AdminButton
                  size="sm"
                  variant={selected.shared ? 'secondary' : 'primary'}
                  onClick={() => { markShared(selected.id); setSelected(s => s ? { ...s, shared: true } : null); }}
                >
                  {selected.shared ? <><Check size={14} /> Partagé</> : <><Share2 size={14} /> Partager</>}
                </AdminButton>
                <AdminButton size="sm" variant="danger" onClick={() => { deleteCapture(selected.id); setSelected(null); }}>
                  <Trash2 size={14} /> Supprimer
                </AdminButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
