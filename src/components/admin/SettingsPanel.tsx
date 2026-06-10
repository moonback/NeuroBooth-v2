import React, { useRef, useState } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing, DisplayFont } from '../../types';
import {
  Upload, RotateCcw, Palette, Zap, Crown, Sparkles, Check,
  Calendar, Image as ImageIcon, Camera, Volume2,
  FastForward, Shield, Lock, Maximize2, Crosshair, Brush, Type, Moon, Monitor,
} from 'lucide-react';
import { hexToRgba } from '../../lib/brandTheme';
import {
  ADMIN, AdminCard, SectionHeader, SliderRow, ToggleRow,
  AdminInput, AdminButton,
} from './ui';

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  hasUltraWideSupport?: boolean;
}

type SettingsCategory = 'event' | 'capture' | 'audio' | 'appearance' | 'security';

const CATEGORIES: { id: SettingsCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'event',      label: 'Événement',  icon: <Calendar size={14} /> },
  { id: 'capture',    label: 'Capture',    icon: <Camera size={14} /> },
  { id: 'audio',      label: 'Audio',      icon: <Volume2 size={14} /> },
  { id: 'appearance', label: 'Apparence',  icon: <Palette size={14} /> },
  { id: 'security',   label: 'Sécurité',   icon: <Shield size={14} /> },
];

const THEMES: {
  value: AppTheme;
  label: string;
  accent: string;
  glow: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { value: 'dark', label: 'Sombre', accent: '#3b82f6', glow: 'rgba(59,130,246,0.15)', icon: <Palette size={15} />, description: 'Minimaliste & professionnel' },
  { value: 'desktop', label: 'Desktop', accent: '#38bdf8', glow: 'rgba(56,189,248,0.15)', icon: <Monitor size={15} />, description: 'Interface grand écran / web' },
  { value: 'neon', label: 'Neon', accent: '#22c55e', glow: 'rgba(34,197,94,0.15)', icon: <Zap size={15} />, description: 'Futuriste, tons verts' },
  { value: 'elegant', label: 'Élégant', accent: '#f5c842', glow: 'rgba(245,200,66,0.15)', icon: <Crown size={15} />, description: 'Luxueux, accents dorés' },
  { value: 'party', label: 'Party', accent: '#a855f7', glow: 'rgba(168,85,247,0.15)', icon: <Sparkles size={15} />, description: 'Fun, dégradé animé' },
];

const DISPLAY_FONTS: { value: DisplayFont; label: string; sample: string }[] = [
  { value: 'clash', label: 'Clash Display', sample: 'Premium & impactant' },
  { value: 'satoshi', label: 'Satoshi', sample: 'Moderne & géométrique' },
  { value: 'inter', label: 'Inter', sample: 'Neutre & lisible' },
];

const QUALITIES: { value: VideoQuality; label: string; sub: string }[] = [
  { value: 'low', label: '480p', sub: 'Économique' },
  { value: 'medium', label: '720p', sub: 'Standard' },
  { value: 'high', label: '1080p', sub: 'Haute def.' },
  { value: '4k', label: '4K', sub: 'Maximale' },
];

