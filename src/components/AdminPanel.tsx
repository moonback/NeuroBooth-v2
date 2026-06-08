import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SettingsPanel } from './admin/SettingsPanel';
import { GalleryPanel } from './admin/GalleryPanel';
import { StatsPanel } from './admin/StatsPanel';
import { MotorPanel } from './admin/MotorPanel';
import { AdminHeader, AdminTabBar, AdminTab } from './admin/ui';

export function AdminPanel() {
  const { settings, updateSettings, setScreen, lockAdmin, isOnline } = useApp();
  const [tab, setTab] = useState<AdminTab>('settings');

  const handleBack = () => {
    lockAdmin();
    setScreen('welcome');
  };

  return (
    <div className="theme-bg soft-grid flex min-h-[100dvh] flex-col">
      <AdminHeader onBack={handleBack} isOnline={isOnline} />
      <AdminTabBar activeTab={tab} onTabChange={setTab} />
      <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-4 py-5 pb-8 sm:px-6 sm:py-6">
        {tab === 'settings' && <SettingsPanel settings={settings} updateSettings={updateSettings} />}
        {tab === 'gallery'  && <GalleryPanel />}
        {tab === 'stats'    && <StatsPanel />}
        {tab === 'motor'    && <MotorPanel settings={settings} updateSettings={updateSettings} />}
      </div>
    </div>
  );
}
