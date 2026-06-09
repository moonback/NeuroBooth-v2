import { useState, useEffect } from 'react';
import { useMotor } from '../../hooks/useMotor';
import { Settings } from '../../types';
import {
  Usb, Bluetooth, PowerOff, Play, Square, RotateCcw, RotateCw,
  AlertCircle, Loader, Cpu,
} from 'lucide-react';
import { AdminCard, SectionHeader, SliderRow, ToggleRow, AdminButton } from './ui';

interface MotorPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function MotorPanel({ settings, updateSettings }: MotorPanelProps) {
  const motor = useMotor();
  const [localSpeed, setLocalSpeed] = useState(settings.motorSpeed);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => { setLocalSpeed(settings.motorSpeed); }, [settings.motorSpeed]);

  const handleSpeedChange = async (speed: number) => {
    setLocalSpeed(speed);
    updateSettings({ motorSpeed: speed });
    if (motor.isConnected && isRunning) await motor.setSpeed(speed);
  };

  const handleDirectionChange = async (dir: 'cw' | 'ccw') => {
    updateSettings({ motorDirection: dir });
    if (motor.isConnected) await motor.setDirection(dir);
  };

  const handleStart = async () => {
    await motor.startMotor(localSpeed, settings.motorDirection);
    setIsRunning(true);
  };

  const handleStop = async () => {
    await motor.stopMotor();
    setIsRunning(false);
  };

  const handleCustomCommand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('cmd') as HTMLInputElement;
    if (input.value.trim()) {
      await motor.sendCommand(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <AdminCard glow="radial-gradient(ellipse at top left, rgba(168,85,247,0.05), transparent 60%)">
        <SectionHeader icon={<Cpu size={15} className="text-purple-400/70" />} title="Plateau motorisé ESP32" />
        <ToggleRow
          icon={<Cpu size={14} />}
          title="Activer le plateau"
          sub="Synchronisation avec l'enregistrement vidéo"
          checked={settings.motorEnabled}
          onChange={v => updateSettings({ motorEnabled: v })}
        />
      </AdminCard>

      {settings.motorEnabled && (
        <>
          <AdminCard>
            <SectionHeader icon={<Usb size={15} className="text-emerald-400/70" />} title="Connexion" />
            {motor.error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                <AlertCircle size={16} /> {motor.error}
              </div>
            )}
            {motor.isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  {motor.connectionType === 'serial' ? <Usb size={18} className="text-emerald-400" /> : <Bluetooth size={18} className="text-emerald-400" />}
                  <span className="text-emerald-400 text-sm font-medium">
                    Connecté via {motor.connectionType === 'serial' ? 'WebSerial (USB)' : 'Bluetooth BLE'}
                  </span>
                </div>
                <AdminButton variant="danger" size="sm" onClick={() => { motor.disconnect(); setIsRunning(false); }}>
                  <PowerOff size={14} /> Déconnecter
                </AdminButton>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AdminButton onClick={motor.connectSerial} disabled={motor.connecting}>
                  {motor.connecting ? <Loader size={16} className="animate-spin" /> : <Usb size={16} />} WebSerial (USB)
                </AdminButton>
                <AdminButton onClick={motor.connectBluetooth} disabled={motor.connecting}>
                  {motor.connecting ? <Loader size={16} className="animate-spin" /> : <Bluetooth size={16} />} Bluetooth BLE
                </AdminButton>
              </div>
            )}
          </AdminCard>

          <AdminCard>
            <SectionHeader icon={<RotateCw size={15} className="text-indigo-400/70" />} title="Contrôles" />
            <div className="space-y-4">
              <SliderRow label="Vitesse" value={localSpeed} display={`${localSpeed}%`} min={0} max={100} onChange={handleSpeedChange} />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-2">Direction</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['cw', 'ccw'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => handleDirectionChange(dir)}
                      className={`touch-target flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${
                        settings.motorDirection === dir ? 'theme-accent-bg border-transparent text-white' : 'border-white/[0.06] text-white/50 hover:border-white/15'
                      }`}
                    >
                      {dir === 'cw' ? <RotateCw size={16} /> : <RotateCcw size={16} />}
                      {dir === 'cw' ? 'Horaire' : 'Anti-horaire'}
                    </button>
                  ))}
                </div>
              </div>

              <ToggleRow
                icon={<Play size={14} />}
                title="Sync. avec enregistrement"
                sub="Démarre et arrête automatiquement avec la capture"
                checked={settings.motorSyncRecording}
                onChange={v => updateSettings({ motorSyncRecording: v })}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <AdminButton variant="primary" onClick={handleStart} disabled={!motor.isConnected || isRunning}>
                  <Play size={16} /> Démarrer
                </AdminButton>
                <AdminButton variant="danger" onClick={handleStop} disabled={!motor.isConnected || !isRunning}>
                  <Square size={16} fill="currentColor" /> Arrêter
                </AdminButton>
              </div>
            </div>
          </AdminCard>

          {motor.isConnected && (
            <AdminCard>
              <SectionHeader icon={<Cpu size={15} className="text-white/40" />} title="Commande manuelle" />
              <form onSubmit={handleCustomCommand} className="flex gap-2">
                <input name="cmd" type="text" placeholder="ex: SPEED:75 ou STOP" className="admin-input flex-1 font-mono text-sm" />
                <AdminButton type="submit" variant="primary">Envoyer</AdminButton>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {['START', 'STOP', 'SPEED:50', 'DIR:CW', 'DIR:CCW', 'RESET'].map(cmd => (
                  <button key={cmd} onClick={() => motor.sendCommand(cmd)} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white text-xs font-mono transition-colors">
                    {cmd}
                  </button>
                ))}
              </div>
            </AdminCard>
          )}
        </>
      )}
    </div>
  );
}
