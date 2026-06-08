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

    // Fallback duration in case video metadata isn't available
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

      // Calculate timings using the known duration from capture
      const slowStart = (options.slowMotionStartPercent / 100) * originalDuration;
      const slowDuration = (options.slowMotionDurationPercent / 100) * originalDuration;
      const slowEnd = Math.min(slowStart + slowDuration, originalDuration);

      logger.debug('Calculated slow motion timings', {
        originalDuration,
        slowStart,
        slowDuration,
        slowEnd,
      });

      // Calculate new total duration
      const normalPart1 = slowStart;
      const slowPart = slowDuration / options.slowMotionFactor;
      const normalPart2 = originalDuration - slowEnd;
      const newDuration = normalPart1 + slowPart + normalPart2;
      logger.debug('Estimated new duration after slow motion', { newDuration });

      // Use MediaRecorder to record the new video
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

      // Start recording and process frames with precise timing
      let lastTime = performance.now() / 1000;
      let isRecording = false;
      let elapsed = 0;
      let frameCount = 0;
      const targetFPS = 30;
      const frameInterval = 1 / targetFPS;

      const processFrame = () => {
        if (!isRecording) return;
        const now = performance.now() / 1000;
        const delta = now - lastTime;
        lastTime = now;
        elapsed += delta;

        // Calculate playback time mapping
        let playbackTime: number;
        if (elapsed < normalPart1) {
          playbackTime = elapsed;
        } else if (elapsed < normalPart1 + slowPart) {
          const slowElapsed = elapsed - normalPart1;
          playbackTime = slowStart + slowElapsed * options.slowMotionFactor;
        } else {
          const normal2Elapsed = elapsed - (normalPart1 + slowPart);
          playbackTime = slowEnd + normal2Elapsed;
        }

        // Stop if we've reached the end of the video
        if (playbackTime >= originalDuration) {
          logger.info('Video processing reached end, stopping recorder', {
            elapsed,
            newDuration,
            frameCount,
          });
          video.pause();
          recorder.stop();
          isRecording = false;
          return;
        }

        // Only seek to new positions to minimize seek operations
        const frame = Math.floor(playbackTime * targetFPS);
        const targetTime = frame / targetFPS;
        
        // Update video and draw frame
        if (Math.abs(video.currentTime - targetTime) > 0.05) {
          video.currentTime = Math.max(0, Math.min(targetTime, originalDuration));
        } else {
          ctx.drawImage(video, 0, 0);
        }

        // Schedule next frame
        frameCount++;
        setTimeout(processFrame, frameInterval * 1000);
      };

      video.onseeked = () => {
        if (!isRecording) return;
        ctx.drawImage(video, 0, 0);
      };

      // Preload video by playing it briefly to get correct duration
      logger.info('Preloading video to ensure duration is accurate');
      video.currentTime = 0;
      video.playbackRate = 4; // Fast forward preload
      
      const handleCanPlay = async () => {
        video.pause();
        video.playbackRate = 1;
        video.currentTime = 0;
        
        // Start everything
        logger.info('Starting video processing recording');
        isRecording = true;
        recorder.start(100);
        
        // Kick off frame processing after a short delay
        setTimeout(processFrame, 100);
      };
      
      // Add canplay listener to know when video is ready
      video.addEventListener('canplay', handleCanPlay, { once: true });
    };

    video.onerror = (err) => {
      logger.error('Video element error during slow motion processing', { error: err });
      reject(err);
    };
  });
}