export function SettingsPanel({ settings, updateSettings, resetSettings, hasUltraWideSupport = true }: SettingsPanelProps) {
  const [category, setCategory] = useState<SettingsCategory>('event');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateSettings({ eventLogo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Category pills */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`touch-target flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              category === cat.id
                ? 'theme-accent-bg border-transparent text-white'
                : 'border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Événement ── */}
      {category === 'event' && (
        <AdminCard glow="radial-gradient(ellipse at top left, rgba(245,200,66,0.04), transparent 60%)">
          <SectionHeader icon={<Calendar size={15} className="text-amber-400/70" />} title="Événement" />
          <div className="space-y-4">
            <div>
              <p className={ADMIN.label}>Nom de l'événement</p>
              <AdminInput
                type="text"
                value={settings.eventName}
                onChange={e => updateSettings({ eventName: e.target.value })}
                placeholder="Mon Événement"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className={ADMIN.label}>Watermark texte</p>
                <AdminInput
                  type="text"
                  value={settings.watermarkText}
                  onChange={e => updateSettings({ watermarkText: e.target.value })}
                  placeholder="© Mon Événement 2026"
                />
              </div>
              <ToggleRow
                icon={<ImageIcon size={14} />}
                title="Afficher watermark"
                sub="Aperçu live ; texte incrusté dans l'export"
                checked={settings.showWatermark}
                onChange={v => updateSettings({ showWatermark: v })}
              />
            </div>
            <div>
              <p className={ADMIN.label}>Logo</p>
              <div className="flex items-center gap-4 bg-white/[0.025] rounded-xl p-4 border border-white/[0.05]">
                {settings.eventLogo ? (
                  <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={settings.eventLogo} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center shrink-0">
                    <Upload size={18} className="text-white/15" />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <AdminButton onClick={() => logoInputRef.current?.click()}>
                    <Upload size={14} />
                    {settings.eventLogo ? 'Changer' : 'Importer'}
                  </AdminButton>
                  {settings.eventLogo && (
                    <AdminButton variant="danger" onClick={() => updateSettings({ eventLogo: '' })}>
                      <RotateCcw size={14} /> Supprimer
                    </AdminButton>
                  )}
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>
        </AdminCard>
      )}

      {/* ── Capture ── */}
      {category === 'capture' && (
        <div className="space-y-4">
          <AdminCard glow="radial-gradient(ellipse at top right, rgba(99,102,241,0.05), transparent 60%)">
            <SectionHeader icon={<Camera size={15} className="text-indigo-400/70" />} title="Enregistrement" />
            <div className="space-y-3">
              <SliderRow label="Durée d'enregistrement" value={settings.captureDuration} display={`${settings.captureDuration}s`} min={3} max={60} onChange={v => updateSettings({ captureDuration: v })} />
              <SliderRow label="Compte à rebours" value={settings.countdownDuration} display={`${settings.countdownDuration}s`} min={1} max={10} onChange={v => updateSettings({ countdownDuration: v })} />
              <div>
                <p className={ADMIN.label}>Qualité vidéo</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUALITIES.map(q => {
                    const active = settings.videoQuality === q.value;
                    return (
                      <button
                        key={q.value}
                        onClick={() => updateSettings({ videoQuality: q.value })}
                        className={`flex flex-col items-center gap-0.5 py-3 rounded-xl text-center transition-all border ${
                          active ? 'bg-amber-400/10 border-amber-400/30 shadow-[0_0_20px_rgba(245,200,66,0.08)]' : 'border-white/[0.05] hover:border-white/15 bg-white/[0.025]'
                        }`}
                      >
                        <span className={`text-sm font-bold ${active ? 'text-amber-400' : 'text-white/50'}`}>{q.label}</span>
                        <span className={`text-[10px] ${active ? 'text-amber-400/60' : 'text-white/25'}`}>{q.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className={ADMIN.label}>Caméra par défaut</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['environment', 'user'] as CameraFacing[]).map(f => {
                    const active = settings.cameraFacing === f;
                    return (
                      <button
                        key={f}
                        onClick={() => updateSettings({ cameraFacing: f })}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all border ${
                          active ? 'bg-amber-400/10 border-amber-400/30 text-amber-400' : 'border-white/[0.05] text-white/40 hover:border-white/15 bg-white/[0.025]'
                        }`}
                      >
                        {f === 'environment' ? 'Arrière' : 'Avant (selfie)'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHeader icon={<Crosshair size={15} className="text-cyan-400/70" />} title="Stabilisation & objectif" />
            <div className="space-y-3">
              <ToggleRow icon={<Maximize2 size={14} />} title="Ultra grand-angle (0.5x)" sub={hasUltraWideSupport ? 'Objectif wide natif' : 'Non détecté sur cet appareil'} checked={settings.ultraWideEnabled} onChange={v => updateSettings({ ultraWideEnabled: v })} />
              <ToggleRow icon={<Lock size={14} />} title="Verrouillage AF/AE" sub="Bloque focus et exposition avant rotation" checked={settings.lockAfAeEnabled} onChange={v => updateSettings({ lockAfAeEnabled: v })} />
              <ToggleRow icon={<Crosshair size={14} />} title="Stabilisation gyroscopique (EIS)" sub="Compense les vibrations du bras 360" checked={settings.gyroStabilizationEnabled} onChange={v => updateSettings({ gyroStabilizationEnabled: v })} />
              {settings.gyroStabilizationEnabled && (
                <SliderRow label="Intensité EIS" value={Math.round(settings.gyroStabilizationStrength * 100)} display={`${Math.round(settings.gyroStabilizationStrength * 100)}%`} min={30} max={100} step={5} onChange={v => updateSettings({ gyroStabilizationStrength: v / 100 })} />
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHeader icon={<FastForward size={15} className="text-indigo-400/70" />} title="Effet ralenti" />
            <div className="space-y-3">
              <ToggleRow icon={<FastForward size={14} />} title="Ralenti automatique" sub="Ajoute un effet ralenti à la vidéo exportée" checked={settings.slowMotionEnabled} onChange={v => updateSettings({ slowMotionEnabled: v })} />
              {settings.slowMotionEnabled && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Subtil', speed: 0.8, start: 0, duration: 100 },
                      { label: 'Épique', speed: 0.5, start: 25, duration: 50 },
                      { label: 'Matrix', speed: 0.25, start: 40, duration: 20 },
                      { label: 'Action', speed: 0.4, start: 60, duration: 40 },
                    ].map(preset => {
                      const isActive = settings.slowMotionFactor === preset.speed && settings.slowMotionStartPercent === preset.start && settings.slowMotionDurationPercent === preset.duration;
                      return (
                        <button
                          key={preset.label}
                          onClick={() => updateSettings({ slowMotionFactor: preset.speed, slowMotionStartPercent: preset.start, slowMotionDurationPercent: preset.duration })}
                          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${isActive ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-white/[0.03] text-white/60 border-white/[0.05]'}`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  <SliderRow label="Vitesse du ralenti" value={settings.slowMotionFactor * 100} display={`${Math.round(settings.slowMotionFactor * 100)}%`} min={10} max={100} step={5} onChange={v => updateSettings({ slowMotionFactor: v / 100 })} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SliderRow label="Début de l'effet" value={settings.slowMotionStartPercent} display={`${settings.slowMotionStartPercent}%`} min={0} max={100} step={5} onChange={v => updateSettings({ slowMotionStartPercent: v })} />
                    <SliderRow label="Durée de l'effet" value={settings.slowMotionDurationPercent} display={`${settings.slowMotionDurationPercent}%`} min={10} max={100} step={5} onChange={v => updateSettings({ slowMotionDurationPercent: v })} />
                  </div>
                </>
              )}
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Audio ── */}
      {category === 'audio' && (
        <div className="space-y-4">
          <AdminCard glow="radial-gradient(ellipse at top left, rgba(34,197,94,0.04), transparent 60%)">
            <SectionHeader icon={<Volume2 size={15} className="text-emerald-400/70" />} title="Son de la borne" />
            <div className="space-y-3">
              <ToggleRow icon={<Volume2 size={14} />} title="Sons interface" sub="Bips et retours audio pendant la session" checked={settings.soundEnabled} onChange={v => updateSettings({ soundEnabled: v })} />
              <SliderRow label="Volume micro" value={settings.micVolume} display={`${settings.micVolume}%`} min={0} max={100} step={5} onChange={v => updateSettings({ micVolume: v })} />
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Apparence ── */}
      {category === 'appearance' && (
        <div className="space-y-4">
          <AdminCard glow="radial-gradient(ellipse at bottom left, rgba(168,85,247,0.04), transparent 60%)">
            <SectionHeader icon={<Palette size={15} className="text-purple-400/70" />} title="Thème visuel" />
            <div className="grid grid-cols-2 gap-2">
              {[
                ...THEMES,
                { value: 'brand' as AppTheme, label: 'Brand', accent: settings.brandAccentColor, glow: hexToRgba(settings.brandAccentColor, 0.15), icon: <Brush size={15} />, description: 'White-label événementiel' },
              ].map(t => {
                const active = settings.theme === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => updateSettings({ theme: t.value })}
                    className={`relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all overflow-hidden ${active ? 'border-white/15 bg-white/[0.04]' : 'border-white/[0.05] bg-white/[0.02]'}`}
                    style={active ? { boxShadow: `0 0 30px ${t.glow}` } : {}}
                  >
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: active ? t.accent + '20' : 'rgba(255,255,255,0.04)', color: active ? t.accent : 'rgba(255,255,255,0.3)' }}>
                        {t.icon}
                        <span className="text-[11px] font-bold">{t.label}</span>
                      </div>
                      {active && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: t.accent }}><Check size={10} className="text-white" /></div>}
                    </div>
                    <p className={`text-[11px] ${active ? 'text-white/50' : 'text-white/25'}`}>{t.description}</p>
                  </button>
                );
              })}
            </div>
            {settings.theme === 'brand' && (
              <div className="mt-5 pt-5 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-2 bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]">
                  <span className="text-white/50 text-xs">Couleur accent</span>
                  <input type="color" value={settings.brandAccentColor} onChange={e => updateSettings({ brandAccentColor: e.target.value })} className="w-12 h-12 rounded-lg border-0 bg-transparent cursor-pointer" />
                </label>
                <label className="flex flex-col gap-2 bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]">
                  <span className="text-white/50 text-xs">Fond</span>
                  <input type="color" value={settings.brandBgColor} onChange={e => updateSettings({ brandBgColor: e.target.value })} className="w-12 h-12 rounded-lg border-0 bg-transparent cursor-pointer" />
                </label>
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <SectionHeader icon={<Type size={15} className="text-white/40" />} title="Typographie & veille" />
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                {DISPLAY_FONTS.map(f => {
                  const active = settings.displayFont === f.value;
                  return (
                    <button key={f.value} onClick={() => updateSettings({ displayFont: f.value })} className={`touch-target flex items-center justify-between px-4 py-3 rounded-xl border text-left ${active ? 'border-white/15 bg-white/[0.04]' : 'border-white/[0.05] bg-white/[0.02]'}`}>
                      <div>
                        <span className="text-white/80 text-sm font-medium block">{f.label}</span>
                        <span className="text-white/30 text-[11px]">{f.sample}</span>
                      </div>
                      {active && <Check size={16} className="theme-accent-text" />}
                    </button>
                  );
                })}
              </div>
              <div className={ADMIN.divider} />
              <ToggleRow icon={<Moon size={14} />} title="Écran veille" sub="Preview floutée + logo animé entre les sessions" checked={settings.screensaverEnabled} onChange={v => updateSettings({ screensaverEnabled: v })} />
              {settings.screensaverEnabled && (
                <SliderRow label="Délai d'inactivité" value={settings.screensaverDelaySeconds} display={`${settings.screensaverDelaySeconds}s`} min={15} max={180} step={15} onChange={v => updateSettings({ screensaverDelaySeconds: v })} />
              )}
            </div>
          </AdminCard>
        </div>
      )}

      {/* ── Sécurité ── */}
      {category === 'security' && (
        <div className="space-y-4">
          <AdminCard glow="radial-gradient(ellipse at bottom right, rgba(239,68,68,0.04), transparent 60%)">
            <SectionHeader icon={<Shield size={15} className="text-red-400/60" />} title="Mode kiosque" />
            <div className="space-y-3">
              <ToggleRow icon={<Lock size={14} />} title="Activer le mode kiosque" sub="Protège le panneau admin par PIN" checked={settings.kioskMode} onChange={v => updateSettings({ kioskMode: v })} />
              {settings.kioskMode && (
                <div className="pl-3 border-l-2 border-white/[0.06]">
                  <p className={ADMIN.label}>PIN admin (4 chiffres)</p>
                  <AdminInput type="number" value={settings.kioskPin} onChange={e => updateSettings({ kioskPin: e.target.value.slice(0, 4) })} className="w-32" maxLength={4} placeholder="1234" />
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <SectionHeader icon={<RotateCcw size={15} className="text-red-400/60" />} title="Réinitialisation" />
            <p className="text-white/30 text-[11px] mb-4">Restaurer tous les paramètres par défaut. Action irréversible.</p>
            <AdminButton variant="danger" onClick={resetSettings}>
              <RotateCcw size={14} /> Réinitialiser les paramètres
            </AdminButton>
          </AdminCard>
        </div>
      )}
    </div>
  );
}
