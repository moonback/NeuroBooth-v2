import React from 'react';
import { Settings, Image, BarChart2, Cpu, Lock, ArrowLeft, Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { isSupabaseConfigured } from '../../../lib/supabase';

export type AdminTab = 'settings' | 'gallery' | 'stats' | 'motor';

export const ADMIN_TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'settings', label: 'Réglages', icon: <Settings size={18} /> },
  { id: 'gallery',  label: 'Galerie',   icon: <Image size={18} /> },
  { id: 'stats',    label: 'Stats',     icon: <BarChart2 size={18} /> },
  { id: 'motor',    label: 'Plateau',   icon: <Cpu size={18} /> },
];

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`touch-target relative w-14 h-8 rounded-full transition-colors duration-200 ${checked ? 'theme-accent-bg' : 'bg-white/10'}`}
      role="switch"
      aria-checked={checked}
    >
      <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all duration-200 ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

interface AdminHeaderProps {
  onBack: () => void;
  isOnline: boolean;
}

export function AdminHeader({ onBack, isOnline }: AdminHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="touch-target flex items-center gap-2 text-white/50 hover:text-white transition-colors -ml-2"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Accueil</span>
        </button>
        <span className="text-white/20">/</span>
        <h1 className="text-white font-bold text-lg">Admin</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Cloud status */}
        {isSupabaseConfigured ? (
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
            <Cloud size={12} />
            <span className="hidden sm:inline">Cloud actif</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-white/30 text-xs">
            <CloudOff size={12} />
            <span className="hidden sm:inline">Local seulement</span>
          </span>
        )}
        {/* Network */}
        {isOnline
          ? <Wifi size={16} className="text-emerald-400" />
          : <WifiOff size={16} className="text-yellow-400" />}

        <button
          onClick={onBack}
          className="touch-target rounded-full text-white/30 hover:text-white/70 transition-colors"
          aria-label="Verrouiller"
        >
          <Lock size={18} />
        </button>
      </div>
    </div>
  );
}

interface AdminTabBarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminTabBar({ activeTab, onTabChange }: AdminTabBarProps) {
  return (
    <div className="flex gap-1 px-4 pt-3 overflow-x-auto scrollbar-hide">
      {ADMIN_TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`touch-target flex items-center gap-2 px-4 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            activeTab === t.id
              ? 'theme-accent-bg text-white'
              : 'text-white/40 hover:text-white/70 hover:bg-white/5'
          }`}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

interface AdminSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminSection({ title, children, className = '' }: AdminSectionProps) {
  return (
    <section className={className}>
      <h3 className="text-white/40 text-xs uppercase tracking-widest mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AdminInput({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`admin-input w-full ${className}`}
      {...props}
    />
  );
}

interface AdminRangeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: number;
  min: number;
  max: number;
}

export function AdminRange({ label, value, min, max, ...props }: AdminRangeProps) {
  return (
    <div>
      <label className="block text-white/70 text-sm mb-2">
        {label}: <span className="text-white font-semibold">{value}s</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="admin-range w-full"
        {...props}
      />
    </div>
  );
}

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export function AdminButton({ children, variant = 'secondary', className = '', ...props }: AdminButtonProps) {
  const variantClasses = {
    primary: 'theme-accent-bg text-white',
    secondary: 'border border-white/20 text-white/70 hover:text-white hover:border-white/40',
    danger: 'border border-red-500/30 text-red-400 hover:border-red-500/60',
  };

  return (
    <button
      className={`touch-target flex items-center gap-2 px-4 rounded-xl text-sm transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
