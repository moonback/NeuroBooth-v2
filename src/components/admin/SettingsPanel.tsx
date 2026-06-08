import React, { useMemo, useRef, useState } from 'react';
import { Settings, AppTheme, VideoQuality, CameraFacing } from '../../types';
import {
  Upload,
  RotateCcw,
  Palette,
  Zap,
  Crown,
  Sparkles,
  Check,
  Calendar,
  Image as ImageIcon,
  Timer,
  Camera,
  Volume2,
  FastForward,
  Shield,
  Lock,
  Wand2,
  Eye,
} from 'lucide-react';
import { Toggle, AdminInput, AdminButton } from './ui';

interface SettingsPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

type SettingsTab = 'event' | 'capture' | 'theme' | 'security';

const SETTING_TABS: { id: SettingsTab; label: string; description: string; icon: React.ReactNode }[] = [
  { id: 'event', label: 'Événement', description: 'Nom, logo, watermark', icon: <Calendar size={18} /> },
  { id: 'capture', label: 'Capture', description: 'Caméra, durée, ralenti', icon: <Camera size={18} /> },
  { id: 'theme', label: 'Thème', description: 'Ambiance visuelle', icon: <Palette size={18} /> },
  { id: 'security', label: 'Kiosque', description: 'PIN admin', icon: <Shield size={18} /> },
];

const THEMES: {
  value: AppTheme;
  label: string;
  subtitle: string;
  accent: string;
  glow: string;
  gradient: string;
  icon: React.ReactNode;
  description: string;
  chips: string[];
}[] = [
  {
    value: 'dark',
    label: 'Sombre',
    subtitle: 'Premium blue',
    accent: '#60a5fa',
    glow: 'rgba(96,165,250,0.35)',
    gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 45%, #1d4ed8 120%)',
    icon: <Palette size={18} />,
    description: 'Un rendu sobre, contrasté et professionnel pour tous les événements.',
    chips: ['Classique', 'Lisible', 'Corporate'],
  },
  {
    value: 'neon',
    label: 'Neon',
    subtitle: 'Cyber green',
    accent: '#00ff87',
    glow: 'rgba(0,255,135,0.38)',
    gradient: 'linear-gradient(135deg, #020403 0%, #052e1b 50%, #00ff87 140%)',
    icon: <Zap size={18} />,
    description: 'Effet futuriste avec halos verts, idéal soirées tech ou club.',
    chips: ['Futuriste', 'Glow', 'Énergique'],
  },
  {
    value: 'elegant',
    label: 'Élégant',
    subtitle: 'Gold lounge',
    accent: '#f0c97a',
    glow: 'rgba(240,201,122,0.34)',
    gradient: 'linear-gradient(135deg, #080605 0%, #2a1d0d 55%, #d4a054 135%)',
    icon: <Crown size={18} />,
    description: 'Ambiance dorée chic pour mariage, gala ou événement haut de gamme.',
    chips: ['Luxe', 'Mariage', 'Chic'],
  },
  {
    value: 'party',
    label: 'Party',
    subtitle: 'Festival pop',
    accent: '#fb7185',
    glow: 'rgba(251,113,133,0.38)',
    gradient: 'linear-gradient(135deg, #16051d 0%, #7c3aed 45%, #f97316 125%)',
    icon: <Sparkles size={18} />,
    description: 'Dégradés festifs et punchy pour créer une expérience très fun.',
    chips: ['Fun', 'Coloré', 'Dynamique'],
  },
];

const QUALITIES: { value: VideoQuality; label: string; detail: string }[] = [
  { value: 'low', label: '480p', detail: 'Économique' },
  { value: 'medium', label: '720p', detail: 'Standard' },
  { value: 'high', label: '1080p', detail: 'Haute def.' },
  { value: '4k', label: '4K', detail: 'Maximale' },
];

