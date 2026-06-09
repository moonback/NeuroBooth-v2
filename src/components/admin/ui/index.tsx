import React from 'react';
import {
  LayoutDashboard, Settings, Image, BarChart2, Cpu,
  Lock, ArrowLeft, Wifi, WifiOff, Cloud, CloudOff, ChevronRight,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../../lib/supabase';

/* ── Navigation ─────────────────────────────────────────────── */

export type AdminTab = 'dashboard' | 'settings' | 'gallery' | 'stats' | 'motor';

export const ADMIN_TABS: {
  id: AdminTab;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  { id: 'dashboard', label: 'Tableau de bord', shortLabel: 'Accueil', icon: <LayoutDashboard size={18} />, description: 'Vue d\'ensemble de la borne' },
  { id: 'settings',  label: 'Paramètres',     shortLabel: 'Réglages', icon: <Settings size={18} />, description: 'Configuration de l\'événement' },
  { id: 'gallery',   label: 'Galerie',          shortLabel: 'Galerie',  icon: <Image size={18} />, description: 'Captures et exports' },
  { id: 'stats',     label: 'Statistiques',     shortLabel: 'Stats',    icon: <BarChart2 size={18} />, description: 'Activité et performances' },
  { id: 'motor',     label: 'Plateau 360',      shortLabel: 'Plateau',  icon: <Cpu size={18} />, description: 'Moteur ESP32' },
];

/* ── Design tokens ────────────────────────────────────────────── */

export const ADMIN = {
  card: [
    'group relative w-full overflow-hidden rounded-2xl',
    'bg-[#0d0d0d] border border-white/[0.06]',
    'p-5 sm:p-6',
    'transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)]',
  ].join(' '),
  cardGlow: 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none',
  sectionHeader: 'flex items-center gap-3 mb-5',
  iconWrap: 'flex items-center justify-center w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.07]',
  sectionTitle: 'text-[11px] font-bold uppercase tracking-[0.18em] text-white/40',
  label: 'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-2.5',
  row: [
    'flex items-center justify-between',
    'bg-white/[0.025] hover:bg-white/[0.04]',
    'rounded-xl px-4 py-3 border border-white/[0.05]',
    'transition-colors duration-150',
  ].join(' '),
  rowLabel: 'flex flex-col gap-0.5',
  rowTitle: 'text-white/75 text-sm font-medium',
  rowSub: 'text-white/25 text-[11px] leading-snug',
  divider: 'border-t border-white/[0.05] my-5',
  sliderWrap: 'bg-white/[0.025] rounded-xl p-4 border border-white/[0.05] space-y-2',
  sliderHeader: 'flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-white/35',
  sliderValue: 'font-bold text-[13px] theme-accent-text tabular-nums',
};

/* ── Primitives ───────────────────────────────────────────────── */

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`touch-target relative w-14 h-8 rounded-full transition-colors duration-200 shrink-0 ${checked ? 'theme-accent-bg' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

export function AdminInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`admin-input w-full ${className}`} {...props} />;
}

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function AdminButton({ children, variant = 'secondary', size = 'md', className = '', ...props }: AdminButtonProps) {
  const variants = {
    primary: 'theme-accent-bg text-white hover:opacity-90',
    secondary: 'border border-white/20 text-white/70 hover:text-white hover:border-white/40 bg-white/[0.03]',
    danger: 'border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10',
    ghost: 'text-white/50 hover:text-white hover:bg-white/5',
  };
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-2.5 text-sm' };
  return (
    <button
      className={`touch-target flex items-center justify-center gap-2 rounded-xl font-medium transition-all disabled:opacity-40 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'accent' | 'purple';
}) {
  const tones = {
    neutral: 'bg-white/10 text-white/50 border-white/10',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    warning: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/15 text-red-400 border-red-500/20',
    accent: 'theme-accent-bg border-transparent text-white',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function AdminCard({
  children,
  glow,
  className = '',
}: {
  children: React.ReactNode;
  glow?: string;
  className?: string;
}) {
  return (
    <section className={`${ADMIN.card} ${className}`}>
      {glow && <div className={ADMIN.cardGlow} style={{ background: glow }} />}
      <div className="relative">{children}</div>
    </section>
  );
}

export function SectionHeader({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) {
  return (
    <div className={`${ADMIN.sectionHeader} ${action ? 'justify-between' : ''}`}>
      <div className="flex items-center gap-3">
        <div className={ADMIN.iconWrap}>{icon}</div>
        <h3 className={ADMIN.sectionTitle}>{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function SliderRow({
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
    <div className={ADMIN.sliderWrap}>
      <div className={ADMIN.sliderHeader}>
        <span>{label}</span>
        <span className={ADMIN.sliderValue}>{display}</span>
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

export function ToggleRow({
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
    <label className={`${ADMIN.row} cursor-pointer`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] text-white/35 shrink-0">
          {icon}
        </div>
        <div className={ADMIN.rowLabel}>
          <span className={ADMIN.rowTitle}>{title}</span>
          {sub && <span className={ADMIN.rowSub}>{sub}</span>}
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </label>
  );
}

export function AdminStatCard({
  icon,
  label,
  value,
  sub,
  accent = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'emerald' | 'yellow' | 'purple' | 'orange' | 'pink' | 'sky';
}) {
  const accents: Record<string, string> = {
    blue: 'from-blue-500/10 to-transparent border-blue-500/15',
    emerald: 'from-emerald-500/10 to-transparent border-emerald-500/15',
    yellow: 'from-yellow-500/10 to-transparent border-yellow-500/15',
    purple: 'from-purple-500/10 to-transparent border-purple-500/15',
    orange: 'from-orange-500/10 to-transparent border-orange-500/15',
    pink: 'from-pink-500/10 to-transparent border-pink-500/15',
    sky: 'from-sky-500/10 to-transparent border-sky-500/15',
  };
  const iconColors: Record<string, string> = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', yellow: 'text-yellow-400',
    purple: 'text-purple-400', orange: 'text-orange-400', pink: 'text-pink-400', sky: 'text-sky-400',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-4 ${accents[accent]}`}>
      <div className={`flex items-center gap-1.5 mb-2 ${iconColors[accent]} opacity-80`}>
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">{value}</p>
      {sub && <p className="text-white/30 text-[11px] mt-1">{sub}</p>}
    </div>
  );
}

export function AdminEmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4 opacity-40">
        {icon}
      </div>
      <p className="text-white/50 font-medium">{title}</p>
      {description && <p className="text-white/25 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  );
}

/* ── Shell components ───────────────────────────────────────────── */

interface AdminShellProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onBack: () => void;
  isOnline: boolean;
  eventName: string;
  badges?: Partial<Record<AdminTab, number>>;
  children: React.ReactNode;
}

export function AdminShell({ activeTab, onTabChange, onBack, isOnline, eventName, badges, children }: AdminShellProps) {
  const current = ADMIN_TABS.find(t => t.id === activeTab)!;

  return (
    <div className="admin-shell theme-bg flex flex-col lg:flex-row min-h-dvh w-full">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/[0.06] bg-[#080808]">
        <div className="p-5 border-b border-white/[0.06]">
          <button
            onClick={onBack}
            className="touch-target flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-4 -ml-1"
          >
            <ArrowLeft size={16} />
            <span className="text-xs font-medium">Retour borne</span>
          </button>
          <p className="text-white font-bold text-lg leading-tight truncate">{eventName}</p>
          <p className="text-white/30 text-xs mt-0.5">Administration</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_TABS.map(tab => (
            <AdminNavItem
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              badge={badges?.[tab.id]}
              onClick={() => onTabChange(tab.id)}
            />
          ))}
        </nav>

        <AdminStatusFooter isOnline={isOnline} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile / tablet header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#080808]/80 backdrop-blur-md lg:hidden shrink-0">
          <button onClick={onBack} className="touch-target flex items-center gap-2 text-white/50 hover:text-white -ml-2">
            <ArrowLeft size={18} />
          </button>
          <div className="text-center min-w-0 flex-1 px-2">
            <p className="text-white font-semibold text-sm truncate">{current.label}</p>
            <p className="text-white/30 text-[10px] truncate">{eventName}</p>
          </div>
          <AdminStatusIcons isOnline={isOnline} />
        </header>

        {/* Page title — desktop */}
        <div className="hidden lg:flex items-center justify-between px-8 py-6 border-b border-white/[0.04] shrink-0">
          <div>
            <h1 className="text-white text-xl font-bold">{current.label}</h1>
            <p className="text-white/35 text-sm mt-0.5">{current.description}</p>
          </div>
          <AdminStatusIcons isOnline={isOnline} />
        </div>

        <main className="flex-1 overflow-y-auto admin-scroll admin-main-with-nav px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
          <div className="max-w-5xl mx-auto w-full">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav — fixed au viewport */}
      <nav className="admin-bottom-nav lg:hidden flex border-t border-white/[0.06] bg-[#080808]/95 backdrop-blur-md">
          {ADMIN_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`touch-target flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors ${
                activeTab === tab.id ? 'theme-accent-text' : 'text-white/35'
              }`}
            >
              <span className="relative">
                {tab.icon}
                {badges?.[tab.id] ? (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {badges[tab.id]! > 9 ? '9+' : badges[tab.id]}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium">{tab.shortLabel}</span>
            </button>
          ))}
      </nav>
    </div>
  );
}

function AdminNavItem({
  tab,
  active,
  badge,
  onClick,
}: {
  tab: (typeof ADMIN_TABS)[number];
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`touch-target w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
        active
          ? 'bg-white/[0.06] text-white border border-white/[0.08]'
          : 'text-white/45 hover:text-white/80 hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <span className={active ? 'theme-accent-text' : ''}>{tab.icon}</span>
      <span className="flex-1 text-sm font-medium">{tab.label}</span>
      {badge ? (
        <span className="px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold">{badge}</span>
      ) : active ? (
        <ChevronRight size={14} className="text-white/20" />
      ) : null}
    </button>
  );
}

function AdminStatusIcons({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {isSupabaseConfigured ? (
        <Cloud size={14} className="text-emerald-400/80" />
      ) : (
        <CloudOff size={14} className="text-white/25" />
      )}
      {isOnline ? <Wifi size={14} className="text-emerald-400" /> : <WifiOff size={14} className="text-yellow-400" />}
      <Lock size={14} className="text-white/20" />
    </div>
  );
}

function AdminStatusFooter({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="p-4 border-t border-white/[0.06] space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/30">Réseau</span>
        <span className={isOnline ? 'text-emerald-400' : 'text-yellow-400'}>{isOnline ? 'En ligne' : 'Hors ligne'}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/30">Cloud</span>
        <span className={isSupabaseConfigured ? 'text-emerald-400' : 'text-white/30'}>
          {isSupabaseConfigured ? 'Connecté' : 'Local'}
        </span>
      </div>
    </div>
  );
}
