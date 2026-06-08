import { CaptureRecord } from '../types';
import { supabase, isSupabaseConfigured, BUCKET, CaptureRow } from './supabase';

// ─── IndexedDB ───────────────────────────────────────────────────────────────

const DB_NAME = 'photobooth360';
const STORE = 'captures';
const DB_VERSION = 1;

type StoredCapture = Omit<CaptureRecord, 'createdAt'> & { createdAt: string };

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveCapture(record: CaptureRecord): Promise<void> {
  const db = await openDB();
  const row: StoredCapture = { ...record, createdAt: record.createdAt.toISOString() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllCaptures(): Promise<CaptureRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).index('createdAt').getAll();
    req.onsuccess = () => {
      const rows = (req.result as StoredCapture[])
        .map(r => ({ ...r, createdAt: new Date(r.createdAt) }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getCapture(id: string): Promise<CaptureRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => {
      const row = req.result as StoredCapture | undefined;
      resolve(row ? { ...row, createdAt: new Date(row.createdAt) } : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateCapture(id: string, updates: Partial<CaptureRecord>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result as StoredCapture | undefined;
      if (!existing) { resolve(); return; }
      const updated: StoredCapture = {
        ...existing,
        ...updates,
        createdAt: updates.createdAt
          ? updates.createdAt.toISOString()
          : existing.createdAt,
      };
      store.put(updated);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCapture(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Returns all local captures that have a blob but no cloud URL yet. */
export async function getPendingUploads(): Promise<CaptureRecord[]> {
  const all = await getAllCaptures();
  return all.filter(c => !c.uploadedToCloud && c.videoBlob);
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────

export type UploadProgress = { loaded: number; total: number; percent: number };

/**
 * Upload a video blob to the Supabase storage bucket.
 * Returns the public URL, or null on failure.
 */
export async function uploadToCloud(
  record: CaptureRecord,
  onProgress?: (p: UploadProgress) => void,
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !record.videoBlob) return null;

  const ext = record.videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const path = `${record.id}.${ext}`;

  try {
    // Simulate progress via an XHR wrapper since Supabase SDK doesn't expose it
    const url = await uploadWithProgress(record.videoBlob, path, onProgress);
    return url;
  } catch {
    return null;
  }
}

async function uploadWithProgress(
  blob: Blob,
  path: string,
  onProgress?: (p: UploadProgress) => void,
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error details:', error);
    throw error;
  }

  if (onProgress) {
    // Simulate 100% progress since the SDK doesn't expose progress easily in this version
    onProgress({ loaded: blob.size, total: blob.size, percent: 100 });
  }

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return publicUrl;
}

/**
 * Delete a video from the Supabase storage bucket.
 */
export async function deleteFromCloud(videoUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    // Extract path from URL
    const urlObj = new URL(videoUrl);
    const parts = urlObj.pathname.split('/');
    const path = parts[parts.length - 1];
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    return !error;
  } catch {
    return false;
  }
}

// ─── Supabase Database ────────────────────────────────────────────────────────

/**
 * Upsert a capture record into the Supabase captures table.
 */
export async function saveCaptureToDb(
  record: CaptureRecord,
  videoUrl: string,
): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('captures').upsert({
      id: record.id,
      event_name: record.eventName,
      video_url: videoUrl,
      thumbnail_url: record.thumbnailUrl ?? null,
      duration: record.duration,
      shared: record.shared,
      created_at: record.createdAt.toISOString(),
    } satisfies CaptureRow);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Mark a capture as shared in Supabase.
 */
export async function markSharedInDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase
      .from('captures')
      .update({ shared: true })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Delete a capture row from Supabase.
 */
export async function deleteCaptureFromDb(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('captures').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetch captures from Supabase, optionally filtered by event name.
 * Returns them as CaptureRecord (no blob — cloud-only).
 */
export async function fetchCapturesFromCloud(
  eventName?: string,
  limit = 100,
): Promise<CaptureRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    let query = supabase
      .from('captures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (eventName) query = query.eq('event_name', eventName);
    const { data, error } = await query;
    if (error || !data) return [];
    return (data as CaptureRow[]).map(rowToRecord);
  } catch {
    return [];
  }
}

/**
 * Fetch aggregate stats from Supabase (total, shared, today).
 */
export async function fetchCloudStats(): Promise<{
  total: number;
  shared: number;
  today: number;
} | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalRes, sharedRes, todayRes] = await Promise.all([
      supabase.from('captures').select('id', { count: 'exact', head: true }),
      supabase.from('captures').select('id', { count: 'exact', head: true }).eq('shared', true),
      supabase.from('captures').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    ]);

    return {
      total: totalRes.count ?? 0,
      shared: sharedRes.count ?? 0,
      today: todayRes.count ?? 0,
    };
  } catch {
    return null;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToRecord(row: CaptureRow): CaptureRecord {
  return {
    id: row.id,
    eventName: row.event_name,
    videoUrl: row.video_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    duration: row.duration,
    shared: row.shared,
    createdAt: new Date(row.created_at),
    uploadedToCloud: true,
  };
}

export function getObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}
