import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SettingsPanel } from './admin/SettingsPanel';
import { GalleryPanel } from './admin/GalleryPanel';
import { StatsPanel } from './admin/StatsPanel';
import { MotorPanel } from './admin/MotorPanel';
import {
  Settings,
  Image,
  BarChart2,
  Cpu,
  X,
  Lock,
  ArrowLeft,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

type Tab = 'settings' | 'gallery' | 'stats' | 'motor';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'settings', label: 'Reglages',  icon: <Settings size={18} /> },
  { id: 'gallery',  label: 'Galerie',   icon: <Image size={18} /> },
  { id: 'stats',    label: 'Stats',     icon: <BarChart2 size={18} /> },
  { id: 'motor',    label: 'Plateau',   icon: <Cpu size={18} /> },
];

export function AdminPanel() {
  const { settings, updateSettings, setScreen, lockAdmin, isOnline } = useApp();
  const [tab, setTab] = useState<Tab>('settings');

  return (
    <div className="theme-bg min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { lockAdmin(); setScreen('welcome'); }}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Accueil</span>
          </button>
          <span className="text-white/20">/</span>
          <h1 className="text-white font-bold">Panneau Admin</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Cloud status */}
          {isSupabaseConfigured ? (
            <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <Cloud size={12} /> Cloud actif
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-white/30 text-xs">
              <CloudOff size={12} /> Local seulement
            </span>
          )}
          {/* Network */}
          {isOnline
            ? <Wifi size={16} className="text-emerald-400" />
            : <WifiOff size={16} className="text-yellow-400" />}

          <button
            onClick={() => { lockAdmin(); setScreen('welcome'); }}
            className="p-2 rounded-full text-white/30 hover:text-white/70 transition-colors"
          >
            <Lock size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? 'theme-accent-bg text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-4xl mx-auto w-full">
        {tab === 'settings' && <SettingsPanel settings={settings} updateSettings={updateSettings} />}
        {tab === 'gallery'  && <GalleryPanel />}
        {tab === 'stats'    && <StatsPanel />}
        {tab === 'motor'    && <MotorPanel settings={settings} updateSettings={updateSettings} />}
      </div>
    </div>
  );
}
