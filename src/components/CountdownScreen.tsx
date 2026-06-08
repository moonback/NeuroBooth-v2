import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';

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
    } catch {}
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
    <div className="theme-bg flex flex-col items-center justify-center min-h-screen w-full gap-8">
      <p className="text-white/60 text-xl tracking-widest uppercase">
        Préparez-vous...
      </p>

      <div className="relative w-64 h-64">
        <svg className="absolute inset-0 -rotate-90" width="256" height="256" viewBox="0 0 256 256">
          <circle cx="128" cy="128" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="128" cy="128" r="90"
            fill="none"
            className="theme-accent-stroke"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 0.9s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {count === 0 ? (
            <span className="text-8xl font-black text-white animate-ping-once">GO!</span>
          ) : (
            <span className="text-9xl font-black text-white countdown-number">{count}</span>
          )}
        </div>
      </div>

      <p className="text-white/40 text-sm">
        L'enregistrement commence automatiquement
      </p>

      <button
        onClick={() => setScreen('welcome')}
        className="mt-4 px-6 py-2 rounded-full border border-white/20 text-white/40 hover:text-white/70 hover:border-white/40 transition-colors text-sm"
      >
        Annuler
      </button>
    </div>
  );
}
