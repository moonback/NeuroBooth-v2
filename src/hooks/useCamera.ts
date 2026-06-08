import { useState, useEffect, useRef, useCallback, RefObject } from 'react';
import { CameraFacing, VideoQuality, QUALITY_CONSTRAINTS } from '../types';
import { logger } from '../lib/logger';

interface UseCameraOptions {
  facing: CameraFacing;
  quality: VideoQuality;
  soundEnabled: boolean;
}

interface UseCameraReturn {
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => Promise<Blob | null>;
  switchCamera: () => void;
  currentFacing: CameraFacing;
  hasMultipleCameras: boolean;
}

export function useCamera({ facing, quality, soundEnabled }: UseCameraOptions): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentFacing, setCurrentFacing] = useState<CameraFacing>(facing);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const startStream = useCallback(async (facingMode: CameraFacing) => {
    try {
      logger.info('Starting camera stream', { facingMode, quality, soundEnabled });
      if (streamRef.current) {
        logger.debug('Stopping previous camera stream');
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const constraints = QUALITY_CONSTRAINTS[quality];
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { ...constraints, facingMode },
        audio: soundEnabled,
      });
      logger.info('Camera stream started', {
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length,
      });
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const errorMsg = (err as Error).message || 'Camera access denied';
      logger.error('Failed to start camera stream', { error: errorMsg });
      setError(errorMsg);
    }
  }, [quality, soundEnabled]);

  useEffect(() => {
    startStream(currentFacing);
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoCams = devices.filter(d => d.kind === 'videoinput');
      setHasMultipleCameras(videoCams.length > 1);
    }).catch(() => {});
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [currentFacing, startStream]);

  const switchCamera = useCallback(() => {
    const next: CameraFacing = currentFacing === 'user' ? 'environment' : 'user';
    setCurrentFacing(next);
  }, [currentFacing]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      logger.warn('Cannot start recording: no stream available');
      return;
    }
    logger.info('Starting video recording');
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
    logger.debug('Using MIME type for recording', { mimeType });
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.start(100);
    recorderRef.current = recorder;
    setIsRecording(true);
    logger.info('Video recording started successfully');
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      logger.info('Stopping video recording');
      if (!recorder || recorder.state === 'inactive') {
        logger.warn('Recorder is inactive, no video to process');
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        logger.info('Video recording stopped, blob created', {
          size: blob.size,
          mimeType,
          chunkCount: chunksRef.current.length,
        });
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return { videoRef, stream, error, isRecording, startRecording, stopRecording, switchCamera, currentFacing, hasMultipleCameras };
}
