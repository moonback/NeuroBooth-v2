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

export function PreviewScreen() {
  const { currentCapture, markShared, startNewCapture, setScreen, isOnline, uploadStates, retryUpload } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shared, setShared] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const uploadState = currentCapture ? (uploadStates[currentCapture.id] ?? { status: 'idle', progress: 0 }) : null;

  // ── Video URL ──────────────────────────────────────────────────────────────
  useEffect(() => {
    logger.info('Preview: video URL effect run', { captureId: currentCapture?.id });
    if (!currentCapture) return;
    if (currentCapture.videoUrl) {
      logger.info('Preview: using cloud video URL');
      setVideoUrl(currentCapture.videoUrl);
    } else if (currentCapture.videoBlob) {
      logger.info('Preview: creating local object URL from blob');
      const url = URL.createObjectURL(currentCapture.videoBlob);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [currentCapture]);

  // ── QR Code — regenerate whenever the cloud URL becomes available ──────────
  useEffect(() => {
    logger.info('Preview: QR code effect run', { captureId: currentCapture?.id, hasVideoUrl: !!currentCapture?.videoUrl });
    if (!currentCapture) return;
    const shareUrl = currentCapture.videoUrl || null;
    if (!shareUrl) { 
      logger.debug('Preview: no share URL, clearing QR');
      setQrDataUrl(null); 
      return; 
    }
    logger.info('Preview: generating QR code for share URL');
    QRCode.toDataURL(shareUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      logger.info('Preview: QR code generated');
      setQrDataUrl(url);
    }).catch((error) => {
      logger.error('Preview: QR code generation failed', { error: (error as Error).message });
      setQrDataUrl(null);
    });
  }, [currentCapture]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) {
      logger.warn('Preview: no video ref for togglePlay');
      return;
    }
    if (videoRef.current.paused) { 
      logger.info('Preview: playing video');
      videoRef.current.play(); 
    }
    else { 
      logger.info('Preview: pausing video');
      videoRef.current.pause(); 
    }
  }, []);

  // ── Sync playback state with video element events ────────────────────────
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
  }, []);

  const handleDownload = useCallback(() => {
    logger.info('Preview: download initiated', { captureId: currentCapture?.id });
    if (!currentCapture?.videoBlob) {
      logger.warn('Preview: no video blob for download');
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(currentCapture.videoBlob);
    a.download = `photobooth-360-${currentCapture.id.slice(0, 8)}.webm`;
    a.click();
    logger.info('Preview: download complete');
    setDownloadDone(true);
  }, [currentCapture]);

  const handleShare = useCallback(async () => {
    logger.info('Preview: share initiated', { captureId: currentCapture?.id });
    if (!currentCapture) {
      logger.warn('Preview: no current capture for share');
      return;
    }
    if (currentCapture.videoUrl && navigator.share) {
      try {
        logger.info('Preview: using native share API');
        await navigator.share({ url: currentCapture.videoUrl, title: 'Mon Photobooth 360°' });
      } catch (error) {
        logger.warn('Preview: native share failed', { error: (error as Error).message });
      }
    }
    logger.info('Preview: marking capture as shared');
    await markShared(currentCapture.id);
    setShared(true);
  }, [currentCapture, markShared]);

  if (!currentCapture) {
    return (
      <div className="theme-bg flex items-center justify-center min-h-screen">
        <button onClick={() => setScreen('welcome')} className="text-white">Retour</button>
      </div>
    );
  }

  const isUploading = uploadState?.status === 'uploading';
  const isUploadError = uploadState?.status === 'error';
  const isUploaded = !!currentCapture.videoUrl;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* ── Fullscreen Video ── */}
      {videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            playsInline
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <div className={`
              w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center
              transition-all duration-200 group-hover:bg-black/80 group-hover:scale-110
              ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
            `}>
              {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
            </div>
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/40 flex flex-col items-center gap-4">
            <Loader size={32} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="h-2 bg-white/10">
            <div
              className="h-full theme-accent-bg transition-all duration-300"
              style={{ width: `${uploadState?.progress ?? 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Cloud badge */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        {isUploaded ? (
          <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-emerald-500/30">
            <Cloud size={12} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden sm:inline">Sauvegardé</span>
          </span>
        ) : isUploading ? (
          <span className="flex items-center gap-2 bg-blue-500/20 text-blue-400 text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-blue-500/30">
            <Loader size={12} className="sm:w-3.5 sm:h-3.5 animate-spin" /> 
            <span>{uploadState?.progress ?? 0}%</span>
          </span>
        ) : isUploadError ? (
          <span className="flex items-center gap-2 bg-red-500/20 text-red-400 text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md border border-red-500/30">
            <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden sm:inline">Erreur</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 bg-white/10 text-white/40 text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-md">
            <CloudOff size={12} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden sm:inline">Local</span>
          </span>
        )}
      </div>

      {/* ── QR Code Overlay (Responsive) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-16 sm:top-20 sm:right-6 sm:left-auto sm:top-1/2 sm:-translate-y-1/2 z-20 animate-bounce-in">
        {isUploaded && qrDataUrl ? (
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-xl border border-white/15 shadow-2xl">
            <div className="p-3 sm:p-4 bg-white/10 rounded-xl sm:rounded-2xl">
              <img src={qrDataUrl} alt="QR Code" className="w-28 h-28 sm:w-44 sm:h-44 rounded-lg sm:rounded-xl" />
            </div>
            <div className="text-center">
              <p className="text-white/80 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2">
                <Smartphone size={12} className="sm:w-3.5 sm:h-3.5" />
                <span>Scannez</span>
              </p>
            </div>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-xl border border-white/15 shadow-2xl">
            <div className="relative w-12 h-12 sm:w-16 sm:h-16">
              <svg className="-rotate-90" width={48} height={48} viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
                <circle
                  cx="32" cy="32" r="26"
                  fill="none" strokeWidth="5" strokeLinecap="round"
                  className="theme-accent-stroke"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - (uploadState?.progress ?? 0) / 100)}
                  style={{ transition: 'stroke-dashoffset 0.3s linear' }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                {uploadState?.progress ?? 0}%
              </span>
            </div>
            <div>
              <p className="text-white/70 text-[10px] sm:text-xs font-medium">Upload en cours...</p>
            </div>
          </div>
        ) : isUploadError ? (
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-red-900/50 backdrop-blur-xl border border-red-500/30 shadow-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <AlertCircle size={20} className="sm:w-6 sm:h-6 text-red-400" />
            </div>
            <div>
              <p className="text-red-400 text-[10px] sm:text-xs font-medium">Upload échoué</p>
            </div>
            {isOnline && (
              <button
                onClick={() => retryUpload(currentCapture.id)}
                className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-[10px] sm:text-xs font-medium"
              >
                <RotateCcw size={10} className="sm:w-3 sm:h-3" /> Réessayer
              </button>
            )}
          </div>
        ) : !isOnline ? (
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-xl border border-white/15 shadow-2xl">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <CloudOff size={20} className="sm:w-6 sm:h-6 text-white/40" />
            </div>
            <div>
              <p className="text-white/50 text-[10px] sm:text-xs font-medium">Hors ligne</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-black/50 backdrop-blur-xl border border-white/15 shadow-2xl">
            <Loader size={24} className="sm:w-7 sm:h-7 text-white/40 animate-spin" />
            <div>
              <p className="text-white/60 text-[10px] sm:text-xs font-medium">Préparation...</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Buttons Overlay (Bottom, Responsive) */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 w-full px-4 sm:px-0">
        <div className="flex flex-col items-center gap-2 sm:gap-3 animate-bounce-in">
          {/* Title */}
          <div className="text-center mb-1 sm:mb-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-1.5 sm:gap-2">
              <Camera size={16} className="sm:w-5 sm:h-5 theme-accent-text" />
              Votre vidéo
            </h2>
            <p className="text-white/60 text-[10px] sm:text-xs">
              {Math.round(currentCapture.duration)}s &bull;{' '}
              {new Date(currentCapture.createdAt).toLocaleTimeString('fr-FR')}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col w-full sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white transition-all shadow-lg backdrop-blur-xl ${
                shared ? 'bg-emerald-600/80 border border-emerald-500/50'
                       : 'theme-accent-bg hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {shared ? <CheckCircle size={16} className="sm:w-4.5 sm:h-4.5" /> : <Share2 size={16} className="sm:w-4.5 sm:h-4.5" />}
              <span className="text-sm sm:text-base">{shared ? 'Partagé !' : 'Partager'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!currentCapture.videoBlob}
              className={`flex-1 flex items-center justify-center gap-2 px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all border backdrop-blur-xl ${
                downloadDone
                  ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/20'
                  : 'border-white/30 text-white hover:bg-white/20 active:scale-[0.98] disabled:opacity-30'
              }`}
            >
              {downloadDone ? <CheckCircle size={16} className="sm:w-4.5 sm:h-4.5" /> : <Download size={16} className="sm:w-4.5 sm:h-4.5" />}
              <span className="text-sm sm:text-base">{downloadDone ? 'Téléchargé !' : 'Télécharger'}</span>
            </button>
          </div>

          <button
            onClick={startNewCapture}
            className="flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-white/80 border border-white/30 hover:text-white hover:border-white/50 transition-all hover:bg-white/20 backdrop-blur-xl w-full sm:w-auto"
          >
            <RefreshCw size={16} className="sm:w-4.5 sm:h-4.5" />
            <span className="text-sm sm:text-base">Nouvelle capture</span>
          </button>

          <button onClick={() => setScreen('welcome')} className="text-white/40 hover:text-white/70 text-xs transition-colors mt-1">
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}