export function SettingsPanel({ settings, updateSettings }: SettingsPanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('event');

  const currentTheme = useMemo(
    () => THEMES.find(theme => theme.value === settings.theme) ?? THEMES[0],
    [settings.theme]
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateSettings({ eventLogo: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-5 overflow-x-hidden">
      <div className="glass-panel overflow-hidden rounded-[1.75rem]">
        <div className="relative p-4 sm:p-6" style={{ background: currentTheme.gradient }}>
          <div className="absolute inset-0 opacity-30" style={{ boxShadow: `inset 0 0 90px ${currentTheme.glow}` }} />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                <Wand2 size={14} /> Configuration
              </p>
              <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Settings en onglets</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                Réglez l'événement, la capture, le thème visuel et la sécurité sans scroller dans une longue page.
              </p>
            </div>
            <div className="hidden rounded-3xl border border-white/15 bg-black/20 p-3 text-right shadow-2xl sm:block">
              <p className="text-xs uppercase tracking-widest text-white/45">Thème actif</p>
              <p className="mt-1 text-lg font-black text-white">{currentTheme.label}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/20 p-2 sm:grid-cols-4">
          {SETTING_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`touch-target pressable flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all ${
                activeTab === tab.id
                  ? 'theme-accent-bg border-transparent text-white shadow-lg shadow-black/30'
                  : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-black">
                {tab.icon}
                {tab.label}
              </span>
              <span className="text-[11px] leading-tight opacity-70">{tab.description}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'event' && (
        <SettingsCard icon={<Calendar size={18} />} title="Événement" subtitle="Identité affichée sur l'écran d'accueil et les vidéos.">
          <div className="space-y-4">
            <Field label="Nom de l'événement">
              <AdminInput
                type="text"
                value={settings.eventName}
                onChange={e => updateSettings({ eventName: e.target.value })}
                placeholder="Mon Événement"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Watermark (texte)">
                <AdminInput
                  type="text"
                  value={settings.watermarkText}
                  onChange={e => updateSettings({ watermarkText: e.target.value })}
                  placeholder="© Mon Événement 2026"
                />
              </Field>
              <ToggleRow
                icon={<ImageIcon size={14} />}
                title="Afficher le watermark"
                description="Ajoute le texte sur l'expérience capture."
                checked={settings.showWatermark}
                onChange={v => updateSettings({ showWatermark: v })}
              />
            </div>

            <Field label="Logo événement">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {settings.eventLogo ? (
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2">
                      <img src={settings.eventLogo} alt="Logo" className="h-full w-full object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5">
                      <Upload size={24} className="text-white/25" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-wrap gap-2">
                    <AdminButton onClick={() => logoInputRef.current?.click()}>
                      <Upload size={16} />
                      {settings.eventLogo ? 'Changer le logo' : 'Importer un logo'}
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
            </Field>
          </div>
        </SettingsCard>
      )}

      {activeTab === 'capture' && (
        <SettingsCard icon={<Camera size={18} />} title="Capture" subtitle="Contrôlez l'enregistrement, la caméra, le son et les effets vidéo.">
          <div className="space-y-5">
            <RangeField
              icon={<Timer size={14} />}
              label="Durée d'enregistrement"
              value={`${settings.captureDuration}s`}
              minLabel="3s"
              midLabel="30s"
              maxLabel="60s"
            >
              <input
                type="range"
                min="3"
                max="60"
                value={settings.captureDuration}
                onChange={e => updateSettings({ captureDuration: +e.target.value })}
                className="admin-range w-full"
              />
            </RangeField>

            <RangeField
              icon={<Timer size={14} />}
              label="Compte à rebours"
              value={`${settings.countdownDuration}s`}
              minLabel="1s"
              maxLabel="10s"
            >
              <input
                type="range"
                min="1"
                max="10"
                value={settings.countdownDuration}
                onChange={e => updateSettings({ countdownDuration: +e.target.value })}
                className="admin-range w-full"
              />
            </RangeField>

            <Field label="Qualité vidéo">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {QUALITIES.map(q => (
                  <button
                    key={q.value}
                    onClick={() => updateSettings({ videoQuality: q.value })}
                    className={`touch-target pressable rounded-2xl border px-3 py-3 text-left transition-all ${
                      settings.videoQuality === q.value
                        ? 'theme-accent-bg border-transparent text-white shadow-lg shadow-black/20'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span className="block text-sm font-black">{q.label}</span>
                    <span className="text-xs opacity-70">{q.detail}</span>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Caméra par défaut">
              <div className="grid grid-cols-2 gap-2">
                {(['environment', 'user'] as CameraFacing[]).map(f => (
                  <button
                    key={f}
                    onClick={() => updateSettings({ cameraFacing: f })}
                    className={`touch-target pressable rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                      settings.cameraFacing === f
                        ? 'theme-accent-bg border-transparent text-white shadow-lg shadow-black/20'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    {f === 'environment' ? 'Arrière' : 'Avant (selfie)'}
                  </button>
                ))}
              </div>
            </Field>

            <ToggleRow
              icon={<Volume2 size={14} />}
              title="Son actif"
              description="Joue les bips du compte à rebours."
              checked={settings.soundEnabled}
              onChange={v => updateSettings({ soundEnabled: v })}
            />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-white/45">
                    <FastForward size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white/75">Ralenti automatique</p>
                    <p className="text-xs text-white/35">Ajoute un effet ralenti à la vidéo.</p>
                  </div>
                </div>
                <Toggle checked={settings.slowMotionEnabled} onChange={v => updateSettings({ slowMotionEnabled: v })} />
              </div>

              {settings.slowMotionEnabled && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniRange
                    label="Vitesse"
                    value={`${Math.round(settings.slowMotionFactor * 100)}%`}
                    min="10"
                    max="100"
                    rangeValue={settings.slowMotionFactor * 100}
                    onChange={value => updateSettings({ slowMotionFactor: value / 100 })}
                  />
                  <MiniRange
                    label="Début"
                    value={`${settings.slowMotionStartPercent}%`}
                    min="0"
                    max="100"
                    rangeValue={settings.slowMotionStartPercent}
                    onChange={value => updateSettings({ slowMotionStartPercent: value })}
                  />
                  <MiniRange
                    label="Durée"
                    value={`${settings.slowMotionDurationPercent}%`}
                    min="10"
                    max="100"
                    rangeValue={settings.slowMotionDurationPercent}
                    onChange={value => updateSettings({ slowMotionDurationPercent: value })}
                  />
                </div>
              )}
            </div>
          </div>
        </SettingsCard>
      )}

      {activeTab === 'theme' && (
        <SettingsCard icon={<Palette size={18} />} title="Thème visuel" subtitle="Choisissez une ambiance et prévisualisez immédiatement le rendu mobile.">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {THEMES.map(theme => (
                <button
                  key={theme.value}
                  onClick={() => updateSettings({ theme: theme.value })}
                  className={`group relative overflow-hidden rounded-[1.5rem] border p-4 text-left transition-all ${
                    settings.theme === theme.value
                      ? 'border-white/30 ring-2 ring-white/10 shadow-2xl shadow-black/35'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                  style={{ background: theme.gradient }}
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100" style={{ boxShadow: `inset 0 0 80px ${theme.glow}` }} />
                  <div className="relative space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-sm font-black text-white">
                          {theme.icon}
                          {theme.label}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{theme.subtitle}</p>
                      </div>
                      {settings.theme === theme.value ? (
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-black shadow-lg">
                          <Check size={16} />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full border border-white/20 bg-white/5" />
                      )}
                    </div>

                    <p className="min-h-10 text-sm leading-relaxed text-white/70">{theme.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {theme.chips.map(chip => (
                        <span key={chip} className="rounded-full border border-white/12 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/65">
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-3">
              <div className="overflow-hidden rounded-[1.35rem] border border-white/10" style={{ background: currentTheme.gradient }}>
                <div className="p-4">
                  <div className="mb-10 flex items-center justify-between">
                    <div className="h-7 w-20 rounded-full bg-white/15" />
                    <div className="h-9 w-9 rounded-2xl bg-white/15" />
                  </div>
                  <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-[1.5rem] text-white shadow-2xl" style={{ background: currentTheme.accent, boxShadow: `0 0 45px ${currentTheme.glow}` }}>
                    <Camera size={34} />
                  </div>
                  <div className="space-y-2 text-center">
                    <div className="mx-auto h-4 w-32 rounded-full bg-white/80" />
                    <div className="mx-auto h-2 w-44 rounded-full bg-white/25" />
                  </div>
                  <div className="mt-8 rounded-2xl px-5 py-4 text-center text-sm font-black text-white shadow-xl" style={{ background: currentTheme.accent }}>
                    Commencer
                  </div>
                </div>
              </div>
              <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-white/45">
                <Eye size={14} /> Aperçu mobile
              </p>
            </div>
          </div>
        </SettingsCard>
      )}

      {activeTab === 'security' && (
        <SettingsCard icon={<Shield size={18} />} title="Mode kiosque" subtitle="Sécurisez l'accès admin quand le photobooth est en libre-service.">
          <div className="space-y-4">
            <ToggleRow
              icon={<Lock size={14} />}
              title="Activer le mode kiosque"
              description="Protège le panneau admin par code PIN."
              checked={settings.kioskMode}
              onChange={v => updateSettings({ kioskMode: v })}
            />

            {settings.kioskMode && (
              <Field label="PIN admin (4 chiffres)">
                <AdminInput
                  type="number"
                  value={settings.kioskPin}
                  onChange={e => updateSettings({ kioskPin: e.target.value.slice(0, 4) })}
                  className="max-w-40 text-center text-lg font-bold tracking-[0.35em]"
                  maxLength={4}
                  placeholder="1234"
                />
              </Field>
            )}
          </div>
        </SettingsCard>
      )}
    </div>
  );
}

function SettingsCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-panel rounded-[1.75rem] p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 theme-accent-text">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-white">{title}</h3>
          <p className="text-sm text-white/40">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-white/45">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/75">{title}</p>
          <p className="text-xs text-white/35">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function RangeField({
  icon,
  label,
  value,
  minLabel,
  midLabel,
  maxLabel,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  minLabel: string;
  midLabel?: string;
  maxLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-sm tracking-normal theme-accent-text">{value}</span>
      </label>
      {children}
      <div className="mt-2 flex justify-between text-xs text-white/25">
        <span>{minLabel}</span>
        {midLabel && <span>{midLabel}</span>}
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function MiniRange({
  label,
  value,
  min,
  max,
  rangeValue,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  max: string;
  rangeValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3">
      <label className="mb-2 flex items-center justify-between text-xs font-bold text-white/50">
        <span>{label}</span>
        <span className="text-white">{value}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={rangeValue}
        onChange={e => onChange(+e.target.value)}
        className="admin-range w-full"
      />
    </div>
  );
}
