import { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { useMobileEnv } from '../hooks/useMobileEnv';

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

  return (
    <>
      {children}
      {!isDesktop && isLandscape && <LandscapeBlocker />}
    </>
  );
}
