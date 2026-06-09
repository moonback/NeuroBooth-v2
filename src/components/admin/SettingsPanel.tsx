
import React, { useRef } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing, DisplayFont } from '../../types';
import {
  Upload, RotateCcw, Palette, Zap, Crown, Sparkles, Check,
  Calendar, Image as ImageIcon, Camera, Volume2,
  FastForward, Shield, Lock, Maximize2, Crosshair, Brush, Type, Moon,
} from 'lucide-react';
import { hexToRgba } from '../../lib/brandTheme';
import { Toggle, AdminInput, AdminButton } from './ui';
 
interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
  hasUltraWideSupport?: boolean;
}
 
/* ── Design tokens ────────────────────────────────────────────── */
const TOKEN = {
  section: [
    'group relative w-full overflow-hidden rounded-2xl',
    'bg-[#0d0d0d] border border-white/[0.06]',
    'p-5 sm:p-6',
    'transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(0,0,0,0.6)]',
  ].join(' '),
  sectionGlow:
    'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
  sectionHeader: 'flex items-center gap-3 mb-6',
  iconWrap:
    'flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07]',
  sectionTitle:
    'text-[11px] font-bold uppercase tracking-[0.18em] text-white/40',
  divider: 'border-t border-white/[0.05] my-5',
  label: 'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-2.5',
  row: [
    'flex items-center justify-between',
    'bg-white/[0.025] hover:bg-white/[0.04]',
    'rounded-xl px-4 py-3 border border-white/[0.05]',
    'transition-colors duration-150',
  ].join(' '),
  rowLabel: 'flex flex-col gap-0.5',
  rowTitle: 'text-white/75 text-sm font-medium',
  rowSub: 'text-white/25 text-[11px]',
  sliderWrap: 'bg-white/[0.025] rounded-xl p-4 border border-white/[0.05] space-y-2',
  sliderHeader: 'flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/35',
  sliderValue: 'font-bold text-[13px] text-amber-400/90 tabular-nums',
};
 
/* ── Theme definitions ────────────────────────────────────────── */
const THEMES: {
  value: AppTheme;
  label: string;
  accent: string;
  glow: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: 'dark',
    label: 'Sombre',
    accent: '#3b82f6',
    glow: 'rgba(59,130,246,0.15)',
    icon: <Palette size={15} />,
    description: 'Minimaliste & professionnel',
  },
  {
    value: 'neon',
    label: 'Neon',
    accent: '#22c55e',
    glow: 'rgba(34,197,94,0.15)',
    icon: <Zap size={15} />,
    description: 'Futuriste, tons verts',
  },
  {
    value: 'elegant',
    label: 'Élégant',
    accent: '#f5c842',
    glow: 'rgba(245,200,66,0.15)',
    icon: <Crown size={15} />,
    description: 'Luxueux, accents dorés',
  },
  {
    value: 'party',
    label: 'Party',
    accent: '#a855f7',
    glow: 'rgba(168,85,247,0.15)',
    icon: <Sparkles size={15} />,
    description: 'Fun, dégradé animé',
  },
];

const DISPLAY_FONTS: { value: DisplayFont; label: string; sample: string }[] = [
  { value: 'clash', label: 'Clash Display', sample: 'Premium & impactant' },
  { value: 'satoshi', label: 'Satoshi', sample: 'Moderne & géométrique' },
  { value: 'inter', label: 'Inter', sample: 'Neutre & lisible' },
];
 
const QUALITIES: { value: VideoQuality; label: string; sub: string }[] = [
  { value: 'low',    label: '480p', sub: 'Économique' },
  { value: 'medium', label: '720p', sub: 'Standard' },
  { value: 'high',   label: '1080p', sub: 'Haute def.' },
  { value: '4k',     label: '4K', sub: 'Maximale' },
];
 
