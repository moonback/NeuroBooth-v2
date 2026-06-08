import { useApp } from '../context/AppContext';
import { Loader } from 'lucide-react';

export function ProcessingModal() {
  const { isProcessing, processingProgress } = useApp();

  if (!isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <Loader className="w-16 h-16 mx-auto text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Traitement en cours...
        </h2>
        <p className="text-white/70 mb-6">
          Nous appliquons le ralenti à votre vidéo, ça ne prendra que quelques instants !
        </p>
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${processingProgress}%` }}
          />
        </div>
        <p className="text-white/60 text-sm">
          {Math.round(processingProgress)}%
        </p>
      </div>
    </div>
  );
}
