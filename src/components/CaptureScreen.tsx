import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useMotor } from '../hooks/useMotor';
import { FlipHorizontal, Square, Mic, MicOff, Maximize2, Crosshair, Aperture } from 'lucide-react';
import { logger } from '../lib/logger';
import { haptics } from '../lib/haptics';

export function CaptureScreen() {
  const {
    settings, finishCapture, setScreen,
    stream, cameraError,
    startRecording, stopRecording, switchCamera, hasMultipleCameras,
    currentCameraFacing, attachStreamToVideo,
    ultraWideActive, gyroStabilizationActive, recalibrateGyro,
    lockCameraExposure, unlockCameraExposure, afAeLocked,
  } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    attachStreamToVideo(videoRef.current);
    return () => {
      attachStreamToVideo(null);
    };
  }, [attachStreamToVideo]);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<'starting' | 'recording' | 'stopping'>('starting');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const motor = useMotor();

  const handleStop = useCallback(async () => {
    if (phase === 'stopping') return;
    logger.info('Capture screen: initiating stop', { phase });
    setPhase('stopping');
    if (timerRef.current) clearInterval(timerRef.current);

    if (settings.motorEnabled && settings.motorSyncRecording && motor.isConnected) {
      logger.info('Stopping motor');
      await motor.stopMotor();
    }

    await unlockCameraExposure();

    logger.info('Camera stop recording initiated');
    const blob = await stopRecording();
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    logger.info('Recording duration calculated', { duration });

    if (blob) {
      haptics.captureEnd();
      logger.info('Proceeding to finish capture');
      await finishCapture(blob, duration);
    } else {
      logger.warn('No blob returned from camera, returning to welcome screen');
      setScreen('welcome');
    }
  }, [phase, stopRecording, motor, settings, finishCapture, setScreen, unlockCameraExposure]);

  useEffect(() => {
    if (cameraError) return;
    if (stream && phase === 'starting') {
      logger.info('Capture screen: starting capture flow');
      // Short delay to let camera warm up
      const t = setTimeout(async () => {
        logger.info('Camera start recording called');
        if (settings.gyroStabilizationEnabled) {
          recalibrateGyro();
        }
        if (settings.lockAfAeEnabled) {
          await lockCameraExposure();
        }
        startRecording();
        startTimeRef.current = Date.now();
        setPhase('recording');

        if (settings.motorEnabled && settings.motorSyncRecording && motor.isConnected) {
          logger.info('Starting motor', { speed: settings.motorSpeed, direction: settings.motorDirection });
          await motor.startMotor(settings.motorSpeed, settings.motorDirection);
        }

        timerRef.current = window.setInterval(() => {
          const s = (Date.now() - startTimeRef.current) / 1000;
          setElapsed(s);
          if (s >= settings.captureDuration) {
            logger.info('Capture duration reached, initiating stop', { elapsed: s, targetDuration: settings.captureDuration });
            clearInterval(timerRef.current!);
          }
        }, 100);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [stream, cameraError, phase, settings.motorEnabled, settings.motorSyncRecording, settings.motorSpeed, settings.motorDirection, settings.gyroStabilizationEnabled, settings.lockAfAeEnabled, motor.isConnected, startRecording, recalibrateGyro, lockCameraExposure]);

  useEffect(() => {
    return () => { unlockCameraExposure(); };
  }, [unlockCameraExposure]);

  useEffect(() => {
    if (phase === 'recording' && elapsed >= settings.captureDuration) {
      handleStop();
    }
  }, [elapsed, phase, settings.captureDuration, handleStop]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const progress = Math.min(elapsed / settings.captureDuration, 1);
  const remaining = Math.max(0, settings.captureDuration - elapsed);

  return (
    <div className="theme-bg screen-layout--immersive relative flex flex-col items-center justify-center w-full overflow-hidden">
      {/* Video preview */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: currentCameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 overlay-gradient-bottom bg-gradient-to-t from-black/80 via-transparent to-black/40" />
        <div className="absolute inset-0 overlay-gradient-top bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Error state */}
      {cameraError && (
        <div className="relative z-10 text-center p-8">
          <p className="text-red-400 text-xl mb-4">Erreur caméra: {cameraError}</p>
          <button onClick={() => setScreen('welcome')} className="touch-target px-6 rounded-full border border-white/30 text-white">
            Retour
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 hud-top flex items-center justify-between z-10">
        {phase === 'recording' && (
          <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full hud-badge hud-text">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-semibold text-sm tracking-wide">REC</span>
          </div>
        )}
        {phase === 'starting' && (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hud-badge hud-text">
            <span className="text-white text-sm">Initialisation...</span>
          </div>
        )}
        {phase === 'stopping' && (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full hud-badge hud-text">
            <span className="text-white text-sm">Traitement...</span>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {ultraWideActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wide">
              <Maximize2 size={12} />
              0.5x
            </span>
          )}
          {gyroStabilizationActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-[10px] font-bold uppercase tracking-wide">
              <Crosshair size={12} />
              EIS
            </span>
          )}
          {afAeLocked && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wide">
              <Aperture size={12} />
              AF/AE
            </span>
          )}
          {settings.soundEnabled
            ? <Mic size={18} className="text-white/60" />
            : <MicOff size={18} className="text-white/30" />}
          {settings.showWatermark && settings.watermarkText && (
            <span className="text-white/40 text-xs hud-text preview-overlay-text">{settings.watermarkText}</span>
          )}
        </div>
      </div>

      {/* Timer arc */}
      {phase === 'recording' && (
        <div className="absolute top-1/2 right-8 -translate-y-1/2 z-10">
          <div className="relative w-20 h-20">
            <svg className="-rotate-90" width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="32"
                fill="none"
                stroke="white"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {Math.ceil(remaining)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 hud-bottom flex items-center justify-between z-10">
        <button
          onClick={() => setScreen('welcome')}
          className="touch-target px-5 rounded-full border border-white/30 text-white/60 hover:text-white hover:border-white/60 transition-colors text-sm backdrop-blur-sm hud-text"
        >
          Annuler
        </button>

        {/* Progress bar */}
        <div className="flex-1 mx-8">
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full theme-accent-bg rounded-full transition-all"
              style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasMultipleCameras && (
            <button
              onClick={switchCamera}
              className="touch-target rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all"
              aria-label="Changer de caméra"
            >
              <FlipHorizontal size={22} />
            </button>
          )}
          {phase === 'recording' && (
            <button
              onClick={handleStop}
              className="touch-target rounded-full bg-red-600/90 hover:bg-red-500 backdrop-blur-sm text-white transition-all hover:scale-105 active:scale-95"
              aria-label="Arrêter"
            >
              <Square size={22} fill="white" />
            </button>
          )}
        </div>
      </div>

      {/* Branding preview — matches canvas burn-in (logo + texte) */}
      {(settings.eventLogo || (settings.showWatermark && settings.watermarkText)) && (
        <div className="absolute bottom-24 left-0 px-[3vmin] flex items-end gap-3 pointer-events-none z-10 max-w-[90vw]">
          {settings.eventLogo && (
            <img
              src={settings.eventLogo}
              alt=""
              className="max-w-[18vw] max-h-[8vh] object-contain opacity-85 drop-shadow-md shrink-0"
            />
          )}
          {settings.showWatermark && settings.watermarkText && (
            <span className="text-white/55 text-[clamp(10px,2vw,14px)] font-semibold preview-overlay-text drop-shadow-md leading-tight pb-0.5">
              {settings.watermarkText}
            </span>
          )}
        </div>
      )}

      {/* 360 watermark overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="text-white/10 text-6xl font-black tracking-widest">360°</span>
      </div>
    </div>
  );
}
