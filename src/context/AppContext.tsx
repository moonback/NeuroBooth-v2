import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  AppScreen,
  Settings,
  CaptureRecord,
  Stats,
  DEFAULT_SETTINGS,
} from '../types';
import {
  saveCapture,
  getAllCaptures,
  deleteCapture as idbDeleteCapture,
  updateCapture,
  uploadToCloud,
  saveCaptureToDb,
  markSharedInDb,
  deleteCaptureFromDb,
  deleteFromCloud,
  fetchCapturesFromCloud,
  UploadProgress,
} from '../lib/storage';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

export type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

export interface UploadState {
  status: UploadStatus;
  progress: number; // 0-100
  error?: string;
}

interface AppContextValue {
  screen: AppScreen;
  setScreen: (s: AppScreen) => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  captures: CaptureRecord[];
  currentCapture: CaptureRecord | null;
  startNewCapture: () => void;
  finishCapture: (blob: Blob, duration: number) => Promise<void>;
  markShared: (id: string) => Promise<void>;
  deleteCapture: (id: string) => Promise<void>;
  uploadStates: Record<string, UploadState>;
  stats: Stats;
  adminUnlocked: boolean;
  unlockAdmin: (pin: string) => boolean;
  lockAdmin: () => void;
  isOnline: boolean;
  retryUpload: (id: string) => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem('pb360_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [captures, setCaptures] = useState<CaptureRecord[]>([]);
  const [currentCapture, setCurrentCapture] = useState<CaptureRecord | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  // ── Online / Offline ─────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Load from IndexedDB on startup ──────────────────────────────────────
  useEffect(() => {
    getAllCaptures().then(setCaptures);
  }, []);

  // ── Settings ──────────────────────────────────────────────────────────────
  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      localStorage.setItem('pb360_settings', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Upload helpers ────────────────────────────────────────────────────────
  const setUploadState = useCallback((id: string, state: Partial<UploadState>) => {
    setUploadStates(prev => ({ ...prev, [id]: { ...prev[id], ...state } as UploadState }));
  }, []);

  const runUpload = useCallback(async (record: CaptureRecord) => {
    setUploadState(record.id, { status: 'uploading', progress: 0 });

    const onProgress = (p: UploadProgress) => {
      setUploadState(record.id, { progress: p.percent });
    };

    const url = await uploadToCloud(record, onProgress);
    if (url) {
      await updateCapture(record.id, { videoUrl: url, uploadedToCloud: true });
      await saveCaptureToDb(record, url);
      setCaptures(prev => prev.map(c =>
        c.id === record.id ? { ...c, videoUrl: url, uploadedToCloud: true } : c,
      ));
      // Update currentCapture if it's the one being uploaded
      setCurrentCapture(prev =>
        prev?.id === record.id ? { ...prev, videoUrl: url, uploadedToCloud: true } : prev,
      );
      setUploadState(record.id, { status: 'done', progress: 100 });
    } else {
      setUploadState(record.id, { status: 'error', error: 'Upload échoué' });
    }
  }, [setUploadState]);

  // ── Sync hook (retry on reconnect + realtime) ─────────────────────────────
  const syncCallbacks = {
    onUploadStart: (id: string) => setUploadState(id, { status: 'uploading', progress: 0 }),
    onUploadProgress: (id: string, p: UploadProgress) => setUploadState(id, { progress: p.percent }),
    onUploadComplete: (id: string, videoUrl: string) => {
      setCaptures(prev => prev.map(c =>
        c.id === id ? { ...c, videoUrl, uploadedToCloud: true } : c,
      ));
      setCurrentCapture(prev =>
        prev?.id === id ? { ...prev, videoUrl, uploadedToCloud: true } : prev,
      );
      setUploadState(id, { status: 'done', progress: 100 });
    },
    onUploadError: (id: string, error: string) => setUploadState(id, { status: 'error', error }),
    onCloudCaptureFetched: (record: CaptureRecord) => {
      // Merge cloud record if not already present locally
      setCaptures(prev => {
        const exists = prev.some(c => c.id === record.id);
        return exists ? prev : [record, ...prev].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        );
      });
    },
  };

  const { retryPending } = useSupabaseSync(isOnline, syncCallbacks);

  // ── Capture flow ──────────────────────────────────────────────────────────
  const startNewCapture = useCallback(() => {
    setCurrentCapture(null);
    setScreen('countdown');
  }, []);

  const finishCapture = useCallback(async (blob: Blob, duration: number) => {
    const id = crypto.randomUUID();
    const record: CaptureRecord = {
      id,
      eventName: settings.eventName,
      videoBlob: blob,
      duration,
      shared: false,
      createdAt: new Date(),
      uploadedToCloud: false,
    };

    objectUrlsRef.current.set(id, URL.createObjectURL(blob));

    await saveCapture(record);
    setCaptures(prev => [record, ...prev]);
    setCurrentCapture(record);
    setScreen('preview');

    if (isOnline) {
      runUpload(record);
    } else {
      setUploadState(id, { status: 'idle', progress: 0 });
    }
  }, [settings.eventName, isOnline, runUpload, setUploadState]);

  // ── Manual retry for a single capture ────────────────────────────────────
  const retryUpload = useCallback(async (id: string) => {
    const capture = captures.find(c => c.id === id);
    if (!capture || capture.uploadedToCloud) return;
    await runUpload(capture);
  }, [captures, runUpload]);

  // ── Mark shared ───────────────────────────────────────────────────────────
  const markShared = useCallback(async (id: string) => {
    await updateCapture(id, { shared: true });
    await markSharedInDb(id);
    setCaptures(prev => prev.map(c => c.id === id ? { ...c, shared: true } : c));
    setCurrentCapture(prev => prev?.id === id ? { ...prev, shared: true } : prev);
  }, []);

  // ── Delete capture ────────────────────────────────────────────────────────
  const deleteCapture = useCallback(async (id: string) => {
    const capture = captures.find(c => c.id === id);
    await idbDeleteCapture(id);

    const objUrl = objectUrlsRef.current.get(id);
    if (objUrl) { URL.revokeObjectURL(objUrl); objectUrlsRef.current.delete(id); }

    // Delete from Supabase (storage + DB) if it was uploaded
    if (capture?.videoUrl) {
      deleteFromCloud(capture.videoUrl);
    }
    deleteCaptureFromDb(id);

    setCaptures(prev => prev.filter(c => c.id !== id));
    setCurrentCapture(prev => prev?.id === id ? null : prev);
    setUploadStates(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [captures]);

  // ── Sync from cloud ────────────────────────────────────────────────────────
  const syncFromCloud = useCallback(async () => {
    const cloudCaptures = await fetchCapturesFromCloud(settings.eventName);
    setCaptures(prev => {
      const localIds = new Set(prev.map(c => c.id));
      const newOnes = cloudCaptures.filter(c => !localIds.has(c.id));
      if (!newOnes.length) return prev;
      return [...prev, ...newOnes].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    });
  }, [settings.eventName]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const pendingCount = Object.values(uploadStates).filter(s => s.status === 'uploading').length;
  const stats: Stats = {
    totalCaptures: captures.length,
    totalShared: captures.filter(c => c.shared).length,
    capturesThisHour: captures.filter(c => Date.now() - c.createdAt.getTime() < 3_600_000).length,
    capturesToday: captures.filter(c => {
      const d = new Date(c.createdAt); const n = new Date();
      return d.getFullYear() === n.getFullYear()
        && d.getMonth() === n.getMonth()
        && d.getDate() === n.getDate();
    }).length,
    averageDuration: captures.length
      ? Math.round(captures.reduce((a, c) => a + c.duration, 0) / captures.length)
      : 0,
    pendingUploads: captures.filter(c => !c.uploadedToCloud && c.videoBlob).length,
    cloudCaptures: captures.filter(c => c.uploadedToCloud).length,
  };

  // Suppress unused warning; pendingCount is readable from uploadStates
  void pendingCount;

  return (
    <AppContext.Provider value={{
      screen, setScreen,
      settings, updateSettings,
      captures, currentCapture,
      startNewCapture, finishCapture,
      markShared,
      deleteCapture,
      uploadStates,
      stats,
      adminUnlocked, unlockAdmin: (pin) => {
        if (!settings.kioskMode || pin === settings.kioskPin) {
          setAdminUnlocked(true); return true;
        }
        return false;
      },
      lockAdmin: () => setAdminUnlocked(false),
      isOnline,
      retryUpload,
      syncFromCloud,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
