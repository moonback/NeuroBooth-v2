import { useState, useEffect } from 'react';
import { useMotor } from '../../hooks/useMotor';
import { Settings } from '../../types';
import {
  Usb,
  Bluetooth,
  PowerOff,
  Play,
  Square,
  RotateCcw,
  RotateCw,
  AlertCircle,
  Loader,
} from 'lucide-react';

interface MotorPanelProps {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function MotorPanel({ settings, updateSettings }: MotorPanelProps) {
  const motor = useMotor();
  const [localSpeed, setLocalSpeed] = useState(settings.motorSpeed);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setLocalSpeed(settings.motorSpeed);
  }, [settings.motorSpeed]);

  const handleSpeedChange = async (speed: number) => {
    setLocalSpeed(speed);
    updateSettings({ motorSpeed: speed });
    if (motor.isConnected && isRunning) {
      await motor.setSpeed(speed);
    }
  };

  const handleDirectionChange = async (dir: 'cw' | 'ccw') => {
    updateSettings({ motorDirection: dir });
    if (motor.isConnected) {
      await motor.setDirection(dir);
    }
  };

  const handleStart = async () => {
    await motor.startMotor(localSpeed, settings.motorDirection);
    setIsRunning(true);
  };

  const handleStop = async () => {
    await motor.stopMotor();
    setIsRunning(false);
  };

  const handleDisconnect = () => {
    motor.disconnect();
    setIsRunning(false);
  };

  const handleCustomCommand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = (e.currentTarget.elements.namedItem('cmd') as HTMLInputElement);
    if (input.value.trim()) {
      await motor.sendCommand(input.value.trim());
      input.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
        <div>
          <p className="text-white font-medium">Plateau motorise ESP32</p>
          <p className="text-white/40 text-sm">Synchronisation avec l'enregistrement</p>
        </div>
        <button
          onClick={() => updateSettings({ motorEnabled: !settings.motorEnabled })}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${settings.motorEnabled ? 'theme-accent-bg' : 'bg-white/10'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${settings.motorEnabled ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {settings.motorEnabled && (
        <>
          {/* Connection */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white/70 text-sm font-medium mb-4">Connexion</h3>

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
                    Connecte via {motor.connectionType === 'serial' ? 'WebSerial' : 'Bluetooth'}
                  </span>
                </div>
                <button onClick={handleDisconnect}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm">
                  <PowerOff size={14} /> Deconnecter
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={motor.connectSerial}
                  disabled={motor.connecting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                >
                  {motor.connecting ? <Loader size={16} className="animate-spin" /> : <Usb size={16} />}
                  WebSerial (USB)
                </button>
                <button
                  onClick={motor.connectBluetooth}
                  disabled={motor.connecting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all text-sm font-medium disabled:opacity-50"
                >
                  {motor.connecting ? <Loader size={16} className="animate-spin" /> : <Bluetooth size={16} />}
                  Bluetooth BLE
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white/70 text-sm font-medium mb-4">Controles</h3>

            {/* Speed */}
            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">
                Vitesse: <span className="text-white font-semibold">{localSpeed}%</span>
              </label>
              <input
                type="range" min="0" max="100" value={localSpeed}
                onChange={e => handleSpeedChange(+e.target.value)}
                className="admin-range w-full"
              />
              <div className="flex justify-between text-white/30 text-xs mt-1">
                <span>Arret</span><span>Mi-vitesse</span><span>Max</span>
              </div>
            </div>

            {/* Direction */}
            <div className="mb-5">
              <label className="block text-white/70 text-sm mb-2">Direction</label>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDirectionChange('cw')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                    settings.motorDirection === 'cw'
                      ? 'theme-accent-bg border-transparent text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}>
                  <RotateCw size={16} /> Horaire
                </button>
                <button
                  onClick={() => handleDirectionChange('ccw')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all border ${
                    settings.motorDirection === 'ccw'
                      ? 'theme-accent-bg border-transparent text-white'
                      : 'border-white/10 text-white/50 hover:border-white/30'
                  }`}>
                  <RotateCcw size={16} /> Anti-horaire
                </button>
              </div>
            </div>

            {/* Sync */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white/70 text-sm">Sync. avec enregistrement</p>
                <p className="text-white/30 text-xs">Demarre et arrete avec la capture</p>
              </div>
              <button
                onClick={() => updateSettings({ motorSyncRecording: !settings.motorSyncRecording })}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.motorSyncRecording ? 'theme-accent-bg' : 'bg-white/10'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.motorSyncRecording ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>

            {/* Manual control */}
            <div className="flex gap-3">
              <button
                onClick={handleStart}
                disabled={!motor.isConnected || isRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl theme-accent-bg text-white font-medium disabled:opacity-30 hover:opacity-90 transition-opacity text-sm">
                <Play size={16} /> Demarrer
              </button>
              <button
                onClick={handleStop}
                disabled={!motor.isConnected || !isRunning}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600/60 text-white font-medium disabled:opacity-30 hover:bg-red-600/80 transition-colors text-sm">
                <Square size={16} fill="white" /> Arreter
              </button>
            </div>
          </div>

          {/* Custom command */}
          {motor.isConnected && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-white/70 text-sm font-medium mb-3">Commande manuelle</h3>
              <form onSubmit={handleCustomCommand} className="flex gap-3">
                <input
                  name="cmd"
                  type="text"
                  placeholder="ex: SPEED:75 ou STOP"
                  className="admin-input flex-1 font-mono"
                />
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl theme-accent-bg text-white text-sm font-medium hover:opacity-90 transition-opacity">
                  Envoyer
                </button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                {['START', 'STOP', 'SPEED:50', 'DIR:CW', 'DIR:CCW', 'RESET'].map(cmd => (
                  <button key={cmd} onClick={() => motor.sendCommand(cmd)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-xs font-mono transition-colors">
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
