import type { CSSProperties } from 'react';
import type { DisplayFont, Settings } from '../types';

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return `rgba(59, 130, 246, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mixHex(hex: string, mix: number): string {
  const h = hex.replace('#', '');
  if (h.length !== 6) return '#1a1a1a';
  const mixChannel = (c: number) => Math.round(c + (255 - c) * mix);
  const r = mixChannel(parseInt(h.slice(0, 2), 16));
  const g = mixChannel(parseInt(h.slice(2, 4), 16));
  const b = mixChannel(parseInt(h.slice(4, 6), 16));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export const DISPLAY_FONT_STACKS: Record<DisplayFont, string> = {
  inter: "'Inter', system-ui, -apple-system, sans-serif",
  satoshi: "'Satoshi', 'Inter', system-ui, sans-serif",
  clash: "'Clash Display', 'Inter', system-ui, sans-serif",
};

export function getDisplayFontFamily(font: DisplayFont): string {
  return DISPLAY_FONT_STACKS[font] ?? DISPLAY_FONT_STACKS.inter;
}

/** Variables CSS dynamiques pour le thème Brand (D5) */
export function getBrandThemeVars(settings: Settings): CSSProperties {
  const accent = settings.brandAccentColor || '#3b82f6';
  const bg = settings.brandBgColor || '#0a0a0a';

  return {
    '--accent': accent,
    '--accent-glow': hexToRgba(accent, 0.3),
    '--accent-dim': hexToRgba(accent, 0.15),
    '--bg': bg,
    '--bg-card': mixHex(bg, 0.12),
    '--ring-color': hexToRgba(accent, 0.08),
    '--font-display': getDisplayFontFamily(settings.displayFont),
  } as CSSProperties;
}

export function getAppThemeStyle(settings: Settings): CSSProperties {
  const base: CSSProperties = {
    '--font-display': getDisplayFontFamily(settings.displayFont),
  } as CSSProperties;

  if (settings.theme === 'brand') {
    return { ...base, ...getBrandThemeVars(settings) };
  }

  return base;
}
