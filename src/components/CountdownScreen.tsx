import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Camera, Timer } from 'lucide-react';

export function CountdownScreen() {
  const { settings, setScreen } = useApp();
  const [count, setCount] = useState(settings.countdownDuration);
  const audioRef = useRef<AudioContext | null>(null);

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
    } catch {
      return;
    }
  };

  useEffect(() => {
    playBeep(440, 0.15);
    if (count === 0) {
      playBeep(880, 0.3);
      const t = setTimeout(() => setScreen('capture'), 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count]);

  const progress = count === 0 ? 1 : 1 - (count / settings.countdownDuration);
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="theme-bg soft-grid mobile-safe relative flex min-h-[100dvh] w-full flex-col items-center justify-center gap-7 overflow-hidden">
      {/* Animated background rings - decorative */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="ring ring-1 opacity-30" />
        <div className="ring ring-2 opacity-20" />
      </div>

      <div className="relative z-10 text-center animate-bounce-in">
        <div className="glass-panel mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl">
          <Camera size={28} className="theme-accent-text" />
        </div>
        <p className="text-white/45 text-xs font-bold uppercase tracking-[0.35em]">Étape 1/3</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
          Préparez-vous
        </h2>
        <p className="mt-2 text-sm text-white/55">Regardez l'objectif, le départ est automatique.</p>
      </div>

      <div className="relative z-10 h-64 w-64 sm:h-72 sm:w-72">
        {/* Outer glow circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
        
        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
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
        
        <div className="absolute inset-0 flex items-center justify-center">
          {count === 0 ? (
            <span className="text-7xl font-black text-white animate-ping-once drop-shadow-lg sm:text-9xl">GO!</span>
          ) : (
            <span className="text-8xl font-black text-white countdown-number drop-shadow-xl sm:text-[10rem]">
              {count}
            </span>
          )}
        </div>
      </div>

      <div className="glass-panel relative z-10 flex items-center gap-3 rounded-2xl px-4 py-3 text-left animate-bounce-in">
        <Timer size={20} className="theme-accent-text shrink-0" />
        <p className="text-sm font-medium text-white/65">
          L'enregistrement commence automatiquement. Restez au centre du plateau.
        </p>
      </div>

      <button
        onClick={() => setScreen('welcome')}
        className="touch-target pressable relative z-10 mt-2 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white/60 backdrop-blur-sm hover:border-white/45 hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={17} />
        Annuler
      </button>
    </div>
  );
}
