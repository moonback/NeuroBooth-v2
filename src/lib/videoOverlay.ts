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

export function drawVideoOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: VideoOverlayConfig,
  logoImage: HTMLImageElement | null,
): void {
  const padding = Math.round(Math.min(width, height) * 0.03);

  if (config.watermarkText) {
    const fontSize = Math.max(12, Math.round(width * 0.022));
    ctx.save();
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.fillText(config.watermarkText, width - padding, padding);
    ctx.restore();
  }

  if (logoImage) {
    const logoMaxW = width * 0.18;
    const logoMaxH = height * 0.08;
    const scale = Math.min(logoMaxW / logoImage.width, logoMaxH / logoImage.height, 1);
    const w = logoImage.width * scale;
    const h = logoImage.height * scale;
    const x = padding;
    const y = height - padding - h;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.drawImage(logoImage, x, y, w, h);
    ctx.restore();
  }
}
