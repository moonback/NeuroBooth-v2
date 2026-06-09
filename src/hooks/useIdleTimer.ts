import { useCallback, useEffect, useRef, useState } from 'react';

export function useIdleTimer(delayMs: number, enabled: boolean) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  const wake = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!enabled || delayMs <= 0) return;
    timerRef.current = window.setTimeout(() => setIsIdle(true), delayMs);
  }, [delayMs, enabled]);

  useEffect(() => {
    if (!enabled || delayMs <= 0) {
      setIsIdle(false);
      return;
    }

    wake();
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, wake));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wake, enabled, delayMs]);

  return { isIdle, wake };
}
