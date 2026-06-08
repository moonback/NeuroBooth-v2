import { useEffect, useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useCamera } from '../hooks/useCamera';
import { useMotor } from '../hooks/useMotor';
import { FlipHorizontal, Square, Mic, MicOff } from 'lucide-react';
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
    <div className="theme-bg relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
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
          <button onClick={() => setScreen('welcome')} className="btn-secondary">
            Retour
          </button>
        </div>
      )}

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        {/* Recording indicator */}
        {phase === 'recording' && (
          <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-semibold text-sm tracking-wide">REC</span>
          </div>
        )}
        {phase === 'starting' && (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white text-sm">Initialisation...</span>
          </div>
        )}
        {phase === 'stopping' && (
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-white text-sm">Traitement...</span>
          </div>
        )}

        <div className="flex items-center gap-3">
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
      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between z-10">
        <button
          onClick={() => setScreen('welcome')}
          className="px-5 py-2 rounded-full border border-white/30 text-white/60 hover:text-white hover:border-white/60 transition-colors text-sm backdrop-blur-sm"
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
          {camera.hasMultipleCameras && (
            <button
              onClick={camera.switchCamera}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all"
              aria-label="Changer de caméra"
            >
              <FlipHorizontal size={22} />
            </button>
          )}
          {phase === 'recording' && (
            <button
              onClick={handleStop}
              className="p-4 rounded-full bg-red-600/90 hover:bg-red-500 backdrop-blur-sm text-white transition-all hover:scale-105 active:scale-95"
              aria-label="Arrêter"
            >
              <Square size={22} fill="white" />
            </button>
          )}
        </div>
      </div>

      {/* 360 watermark overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <span className="text-white/10 text-6xl font-black tracking-widest">360°</span>
      </div>
    </div>
  );
}
