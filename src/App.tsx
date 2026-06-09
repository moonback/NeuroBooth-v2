import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { AdminPanel } from './components/AdminPanel';
import { PinModal } from './components/PinModal';
import { ProcessingModal } from './components/ProcessingModal';
import { Download } from 'lucide-react';

function AppInner({ showInstallPrompt, onInstall }: { showInstallPrompt: boolean; onInstall: () => void }) {
  const { screen, setScreen, settings, adminUnlocked } = useApp();
  const [showPin, setShowPin] = useState(false);

  // Intercept admin navigation to enforce kiosk PIN
  const guardedSetScreen = (s: typeof screen) => {
    if (s === 'admin' && settings.kioskMode && !adminUnlocked) {
      setShowPin(true);
    } else {
      setScreen(s);
    }
  };

  // Inject the guarded setter into context via a wrapper approach
  // by passing it down as a callback where needed (WelcomeScreen uses useApp internally)
  // We patch the screen flow at the WelcomeScreen level via AdminPanel
  return (
    <div className={`app-root theme-${settings.theme}`}>
      {screen === 'welcome'   && <WelcomeScreen onAdmin={() => guardedSetScreen('admin')} />}
      {screen === 'countdown' && <CountdownScreen />}
      {screen === 'capture'   && <CaptureScreen />}
      {screen === 'preview'   && <PreviewScreen />}
      {screen === 'admin'     && <AdminPanel />}

      {showPin && (
        <PinModal
          onClose={() => setShowPin(false)}
          onSuccess={() => { setShowPin(false); setScreen('admin'); }}
        />
      )}
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-bounce-in">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Download size={20} className="text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">Installer NeuroBooth</p>
            <p className="text-white/60 text-xs">Accès hors ligne et plein écran</p>
          </div>
          <button 
            onClick={onInstall}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm transition-colors"
          >
            Installer
          </button>
        </div>
      )}
      
      <ProcessingModal />
    </div>
  );
}

export default function App({ showInstallPrompt, onInstall }: { showInstallPrompt: boolean; onInstall: () => void }) {
  return (
    <AppProvider>
      <AppInner showInstallPrompt={showInstallPrompt} onInstall={onInstall} />
    </AppProvider>
  );
}
