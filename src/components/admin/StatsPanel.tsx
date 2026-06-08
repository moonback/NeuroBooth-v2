import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { fetchCloudStats } from '../../lib/storage';
import { isSupabaseConfigured } from '../../lib/supabase';
import {
  Camera, Share2, Clock, TrendingUp, Activity, Calendar,
  Cloud, CloudOff, Upload, RefreshCw, Loader,
} from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Local stats grid */}
      <div>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Statistiques locales</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard icon={<Camera size={18} />} label="Total" value={stats.totalCaptures} color="blue" />
          <StatCard icon={<Share2 size={18} />} label="Partagés" value={stats.totalShared} color="emerald" />
          <StatCard icon={<Activity size={18} />} label="Cette heure" value={stats.capturesThisHour} color="yellow" />
          <StatCard icon={<Calendar size={18} />} label="Aujourd'hui" value={stats.capturesToday} color="purple" />
          <StatCard icon={<Clock size={18} />} label="Durée moy." value={`${stats.averageDuration}s`} color="orange" />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Taux partage"
            value={stats.totalCaptures > 0 ? `${Math.round((stats.totalShared / stats.totalCaptures) * 100)}%` : '—'}
            color="pink"
          />
        </div>
      </div>

      {/* Cloud stats */}
      {isSupabaseConfigured && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white/40 text-xs uppercase tracking-widest">Statistiques cloud</h3>
            <button
              onClick={loadCloudStats}
              disabled={loadingCloud || !isOnline}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors disabled:opacity-30"
            >
              {loadingCloud ? <Loader size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              Rafraîchir
            </button>
          </div>

          {!isOnline ? (
            <div className="flex items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 text-white/30 text-sm">
              <CloudOff size={16} /> Hors ligne — statistiques cloud indisponibles
            </div>
          ) : cloudStats ? (
            <div className="grid grid-cols-3 gap-3">
              <CloudStatCard label="Total cloud" value={cloudStats.total} icon={<Cloud size={16} />} />
              <CloudStatCard label="Partagés" value={cloudStats.shared} icon={<Share2 size={16} />} />
              <CloudStatCard label="Aujourd'hui" value={cloudStats.today} icon={<Calendar size={16} />} />
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10">
              <Loader size={20} className="text-white/20 animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Upload status */}
      <div>
        <h3 className="text-white/40 text-xs uppercase tracking-widest mb-3">Statut uploads</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-1"><Cloud size={14} /> Uploadés</div>
            <p className="text-2xl font-black text-white">{stats.cloudCaptures}</p>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-1.5 text-yellow-400 text-xs mb-1">
              {uploadingCount > 0 ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
              En attente
            </div>
            <p className="text-2xl font-black text-white">{stats.pendingUploads}</p>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1.5 text-red-400 text-xs mb-1"><Activity size={14} /> Erreurs</div>
            <p className="text-2xl font-black text-white">{errorCount}</p>
          </div>
        </div>
      </div>

      {/* Hourly chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-white/70 text-sm font-medium mb-5">Activité par heure (12 dernières heures)</h3>
        <div className="flex items-end gap-1.5 h-28">
          {hourlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-end justify-center" style={{ height: '88px' }}>
                <div
                  className="w-full rounded-t theme-accent-bg transition-all duration-500"
                  style={{
                    height: `${(d.count / maxHourly) * 100}%`,
                    minHeight: d.count > 0 ? '4px' : '0',
                    opacity: d.count > 0 ? 1 : 0.12,
                  }}
                />
              </div>
              <span className="text-white/25 text-xs">{d.hour}h</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent list */}
      {captures.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white/70 text-sm font-medium mb-4">Captures récentes</h3>
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {captures.slice(0, 12).map(c => {
              const upSt = uploadStates[c.id];
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-white text-sm truncate max-w-[160px]">{c.eventName}</p>
                    <p className="text-white/35 text-xs">
                      {new Date(c.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-white/40 text-xs">{c.duration}s</span>
                    {upSt?.status === 'uploading' && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1">
                        <Loader size={9} className="animate-spin" />{upSt.progress}%
                      </span>
                    )}
                    {c.shared && <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs">partage</span>}
                    {c.uploadedToCloud
                      ? <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs">cloud</span>
                      : <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/25 text-xs">local</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-500/10 border-blue-500/20 text-blue-400',
    emerald:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
    pink:   'bg-pink-500/10 border-pink-500/20 text-pink-400',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center gap-1.5 mb-2 opacity-70">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function CloudStatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
      <div className="flex items-center gap-1.5 mb-2 text-sky-400 opacity-70">{icon}<span className="text-xs uppercase tracking-wide">{label}</span></div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}
