import React, { useRef } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing } from '../../types';
import {
  Upload,
  RotateCcw,
} from 'lucide-react';

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const THEMES: { value: AppTheme; label: string; color: string }[] = [
  { value: 'dark',    label: 'Sombre',   color: '#1e40af' },
  { value: 'neon',    label: 'Neon',     color: '#16a34a' },
  { value: 'elegant', label: 'Elegant',  color: '#92400e' },
  { value: 'party',   label: 'Party',    color: '#7c3aed' },
];

const QUALITIES: { value: VideoQuality; label: string }[] = [
  { value: 'low',    label: '480p — Economique' },
  { value: 'medium', label: '720p — Standard' },
  { value: 'high',   label: '1080p — Haute def.' },
  { value: '4k',     label: '4K — Maximale' },
];

export function SettingsPanel({ settings, updateSettings }: SettingsPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSettings({ eventLogo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8">
      {/* Event */}
      <section>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-4">Evenement</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Nom de l'evenement</label>
            <input
              type="text"
              value={settings.eventName}
              onChange={e => updateSettings({ eventName: e.target.value })}
              className="admin-input w-full"
              placeholder="Mon Evenement"
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Watermark (texte)</label>
            <input
              type="text"
              value={settings.watermarkText}
              onChange={e => updateSettings({ watermarkText: e.target.value })}
              className="admin-input w-full"
              placeholder="© Mon Evenement 2024"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white/70 text-sm">Afficher le watermark</label>
            <Toggle
              checked={settings.showWatermark}
              onChange={v => updateSettings({ showWatermark: v })}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {settings.eventLogo && (
                <img src={settings.eventLogo} alt="Logo" className="w-16 h-16 object-contain rounded-xl bg-white/5 border border-white/10 p-1" />
              )}
              <button onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-colors text-sm">
                <Upload size={16} /> {settings.eventLogo ? 'Changer' : 'Importer'}
              </button>
              {settings.eventLogo && (
                <button onClick={() => updateSettings({ eventLogo: '' })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:border-red-500/60 transition-colors text-sm">
                  <RotateCcw size={16} /> Supprimer
                </button>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </div>
        </div>
      </section>

      {/* Capture */}
      <section>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-4">Capture</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Duree d'enregistrement: <span className="text-white font-semibold">{settings.captureDuration}s</span>
            </label>
            <input type="range" min="3" max="60" value={settings.captureDuration}
              onChange={e => updateSettings({ captureDuration: +e.target.value })}
              className="admin-range w-full" />
            <div className="flex justify-between text-white/30 text-xs mt-1">
              <span>3s</span><span>30s</span><span>60s</span>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">
              Compte a rebours: <span className="text-white font-semibold">{settings.countdownDuration}s</span>
            </label>
            <input type="range" min="1" max="10" value={settings.countdownDuration}
              onChange={e => updateSettings({ countdownDuration: +e.target.value })}
              className="admin-range w-full" />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-3">Qualite video</label>
            <div className="grid grid-cols-2 gap-2">
              {QUALITIES.map(q => (
                <button key={q.value}
                  onClick={() => updateSettings({ videoQuality: q.value })}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                    settings.videoQuality === q.value
                      ? 'theme-accent-bg border-transparent text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                  }`}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Camera par defaut</label>
            <div className="flex gap-2">
              {(['environment', 'user'] as CameraFacing[]).map(f => (
                <button key={f}
                  onClick={() => updateSettings({ cameraFacing: f })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                    settings.cameraFacing === f
                      ? 'theme-accent-bg border-transparent text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}>
                  {f === 'environment' ? 'Arriere' : 'Avant (selfie)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-white/70 text-sm">Son actif</label>
            <Toggle checked={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />
          </div>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-4">Theme visuel</h3>
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(t => (
            <button key={t.value}
              onClick={() => updateSettings({ theme: t.value })}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                settings.theme === t.value
                  ? 'border-transparent text-white ring-2 ring-white/20'
                  : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
              }`}
              style={{ background: settings.theme === t.value ? t.color + '40' : undefined }}>
              <span className="w-4 h-4 rounded-full" style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Kiosk */}
      <section>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-4">Mode kiosque</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Activer le mode kiosque</p>
              <p className="text-white/30 text-xs">Protege le panneau admin par PIN</p>
            </div>
            <Toggle checked={settings.kioskMode} onChange={v => updateSettings({ kioskMode: v })} />
          </div>
          {settings.kioskMode && (
            <div>
              <label className="block text-white/70 text-sm mb-2">PIN admin (4 chiffres)</label>
              <input
                type="number"
                value={settings.kioskPin}
                onChange={e => updateSettings({ kioskPin: e.target.value.slice(0, 4) })}
                className="admin-input w-32"
                maxLength={4}
                placeholder="1234"
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${checked ? 'theme-accent-bg' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-6' : 'left-0.5'}`} />
    </button>
  );
}