/* ── Sub-components ───────────────────────────────────────────── */
function SectionHeader({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className={TOKEN.sectionHeader}>
      <div className={TOKEN.iconWrap}>{icon}</div>
      <h3 className={TOKEN.sectionTitle}>{title}</h3>
    </div>
  );
}
 
function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className={TOKEN.sliderWrap}>
      <div className={TOKEN.sliderHeader}>
        <span>{label}</span>
        <span className={TOKEN.sliderValue}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(+e.target.value)}
        className="admin-range w-full"
      />
    </div>
  );
}
 
function ToggleRow({
  icon,
  title,
  sub,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`${TOKEN.row} cursor-pointer`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/35">
          {icon}
        </div>
        <div className={TOKEN.rowLabel}>
          <span className={TOKEN.rowTitle}>{title}</span>
          {sub && <span className={TOKEN.rowSub}>{sub}</span>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </label>
  );
}
 
/* ── Main component ───────────────────────────────────────────── */
export function SettingsPanel({ settings, updateSettings, resetSettings, hasUltraWideSupport = true }: SettingsPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => updateSettings({ eventLogo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 w-full overflow-x-hidden">

      {/* ── Événement ── */}
      <section className={TOKEN.section}>
        <div
          className={TOKEN.sectionGlow}
          style={{ background: 'radial-gradient(ellipse at top left, rgba(245,200,66,0.04), transparent 60%)' }}
        />
        <SectionHeader
          icon={<Calendar size={15} className="text-amber-400/70" />}
          title="Événement"
        />

        <div className="space-y-4">
          <div>
            <p className={TOKEN.label}>Nom de l'événement</p>
            <AdminInput
              type="text"
              value={settings.eventName}
              onChange={e => updateSettings({ eventName: e.target.value })}
              placeholder="Mon Événement"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className={TOKEN.label}>Watermark texte</p>
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
              sub="Aperçu live pendant la capture ; le texte est toujours incrusté dans l'export"
              checked={settings.showWatermark}
              onChange={v => updateSettings({ showWatermark: v })}
            />
          </div>

          <div>
            <p className={TOKEN.label}>Logo</p>
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
                    <RotateCcw size={14} />
                    Supprimer
                  </AdminButton>
                )}
              </div>
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            {(settings.eventLogo || settings.watermarkText) && (
              <p className="text-white/25 text-[11px] mt-2">
                Logo et texte watermark sont incrustés en bas de la vidéo finale (canvas).
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Capture ── */}
      <section className={TOKEN.section}>
        <div
          className={TOKEN.sectionGlow}
          style={{ background: 'radial-gradient(ellipse at top right, rgba(99,102,241,0.05), transparent 60%)' }}
        />
        <SectionHeader
          icon={<Camera size={15} className="text-indigo-400/70" />}
          title="Capture"
        />

        <div className="space-y-3">
          <SliderRow
            label="Durée d'enregistrement"
            value={settings.captureDuration}
            display={`${settings.captureDuration}s`}
            min={3} max={60}
            onChange={v => updateSettings({ captureDuration: v })}
          />

          <SliderRow
            label="Compte à rebours"
            value={settings.countdownDuration}
            display={`${settings.countdownDuration}s`}
            min={1} max={10}
            onChange={v => updateSettings({ countdownDuration: v })}
          />

          <div>
            <p className={TOKEN.label}>Qualité vidéo</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALITIES.map(q => {
                const active = settings.videoQuality === q.value;
                return (
                  <button
                    key={q.value}
                    onClick={() => updateSettings({ videoQuality: q.value })}
                    className={[
                      'flex flex-col items-center gap-0.5 py-3 rounded-xl text-center transition-all border',
                      active
                        ? 'bg-amber-400/10 border-amber-400/30 shadow-[0_0_20px_rgba(245,200,66,0.08)]'
                        : 'border-white/[0.05] hover:border-white/15 bg-white/[0.025] hover:bg-white/[0.04]',
                    ].join(' ')}
                  >
                    <span className={`text-sm font-bold ${active ? 'text-amber-400' : 'text-white/50'}`}>{q.label}</span>
                    <span className={`text-[10px] ${active ? 'text-amber-400/60' : 'text-white/25'}`}>{q.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={TOKEN.label}>Caméra par défaut</p>
            <div className="grid grid-cols-2 gap-2">
              {(['environment', 'user'] as CameraFacing[]).map(f => {
                const active = settings.cameraFacing === f;
                return (
                  <button
                    key={f}
                    onClick={() => updateSettings({ cameraFacing: f })}
                    className={[
                      'py-3 rounded-xl text-sm font-semibold transition-all border',
                      active
                        ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                        : 'border-white/[0.05] text-white/40 hover:border-white/15 hover:text-white/60 bg-white/[0.025]',
                    ].join(' ')}
                  >
                    {f === 'environment' ? '📷 Arrière' : '🤳 Avant (selfie)'}
                  </button>
                );
              })}
            </div>
          </div>

          <ToggleRow
            icon={<Maximize2 size={14} />}
            title="Ultra grand-angle (0.5x)"
            sub={
              hasUltraWideSupport
                ? 'Objectif wide natif — idéal pour ne couper personne'
                : 'Non détecté sur cet appareil — repli sur caméra standard'
            }
            checked={settings.ultraWideEnabled}
            onChange={v => updateSettings({ ultraWideEnabled: v })}
          />

          <ToggleRow
            icon={<Lock size={14} />}
            title="Verrouillage AF/AE"
            sub="Bloque focus et exposition avant rotation pour éviter le pompage lumineux"
            checked={settings.lockAfAeEnabled}
            onChange={v => updateSettings({ lockAfAeEnabled: v })}
          />

          <ToggleRow
            icon={<Crosshair size={14} />}
            title="Stabilisation gyroscopique (EIS)"
            sub="Compense les vibrations du bras 360 via gyroscope"
            checked={settings.gyroStabilizationEnabled}
            onChange={v => updateSettings({ gyroStabilizationEnabled: v })}
          />

          {settings.gyroStabilizationEnabled && (
            <SliderRow
              label="Intensité EIS"
              value={Math.round(settings.gyroStabilizationStrength * 100)}
              display={`${Math.round(settings.gyroStabilizationStrength * 100)}%`}
              min={30}
              max={100}
              step={5}
              onChange={v => updateSettings({ gyroStabilizationStrength: v / 100 })}
            />
          )}

          <ToggleRow
            icon={<Volume2 size={14} />}
            title="Son actif"
            checked={settings.soundEnabled}
            onChange={v => updateSettings({ soundEnabled: v })}
          />

          <div className={TOKEN.divider} />

          <ToggleRow
            icon={<FastForward size={14} />}
            title="Ralenti automatique"
            sub="Ajoute un effet ralenti à la vidéo"
            checked={settings.slowMotionEnabled}
            onChange={v => updateSettings({ slowMotionEnabled: v })}
          />

          {settings.slowMotionEnabled && (
            <div className="mt-3 p-4 bg-white/[0.02] border border-white/[0.04] rounded-2xl space-y-4 relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-1">
                <FastForward size={13} className="text-indigo-400/50" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400/50">Configuration de l'effet</span>
              </div>
              
              <div className="flex flex-wrap gap-2 pb-1">
                {[
                  { label: 'Subtil', speed: 0.8, start: 0, duration: 100 },
                  { label: 'Épique', speed: 0.5, start: 25, duration: 50 },
                  { label: 'Matrix', speed: 0.25, start: 40, duration: 20 },
                  { label: 'Action', speed: 0.4, start: 60, duration: 40 },
                ].map(preset => {
                  const isActive = 
                    settings.slowMotionFactor === preset.speed &&
                    settings.slowMotionStartPercent === preset.start &&
                    settings.slowMotionDurationPercent === preset.duration;
                    
                  return (
                    <button
                      key={preset.label}
                      onClick={() => updateSettings({
                        slowMotionFactor: preset.speed,
                        slowMotionStartPercent: preset.start,
                        slowMotionDurationPercent: preset.duration
                      })}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                        isActive 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 shadow-[0_0_10px_rgba(99,102,241,0.1)]' 
                          : 'bg-white/[0.03] hover:bg-white/[0.06] text-white/60 border-white/[0.05]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              
              <SliderRow
                label="Vitesse du ralenti"
                value={settings.slowMotionFactor * 100}
                display={`${Math.round(settings.slowMotionFactor * 100)}%`}
                min={10} max={100}
                step={5}
                onChange={v => updateSettings({ slowMotionFactor: v / 100 })}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SliderRow
                  label="Début de l'effet"
                  value={settings.slowMotionStartPercent}
                  display={`${settings.slowMotionStartPercent}%`}
                  min={0} max={100}
                  step={5}
                  onChange={v => updateSettings({ slowMotionStartPercent: v })}
                />
                <SliderRow
                  label="Durée de l'effet"
                  value={settings.slowMotionDurationPercent}
                  display={`${settings.slowMotionDurationPercent}%`}
                  min={10} max={100}
                  step={5}
                  onChange={v => updateSettings({ slowMotionDurationPercent: v })}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Thème visuel ── */}
      <section className={TOKEN.section}>
        <div
          className={TOKEN.sectionGlow}
          style={{ background: 'radial-gradient(ellipse at bottom left, rgba(168,85,247,0.04), transparent 60%)' }}
        />
        <SectionHeader
          icon={<Palette size={15} className="text-purple-400/70" />}
          title="Thème visuel"
        />

        <div className="grid grid-cols-2 gap-2">
          {[
            ...THEMES,
            {
              value: 'brand' as AppTheme,
              label: 'Brand',
              accent: settings.brandAccentColor,
              glow: hexToRgba(settings.brandAccentColor, 0.15),
              icon: <Brush size={15} />,
              description: 'White-label événementiel',
            },
          ].map(t => {
            const active = settings.theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => updateSettings({ theme: t.value })}
                className={[
                  'relative flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all overflow-hidden',
                  active
                    ? 'border-white/15 bg-white/[0.04]'
                    : 'border-white/[0.05] hover:border-white/10 bg-white/[0.02] hover:bg-white/[0.035]',
                ].join(' ')}
                style={active ? { boxShadow: `0 0 30px ${t.glow}` } : {}}
              >
                {active && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at top left, ${t.glow}, transparent 70%)` }}
                  />
                )}

                <div className="relative flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: active ? t.accent + '20' : 'rgba(255,255,255,0.04)',
                      color: active ? t.accent : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {t.icon}
                    <span className="text-[11px] font-bold">{t.label}</span>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center border transition-all"
                    style={
                      active
                        ? { background: t.accent, borderColor: 'transparent', boxShadow: `0 0 12px ${t.accent}60` }
                        : { borderColor: 'rgba(255,255,255,0.1)' }
                    }
                  >
                    {active && <Check size={10} className="text-white" />}
                  </div>
                </div>

                <p className={`relative text-[11px] leading-snug ${active ? 'text-white/50' : 'text-white/25'}`}>
                  {t.description}
                </p>

                <div className="relative w-full h-1 rounded-full overflow-hidden flex gap-px">
                  {[1, 0.55, 0.25].map((o, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 ${i === 0 ? 'rounded-l-full' : i === 2 ? 'rounded-r-full' : ''}`}
                      style={{ background: t.accent, opacity: o }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {settings.theme === 'brand' && (
          <div className="mt-5 space-y-4 pt-5 border-t border-white/[0.06]">
            <p className={TOKEN.label}>Personnalisation Brand</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]">
                <span className="text-white/50 text-xs">Couleur accent</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.brandAccentColor}
                    onChange={e => updateSettings({ brandAccentColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-0 bg-transparent cursor-pointer touch-target-sm"
                  />
                  <span className="text-white/70 text-sm font-mono">{settings.brandAccentColor}</span>
                </div>
              </label>
              <label className="flex flex-col gap-2 bg-white/[0.025] rounded-xl p-3 border border-white/[0.05]">
                <span className="text-white/50 text-xs">Fond</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.brandBgColor}
                    onChange={e => updateSettings({ brandBgColor: e.target.value })}
                    className="w-12 h-12 rounded-lg border-0 bg-transparent cursor-pointer touch-target-sm"
                  />
                  <span className="text-white/70 text-sm font-mono">{settings.brandBgColor}</span>
                </div>
              </label>
            </div>
            <p className="text-white/25 text-[11px]">
              Le logo événement est importé dans la section Événement ci-dessus.
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3 pt-5 border-t border-white/[0.06]">
          <p className={TOKEN.label}>
            <Type size={12} className="inline mr-1" />
            Police des titres
          </p>
          <div className="flex flex-col gap-2">
            {DISPLAY_FONTS.map(f => {
              const active = settings.displayFont === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => updateSettings({ displayFont: f.value })}
                  className={`touch-target flex items-center justify-between px-4 rounded-xl border text-left transition-all ${
                    active ? 'border-white/15 bg-white/[0.04]' : 'border-white/[0.05] bg-white/[0.02]'
                  }`}
                >
                  <div>
                    <span className="text-white/80 text-sm font-medium block">{f.label}</span>
                    <span className="text-white/30 text-[11px]">{f.sample}</span>
                  </div>
                  {active && <Check size={16} className="theme-accent-text" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-3 pt-5 border-t border-white/[0.06]">
          <ToggleRow
            icon={<Moon size={14} />}
            title="Écran veille"
            sub="Preview floutée + logo animé entre les sessions"
            checked={settings.screensaverEnabled}
            onChange={v => updateSettings({ screensaverEnabled: v })}
          />
          {settings.screensaverEnabled && (
            <SliderRow
              label="Délai d'inactivité"
              value={settings.screensaverDelaySeconds}
              display={`${settings.screensaverDelaySeconds}s`}
              min={15}
              max={180}
              step={15}
              onChange={v => updateSettings({ screensaverDelaySeconds: v })}
            />
          )}
        </div>
      </section>

      {/* ── Mode kiosque ── */}
      <section className={TOKEN.section}>
        <div
          className={TOKEN.sectionGlow}
          style={{ background: 'radial-gradient(ellipse at bottom right, rgba(239,68,68,0.04), transparent 60%)' }}
        />
        <SectionHeader
          icon={<Shield size={15} className="text-red-400/60" />}
          title="Mode kiosque"
        />

        <div className="space-y-3">
          <ToggleRow
            icon={<Lock size={14} />}
            title="Activer le mode kiosque"
            sub="Protège le panneau admin par PIN"
            checked={settings.kioskMode}
            onChange={v => updateSettings({ kioskMode: v })}
          />

          {settings.kioskMode && (
            <div className="pl-2 border-l border-white/[0.06]">
              <p className={TOKEN.label}>PIN admin (4 chiffres)</p>
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
      </section>

      {/* ── Réinitialiser ── */}
      <section className={TOKEN.section}>
        <div
          className={TOKEN.sectionGlow}
          style={{ background: 'radial-gradient(ellipse at bottom, rgba(239,68,68,0.04), transparent 60%)' }}
        />
        <SectionHeader
          icon={<RotateCcw size={15} className="text-red-400/60" />}
          title="Réinitialisation"
        />
        <div className="space-y-3">
          <p className="text-white/30 text-[11px]">
            Restaurer tous les paramètres par défaut. Cette action est irréversible.
          </p>
          <AdminButton variant="danger" onClick={resetSettings}>
            <RotateCcw size={14} />
            Réinitialiser les paramètres
          </AdminButton>
        </div>
      </section>

    </div>
  );
}
 


