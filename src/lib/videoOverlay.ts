export interface VideoOverlayConfig {
  watermarkText?: string;
  eventLogoDataUrl?: string;
}

const logoCache = new Map<string, HTMLImageElement>();

export async function preloadOverlayAssets(
  config: VideoOverlayConfig,
): Promise<HTMLImageElement | null> {
  if (!config.eventLogoDataUrl) return null;

  const cached = logoCache.get(config.eventLogoDataUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      logoCache.set(config.eventLogoDataUrl!, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = config.eventLogoDataUrl;
  });
}

function measureLogo(
  logoImage: HTMLImageElement,
  width: number,
  height: number,
): { w: number; h: number } {
  const logoMaxW = width * 0.18;
  const logoMaxH = height * 0.08;
  const scale = Math.min(logoMaxW / logoImage.width, logoMaxH / logoImage.height, 1);
  return { w: logoImage.width * scale, h: logoImage.height * scale };
}

export function drawVideoOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: VideoOverlayConfig,
  logoImage: HTMLImageElement | null,
): void {
  const padding = Math.round(Math.min(width, height) * 0.03);
  const gap = Math.round(padding * 0.6);
  const bottom = height - padding;

  let logoW = 0;
  let logoH = 0;

  if (logoImage) {
    const size = measureLogo(logoImage, width, height);
    logoW = size.w;
    logoH = size.h;
    const x = padding;
    const y = bottom - logoH;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logoImage, x, y, logoW, logoH);
    ctx.restore();
  }

  if (config.watermarkText) {
    const fontSize = Math.max(11, Math.round(width * 0.02));
    ctx.save();
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.textBaseline = 'bottom';

    if (logoImage) {
      ctx.textAlign = 'left';
      ctx.fillText(config.watermarkText, padding + logoW + gap, bottom);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(config.watermarkText, width - padding, bottom);
    }

    ctx.restore();
  }
}
