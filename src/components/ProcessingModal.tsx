import { useApp } from '../context/AppContext';
import { Loader, Sparkles } from 'lucide-react';

export function ProcessingModal() {
  const { isProcessing, processingProgress } = useApp();

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-white/15 to-white/5 border border-white/20 rounded-3xl p-10 max-w-sm w-full mx-6 text-center shadow-2xl">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-20 h-20 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Loader className="w-10 h-10 text-white animate-spin" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-300" />
          Traitement en cours...
        </h2>
        <p className="text-white/60 mb-8 text-sm leading-relaxed">
          Nous appliquons le ralenti à votre vidéo, ça ne prendra que quelques instants !
        </p>
        <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden mb-4 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_100%] animate-shimmer transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <span className="text-white font-mono text-2xl font-bold">
            {Math.round(processingProgress)}
          </span>
          <span className="text-white/40 text-xl">%</span>
        </div>
      </div>
    </div>
  );
}
