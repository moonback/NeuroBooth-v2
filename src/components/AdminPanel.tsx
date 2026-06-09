import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SettingsPanel } from './admin/SettingsPanel';
import { GalleryPanel } from './admin/GalleryPanel';
import { StatsPanel } from './admin/StatsPanel';
import { MotorPanel } from './admin/MotorPanel';
import { AdminHeader, AdminTabBar, AdminTab } from './admin/ui';

export function AdminPanel() {
  const { settings, updateSettings, resetSettings, setScreen, lockAdmin, isOnline, hasUltraWideSupport } = useApp();
  const [tab, setTab] = useState<AdminTab>('settings');

  const handleBack = () => {
    lockAdmin();
    setScreen('welcome');
  };

  return (
    <div className="theme-bg screen-layout flex flex-col !pb-0">
      <AdminHeader onBack={handleBack} isOnline={isOnline} />
      <AdminTabBar activeTab={tab} onTabChange={setTab} />
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full">
        {tab === 'settings' && (
          <SettingsPanel
            settings={settings}
            updateSettings={updateSettings}
            resetSettings={resetSettings}
            hasUltraWideSupport={hasUltraWideSupport}
          />
        )}
        {tab === 'gallery'  && <GalleryPanel />}
        {tab === 'stats'    && <StatsPanel />}
        {tab === 'motor'    && <MotorPanel settings={settings} updateSettings={updateSettings} />}
      </div>
    </div>
  );
}
