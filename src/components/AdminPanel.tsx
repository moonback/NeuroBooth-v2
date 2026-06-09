import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SettingsPanel } from './admin/SettingsPanel';
import { GalleryPanel } from './admin/GalleryPanel';
import { StatsPanel } from './admin/StatsPanel';
import { MotorPanel } from './admin/MotorPanel';
import { DashboardPanel } from './admin/DashboardPanel';
import { AdminShell, AdminTab } from './admin/ui';

export function AdminPanel() {
  const {
    settings, updateSettings, resetSettings, setScreen, lockAdmin,
    isOnline, hasUltraWideSupport, uploadStates, captures,
  } = useApp();
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const badges = useMemo(() => {
    const b: Partial<Record<AdminTab, number>> = {};
    const errors = Object.values(uploadStates).filter(s => s.status === 'error').length;
    const pending = captures.filter(c => !c.uploadedToCloud && c.videoBlob).length;
    if (errors > 0) b.gallery = errors;
    else if (pending > 0) b.gallery = pending;
    return b;
  }, [uploadStates, captures]);

  const handleBack = () => {
    lockAdmin();
    setScreen('welcome');
  };

  return (
    <AdminShell
      activeTab={tab}
      onTabChange={setTab}
      onBack={handleBack}
      isOnline={isOnline}
      eventName={settings.eventName}
      badges={badges}
    >
      {tab === 'dashboard' && <DashboardPanel onNavigate={setTab} />}
      {tab === 'settings' && (
        <SettingsPanel
          settings={settings}
          updateSettings={updateSettings}
          resetSettings={resetSettings}
          hasUltraWideSupport={hasUltraWideSupport}
        />
      )}
      {tab === 'gallery' && <GalleryPanel />}
      {tab === 'stats' && <StatsPanel />}
      {tab === 'motor' && <MotorPanel settings={settings} updateSettings={updateSettings} />}
    </AdminShell>
  );
}
