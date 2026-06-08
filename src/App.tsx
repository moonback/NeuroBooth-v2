import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CountdownScreen } from './components/CountdownScreen';
import { CaptureScreen } from './components/CaptureScreen';
import { PreviewScreen } from './components/PreviewScreen';
import { AdminPanel } from './components/AdminPanel';
import { PinModal } from './components/PinModal';

function AppInner() {
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
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
