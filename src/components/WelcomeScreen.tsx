import { useApp } from '../context/AppContext';
import {
  Camera,
  Settings,
  Wifi,
  WifiOff,
  ChevronRight,
  Zap,
  Sparkles,
  Timer,
  RotateCw,
} from 'lucide-react';

interface WelcomeScreenProps {
  onAdmin: () => void;
}

export function WelcomeScreen({ onAdmin }: WelcomeScreenProps) {
  const { settings, startNewCapture, isOnline } = useApp();

  const handleStart = () => {
    navigator.vibrate?.(35);
    startNewCapture();
  };

  return (
    <div className="welcome-screen theme-bg soft-grid flex min-h-[100dvh] w-full flex-col items-center justify-between overflow-hidden relative">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring ring-4" />
      </div>
      <div className="absolute -top-28 -right-24 h-72 w-72 rounded-full theme-accent-bg opacity-20 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white opacity-[0.06] blur-3xl" />

      {/* Top bar */}
      <div className="z-10 flex w-full items-center justify-between gap-3">
        <div className="status-pill border-white/10 bg-black/20 text-white/70 shadow-lg">
          {isOnline
            ? <Wifi size={15} className="text-emerald-400" />
            : <WifiOff size={15} className="text-yellow-400" />}
          <span>{isOnline ? 'Prêt à partager' : 'Mode hors ligne'}</span>
        </div>
        <button
          onClick={onAdmin}
          className="touch-target pressable grid place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/55 shadow-lg hover:bg-white/10 hover:text-white"
          aria-label="Panneau admin"
        >
          <Settings size={21} />
        </button>
      </div>

      {/* Center content */}
      <main className="z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 py-8 text-center sm:max-w-2xl">
        {/* Logo */}
        <div className="relative animate-float">
          {settings.eventLogo ? (
            <div className="relative">
              <img
                src={settings.eventLogo}
                alt="Logo"
                className="h-28 w-28 rounded-[2rem] object-contain shadow-2xl sm:h-36 sm:w-36"
              />
              <div className="absolute -inset-3 rounded-[2.25rem] border-2 theme-accent-border opacity-30" />
            </div>
          ) : (
            <div className="relative">
              <div className="grid h-28 w-28 place-items-center rounded-[2rem] theme-accent-bg shadow-2xl sm:h-36 sm:w-36">
                <Camera size={56} className="text-white sm:h-16 sm:w-16" />
              </div>
              <div className="absolute -inset-3 rounded-[2.25rem] border-2 theme-accent-border opacity-30" />
            </div>
          )}
        </div>

        {/* Event name */}
        <div className="animate-bounce-in space-y-3">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white/55">
            <Zap size={15} className="text-yellow-300" />
            Photobooth 360°
          </div>
          <h1 className="text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
            {settings.eventName}
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-white/55 sm:max-w-lg sm:text-base">
            Une expérience guidée en 3 étapes : préparez-vous, tournez, récupérez votre vidéo instantanément.
          </p>
        </div>

        {/* UX guide */}
        <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: <Timer size={17} />, label: 'Compte à rebours' },
            { icon: <RotateCw size={17} />, label: 'Capture 360°' },
            { icon: <Sparkles size={17} />, label: 'QR code' },
          ].map((step, index) => (
            <div key={step.label} className="glass-panel rounded-2xl p-3 text-center">
              <div className="mx-auto mb-2 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white">
                {step.icon}
              </div>
              <p className="text-[11px] font-semibold leading-tight text-white/65">
                {index + 1}. {step.label}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          className="cta-button touch-target pressable group relative mt-1 flex w-full items-center justify-center overflow-hidden rounded-[1.75rem] px-8 py-5 text-xl font-black text-white shadow-2xl sm:w-auto sm:px-16"
        >
          <span className="relative z-10 flex items-center gap-3">
            Commencer
            <ChevronRight size={25} className="transition-transform group-hover:translate-x-2" />
          </span>
          <div className="cta-shine" />
        </button>

        <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/30">
          Touchez pour lancer l'expérience
        </p>
      </main>

      {/* Bottom */}
      <div className="z-10 flex w-full items-center justify-center text-white/20 text-xs">
        Photobooth 360 &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
