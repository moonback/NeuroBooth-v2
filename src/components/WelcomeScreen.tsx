import { useApp } from '../context/AppContext';
import {
  Camera,
  Settings,
  Wifi,
  WifiOff,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

interface WelcomeScreenProps {
  onAdmin: () => void;
}

export function WelcomeScreen({ onAdmin }: WelcomeScreenProps) {
  const { settings, startNewCapture, isOnline, attachStreamToVideo, currentCameraFacing } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    attachStreamToVideo(videoRef.current);
    return () => {
      attachStreamToVideo(null);
    };
  }, [attachStreamToVideo]);

  return (
    <div className="welcome-screen theme-bg flex flex-col items-center justify-between min-h-screen w-full p-6 relative overflow-hidden">
      {/* Video preview background */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: currentCameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring ring-4" />
      </div>

      {/* Top bar */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          {isOnline
            ? <Wifi size={14} className="text-emerald-400" />
            : <WifiOff size={14} className="text-yellow-400" />}
          <span className={isOnline ? 'text-emerald-400' : 'text-yellow-400'}>
            {isOnline ? 'En ligne' : 'Hors ligne'}
          </span>
        </div>
        <button
          onClick={onAdmin}
          className="p-3 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
          aria-label="Panneau admin"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Center content */}
      <div className="flex flex-col items-center gap-10 z-10 flex-1 justify-center">
        {/* Logo */}
        <div className="relative animate-float">
          {settings.eventLogo ? (
            <div className="relative">
              <img
                src={settings.eventLogo}
                alt="Logo"
                className="w-36 h-36 object-contain rounded-3xl shadow-2xl"
              />
              <div className="absolute -inset-4 rounded-3xl border-2 theme-accent-border opacity-30" />
            </div>
          ) : (
            <div className="relative">
              <div className="w-36 h-36 rounded-3xl theme-accent-bg flex items-center justify-center shadow-2xl shadow-accent/40">
                <Camera size={64} className="text-white" />
              </div>
              <div className="absolute -inset-4 rounded-3xl border-2 theme-accent-border opacity-30" />
            </div>
          )}
        </div>

        {/* Event name */}
        <div className="text-center animate-bounce-in">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight mb-2">
            {settings.eventName}
          </h1>
          <p className="text-white/40 text-base tracking-widest uppercase flex items-center justify-center gap-2">
            <Zap size={16} className="text-yellow-400" />
            Photobooth 360°
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={startNewCapture}
          className="cta-button group relative mt-2 px-14 py-5 rounded-full text-xl font-bold text-white overflow-hidden transition-all duration-300 hover:scale-105 active:scale-[0.98] animate-bounce-in"
        >
          <span className="relative z-10 flex items-center gap-3">
            Commencer
            <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </span>
          <div className="cta-shine" />
        </button>

        <p className="text-white/30 text-sm animate-bounce-in">
          Appuyez pour lancer votre expérience 360°
        </p>
      </div>

      {/* Bottom */}
      <div className="z-10 text-white/15 text-xs">
        Photobooth 360 &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
