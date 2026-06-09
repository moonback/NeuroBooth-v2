import { Camera } from 'lucide-react';
import { haptics } from '../lib/haptics';

interface ScreensaverOverlayProps {
  eventName: string;
  eventLogo: string;
  onWake: () => void;
}

export function ScreensaverOverlay({ eventName, eventLogo, onWake }: ScreensaverOverlayProps) {
  const handleWake = () => {
    haptics.tap();
    onWake();
  };

  return (
    <button
      type="button"
      onClick={handleWake}
      className="screensaver-overlay fixed inset-0 z-40 flex flex-col items-center justify-center screen-layout--immersive"
      aria-label="Réveiller l'écran"
    >
      <div className="screensaver-overlay__glow" aria-hidden />

      <div className="relative z-10 flex flex-col items-center gap-8 px-8">
        <div className="screensaver-logo-wrap">
          {eventLogo ? (
            <img
              src={eventLogo}
              alt=""
              className="screensaver-logo w-44 h-44 object-contain drop-shadow-2xl"
            />
          ) : (
            <div className="screensaver-logo w-44 h-44 rounded-3xl theme-accent-bg flex items-center justify-center shadow-2xl">
              <Camera size={72} className="text-white" />
            </div>
          )}
          <div className="screensaver-logo-ring screensaver-logo-ring--1" />
          <div className="screensaver-logo-ring screensaver-logo-ring--2" />
        </div>

        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight preview-overlay-text screensaver-title">
            {eventName}
          </h1>
          <p className="text-white/40 text-sm mt-3 tracking-widest uppercase animate-screensaver-pulse">
            Touchez pour commencer
          </p>
        </div>
      </div>
    </button>
  );
}
