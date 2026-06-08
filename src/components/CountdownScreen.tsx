import { useEffect, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Camera } from 'lucide-react';

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
    <div className="theme-bg flex flex-col items-center justify-center min-h-screen w-full gap-10 p-6">
      {/* Animated background rings - decorative */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="ring ring-1 opacity-30" />
        <div className="ring ring-2 opacity-20" />
      </div>

      <div className="relative z-10 text-center animate-bounce-in">
        <Camera size={32} className="text-white/30 mx-auto mb-4" />
        <p className="text-white/70 text-2xl font-semibold tracking-wider uppercase">
          Préparez-vous...
        </p>
      </div>

      <div className="relative z-10 w-72 h-72">
        {/* Outer glow circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" />
        
        <svg className="absolute inset-0 -rotate-90" width="288" height="288" viewBox="0 0 256 256">
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
            <span className="text-9xl font-black text-white animate-ping-once drop-shadow-lg">GO!</span>
          ) : (
            <span className="text-[10rem] font-black text-white countdown-number drop-shadow-xl">
              {count}
            </span>
          )}
        </div>
      </div>

      <div className="relative z-10 text-center animate-bounce-in">
        <p className="text-white/40 text-base">
          L'enregistrement commence automatiquement
        </p>
      </div>

      <button
        onClick={() => setScreen('welcome')}
        className="relative z-10 mt-2 px-8 py-3 rounded-full border border-white/25 bg-white/5 text-white/50 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all duration-300 text-sm font-medium backdrop-blur-sm"
      >
        Annuler
      </button>
    </div>
  );
}
