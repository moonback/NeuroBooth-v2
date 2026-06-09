const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/** Navigateurs cibles : iOS Safari 17+, Chrome Android 120+ */
export function isMobileUserAgent(): boolean {
  return MOBILE_UA.test(navigator.userAgent);
}

export function hasCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/** Desktop non supporté — tablettes tactiles étroites autorisées */
export function isDesktopEnvironment(): boolean {
  if (isMobileUserAgent()) return false;
  const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  if (touchCapable && window.innerWidth <= 820) return false;
  return !hasCoarsePointer() && window.innerWidth > 768;
}

export function isLandscapeOrientation(): boolean {
  return window.matchMedia('(orientation: landscape)').matches;
}

/** Luminosité ambiante élevée (extérieur) — API expérimentale, géré par useMobileEnv */
export function createAmbientLightWatcher(onChange: (high: boolean) => void): (() => void) | null {
  const ALS = (window as Window & { AmbientLightSensor?: new () => { illuminance: number; onreading: (() => void) | null; start: () => void; stop: () => void } }).AmbientLightSensor;
  if (!ALS) return null;

  try {
    const sensor = new ALS();
    sensor.onreading = () => onChange(sensor.illuminance > 10000);
    sensor.start();
    return () => sensor.stop();
  } catch {
    return null;
  }
}
