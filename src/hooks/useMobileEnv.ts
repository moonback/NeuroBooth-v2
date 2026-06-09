import { useEffect, useState } from 'react';
import {
  createAmbientLightWatcher,
  isDesktopEnvironment,
  isLandscapeOrientation,
} from '../lib/mobileEnv';

export function useMobileEnv() {
  const [isDesktop, setIsDesktop] = useState(isDesktopEnvironment);
  const [isLandscape, setIsLandscape] = useState(isLandscapeOrientation);
  const [highBrightness, setHighBrightness] = useState(
    () => window.matchMedia('(prefers-contrast: more)').matches,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(isDesktopEnvironment());
    const orientationMq = window.matchMedia('(orientation: landscape)');
    const contrastMq = window.matchMedia('(prefers-contrast: more)');

    const onOrientation = () => setIsLandscape(orientationMq.matches);
    const onContrast = () => setHighBrightness(contrastMq.matches);

    window.addEventListener('resize', onResize);
    orientationMq.addEventListener('change', onOrientation);
    contrastMq.addEventListener('change', onContrast);

    const stopAls = createAmbientLightWatcher((high) => {
      if (high) setHighBrightness(true);
    });

    return () => {
      window.removeEventListener('resize', onResize);
      orientationMq.removeEventListener('change', onOrientation);
      contrastMq.removeEventListener('change', onContrast);
      stopAls?.();
    };
  }, []);

  return { isDesktop, isLandscape, highBrightness };
}
