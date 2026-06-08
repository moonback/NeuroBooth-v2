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
  Home,
  Copy,
  Sparkles,
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
  const [copied, setCopied] = useState(false);

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
    navigator.vibrate?.(20);
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
    const objectUrl = URL.createObjectURL(currentCapture.videoBlob);
    a.href = objectUrl;
    a.download = `photobooth-360-${currentCapture.id.slice(0, 8)}.webm`;
    a.click();
    URL.revokeObjectURL(objectUrl);
    navigator.vibrate?.(25);
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
    navigator.vibrate?.(30);
    logger.info('Preview: marking capture as shared');
    await markShared(currentCapture.id);
    setShared(true);
  }, [currentCapture, markShared]);

  const handleCopy = useCallback(async () => {
    if (!currentCapture?.videoUrl) return;
    await navigator.clipboard?.writeText(currentCapture.videoUrl);
    navigator.vibrate?.(20);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [currentCapture?.videoUrl]);

  if (!currentCapture) {
    return (
      <div className="theme-bg flex min-h-[100dvh] items-center justify-center p-6">
        <button onClick={() => setScreen('welcome')} className="touch-target rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white">
          Retour
        </button>
      </div>
    );
  }

  const isUploading = uploadState?.status === 'uploading';
  const isUploadError = uploadState?.status === 'error';
  const isUploaded = !!currentCapture.videoUrl;

  return (
    <div className="theme-bg soft-grid flex min-h-[100dvh] w-full flex-col overflow-hidden lg:flex-row">
      {/* ── Video ── */}
      <section className="relative flex min-h-[48dvh] flex-1 items-center justify-center bg-black lg:min-h-[100dvh]">
        {videoUrl ? (
          <>
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full max-h-[58dvh] w-full object-contain lg:max-h-screen"
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
                grid h-20 w-20 place-items-center rounded-full border border-white/20 bg-black/55 backdrop-blur-md
                transition-all duration-200 group-hover:scale-110 group-hover:bg-black/75 sm:h-24 sm:w-24
                ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
              `}>
                {isPlaying ? <Pause size={38} className="text-white" /> : <Play size={38} className="ml-1 text-white" />}
              </div>
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/45">
            <Loader size={40} className="animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 to-transparent lg:hidden" />

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
        <div className="mobile-top-safe absolute right-4 top-0 sm:right-6">
          {isUploaded ? (
            <span className="status-pill border-emerald-500/30 bg-emerald-500/20 text-emerald-300">
              <Cloud size={14} /> Sauvegardé
            </span>
          ) : isUploading ? (
            <span className="status-pill border-blue-500/30 bg-blue-500/20 text-blue-300">
              <Loader size={14} className="animate-spin" /> {uploadState?.progress ?? 0}%
            </span>
          ) : isUploadError ? (
            <span className="status-pill border-red-500/30 bg-red-500/20 text-red-300">
              <AlertCircle size={14} /> Erreur
            </span>
          ) : (
            <span className="status-pill border-white/10 bg-white/10 text-white/50">
              <CloudOff size={14} /> Local
            </span>
          )}
        </div>
      </section>

      {/* ── QR + Actions ── */}
      <aside className="bottom-sheet glass-panel z-10 -mt-8 flex w-full flex-col items-center gap-5 overflow-y-auto px-5 py-6 lg:mt-0 lg:w-[27rem] lg:justify-center lg:rounded-none lg:border-y-0 lg:border-r-0 lg:px-8">
        <div className="h-1.5 w-12 rounded-full bg-white/20 lg:hidden" />

        <div className="w-full text-center animate-bounce-in">
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            <Sparkles size={14} className="theme-accent-text" /> Étape 3/3
          </p>
          <h2 className="flex items-center justify-center gap-2 text-3xl font-black tracking-tight text-white">
            <Camera size={24} className="theme-accent-text" />
            Votre vidéo
          </h2>
          <p className="mt-1 text-sm text-white/50">
            {Math.round(currentCapture.duration)}s &bull;{' '}
            {new Date(currentCapture.createdAt).toLocaleTimeString('fr-FR')}
          </p>
        </div>

        {/* QR Code section */}
        <div className="w-full animate-bounce-in">
          {isUploaded && qrDataUrl ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-white/12 to-white/5 p-4 shadow-2xl">
                <div className="absolute inset-0 rounded-[1.75rem] border theme-accent-border opacity-10" />
                <img src={qrDataUrl} alt="QR Code" className="h-44 w-44 rounded-2xl sm:h-56 sm:w-56" />
              </div>
              <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-white/65">
                <Smartphone size={16} className="text-white/45" />
                Scannez ou partagez le lien
              </p>
            </div>
          ) : isUploading ? (
            <UploadingPlaceholder progress={uploadState?.progress ?? 0} />
          ) : isUploadError ? (
            <ErrorPlaceholder onRetry={() => retryUpload(currentCapture.id)} isOnline={isOnline} />
          ) : !isOnline ? (
            <OfflinePlaceholder />
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 text-center">
              <Loader size={32} className="text-white/35 animate-spin" />
              <div>
                <p className="text-sm font-medium text-white/65">Préparation de l'upload...</p>
                <p className="mt-1 text-xs text-white/35">Votre vidéo est en route</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid w-full grid-cols-2 gap-3 animate-bounce-in">
          <button
            onClick={handleShare}
            className={`touch-target pressable col-span-2 flex items-center justify-center gap-3 rounded-2xl py-4 font-bold text-white shadow-lg ${
              shared ? 'border border-emerald-500/50 bg-emerald-600/80'
                     : 'theme-accent-bg hover:opacity-90'
            }`}
          >
            {shared ? <CheckCircle size={20} /> : <Share2 size={20} />}
            {shared ? 'Partagé !' : 'Partager maintenant'}
          </button>

          {isUploaded && (
            <button
              onClick={handleCopy}
              className={`touch-target pressable flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold ${
                copied
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/15 bg-white/5 text-white/70 hover:border-white/35 hover:text-white'
              }`}
            >
              {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              {copied ? 'Copié' : 'Lien'}
            </button>
          )}

          <button
            onClick={handleDownload}
            disabled={!currentCapture.videoBlob}
            className={`touch-target pressable flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold ${isUploaded ? '' : 'col-span-2'} ${
              downloadDone
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                : 'border-white/15 bg-white/5 text-white/70 hover:border-white/35 hover:text-white disabled:opacity-30'
            }`}
          >
            {downloadDone ? <CheckCircle size={18} /> : <Download size={18} />}
            {downloadDone ? 'Téléchargé' : 'Télécharger'}
          </button>

          <button
            onClick={startNewCapture}
            className="touch-target pressable col-span-2 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold text-white/75 hover:border-white/30 hover:text-white"
          >
            <RefreshCw size={20} />
            Nouvelle capture
          </button>
        </div>

        <button onClick={() => setScreen('welcome')} className="touch-target pressable flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white/35 hover:text-white/70">
          <Home size={16} /> Retour à l'accueil
        </button>
      </aside>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadingPlaceholder({ progress }: { progress: number }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 text-center">
      <div className="relative h-20 w-20">
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
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-white">
          {progress}%
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-white/70">Upload en cours...</p>
        <p className="mt-1 text-xs text-white/35">Le QR code apparaîtra ici</p>
      </div>
    </div>
  );
}

function ErrorPlaceholder({ onRetry, isOnline }: { onRetry: () => void; isOnline: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
        <AlertCircle size={32} className="text-red-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-red-400">Upload échoué</p>
        <p className="mt-1 text-xs text-white/35">La vidéo est sauvegardée localement</p>
      </div>
      {isOnline && (
        <button
          onClick={onRetry}
          className="touch-target pressable flex items-center gap-2 rounded-xl bg-red-500/20 px-5 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/30"
        >
          <RotateCcw size={14} /> Réessayer
        </button>
      )}
    </div>
  );
}

function OfflinePlaceholder() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10">
        <CloudOff size={32} className="text-white/35" />
      </div>
      <div>
        <p className="text-sm font-medium text-white/55">Hors ligne</p>
        <p className="mt-1 text-xs text-white/35">L'upload reprendra automatiquement<br />dès le retour de la connexion</p>
      </div>
    </div>
  );
}
