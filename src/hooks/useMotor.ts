import { useState, useRef, useCallback } from 'react';
import { MotorDirection, MotorConnectionType } from '../types';

interface UseMotorReturn {
  connectionType: MotorConnectionType;
  isConnected: boolean;
  connecting: boolean;
  connectSerial: () => Promise<void>;
  connectBluetooth: () => Promise<void>;
  disconnect: () => void;
  sendCommand: (cmd: string) => Promise<void>;
  startMotor: (speed: number, direction: MotorDirection) => Promise<void>;
  stopMotor: () => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
  setDirection: (direction: MotorDirection) => Promise<void>;
  error: string | null;
}

export function useMotor(): UseMotorReturn {
  const [connectionType, setConnectionType] = useState<MotorConnectionType>('none');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serialPortRef = useRef<SerialPort | null>(null);
  const serialWriterRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const bleCharRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const bleDeviceRef = useRef<BluetoothDevice | null>(null);

  const sendCommand = useCallback(async (cmd: string) => {
    const encoded = new TextEncoder().encode(cmd + '\n');
    try {
      if (connectionType === 'serial' && serialWriterRef.current) {
        await serialWriterRef.current.write(encoded);
      } else if (connectionType === 'bluetooth' && bleCharRef.current) {
        await bleCharRef.current.writeValue(encoded);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }, [connectionType]);

  const connectSerial = useCallback(async () => {
    if (!('serial' in navigator)) {
      setError('WebSerial non supporté sur ce navigateur');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const port = await (navigator as Navigator & { serial: { requestPort: () => Promise<SerialPort> } }).serial.requestPort();
      await port.open({ baudRate: 115200 });
      serialPortRef.current = port;
      const writer = port.writable!.getWriter();
      serialWriterRef.current = writer;
      setConnectionType('serial');
      setIsConnected(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const connectBluetooth = useCallback(async () => {
    if (!('bluetooth' in navigator)) {
      setError('Web Bluetooth non supporté');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Photobooth' }, { namePrefix: 'ESP32' }],
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'], // Nordic UART
      });
      bleDeviceRef.current = device;
      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      const char = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      bleCharRef.current = char;
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setConnectionType('none');
      });
      setConnectionType('bluetooth');
      setIsConnected(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    try {
      serialWriterRef.current?.releaseLock();
      serialPortRef.current?.close();
      bleDeviceRef.current?.gatt?.disconnect();
    } catch {}
    serialPortRef.current = null;
    serialWriterRef.current = null;
    bleCharRef.current = null;
    bleDeviceRef.current = null;
    setIsConnected(false);
    setConnectionType('none');
    setError(null);
  }, []);

  const startMotor = useCallback(async (speed: number, direction: MotorDirection) => {
    await sendCommand(`DIR:${direction.toUpperCase()}`);
    await sendCommand(`SPEED:${speed}`);
    await sendCommand('START');
  }, [sendCommand]);

  const stopMotor = useCallback(async () => {
    await sendCommand('STOP');
  }, [sendCommand]);

  const setSpeed = useCallback(async (speed: number) => {
    await sendCommand(`SPEED:${speed}`);
  }, [sendCommand]);

  const setDirection = useCallback(async (direction: MotorDirection) => {
    await sendCommand(`DIR:${direction.toUpperCase()}`);
  }, [sendCommand]);

  return {
    connectionType, isConnected, connecting,
    connectSerial, connectBluetooth, disconnect,
    sendCommand, startMotor, stopMotor, setSpeed, setDirection,
    error,
  };
}

// Extend navigator types
declare global {
  interface Navigator {
    bluetooth: {
      requestDevice: (options: RequestDeviceOptions) => Promise<BluetoothDevice>;
    };
  }
  interface SerialPort {
    open: (options: { baudRate: number }) => Promise<void>;
    close: () => Promise<void>;
    writable: WritableStream<Uint8Array> | null;
  }
  interface RequestDeviceOptions {
    filters?: Array<{ namePrefix?: string; services?: string[] }>;
    optionalServices?: string[];
  }
  interface BluetoothDevice {
    gatt: { 
      connect: () => Promise<{ getPrimaryService: (uuid: string) => Promise<{ getCharacteristic: (uuid: string) => Promise<BluetoothRemoteGATTCharacteristic> }> }>;
      disconnect: () => void;
    } | null;
    addEventListener: (type: string, listener: () => void) => void;
  }
  interface BluetoothRemoteGATTCharacteristic {
    writeValue: (value: Uint8Array) => Promise<void>;
  }
}
