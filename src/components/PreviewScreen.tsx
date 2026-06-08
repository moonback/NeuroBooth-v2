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
  }, [currentCapture?.id, currentCapture?.videoUrl]);

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
      width: 280,
      margin: 2,
      color: { dark: '#ffffff', light: '#00000000' },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      logger.info('Preview: QR code generated');
      setQrDataUrl(url);
    }).catch((error) => {
      logger.error('Preview: QR code generation failed', { error: (error as Error).message });
    });
  }, [currentCapture?.videoUrl]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) {
      logger.warn('Preview: no video ref for togglePlay');
      return;
    }
    if (videoRef.current.paused) { 
      logger.info('Preview: playing video');
      videoRef.current.play(); 
      setIsPlaying(true); 
    }
    else { 
      logger.info('Preview: pausing video');
      videoRef.current.pause(); 
      setIsPlaying(false); 
    }
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
    <div className="theme-bg flex flex-col lg:flex-row min-h-screen w-full overflow-hidden">
      {/* ── Left: Video ── */}
      <div className="relative flex-1 bg-black flex items-center justify-center min-h-[45vh] lg:min-h-screen">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain max-h-screen"
              loop
              playsInline
              onEnded={() => setIsPlaying(false)}
            />
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center group"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <div className={`
                w-24 h-24 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center
                transition-all duration-200 group-hover:bg-black/80 group-hover:scale-110
                ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
              `}>
                {isPlaying ? <Pause size={40} className="text-white" /> : <Play size={40} className="text-white ml-1" />}
              </div>
            </button>
          </>
        ) : (
          <div className="text-white/40 flex flex-col items-center gap-4">
            <Loader size={40} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="h-2 bg-white/10">
              <div
                className="h-full theme-accent-bg transition-all duration-300"
                style={{ width: `${uploadState?.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Cloud badge */}
        <div className="absolute top-4 right-4">
          {isUploaded ? (
            <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 text-xs px-4 py-2 rounded-full backdrop-blur-md border border-emerald-500/30">
              <Cloud size={14} /> Sauvegardé
            </span>
          ) : isUploading ? (
            <span className="flex items-center gap-2 bg-blue-500/20 text-blue-400 text-xs px-4 py-2 rounded-full backdrop-blur-md border border-blue-500/30">
              <Loader size={14} className="animate-spin" /> {uploadState?.progress ?? 0}%
            </span>
          ) : isUploadError ? (
            <span className="flex items-center gap-2 bg-red-500/20 text-red-400 text-xs px-4 py-2 rounded-full backdrop-blur-md border border-red-500/30">
              <AlertCircle size={14} /> Erreur
            </span>
          ) : (
            <span className="flex items-center gap-2 bg-white/10 text-white/40 text-xs px-4 py-2 rounded-full backdrop-blur-md">
              <CloudOff size={14} /> Local
            </span>
          )}
        </div>
      </div>

      {/* ── Right: QR + Actions ── */}
      <div className="w-full lg:w-96 flex flex-col items-center justify-start lg:justify-center gap-6 p-6 lg:p-8 relative overflow-y-auto">
        <div className="text-center animate-bounce-in">
          <h2 className="text-3xl font-bold text-white mb-1 flex items-center justify-center gap-2">
            <Camera size={24} className="theme-accent-text" />
            Votre vidéo
          </h2>
          <p className="text-white/50 text-sm">
            {Math.round(currentCapture.duration)}s &bull;{' '}
            {new Date(currentCapture.createdAt).toLocaleTimeString('fr-FR')}
          </p>
        </div>

        {/* QR Code section */}
        <div className="w-full animate-bounce-in">
          {isUploaded && qrDataUrl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="p-5 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-2xl relative">
                <div className="absolute inset-0 rounded-3xl theme-accent-border border opacity-10" />
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-2xl" />
              </div>
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1 flex items-center justify-center gap-2">
                  <Smartphone size={16} className="text-white/40" />
                  Scannez pour récupérer votre vidéo
                </p>
              </div>
            </div>
          ) : isUploading ? (
            <UploadingPlaceholder progress={uploadState?.progress ?? 0} />
          ) : isUploadError ? (
            <ErrorPlaceholder onRetry={() => retryUpload(currentCapture.id)} isOnline={isOnline} />
          ) : !isOnline ? (
            <OfflinePlaceholder />
          ) : (
            <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-center">
              <Loader size={32} className="text-white/30 animate-spin" />
              <div>
                <p className="text-white/60 text-sm font-medium">Préparation de l'upload...</p>
                <p className="text-white/30 text-xs mt-1">Votre vidéo est en route</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full animate-bounce-in">
          <button
            onClick={handleShare}
            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-white transition-all shadow-lg ${
              shared ? 'bg-emerald-600/80 border border-emerald-500/50'
                     : 'theme-accent-bg hover:opacity-90 hover:scale-[1.01] active:scale-[0.98]'
            }`}
          >
            {shared ? <CheckCircle size={20} /> : <Share2 size={20} />}
            {shared ? 'Partagé !' : 'Partager'}
          </button>

          <button
            onClick={handleDownload}
            disabled={!currentCapture.videoBlob}
            className={`flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold transition-all border ${
              downloadDone
                ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10'
                : 'border-white/20 text-white hover:bg-white/10 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30'
            }`}
          >
            {downloadDone ? <CheckCircle size={20} /> : <Download size={20} />}
            {downloadDone ? 'Téléchargé !' : 'Télécharger'}
          </button>

          <button
            onClick={startNewCapture}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-semibold text-white/70 border border-white/10 hover:text-white hover:border-white/30 transition-all hover:bg-white/5"
          >
            <RefreshCw size={20} />
            Nouvelle capture
          </button>
        </div>

        <button onClick={() => setScreen('welcome')} className="text-white/30 hover:text-white/60 text-sm transition-colors">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadingPlaceholder({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-center">
      <div className="relative w-20 h-20">
        <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="32"
            fill="none" strokeWidth="6" strokeLinecap="round"
            className="theme-accent-stroke"
            strokeDasharray={2 * Math.PI * 32}
            strokeDashoffset={2 * Math.PI * 32 * (1 - progress / 100)}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white text-base font-bold">
          {progress}%
        </span>
      </div>
      <div>
        <p className="text-white/70 text-sm font-medium">Upload en cours...</p>
        <p className="text-white/30 text-xs mt-1">Le QR code apparaîtra ici</p>
      </div>
    </div>
  );
}

function ErrorPlaceholder({ onRetry, isOnline }: { onRetry: () => void; isOnline: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <div>
        <p className="text-red-400 text-sm font-medium">Upload échoué</p>
        <p className="text-white/30 text-xs mt-1">La vidéo est sauvegardée localement</p>
      </div>
      {isOnline && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm font-medium"
        >
          <RotateCcw size={14} /> Réessayer
        </button>
      )}
    </div>
  );
}

function OfflinePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 text-center">
      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
        <CloudOff size={32} className="text-white/30" />
      </div>
      <div>
        <p className="text-white/50 text-sm font-medium">Hors ligne</p>
        <p className="text-white/30 text-xs mt-1">L'upload reprendra automatiquement<br />dès le retour de la connexion</p>
      </div>
    </div>
  );
}
