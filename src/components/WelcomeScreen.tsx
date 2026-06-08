import { useApp } from '../context/AppContext';
import {
  Camera,
  Settings,
  Wifi,
  WifiOff,
  ChevronRight,
} from 'lucide-react';

interface WelcomeScreenProps {
  onAdmin: () => void;
}

export function WelcomeScreen({ onAdmin }: WelcomeScreenProps) {
  const { settings, startNewCapture, isOnline } = useApp();

  return (
    <div className="welcome-screen theme-bg flex flex-col items-center justify-between min-h-screen w-full p-8 relative overflow-hidden">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring ring-4" />
      </div>

      {/* Top bar */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-sm">
          {isOnline
            ? <Wifi size={16} className="text-emerald-400" />
            : <WifiOff size={16} className="text-yellow-400" />}
          <span className={isOnline ? 'text-emerald-400' : 'text-yellow-400'}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        <button
          onClick={onAdmin}
          className="p-2 rounded-full text-white/30 hover:text-white/70 transition-colors"
          aria-label="Panneau admin"
        >
          <Settings size={22} />
        </button>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-8 z-10 flex-1 justify-center">
        {/* Logo */}
        <div className="relative">
          {settings.eventLogo ? (
            <img
              src={settings.eventLogo}
              alt="Logo"
              className="w-32 h-32 object-contain rounded-2xl shadow-2xl"
            />
          ) : (
            <div className="w-32 h-32 rounded-full theme-accent-bg flex items-center justify-center shadow-2xl shadow-accent/30">
              <Camera size={56} className="text-white" />
            </div>
          )}
          <div className="absolute -inset-2 rounded-full theme-accent-border border opacity-40 animate-pulse" />
        </div>

        {/* Event name */}
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white leading-none">
            {settings.eventName}
          </h1>
          <p className="mt-4 text-white/50 text-lg tracking-widest uppercase">
            Photobooth 360°
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={startNewCapture}
          className="cta-button group relative mt-4 px-16 py-6 rounded-full text-2xl font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <span className="relative z-10 flex items-center gap-3">
            Commencer
            <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="cta-shine" />
        </button>

        <p className="text-white/30 text-sm">
          Appuyez pour lancer votre expérience 360°
        </p>
      </div>

      {/* Bottom */}
      <div className="z-10 text-white/20 text-xs">
        Photobooth 360 &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
