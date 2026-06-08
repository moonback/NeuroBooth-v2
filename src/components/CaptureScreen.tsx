import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useCamera } from '../hooks/useCamera';
import { useMotor } from '../hooks/useMotor';
import { FlipHorizontal, Square, Mic, MicOff, ArrowLeft, Radio, RotateCw } from 'lucide-react';
import { logger } from '../lib/logger';

export function CaptureScreen() {
  const { settings, finishCapture, setScreen } = useApp();
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<'starting' | 'recording' | 'stopping'>('starting');
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const camera = useCamera({
    facing: settings.cameraFacing,
    quality: settings.videoQuality,
    soundEnabled: settings.soundEnabled,
  });

  const motor = useMotor();

  const handleStop = useCallback(async () => {
    if (phase === 'stopping') return;
    navigator.vibrate?.([30, 40, 30]);
    logger.info('Capture screen: initiating stop', { phase });
    setPhase('stopping');
    if (timerRef.current) clearInterval(timerRef.current);

    if (settings.motorEnabled && settings.motorSyncRecording && motor.isConnected) {
      logger.info('Stopping motor');
      await motor.stopMotor();
    }

    logger.info('Camera stop recording initiated');
    const blob = await camera.stopRecording();
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    logger.info('Recording duration calculated', { duration });

    if (blob) {
      logger.info('Proceeding to finish capture');
      await finishCapture(blob, duration);
    } else {
      logger.warn('No blob returned from camera, returning to welcome screen');
      setScreen('welcome');
    }
  }, [phase, camera, motor, settings, finishCapture, setScreen]);

  useEffect(() => {
    if (camera.error) return;
    if (camera.stream && phase === 'starting') {
      logger.info('Capture screen: starting capture flow');
      // Short delay to let camera warm up
      const t = setTimeout(async () => {
        logger.info('Camera start recording called');
        camera.startRecording();
        startTimeRef.current = Date.now();
        navigator.vibrate?.(45);
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
  }, [camera.stream, camera.error, phase, settings.motorEnabled, settings.motorSyncRecording, settings.motorSpeed, settings.motorDirection, motor.isConnected]);

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
    <div className="theme-bg relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden">
      {/* Video preview */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={camera.videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: settings.cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      </div>

      {/* Error state */}
      {camera.error && (
        <div className="relative z-10 text-center p-8">
          <p className="text-red-400 text-xl mb-4">Erreur caméra: {camera.error}</p>
          <button onClick={() => setScreen('welcome')} className="touch-target rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white">
            Retour
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="mobile-top-safe absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-6">
        {/* Recording indicator */}
        {phase === 'recording' && (
          <div className="status-pill border-red-400/30 bg-red-600/90 text-white">
            <Radio size={15} className="animate-pulse" />
            <span>REC</span>
          </div>
        )}
        {phase === 'starting' && (
          <div className="status-pill border-white/15 bg-white/15 text-white/80">
            <span>Initialisation...</span>
          </div>
        )}
        {phase === 'stopping' && (
          <div className="status-pill border-white/15 bg-white/15 text-white/80">
            <span>Traitement...</span>
          </div>
        )}

        <div className="flex max-w-[52vw] items-center justify-end gap-3 rounded-full bg-black/20 px-3 py-2 backdrop-blur-md">
          {settings.soundEnabled
            ? <Mic size={18} className="text-white/60" />
            : <MicOff size={18} className="text-white/30" />}
          {settings.showWatermark && settings.watermarkText && (
            <span className="text-white/40 text-xs">{settings.watermarkText}</span>
          )}
        </div>
      </div>

      {/* Timer arc */}
      {phase === 'recording' && (
        <div className="absolute right-4 top-24 z-10 sm:right-8 sm:top-1/2 sm:-translate-y-1/2">
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
      <div className="bottom-sheet glass-panel absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-3 px-4 py-4 sm:m-6 sm:rounded-[2rem] sm:p-5">
        <button
          onClick={() => setScreen('welcome')}
          className="touch-target pressable flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-3 py-3 text-sm font-bold text-white/65 hover:border-white/45 hover:text-white sm:px-5"
        >
          <ArrowLeft size={17} />
          <span className="hidden sm:inline">Annuler</span>
        </button>

        {/* Progress bar */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/55">
            <span>Capture</span>
            <span>{Math.ceil(remaining)}s</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full theme-accent-bg rounded-full transition-all"
              style={{ width: `${progress * 100}%`, transition: 'width 0.1s linear' }}
            />
          </div>
        </div>

        <div className="flex max-w-[52vw] items-center justify-end gap-3 rounded-full bg-black/20 px-3 py-2 backdrop-blur-md">
          {camera.hasMultipleCameras && (
            <button
              onClick={camera.switchCamera}
              className="touch-target pressable grid place-items-center rounded-2xl bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
              aria-label="Changer de caméra"
            >
              <FlipHorizontal size={22} />
            </button>
          )}
          {phase === 'recording' && (
            <button
              onClick={handleStop}
              className="touch-target pressable grid h-16 w-16 place-items-center rounded-2xl bg-red-600/95 text-white shadow-2xl shadow-red-950/40 backdrop-blur-sm hover:bg-red-500 sm:h-14 sm:w-14"
              aria-label="Arrêter"
            >
              <Square size={22} fill="white" />
            </button>
          )}
        </div>
      </div>

      {/* 360 watermark overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="flex items-center gap-2 text-white/10 text-5xl font-black tracking-widest sm:text-6xl"><RotateCw size={42} />360°</span>
      </div>
    </div>
  );
}
