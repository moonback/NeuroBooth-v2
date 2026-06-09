import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchCloudStats } from '../../lib/storage';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Camera, Share2, Clock, TrendingUp, Activity, Calendar,
  Cloud, CloudOff, Upload, RefreshCw, Loader, BarChart2,
} from 'lucide-react';
import { AdminCard, AdminStatCard, AdminBadge, SectionHeader } from './ui';

interface CloudStats { total: number; shared: number; today: number }

export function StatsPanel() {
  const { stats, captures, uploadStates, isOnline } = useApp();
  const [cloudStats, setCloudStats] = useState<CloudStats | null>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);

  const uploadingCount = Object.values(uploadStates).filter(s => s.status === 'uploading').length;
  const errorCount = Object.values(uploadStates).filter(s => s.status === 'error').length;

  const loadCloudStats = async () => {
    if (!isSupabaseConfigured || !isOnline) return;
    setLoadingCloud(true);
    try {
      const s = await fetchCloudStats();
      if (s) setCloudStats(s);
    } finally {
      setLoadingCloud(false);
    }
  };

  useEffect(() => { loadCloudStats(); }, [isOnline]);

  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const h = new Date().getHours() - 11 + i;
    const count = captures.filter(c => new Date(c.createdAt).getHours() === ((h + 24) % 24)).length;
    return { hour: ((h + 24) % 24), count };
  });
  const maxHourly = Math.max(...hourlyData.map(d => d.count), 1);
  const shareRate = stats.totalCaptures > 0 ? Math.round((stats.totalShared / stats.totalCaptures) * 100) : 0;

  return (
    <div className="space-y-5">
      <AdminCard glow="radial-gradient(ellipse at top left, rgba(59,130,246,0.05), transparent 60%)">
        <SectionHeader icon={<BarChart2 size={15} className="text-blue-400/70" />} title="Statistiques locales" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <AdminStatCard icon={<Camera size={16} />} label="Total" value={stats.totalCaptures} accent="blue" />
          <AdminStatCard icon={<Share2 size={16} />} label="Partagés" value={stats.totalShared} accent="emerald" />
          <AdminStatCard icon={<Activity size={16} />} label="Cette heure" value={stats.capturesThisHour} accent="yellow" />
          <AdminStatCard icon={<Calendar size={16} />} label="Aujourd'hui" value={stats.capturesToday} accent="purple" />
          <AdminStatCard icon={<Clock size={16} />} label="Durée moy." value={`${stats.averageDuration}s`} accent="orange" />
          <AdminStatCard icon={<TrendingUp size={16} />} label="Taux partage" value={stats.totalCaptures > 0 ? `${shareRate}%` : '—'} accent="pink" />
        </div>
      </AdminCard>

      {isSupabaseConfigured && (
        <AdminCard>
          <SectionHeader
            icon={<Cloud size={15} className="text-sky-400/70" />}
            title="Statistiques cloud"
            action={
              <button onClick={loadCloudStats} disabled={loadingCloud || !isOnline} className="flex items-center gap-1 text-white/30 hover:text-white/60 text-xs disabled:opacity-30">
                {loadingCloud ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rafraîchir
              </button>
            }
          />
          {!isOnline ? (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-white/30 text-sm">
              <CloudOff size={16} /> Hors ligne — statistiques cloud indisponibles
            </div>
          ) : cloudStats ? (
            <div className="grid grid-cols-3 gap-3">
              <AdminStatCard icon={<Cloud size={16} />} label="Total cloud" value={cloudStats.total} accent="sky" />
              <AdminStatCard icon={<Share2 size={16} />} label="Partagés" value={cloudStats.shared} accent="emerald" />
              <AdminStatCard icon={<Calendar size={16} />} label="Aujourd'hui" value={cloudStats.today} accent="purple" />
            </div>
          ) : (
            <div className="flex items-center justify-center p-8">
              <Loader size={20} className="text-white/20 animate-spin" />
            </div>
          )}
        </AdminCard>
      )}

      <AdminCard>
        <SectionHeader icon={<Upload size={15} className="text-yellow-400/70" />} title="Statut uploads" />
        <div className="grid grid-cols-3 gap-3">
          <AdminStatCard icon={<Cloud size={16} />} label="Uploadés" value={stats.cloudCaptures} accent="emerald" />
          <AdminStatCard
            icon={uploadingCount > 0 ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
            label="En attente"
            value={stats.pendingUploads}
            accent="yellow"
          />
          <AdminStatCard icon={<Activity size={16} />} label="Erreurs" value={errorCount} accent="pink" />
        </div>
      </AdminCard>

      <AdminCard>
        <SectionHeader icon={<Activity size={15} className="text-indigo-400/70" />} title="Activité par heure" />
        <p className="text-white/30 text-xs mb-4">12 dernières heures</p>
        <div className="flex items-end gap-1.5 h-28">
          {hourlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                <div
                  className="w-full rounded-t theme-accent-bg transition-all duration-500"
                  style={{ height: `${(d.count / maxHourly) * 100}%`, minHeight: d.count > 0 ? '4px' : '0', opacity: d.count > 0 ? 1 : 0.12 }}
                />
              </div>
              <span className="text-white/25 text-[10px]">{d.hour}h</span>
            </div>
          ))}
        </div>
      </AdminCard>

      {captures.length > 0 && (
        <AdminCard>
          <SectionHeader icon={<Camera size={15} className="text-white/40" />} title="Captures récentes" />
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {captures.slice(0, 12).map(c => {
              const upSt = uploadStates[c.id];
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{c.eventName}</p>
                    <p className="text-white/35 text-xs">
                      {new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-white/40 text-xs">{c.duration}s</span>
                    {upSt?.status === 'uploading' && <AdminBadge tone="accent"><Loader size={9} className="animate-spin" /> {upSt.progress}%</AdminBadge>}
                    {c.shared && <AdminBadge tone="purple">partage</AdminBadge>}
                    {c.uploadedToCloud ? <AdminBadge tone="success">cloud</AdminBadge> : <AdminBadge tone="neutral">local</AdminBadge>}
                  </div>
                </div>
              );
            })}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
