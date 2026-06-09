import { logger } from './logger';
import {
  VideoOverlayConfig,
  drawVideoOverlays,
  preloadOverlayAssets,
} from './videoOverlay';

export interface SlowMotionOptions {
  slowMotionFactor: number;
  slowMotionStartPercent: number;
  slowMotionDurationPercent: number;
}

export interface VideoProcessOptions {
  overlays?: VideoOverlayConfig;
  slowMotion?: SlowMotionOptions;
}

function pickMimeType(): string {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  return 'video/mp4';
}

export function computeSlowMotionDuration(
  originalDurationSeconds: number,
  options: SlowMotionOptions,
): number {
  const slowStart = (options.slowMotionStartPercent / 100) * originalDurationSeconds;
  const slowDuration = (options.slowMotionDurationPercent / 100) * originalDurationSeconds;
  const slowEnd = Math.min(slowStart + slowDuration, originalDurationSeconds);
  const normalPart1 = slowStart;
  const slowPart = slowDuration / options.slowMotionFactor;
  const normalPart2 = originalDurationSeconds - slowEnd;
  return normalPart1 + slowPart + normalPart2;
}

export async function processVideo(
  videoBlob: Blob,
  options: VideoProcessOptions,
  originalDurationSeconds: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  const hasOverlays = !!(
    options.overlays?.watermarkText || options.overlays?.eventLogoDataUrl
  );
  const hasSlowMotion = !!options.slowMotion;

  if (!hasOverlays && !hasSlowMotion) return videoBlob;

  logger.info('Starting video post-processing', {
    hasOverlays,
    hasSlowMotion,
    originalDurationSeconds,
  });

  const logoImage = hasOverlays && options.overlays
    ? await preloadOverlayAssets(options.overlays)
    : null;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const originalDuration = originalDurationSeconds;
    const slowOpts = options.slowMotion;
    const slowStart = slowOpts
      ? (slowOpts.slowMotionStartPercent / 100) * originalDuration
      : 0;
    const slowDuration = slowOpts
      ? (slowOpts.slowMotionDurationPercent / 100) * originalDuration
      : 0;
    const slowEnd = slowOpts
      ? Math.min(slowStart + slowDuration, originalDuration)
      : 0;
    const normalPart1 = slowStart;
    const slowPart = slowOpts ? slowDuration / slowOpts.slowMotionFactor : 0;
    const newDuration = slowOpts
      ? computeSlowMotionDuration(originalDuration, slowOpts)
      : originalDuration;

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const mimeType = pickMimeType();
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const newBlob = new Blob(chunks, { type: mimeType });
        URL.revokeObjectURL(video.src);
        logger.info('Video post-processing complete', { size: newBlob.size, mimeType });
        resolve(newBlob);
      };

      recorder.onerror = (err) => reject(err);

      let isRecording = false;
      let animationFrameId: number | null = null;

      const drawFrame = () => {
        if (!isRecording) return;
        ctx.drawImage(video, 0, 0);
        if (hasOverlays && options.overlays) {
          drawVideoOverlays(ctx, canvas.width, canvas.height, options.overlays, logoImage);
        }
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      if (hasSlowMotion && slowOpts) {
        video.addEventListener('timeupdate', () => {
          const currentTime = video.currentTime;
          let processedTime = 0;

          if (currentTime < slowStart) {
            processedTime = currentTime;
          } else if (currentTime < slowEnd) {
            processedTime = normalPart1 + (currentTime - slowStart) / slowOpts.slowMotionFactor;
          } else {
            processedTime = normalPart1 + slowPart + (currentTime - slowEnd);
          }

          onProgress?.(Math.min(100, Math.max(0, (processedTime / newDuration) * 100)));

          if (currentTime >= slowStart && currentTime < slowEnd) {
            if (video.playbackRate !== slowOpts.slowMotionFactor) {
              video.playbackRate = slowOpts.slowMotionFactor;
            }
          } else if (video.playbackRate !== 1) {
            video.playbackRate = 1;
          }
        });
      } else {
        video.addEventListener('timeupdate', () => {
          const progress = Math.min(100, (video.currentTime / originalDuration) * 100);
          onProgress?.(progress);
        });
      }

      video.addEventListener('ended', () => {
        onProgress?.(100);
        video.pause();
        recorder.stop();
        isRecording = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      });

      video.addEventListener('canplay', async () => {
        video.currentTime = 0;
        video.playbackRate = 1;
        isRecording = true;
        recorder.start(100);
        drawFrame();
        await video.play();
      }, { once: true });
    };

    video.onerror = () => reject(new Error('Video element error during processing'));
  });
}

/** @deprecated Use processVideo instead */
export async function applySlowMotion(
  videoBlob: Blob,
  options: SlowMotionOptions,
  originalDurationSeconds: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> {
  return processVideo(
    videoBlob,
    { slowMotion: options },
    originalDurationSeconds,
    onProgress,
  );
}
