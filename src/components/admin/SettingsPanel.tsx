import React, { useRef } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing } from '../../types';
import { Upload, RotateCcw, Palette, Zap, Crown, Sparkles, Check, Calendar, Image as ImageIcon, Timer, Camera, Volume2, FastForward, Shield, Lock } from 'lucide-react';
import { Toggle, AdminInput, AdminButton } from './ui';

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
    <div className="space-y-6 w-full overflow-x-hidden">
      {/* Événement Section */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 sm:p-6 backdrop-blur-sm w-full overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl theme-accent-bg/10">
            <Calendar size={18} className="theme-accent-text" />
          </div>
          <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">Événement</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2">
              <span>Nom de l'événement</span>
            </label>
            <AdminInput
              type="text"
              value={settings.eventName}
              onChange={e => updateSettings({ eventName: e.target.value })}
              placeholder="Mon Événement"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2">
                <span>Watermark (texte)</span>
              </label>
              <AdminInput
                type="text"
                value={settings.watermarkText}
                onChange={e => updateSettings({ watermarkText: e.target.value })}
                placeholder="© Mon Événement 2024"
              />
            </div>
            <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <ImageIcon size={14} className="text-white/40" />
                </div>
                <label className="text-white/70 text-sm">Afficher le watermark</label>
              </div>
              <Toggle checked={settings.showWatermark} onChange={v => updateSettings({ showWatermark: v })} />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-3">
              <span>Logo</span>
            </label>
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative">
                  {settings.eventLogo ? (
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 p-1 overflow-hidden flex items-center justify-center">
                      <img
                        src={settings.eventLogo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 border-dashed flex items-center justify-center">
                      <Upload size={20} className="text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
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
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>
      </div>

      {/* Capture Section */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 sm:p-6 backdrop-blur-sm w-full overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl theme-accent-bg/10">
            <Camera size={18} className="theme-accent-text" />
          </div>
          <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">Capture</h3>
        </div>
        
        <div className="space-y-5">
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-3">
              <Timer size={14} className="text-white/40" />
              <span>Durée d'enregistrement</span>
              <span className="ml-auto theme-accent-text font-semibold">{settings.captureDuration}s</span>
            </label>
            <input
              type="range"
              min="3"
              max="60"
              value={settings.captureDuration}
              onChange={e => updateSettings({ captureDuration: +e.target.value })}
              className="admin-range w-full"
            />
            <div className="flex justify-between text-white/20 text-xs mt-1">
              <span>3s</span>
              <span>30s</span>
              <span>60s</span>
            </div>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-3">
              <Timer size={14} className="text-white/40" />
              <span>Compte à rebours</span>
              <span className="ml-auto theme-accent-text font-semibold">{settings.countdownDuration}s</span>
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
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-3">
              <span>Qualité vidéo</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {QUALITIES.map(q => (
                <button
                  key={q.value}
                  onClick={() => updateSettings({ videoQuality: q.value })}
                  className={`px-4 py-3.5 rounded-xl text-xs font-semibold transition-all border ${
                    settings.videoQuality === q.value
                      ? 'theme-accent-bg border-transparent text-white shadow-lg shadow-black/20'
                      : 'border-white/5 text-white/50 hover:border-white/20 hover:text-white/70 bg-white/[0.03]'
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-3">
              <span>Caméra par défaut</span>
            </label>
            <div className="flex gap-2">
              {(['environment', 'user'] as CameraFacing[]).map(f => (
                <button
                  key={f}
                  onClick={() => updateSettings({ cameraFacing: f })}
                  className={`flex-1 py-3.5 rounded-xl text-xs font-semibold transition-all border ${
                    settings.cameraFacing === f
                      ? 'theme-accent-bg border-transparent text-white shadow-lg shadow-black/20'
                      : 'border-white/5 text-white/50 hover:border-white/20 hover:text-white/70 bg-white/[0.03]'
                  }`}
                >
                  {f === 'environment' ? 'Arrière' : 'Avant (selfie)'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5">
                <Volume2 size={14} className="text-white/40" />
              </div>
              <label className="text-white/70 text-sm">Son actif</label>
            </div>
            <Toggle checked={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />
          </div>

          {/* Slow Motion */}
          <div className="mt-2 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/5">
                  <FastForward size={14} className="text-white/40" />
                </div>
                <div>
                  <p className="text-white/70 text-sm font-medium">Ralenti automatique</p>
                  <p className="text-white/30 text-xs">Ajoute un effet ralenti à la vidéo</p>
                </div>
              </div>
              <Toggle checked={settings.slowMotionEnabled} onChange={v => updateSettings({ slowMotionEnabled: v })} />
            </div>

            {settings.slowMotionEnabled && (
              <div className="space-y-4 pl-1">
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                  <label className="flex items-center justify-between text-white/60 text-xs font-medium mb-2">
                    <span>Vitesse ralenti</span>
                    <span className="text-white font-semibold">{Math.round(settings.slowMotionFactor * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={settings.slowMotionFactor * 100}
                    onChange={e => updateSettings({ slowMotionFactor: +e.target.value / 100 })}
                    className="admin-range w-full"
                  />
                </div>

                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                  <label className="flex items-center justify-between text-white/60 text-xs font-medium mb-2">
                    <span>Début ralenti</span>
                    <span className="text-white font-semibold">{settings.slowMotionStartPercent}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.slowMotionStartPercent}
                    onChange={e => updateSettings({ slowMotionStartPercent: +e.target.value })}
                    className="admin-range w-full"
                  />
                </div>

                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                  <label className="flex items-center justify-between text-white/60 text-xs font-medium mb-2">
                    <span>Durée ralenti</span>
                    <span className="text-white font-semibold">{settings.slowMotionDurationPercent}%</span>
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
        </div>
      </div>

      {/* Thème visuel Section */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 sm:p-6 backdrop-blur-sm w-full overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl theme-accent-bg/10">
            <Palette size={18} className="theme-accent-text" />
          </div>
          <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">Thème visuel</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden">
          {THEMES.map(t => (
            <button
              key={t.value}
              onClick={() => updateSettings({ theme: t.value })}
              className={`group relative flex flex-col items-start gap-3 p-3 sm:p-4 rounded-2xl border text-left transition-all w-full overflow-hidden ${
                settings.theme === t.value
                  ? 'border-white/20 ring-2 ring-white/10 shadow-xl shadow-black/30 bg-white/[0.05]'
                  : 'border-white/5 hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-full flex items-center justify-between min-w-0">
                <div 
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg min-w-0 flex-1"
                  style={{ 
                    backgroundColor: settings.theme === t.value ? t.color + '25' : 'rgba(255,255,255,0.05)',
                    color: settings.theme === t.value ? t.color : 'rgba(255,255,255,0.4)'
                  }}
                >
                  {t.icon}
                  <span className="text-xs font-bold truncate">{t.label}</span>
                </div>
                {settings.theme === t.value ? (
                  <div className="p-1.5 rounded-full shadow-lg flex-shrink-0" style={{ backgroundColor: t.color, boxShadow: `0 0 15px ${t.color}40` }}>
                    <Check size={12} className="text-white" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0" />
                )}
              </div>

              <p className={`text-xs leading-tight ${settings.theme === t.value ? 'text-white/60' : 'text-white/35'}`}>
                {t.description}
              </p>

              <div className="w-full h-2 rounded-full overflow-hidden flex gap-0.5">
                <div className="h-full flex-1 rounded-l-full" style={{ backgroundColor: t.color }} />
                <div className="h-full flex-1" style={{ backgroundColor: t.color, opacity: 0.6 }} />
                <div className="h-full flex-1 rounded-r-full" style={{ backgroundColor: t.color, opacity: 0.3 }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode kiosque Section */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 p-4 sm:p-6 backdrop-blur-sm w-full overflow-hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl theme-accent-bg/10">
            <Shield size={18} className="theme-accent-text" />
          </div>
          <h3 className="text-white/80 text-sm font-semibold uppercase tracking-wider">Mode kiosque</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/5">
                <Lock size={14} className="text-white/40" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium">Activer le mode kiosque</p>
                <p className="text-white/30 text-xs">Protège le panneau admin par PIN</p>
              </div>
            </div>
            <Toggle checked={settings.kioskMode} onChange={v => updateSettings({ kioskMode: v })} />
          </div>
          
          {settings.kioskMode && (
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
              <label className="flex items-center gap-2 text-white/60 text-xs font-medium mb-2">
                <span>PIN admin (4 chiffres)</span>
              </label>
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
        </div>
      </div>
    </div>
  );
}
