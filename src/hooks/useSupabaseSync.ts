import { useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, CaptureRow } from '../lib/supabase';
import {
  getPendingUploads,
  uploadToCloud,
  saveCaptureToDb,
  updateCapture,
  UploadProgress,
} from '../lib/storage';
import { CaptureRecord } from '../types';

interface SyncCallbacks {
  onUploadStart: (id: string) => void;
  onUploadProgress: (id: string, progress: UploadProgress) => void;
  onUploadComplete: (id: string, videoUrl: string) => void;
  onUploadError: (id: string, error: string) => void;
  onCloudCaptureFetched: (record: CaptureRecord) => void;
}

export function useSupabaseSync(isOnline: boolean, callbacks: SyncCallbacks) {
  const retryInProgress = useRef(false);
  const channelRef = useRef<any>(null);

  /** Upload one pending record with progress feedback */
  const uploadOne = useCallback(async (record: CaptureRecord) => {
    callbacks.onUploadStart(record.id);
    const url = await uploadToCloud(record, (p) => {
      callbacks.onUploadProgress(record.id, p);
    });
    if (url) {
      await updateCapture(record.id, { videoUrl: url, uploadedToCloud: true });
      await saveCaptureToDb(record, url);
      callbacks.onUploadComplete(record.id, url);
    } else {
      callbacks.onUploadError(record.id, 'Upload échoué');
    }
  }, [callbacks]);

  /** Retry all pending local uploads */
  const retryPending = useCallback(async () => {
    if (!isOnline || !isSupabaseConfigured || retryInProgress.current) return;
    retryInProgress.current = true;
    try {
      const pending = await getPendingUploads();
      for (const record of pending) {
        await uploadOne(record);
      }
    } finally {
      retryInProgress.current = false;
    }
  }, [isOnline, uploadOne]);

  // Retry when coming back online
  useEffect(() => {
    if (isOnline) {
      // Small delay so the network is truly ready
      const t = setTimeout(retryPending, 2000);
      return () => clearTimeout(t);
    }
  }, [isOnline, retryPending]);

  // Realtime subscription to captures table
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('captures-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'captures' },
        (payload) => {
          const row = payload.new as CaptureRow;
          const record: CaptureRecord = {
            id: row.id,
            eventName: row.event_name,
            videoUrl: row.video_url ?? undefined,
            thumbnailUrl: row.thumbnail_url ?? undefined,
            duration: row.duration,
            shared: row.shared,
            createdAt: new Date(row.created_at),
            uploadedToCloud: true,
          };
          callbacks.onCloudCaptureFetched(record);
        },
      )
      .subscribe();

    channelRef.current = channel;
    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
      channelRef.current = null;
    };
  }, [callbacks]);

  return { retryPending };
}
