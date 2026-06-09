import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Camera, Share2, Cloud, CloudOff, Upload, AlertCircle,
  Settings, Image, Cpu, Zap, Clock, Palette, Shield,
  ChevronRight, Loader,
} from 'lucide-react';
import { AdminCard, AdminStatCard, AdminBadge, SectionHeader } from './ui';
import type { AdminTab } from './ui';

interface DashboardPanelProps {
  onNavigate: (tab: AdminTab) => void;
}

export function DashboardPanel({ onNavigate }: DashboardPanelProps) {
  const { settings, stats, captures, uploadStates, isOnline, hasUltraWideSupport } = useApp();

  const uploadingCount = Object.values(uploadStates).filter(s => s.status === 'uploading').length;
  const errorCount = Object.values(uploadStates).filter(s => s.status === 'error').length;
  const pendingCount = stats.pendingUploads;
  const recentCaptures = captures.slice(0, 5);

  const formatDate = (d: Date) =>
    new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  const quickLinks = [
    { tab: 'settings' as AdminTab, icon: <Settings size={16} />, label: 'Paramètres', sub: settings.eventName },
    { tab: 'gallery' as AdminTab, icon: <Image size={16} />, label: 'Galerie', sub: `${captures.length} capture${captures.length !== 1 ? 's' : ''}` },
    { tab: 'motor' as AdminTab, icon: <Cpu size={16} />, label: 'Plateau 360', sub: settings.motorEnabled ? 'Activé' : 'Désactivé' },
  ];

  return (
    <div className="space-y-5">
      {/* Status banner */}
      <AdminCard glow="radial-gradient(ellipse at top left, rgba(245,200,66,0.06), transparent 60%)">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <AdminBadge tone="accent">{settings.theme}</AdminBadge>
              {settings.kioskMode && (
                <AdminBadge tone="warning"><Shield size={10} /> Kiosque</AdminBadge>
              )}
              {settings.motorEnabled && (
                <AdminBadge tone="purple"><Cpu size={10} /> Plateau</AdminBadge>
              )}
              {!isOnline && (
                <AdminBadge tone="warning">Hors ligne</AdminBadge>
              )}
            </div>
            <h2 className="text-white text-xl sm:text-2xl font-bold">{settings.eventName}</h2>
            <p className="text-white/35 text-sm mt-1">
              {settings.captureDuration}s · {settings.videoQuality.toUpperCase()} · {settings.cameraFacing === 'user' ? 'Selfie' : 'Arrière'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSupabaseConfigured ? (
              <AdminBadge tone="success"><Cloud size={10} /> Cloud actif</AdminBadge>
            ) : (
              <AdminBadge tone="neutral"><CloudOff size={10} /> Mode local</AdminBadge>
            )}
            {uploadingCount > 0 && (
              <AdminBadge tone="accent"><Loader size={10} className="animate-spin" /> {uploadingCount} upload</AdminBadge>
            )}
            {errorCount > 0 && (
              <AdminBadge tone="error"><AlertCircle size={10} /> {errorCount} erreur{errorCount > 1 ? 's' : ''}</AdminBadge>
            )}
          </div>
        </div>
      </AdminCard>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard icon={<Camera size={16} />} label="Captures" value={stats.totalCaptures} accent="blue" />
        <AdminStatCard icon={<Share2 size={16} />} label="Partagées" value={stats.totalShared} accent="emerald" />
        <AdminStatCard icon={<Clock size={16} />} label="Aujourd'hui" value={stats.capturesToday} accent="purple" />
        <AdminStatCard
          icon={<Upload size={16} />}
          label="En attente"
          value={pendingCount}
          sub={pendingCount > 0 ? 'Upload cloud' : undefined}
          accent="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Quick access */}
        <AdminCard glow="radial-gradient(ellipse at top right, rgba(99,102,241,0.05), transparent 60%)">
          <SectionHeader icon={<Zap size={15} className="text-indigo-400/70" />} title="Accès rapide" />
          <div className="space-y-2">
            {quickLinks.map(link => (
              <button
                key={link.tab}
                onClick={() => onNavigate(link.tab)}
                className="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] transition-all text-left group"
              >
                <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 group-hover:theme-accent-text transition-colors">
                  {link.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">{link.label}</p>
                  <p className="text-white/30 text-xs truncate">{link.sub}</p>
                </div>
                <ChevronRight size={16} className="text-white/15 group-hover:text-white/40 transition-colors" />
              </button>
            ))}
          </div>
        </AdminCard>

        {/* Booth config summary */}
        <AdminCard glow="radial-gradient(ellipse at bottom left, rgba(168,85,247,0.04), transparent 60%)">
          <SectionHeader icon={<Palette size={15} className="text-purple-400/70" />} title="Configuration active" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Compte à rebours', value: `${settings.countdownDuration}s` },
              { label: 'Ralenti', value: settings.slowMotionEnabled ? 'Activé' : 'Off' },
              { label: 'Son', value: settings.soundEnabled ? 'On' : 'Off' },
              { label: 'Écran veille', value: settings.screensaverEnabled ? `${settings.screensaverDelaySeconds}s` : 'Off' },
              { label: 'EIS gyro', value: settings.gyroStabilizationEnabled ? 'On' : 'Off' },
              { label: 'Ultra-wide', value: settings.ultraWideEnabled && hasUltraWideSupport ? '0.5x' : '—' },
            ].map(item => (
              <div key={item.label} className="px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-white/30 text-[10px] uppercase tracking-wider font-semibold">{item.label}</p>
                <p className="text-white/75 text-sm font-medium mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNavigate('settings')}
            className="mt-4 w-full text-center text-xs theme-accent-text hover:underline"
          >
            Modifier les paramètres →
          </button>
        </AdminCard>
      </div>

      {/* Recent captures */}
      <AdminCard>
        <SectionHeader
          icon={<Image size={15} className="text-emerald-400/70" />}
          title="Captures récentes"
          action={
            captures.length > 0 ? (
              <button onClick={() => onNavigate('gallery')} className="text-xs text-white/30 hover:text-white/60 transition-colors">
                Voir tout →
              </button>
            ) : undefined
          }
        />
        {recentCaptures.length === 0 ? (
          <p className="text-white/25 text-sm text-center py-6">Aucune capture pour le moment</p>
        ) : (
          <div className="space-y-1">
            {recentCaptures.map(c => {
              const upSt = uploadStates[c.id];
              return (
                <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-white/80 text-sm truncate">{c.eventName}</p>
                    <p className="text-white/30 text-xs">{formatDate(c.createdAt)} · {c.duration}s</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {upSt?.status === 'uploading' && (
                      <AdminBadge tone="accent"><Loader size={9} className="animate-spin" /> {upSt.progress}%</AdminBadge>
                    )}
                    {upSt?.status === 'error' && <AdminBadge tone="error">Erreur</AdminBadge>}
                    {c.shared && <AdminBadge tone="purple">Partagé</AdminBadge>}
                    {c.uploadedToCloud ? (
                      <AdminBadge tone="success">Cloud</AdminBadge>
                    ) : (
                      <AdminBadge tone="neutral">Local</AdminBadge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
