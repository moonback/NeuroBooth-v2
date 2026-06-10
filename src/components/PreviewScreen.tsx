import { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import {
  Share2,
  Download,
  RefreshCw,
  CheckCircle,
  Cloud,
  CloudOff,
  Play,
  Pause,
  AlertCircle,
  Loader,
  RotateCcw,
  Camera,
  Smartphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { logger } from '../lib/logger';
import { haptics } from '../lib/haptics';

function QrPanel({
  isUploaded,
  qrDataUrl,
  isUploading,
  isUploadError,
  isOnline,
  uploadProgress,
  onRetry,
}: {
  isUploaded: boolean;
  qrDataUrl: string | null;
  isUploading: boolean;
  isUploadError: boolean;
  isOnline: boolean;
  uploadProgress: number;
  onRetry: () => void;
}) {
  const shell = 'flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl';

  if (isUploaded && qrDataUrl) {
    return (
      <div className={shell}>
        <div className="p-2 bg-white rounded-xl">
          <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg" />
        </div>
        <p className="text-white/80 text-xs font-medium flex items-center gap-1.5 preview-overlay-text">
          <Smartphone size={12} />
          Scannez pour récupérer
        </p>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className={shell}>
        <div className="relative w-12 h-12">
          <svg className="-rotate-90 w-full h-full" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r="26"
              fill="none" strokeWidth="5" strokeLinecap="round"
              className="theme-accent-stroke"
              strokeDasharray={2 * Math.PI * 26}
              strokeDashoffset={2 * Math.PI * 26 * (1 - uploadProgress / 100)}
              style={{ transition: 'stroke-dashoffset 0.3s linear' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
            {uploadProgress}%
          </span>
        </div>
        <p className="text-white/70 text-xs font-medium">Upload en cours...</p>
      </div>
    );
  }

  if (isUploadError) {
    return (
      <div className={`${shell} border-red-500/30 bg-red-900/40`}>
        <AlertCircle size={24} className="text-red-400" />
        <p className="text-red-400 text-xs font-medium">Upload échoué</p>
        {isOnline && (
          <button
            onClick={onRetry}
            className="touch-target-sm flex items-center gap-1.5 px-3 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium"
          >
            <RotateCcw size={12} /> Réessayer
          </button>
        )}
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className={shell}>
        <CloudOff size={24} className="text-white/40" />
        <p className="text-white/50 text-xs font-medium">Hors ligne</p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <Loader size={22} className="text-white/40 animate-spin" />
      <p className="text-white/60 text-xs font-medium">Préparation du lien...</p>
    </div>
  );
}

export function PreviewScreen() {
  const { currentCapture, markShared, startNewCapture, setScreen, isOnline, uploadStates, retryUpload } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const uploadState = currentCapture ? (uploadStates[currentCapture.id] ?? { status: 'idle', progress: 0 }) : null;

  useEffect(() => {
    if (!currentCapture) return;
    if (currentCapture.videoUrl) {
      setVideoUrl(currentCapture.videoUrl);
    } else if (currentCapture.videoBlob) {
      const url = URL.createObjectURL(currentCapture.videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentCapture]);

  useEffect(() => {
    if (!currentCapture) return;
    const shareUrl = currentCapture.videoUrl || null;
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, {
      width: 192,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [currentCapture]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [videoUrl]);

  const handleDownload = useCallback(() => {
    if (!currentCapture?.videoBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(currentCapture.videoBlob);
    a.download = `photobooth-360-${currentCapture.id.slice(0, 8)}.webm`;
    a.click();
    setDownloadDone(true);
  }, [currentCapture]);

  const handleShare = useCallback(async () => {
    if (!currentCapture) return;
    if (currentCapture.videoUrl && navigator.share) {
      try {
        await navigator.share({ url: currentCapture.videoUrl, title: 'Mon NeuroBooth 360°' });
      } catch (error) {
        logger.warn('Preview: native share failed', { error: (error as Error).message });
      }
    }
    await markShared(currentCapture.id);
    haptics.shareSuccess();
    setShared(true);
  }, [currentCapture, markShared]);

  if (!currentCapture) {
    return (
      <div className="theme-bg screen-layout flex items-center justify-center">
        <button onClick={() => setScreen('welcome')} className="touch-target text-white">Retour</button>
      </div>
    );
  }

  const isUploading = uploadState?.status === 'uploading';
  const isUploadError = uploadState?.status === 'error';
  const isUploaded = !!currentCapture.videoUrl;

  return (
    <div className="preview-screen theme-bg">
      {/* Vidéo plein écran */}
      <div className="preview-screen__video bg-black">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              loop
              playsInline
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <div className={`w-16 h-16 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center transition-all duration-200 ${isPlaying ? 'opacity-0 group-active:opacity-100' : 'opacity-100'}`}>
                {isPlaying ? <Pause size={28} className="text-white" /> : <Play size={28} className="text-white ml-0.5" />}
              </div>
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader size={32} className="animate-spin text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 overlay-gradient-top bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />
      </div>

      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/10">
          <div
            className="h-full theme-accent-bg transition-all duration-300"
            style={{ width: `${uploadState?.progress ?? 0}%` }}
          />
        </div>
      )}

      {/* En-tête : titre + statut cloud */}
      <header className="preview-screen__header flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold text-white flex items-center gap-2 preview-overlay-text">
            <Camera size={16} className="theme-accent-text shrink-0" />
            Votre vidéo
          </h2>
          <p className="text-white/60 text-xs hud-text mt-0.5">
            {Math.round(currentCapture.duration)}s · {new Date(currentCapture.createdAt).toLocaleTimeString('fr-FR')}
          </p>
        </div>
        {isUploaded ? (
          <span className="shrink-0 flex items-center gap-1.5 bg-emerald-500/25 text-emerald-400 text-xs px-2.5 py-1.5 rounded-full backdrop-blur-md border border-emerald-500/30 hud-badge hud-text">
            <Cloud size={12} />
            Sauvegardé
          </span>
        ) : isUploading ? (
          <span className="shrink-0 flex items-center gap-1.5 bg-blue-500/25 text-blue-400 text-xs px-2.5 py-1.5 rounded-full backdrop-blur-md border border-blue-500/30 hud-badge hud-text">
            <Loader size={12} className="animate-spin" />
            {uploadState?.progress ?? 0}%
          </span>
        ) : isUploadError ? (
          <span className="shrink-0 flex items-center gap-1.5 bg-red-500/25 text-red-400 text-xs px-2.5 py-1.5 rounded-full backdrop-blur-md border border-red-500/30 hud-badge hud-text">
            <AlertCircle size={12} />
            Erreur
          </span>
        ) : (
          <span className="shrink-0 flex items-center gap-1.5 bg-white/10 text-white/50 text-xs px-2.5 py-1.5 rounded-full backdrop-blur-md hud-badge hud-text">
            <CloudOff size={12} />
            Local
          </span>
        )}
      </header>

      {/* QR — zone haute, séparée des boutons */}
      <div className="preview-screen__qr">
        <QrPanel
          isUploaded={isUploaded}
          qrDataUrl={qrDataUrl}
          isUploading={isUploading}
          isUploadError={isUploadError}
          isOnline={isOnline}
          uploadProgress={uploadState?.progress ?? 0}
          onRetry={() => retryUpload(currentCapture.id)}
        />
      </div>

      {/* Zone centrale — tap play */}
      <div className="preview-screen__spacer" onClick={togglePlay} role="presentation" />

      {/* Actions — zone pouce en bas */}
      <footer className="preview-screen__actions">
        <div className="flex flex-col gap-2 w-full max-w-md mx-auto">
          <button
            onClick={handleShare}
            className={`cta-button w-full flex items-center justify-center gap-2 px-6 rounded-2xl font-semibold text-white transition-all shadow-lg ${
              shared ? 'bg-emerald-600/90 border border-emerald-500/50' : 'hover:opacity-90 active:scale-[0.98]'
            }`}
          >
            {shared ? <CheckCircle size={18} /> : <Share2 size={18} />}
            {shared ? 'Partagé !' : 'Partager'}
          </button>

          <button
            onClick={handleDownload}
            disabled={!currentCapture.videoBlob}
            className={`action-button touch-target w-full flex items-center justify-center gap-2 px-6 rounded-2xl font-semibold transition-all border ${
              downloadDone
                ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/20'
                : 'border-white/30 text-white bg-black/40 active:scale-[0.98] disabled:opacity-30'
            }`}
          >
            {downloadDone ? <CheckCircle size={18} /> : <Download size={18} />}
            {downloadDone ? 'Téléchargé !' : 'Télécharger'}
          </button>

          <button
            onClick={startNewCapture}
            className="touch-target w-full flex items-center justify-center gap-2 px-6 rounded-2xl font-semibold text-white/90 border border-white/25 bg-black/30 active:scale-[0.98]"
          >
            <RefreshCw size={18} />
            Nouvelle capture
          </button>

          <button
            onClick={() => setScreen('welcome')}
            className="touch-target-sm w-full text-white/40 text-xs mt-1"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </footer>
    </div>
  );
}
