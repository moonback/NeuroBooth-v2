import { ReactNode } from 'react';
import { RotateCcw, Smartphone, Monitor } from 'lucide-react';
import { useMobileEnv } from '../hooks/useMobileEnv';

function DesktopBlocker() {
  return (
    <div className="fixed inset-0 z-[100] theme-bg flex flex-col items-center justify-center p-8 text-center screen-layout">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
        <Monitor size={40} className="text-white/40" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Mobile uniquement</h1>
      <p className="text-white/50 text-sm max-w-xs leading-relaxed">
        NeuroBooth 360 est conçu pour iPhone et Android.
        Ouvrez cette page sur votre smartphone en mode portrait.
      </p>
      <div className="mt-8 flex items-center gap-2 text-white/30 text-xs">
        <Smartphone size={14} />
        <span>iOS Safari 17+ · Chrome Android 120+</span>
      </div>
    </div>
  );
}

function LandscapeBlocker() {
  return (
    <div className="fixed inset-0 z-[90] theme-bg flex flex-col items-center justify-center p-8 text-center screen-layout">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 animate-float">
        <RotateCcw size={40} className="theme-accent-text" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Mode portrait requis</h1>
      <p className="text-white/50 text-sm max-w-xs leading-relaxed">
        Tournez votre téléphone en position verticale pour utiliser le photobooth.
      </p>
    </div>
  );
}

export function MobileGate({ children }: { children: ReactNode }) {
  const { isDesktop, isLandscape } = useMobileEnv();

  if (isDesktop) return <DesktopBlocker />;

  return (
    <>
      {children}
      {isLandscape && <LandscapeBlocker />}
    </>
  );
}
