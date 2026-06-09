import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, X, Eye, EyeOff } from 'lucide-react';
import { haptics } from '../lib/haptics';

interface PinModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PinModal({ onClose, onSuccess }: PinModalProps) {
  const { unlockAdmin } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockAdmin(pin)) {
      onSuccess();
    } else {
      haptics.error();
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1500);
    }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 8) setPin(p => p + d);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm screen-layout"
    >
      <div className={`relative w-full max-w-sm bg-[#1a1a1a] border rounded-3xl p-8 shadow-2xl transition-all ${
        error ? 'border-red-500/60 animate-shake' : 'border-white/10'
      }`}>
        <button onClick={onClose} className="touch-target absolute top-4 right-4 text-white/30 hover:text-white/70" aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock size={28} className="text-white/60" />
          </div>

          <div className="text-center">
            <h2 className="text-white text-xl font-bold">Acces admin</h2>
            <p className="text-white/40 text-sm mt-1">Entrez votre code PIN</p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value.slice(0, 8))}
                className={`w-full text-center text-2xl font-mono tracking-[0.5em] py-4 rounded-2xl bg-white/5 border text-white outline-none transition-colors ${
                  error ? 'border-red-500/60 text-red-400' : 'border-white/10 focus:border-white/30'
                }`}
                placeholder="••••"
                autoFocus
              />
              <button type="button" onClick={() => setShowPin(s => !s)}
                className="touch-target absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','',  '0','⌫'].map((d, i) => (
                d === '' ? <div key={i} /> :
                d === '⌫' ? (
                  <button key={i} type="button" onClick={() => setPin(p => p.slice(0,-1))}
                    className="touch-target rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-colors text-lg font-medium">
                    ⌫
                  </button>
                ) : (
                  <button key={i} type="button" onClick={() => handleDigit(d)}
                    className="touch-target rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors text-lg font-semibold">
                    {d}
                  </button>
                )
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center">Code incorrect</p>}

            <button type="submit"
              className="cta-button w-full rounded-2xl theme-accent-bg text-white font-bold text-lg hover:opacity-90 active:scale-95 transition-all">
              Confirmer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
