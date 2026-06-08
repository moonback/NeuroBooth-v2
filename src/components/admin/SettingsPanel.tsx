import React, { useRef } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing } from '../../types';
import { Upload, RotateCcw, Palette, Zap, Crown, Sparkles, Check } from 'lucide-react';
import { Toggle, AdminSection, AdminInput, AdminButton } from './ui';

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const THEMES: { 
  value: AppTheme; 
  label: string; 
  color: string; 
  icon: React.ReactNode;
  description: string;
}[] = [
  { value: 'dark',    label: 'Sombre',   color: '#1e40af', icon: <Palette size={18} />, description: "Thème minimaliste et professionnel" },
  { value: 'neon',    label: 'Neon',     color: '#16a34a', icon: <Zap size={18} />, description: "Futuriste avec des tons verts" },
  { value: 'elegant', label: 'Elegant',  color: '#92400e', icon: <Crown size={18} />, description: "Luxueux avec accents dorés" },
  { value: 'party',   label: 'Party',    color: '#7c3aed', icon: <Sparkles size={18} />, description: "Fun avec un dégradé animé" },
];

const QUALITIES: { value: VideoQuality; label: string }[] = [
  { value: 'low',    label: '480p — Économique' },
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
      <AdminSection title="Événement">
        <div>
          <label className="block text-white/70 text-sm mb-2">Nom de l'événement</label>
          <AdminInput
            type="text"
            value={settings.eventName}
            onChange={e => updateSettings({ eventName: e.target.value })}
            placeholder="Mon Événement"
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Watermark (texte)</label>
          <AdminInput
            type="text"
            value={settings.watermarkText}
            onChange={e => updateSettings({ watermarkText: e.target.value })}
            placeholder="© Mon Événement 2024"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-white/70 text-sm">Afficher le watermark</label>
          <Toggle checked={settings.showWatermark} onChange={v => updateSettings({ showWatermark: v })} />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Logo</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {settings.eventLogo && (
              <img
                src={settings.eventLogo}
                alt="Logo"
                className="w-16 h-16 object-contain rounded-xl bg-white/5 border border-white/10 p-1"
              />
            )}
            <div className="flex gap-3 flex-wrap">
              <AdminButton onClick={() => logoInputRef.current?.click()}>
                <Upload size={16} />
                {settings.eventLogo ? 'Changer' : 'Importer'}
              </AdminButton>
              {settings.eventLogo && (
                <AdminButton variant="danger" onClick={() => updateSettings({ eventLogo: '' })}>
                  <RotateCcw size={16} />
                  Supprimer
                </AdminButton>
              )}
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </AdminSection>

      <AdminSection title="Capture">
        <div>
          <label className="block text-white/70 text-sm mb-2">
            Durée d'enregistrement: <span className="text-white font-semibold">{settings.captureDuration}s</span>
          </label>
          <input
            type="range"
            min="3"
            max="60"
            value={settings.captureDuration}
            onChange={e => updateSettings({ captureDuration: +e.target.value })}
            className="admin-range w-full"
          />
          <div className="flex justify-between text-white/30 text-xs mt-1">
            <span>3s</span>
            <span>30s</span>
            <span>60s</span>
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">
            Compte à rebours: <span className="text-white font-semibold">{settings.countdownDuration}s</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={settings.countdownDuration}
            onChange={e => updateSettings({ countdownDuration: +e.target.value })}
            className="admin-range w-full"
          />
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-3">Qualité vidéo</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUALITIES.map(q => (
              <button
                key={q.value}
                onClick={() => updateSettings({ videoQuality: q.value })}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  settings.videoQuality === q.value
                    ? 'theme-accent-bg border-transparent text-white'
                    : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white/80'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-white/70 text-sm mb-2">Caméra par défaut</label>
          <div className="flex gap-2">
            {(['environment', 'user'] as CameraFacing[]).map(f => (
              <button
                key={f}
                onClick={() => updateSettings({ cameraFacing: f })}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                  settings.cameraFacing === f
                    ? 'theme-accent-bg border-transparent text-white'
                    : 'border-white/10 text-white/50 hover:border-white/30'
                }`}
              >
                {f === 'environment' ? 'Arrière' : 'Avant (selfie)'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-white/70 text-sm">Son actif</label>
          <Toggle checked={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm">Ralenti automatique</p>
              <p className="text-white/30 text-xs">Ajoute un effet ralenti à la vidéo</p>
            </div>
            <Toggle checked={settings.slowMotionEnabled} onChange={v => updateSettings({ slowMotionEnabled: v })} />
          </div>

          {settings.slowMotionEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Vitesse ralenti: <span className="text-white font-semibold">{Math.round(settings.slowMotionFactor * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.slowMotionFactor * 100}
                  onChange={e => updateSettings({ slowMotionFactor: +e.target.value / 100 })}
                  className="admin-range w-full"
                />
                <div className="flex justify-between text-white/30 text-xs mt-1">
                  <span>10%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Début ralenti: <span className="text-white font-semibold">{settings.slowMotionStartPercent}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.slowMotionStartPercent}
                  onChange={e => updateSettings({ slowMotionStartPercent: +e.target.value })}
                  className="admin-range w-full"
                />
                <div className="flex justify-between text-white/30 text-xs mt-1">
                  <span>Début</span><span>Milieu</span><span>Fin</span>
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">
                  Durée ralenti: <span className="text-white font-semibold">{settings.slowMotionDurationPercent}%</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.slowMotionDurationPercent}
                  onChange={e => updateSettings({ slowMotionDurationPercent: +e.target.value })}
                  className="admin-range w-full"
                />
              </div>
            </div>
          )}
        </div>
      </AdminSection>

      <AdminSection title="Thème visuel">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => updateSettings({ theme: t.value })}
              className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border text-left transition-all ${
                settings.theme === t.value
                  ? 'border-white/30 ring-2 ring-white/15 shadow-lg shadow-black/20'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              {/* Top Bar Preview */}
              <div className="w-full flex items-center justify-between">
                <div 
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ 
                    backgroundColor: settings.theme === t.value ? t.color + '20' : 'rgba(255,255,255,0.05)',
                    color: settings.theme === t.value ? 'white' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  {t.icon}
                  <span className="text-sm font-semibold">{t.label}</span>
                </div>
                {settings.theme === t.value ? (
                  <div className="p-1.5 rounded-full" style={{ backgroundColor: t.color }}>
                    <Check size={14} className="text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border border-white/10" />
                )}
              </div>

              {/* Description */}
              <p className={`text-xs ${settings.theme === t.value ? 'text-white/70' : 'text-white/40'}`}>
                {t.description}
              </p>

              {/* Color Preview */}
              <div className="w-full h-1.5 rounded-full overflow-hidden flex">
                <div className="h-full w-1/3" style={{ backgroundColor: t.color }} />
                <div className="h-full w-1/3" style={{ backgroundColor: t.color, opacity: 0.6 }} />
                <div className="h-full w-1/3" style={{ backgroundColor: t.color, opacity: 0.3 }} />
              </div>
            </button>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Mode kiosque">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Activer le mode kiosque</p>
            <p className="text-white/30 text-xs">Protège le panneau admin par PIN</p>
          </div>
          <Toggle checked={settings.kioskMode} onChange={v => updateSettings({ kioskMode: v })} />
        </div>
        {settings.kioskMode && (
          <div>
            <label className="block text-white/70 text-sm mb-2">PIN admin (4 chiffres)</label>
            <AdminInput
              type="number"
              value={settings.kioskPin}
              onChange={e => updateSettings({ kioskPin: e.target.value.slice(0, 4) })}
              className="w-32"
              maxLength={4}
              placeholder="1234"
            />
          </div>
        )}
      </AdminSection>
    </div>
  );
}
