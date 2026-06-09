import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Camera } from 'lucide-react';
import { haptics } from '../lib/haptics';

export function CountdownScreen() {
  const { settings, setScreen, requestGyroAccess, recalibrateGyro } = useApp();
  const [count, setCount] = useState(settings.countdownDuration);
  const audioRef = useRef<AudioContext | null>(null);
  const gyroReadyRef = useRef(false);

  useEffect(() => {
    if (!settings.gyroStabilizationEnabled || gyroReadyRef.current) return;
    gyroReadyRef.current = true;
    requestGyroAccess();
  }, [settings.gyroStabilizationEnabled, requestGyroAccess]);

  const playBeep = (freq: number, duration: number) => {
    if (!settings.soundEnabled) return;
    try {
      if (!audioRef.current) audioRef.current = new AudioContext();
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {}
  };

  useEffect(() => {
    if (count === 1 && settings.gyroStabilizationEnabled) {
      recalibrateGyro();
    }
    playBeep(440, 0.15);
    if (count === 0) {
      haptics.countdownGo();
      playBeep(880, 0.3);
      const t = setTimeout(() => setScreen('capture'), 300);
      return () => clearTimeout(t);
    }
    haptics.countdownTick();
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const progress = count === 0 ? 1 : 1 - (count / settings.countdownDuration);
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="theme-bg screen-layout flex flex-col items-center justify-center w-full gap-6 relative">
      {/* Anneaux décoratifs — contenus avec overflow-hidden sur le parent */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="absolute rounded-full border border-white/10"
          style={{ width: '70vmin', height: '70vmin' }}
        />
        <div
          className="absolute rounded-full border border-white/5"
          style={{ width: '90vmin', height: '90vmin' }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 text-center animate-bounce-in">
        <Camera size={28} className="text-white/30 mx-auto mb-3" />
        <p className="text-white/70 text-lg font-semibold tracking-wider uppercase leading-tight hud-text">
          Préparez-vous...
        </p>
      </div>

      {/* Cercle countdown — taille adaptative avec vmin */}
      <div
        className="relative z-10 flex-shrink-0"
        style={{ width: 'min(72vmin, 288px)', height: 'min(72vmin, 288px)' }}
      >
        {/* Lueur de fond */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />

        <svg
          className="absolute inset-0 -rotate-90 w-full h-full"
          viewBox="0 0 256 256"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="128" cy="128" r="90"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="10"
          />
          <circle
            cx="128" cy="128" r="90"
            fill="none"
            className="theme-accent-stroke"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.9s ease-out' }}
          />
        </svg>

        {/* Chiffre central — clamp pour s'adapter à toutes tailles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {count === 0 ? (
            <span
              className="font-black text-white animate-ping-once drop-shadow-lg"
              style={{ fontSize: 'clamp(3rem, 18vmin, 6rem)' }}
            >
              GO!
            </span>
          ) : (
            <span
              className="font-black text-white countdown-number drop-shadow-xl"
              style={{ fontSize: 'clamp(4.5rem, 22vmin, 9rem)' }}
            >
              {count}
            </span>
          )}
        </div>
      </div>

      {/* Sous-titre */}
      <div className="relative z-10 text-center px-6 animate-bounce-in">
        <p className="text-white/40 text-sm leading-snug">
          L'enregistrement commence automatiquement
        </p>
      </div>

      {/* Bouton annuler — zone de tap généreuse */}
      <button
        onClick={() => setScreen('welcome')}
        className="touch-target relative z-10 px-8 rounded-full border border-white/25 bg-white/5 text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 active:scale-95 transition-all duration-300 text-sm font-medium backdrop-blur-sm screen-action-zone"
      >
        Annuler
      </button>
    </div>
  );
}