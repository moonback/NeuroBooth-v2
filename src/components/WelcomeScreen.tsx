import { useApp } from '../context/AppContext';
import {
  Camera,
  Wifi,
  WifiOff,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface WelcomeScreenProps {
  onAdmin: () => void;
}

export function WelcomeScreen({ onAdmin }: WelcomeScreenProps) {
  const { settings, startNewCapture, isOnline, attachStreamToVideo, currentCameraFacing } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tapCount, setTapCount] = useState(0);
  const [visualTaps, setVisualTaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapTimeRef = useRef(0);
  const tapIdRef = useRef(0);
  const GESTURE_TIMEOUT = 1000; // 1 second timeout between taps
  const REQUIRED_TAPS = 5;

  useEffect(() => {
    attachStreamToVideo(videoRef.current);
    return () => {
      attachStreamToVideo(null);
    };
  }, [attachStreamToVideo]);

  const handleSecretTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add visual feedback
    const id = tapIdRef.current++;
    setVisualTaps(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setVisualTaps(prev => prev.filter(t => t.id !== id));
    }, 600);

    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(20); // 20ms vibration
    }

    // Handle gesture logic
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;

    if (timeSinceLastTap > GESTURE_TIMEOUT) {
      setTapCount(1);
    } else {
      const newCount = tapCount + 1;
      setTapCount(newCount);
      if (newCount >= REQUIRED_TAPS) {
        // Stronger haptic feedback for success
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
        onAdmin();
        setTapCount(0);
      }
    }
  };

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
        {/* Secret gesture area */}
        <button
          onClick={handleSecretTap}
          className="p-3 rounded-full relative overflow-visible"
          aria-label="Secret gesture zone"
        >
          {/* Tap count indicator */}
          {tapCount > 0 && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20">
              {tapCount}/{REQUIRED_TAPS}
            </div>
          )}
          
          {/* Visual tap animations */}
          {visualTaps.map(tap => (
            <div
              key={tap.id}
              className="absolute w-10 h-10 rounded-full bg-white/40 pointer-events-none animate-ping"
              style={{
                left: tap.x - 20,
                top: tap.y - 20,
              }}
            />
          ))}
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
            NeuroBooth 360°
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
        NeuroBooth 360 &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
