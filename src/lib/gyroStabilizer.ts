import { logger } from './logger';

export async function requestGyroPermission(): Promise<boolean> {
  if (typeof DeviceOrientationEvent === 'undefined') {
    logger.warn('Gyro: DeviceOrientationEvent not available');
    return false;
  }

  const iosRequest = (
    DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<'granted' | 'denied'> }
  ).requestPermission;

  if (typeof iosRequest === 'function') {
    try {
      const result = await iosRequest();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  return true;
}

export function isGyroAvailable(): boolean {
  return typeof DeviceOrientationEvent !== 'undefined';
}

interface GyroStabilizerOptions {
  inputStream: MediaStream;
  mirror: boolean;
  strength: number;
  fps?: number;
}

interface OrientationState {
  beta: number;
  gamma: number;
}

const CROP_MARGIN = 1.12;
const SMOOTHING = 0.18;

export class GyroStabilizer {
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rafId: number | null = null;
  private orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;
  private outputStream: MediaStream | null = null;
  private baseline: OrientationState | null = null;
  private smoothed: OrientationState = { beta: 0, gamma: 0 };
  private running = false;

  constructor(private options: GyroStabilizerOptions) {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');

    this.canvas = document.createElement('canvas');
    const ctx = this.canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
  }

  async start(): Promise<MediaStream> {
    if (this.running) return this.outputStream!;

    this.video.srcObject = this.options.inputStream;
    await this.video.play();

    const track = this.options.inputStream.getVideoTracks()[0];
    const settings = track?.getSettings();
    this.canvas.width = settings?.width ?? 1280;
    this.canvas.height = settings?.height ?? 720;

    this.baseline = null;
    this.smoothed = { beta: 0, gamma: 0 };

    this.orientationHandler = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      this.smoothed = {
        beta: SMOOTHING * e.beta + (1 - SMOOTHING) * this.smoothed.beta,
        gamma: SMOOTHING * e.gamma + (1 - SMOOTHING) * this.smoothed.gamma,
      };
    };
    window.addEventListener('deviceorientation', this.orientationHandler, true);

    const fps = this.options.fps ?? 30;
    this.outputStream = this.canvas.captureStream(fps);

    const audioTracks = this.options.inputStream.getAudioTracks();
    for (const audio of audioTracks) {
      this.outputStream.addTrack(audio);
    }

    this.running = true;
    this.renderLoop();

    logger.info('Gyro stabilizer started', {
      width: this.canvas.width,
      height: this.canvas.height,
      strength: this.options.strength,
    });

    return this.outputStream;
  }

  recalibrate(): void {
    this.baseline = { ...this.smoothed };
    logger.debug('Gyro stabilizer recalibrated', this.baseline);
  }

  stop(): void {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.orientationHandler) {
      window.removeEventListener('deviceorientation', this.orientationHandler, true);
      this.orientationHandler = null;
    }
    this.video.pause();
    this.video.srcObject = null;
    this.outputStream?.getVideoTracks().forEach(t => t.stop());
    this.outputStream = null;
    this.baseline = null;
  }

  private renderLoop = (): void => {
    if (!this.running) return;

    if (this.video.readyState >= 2) {
      this.drawFrame();
    }

    this.rafId = requestAnimationFrame(this.renderLoop);
  };

  private drawFrame(): void {
    const { ctx, canvas, video } = this;
    const strength = Math.max(0.1, Math.min(1, this.options.strength));

    if (!this.baseline) {
      this.baseline = { ...this.smoothed };
    }

    const deltaBeta = this.smoothed.beta - this.baseline.beta;
    const deltaGamma = this.smoothed.gamma - this.baseline.gamma;

    const maxShiftX = canvas.width * 0.06 * strength;
    const maxShiftY = canvas.height * 0.06 * strength;
    const shiftX = (deltaGamma / 45) * maxShiftX;
    const shiftY = (deltaBeta / 45) * maxShiftY;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    if (this.options.mirror) {
      ctx.scale(-1, 1);
    }

    ctx.translate(-shiftX, -shiftY);
    ctx.scale(CROP_MARGIN, CROP_MARGIN);

    const vw = video.videoWidth || canvas.width;
    const vh = video.videoHeight || canvas.height;
    const scale = Math.max(canvas.width / vw, canvas.height / vh);
    const dw = vw * scale;
    const dh = vh * scale;

    ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }
}
