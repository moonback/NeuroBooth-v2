import { useState, useEffect, useRef, useCallback } from 'react';
import { GyroStabilizer } from '../lib/gyroStabilizer';

interface UseStabilizedStreamOptions {
  inputStream: MediaStream | null;
  enabled: boolean;
  mirror: boolean;
  strength: number;
}

interface UseStabilizedStreamReturn {
  outputStream: MediaStream | null;
  isStabilizing: boolean;
  recalibrate: () => void;
}

export function useStabilizedStream({
  inputStream,
  enabled,
  mirror,
  strength,
}: UseStabilizedStreamOptions): UseStabilizedStreamReturn {
  const [outputStream, setOutputStream] = useState<MediaStream | null>(null);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const stabilizerRef = useRef<GyroStabilizer | null>(null);

  const recalibrate = useCallback(() => {
    stabilizerRef.current?.recalibrate();
  }, []);

  useEffect(() => {
    stabilizerRef.current?.stop();
    stabilizerRef.current = null;

    if (!inputStream || !enabled) {
      setOutputStream(inputStream);
      setIsStabilizing(false);
      return;
    }

    let cancelled = false;
    const stabilizer = new GyroStabilizer({ inputStream, mirror, strength });
    stabilizerRef.current = stabilizer;

    stabilizer.start().then(stream => {
      if (cancelled) {
        stabilizer.stop();
        return;
      }
      setOutputStream(stream);
      setIsStabilizing(true);
      stabilizer.recalibrate();
    }).catch(() => {
      if (!cancelled) {
        setOutputStream(inputStream);
        setIsStabilizing(false);
      }
    });

    return () => {
      cancelled = true;
      stabilizer.stop();
      if (stabilizerRef.current === stabilizer) {
        stabilizerRef.current = null;
      }
    };
  }, [inputStream, enabled, mirror, strength]);

  return { outputStream, isStabilizing, recalibrate };
}
