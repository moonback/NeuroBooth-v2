import { logger } from './logger';

export interface SlowMotionOptions {
  slowMotionFactor: number; // 0.1 to 1
  slowMotionStartPercent: number; // 0-100
  slowMotionDurationPercent: number; // 0-100
}

export async function applySlowMotion(
  videoBlob: Blob,
  options: SlowMotionOptions,
  originalDurationSeconds: number,
): Promise<Blob> {
  logger.info('Starting slow motion video processing', { options, originalDurationSeconds });
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const originalDuration = originalDurationSeconds;

    video.onloadedmetadata = async () => {
      logger.info('Video metadata loaded', {
        width: video.videoWidth,
        height: video.videoHeight,
        metadataDuration: video.duration,
        usedDuration: originalDuration,
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        const errorMsg = 'Could not get canvas context';
        logger.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const slowStart = (options.slowMotionStartPercent / 100) * originalDuration;
      const slowDuration = (options.slowMotionDurationPercent / 100) * originalDuration;
      const slowEnd = Math.min(slowStart + slowDuration, originalDuration);

      logger.debug('Calculated slow motion timings', {
        originalDuration,
        slowStart,
        slowDuration,
        slowEnd,
      });

      const normalPart1 = slowStart;
      const slowPart = slowDuration / options.slowMotionFactor;
      const normalPart2 = originalDuration - slowEnd;
      const newDuration = normalPart1 + slowPart + normalPart2;
      logger.debug('Estimated new duration after slow motion', { newDuration });

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';
      logger.debug('Using MIME type for processed video', { mimeType });
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        logger.info('Video processing recorder stopped, creating final blob');
        const newBlob = new Blob(chunks, { type: mimeType });
        logger.info('Final slow-motion video blob created', {
          size: newBlob.size,
          mimeType: newBlob.type,
          chunkCount: chunks.length,
        });
        URL.revokeObjectURL(video.src);
        resolve(newBlob);
      };
      recorder.onerror = (err) => {
        logger.error('Video processing recorder error', { error: err });
        reject(err);
      };

      let isRecording = false;
      let animationFrameId: number | null = null;

      const drawFrame = () => {
        if (!isRecording) return;
        ctx.drawImage(video, 0, 0);
        animationFrameId = requestAnimationFrame(drawFrame);
      };

      video.addEventListener('timeupdate', () => {
        // Update playback rate based on current time
        const currentTime = video.currentTime;
        
        if (currentTime >= slowStart && currentTime < slowEnd) {
          if (video.playbackRate !== options.slowMotionFactor) {
            logger.debug('Entering slow motion zone', { currentTime, playbackRate: options.slowMotionFactor });
            video.playbackRate = options.slowMotionFactor;
          }
        } else {
          if (video.playbackRate !== 1) {
            logger.debug('Leaving slow motion zone', { currentTime, playbackRate: 1 });
            video.playbackRate = 1;
          }
        }
      });

      video.addEventListener('ended', () => {
        logger.info('Original video ended, stopping recorder');
        video.pause();
        recorder.stop();
        isRecording = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      });

      const handleCanPlay = async () => {
        logger.info('Video ready, starting processing');
        video.currentTime = 0;
        video.playbackRate = 1;
        
        isRecording = true;
        recorder.start(100);
        drawFrame();
        
        logger.info('Starting video playback for processing');
        await video.play();
      };

      video.addEventListener('canplay', handleCanPlay, { once: true });
    };

    video.onerror = (err) => {
      logger.error('Video element error during slow motion processing', { error: err });
      reject(err);
    };
  });
}
