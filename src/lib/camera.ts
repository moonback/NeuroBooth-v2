import { CameraFacing } from '../types';
import { logger } from './logger';

interface ZoomMediaTrackCapabilities extends MediaTrackCapabilities {
  zoom?: {
    min?: number;
    max?: number;
    step?: number;
  };
}

interface ZoomMediaTrackSettings extends MediaTrackSettings {
  deviceId?: string;
  zoom?: number;
}

type ZoomMediaTrackConstraintSet = MediaTrackConstraintSet & {
  zoom?: ConstrainDouble;
};

type ZoomMediaTrackConstraints = MediaTrackConstraints & {
  advanced?: ZoomMediaTrackConstraintSet[];
};

interface PreferredCameraStreamOptions {
  videoConstraints: MediaTrackConstraints;
  facingMode: CameraFacing;
  audio: boolean;
}

const ULTRA_WIDE_LABEL_PATTERNS = [
  /ultra[\s-]?wide/i,
  /ultrawide/i,
  /ultra[\s-]?grand[\s-]?angle/i,
  /grand[\s-]?angle/i,
  /0[,.]5\s*x/i,
];

function isUltraWideLabel(label: string) {
  return ULTRA_WIDE_LABEL_PATTERNS.some(pattern => pattern.test(label));
}

async function findNativeUltraWideDeviceId(facingMode: CameraFacing): Promise<string | null> {
  if (facingMode !== 'environment') return null;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const ultraWideCamera = devices.find(device => (
      device.kind === 'videoinput' && isUltraWideLabel(device.label)
    ));

    return ultraWideCamera?.deviceId ?? null;
  } catch (error) {
    logger.debug('Unable to enumerate cameras for ultra-wide selection', { error });
    return null;
  }
}

async function applyWidestAvailableZoom(stream: MediaStream, facingMode: CameraFacing) {
  if (facingMode !== 'environment') return;

  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack?.getCapabilities || !videoTrack.applyConstraints) return;

  const capabilities = videoTrack.getCapabilities() as ZoomMediaTrackCapabilities;
  const minZoom = capabilities.zoom?.min;

  if (typeof minZoom !== 'number' || minZoom >= 1) return;

  try {
    await videoTrack.applyConstraints({
      advanced: [{ zoom: minZoom }],
    } as ZoomMediaTrackConstraints);

    const settings = videoTrack.getSettings() as ZoomMediaTrackSettings;
    logger.info('Applied widest supported camera zoom', {
      minZoom,
      currentZoom: settings.zoom,
    });
  } catch (error) {
    logger.debug('Unable to apply ultra-wide zoom constraint', { error, minZoom });
  }
}

function withFacingMode(
  videoConstraints: MediaTrackConstraints,
  facingMode: CameraFacing,
): MediaTrackConstraints {
  return {
    ...videoConstraints,
    facingMode: facingMode === 'environment' ? { ideal: 'environment' } : { ideal: 'user' },
  };
}

async function requestCameraStream(
  video: MediaTrackConstraints,
  audio: boolean,
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({ video, audio });
}

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop());
}

async function requestNativeUltraWideStream(
  deviceId: string,
  videoConstraints: MediaTrackConstraints,
  audio: boolean,
): Promise<MediaStream | null> {
  try {
    logger.info('Using native ultra-wide camera device', { deviceId });
    return await requestCameraStream({
      ...videoConstraints,
      deviceId: { exact: deviceId },
    }, audio);
  } catch (error) {
    logger.debug('Unable to open exact native ultra-wide camera device', { error, deviceId });
    return null;
  }
}

export async function getPreferredCameraStream({
  videoConstraints,
  facingMode,
  audio,
}: PreferredCameraStreamOptions): Promise<MediaStream> {
  const nativeUltraWideDeviceId = await findNativeUltraWideDeviceId(facingMode);
  const nativeUltraWideStream = nativeUltraWideDeviceId
    ? await requestNativeUltraWideStream(nativeUltraWideDeviceId, videoConstraints, audio)
    : null;

  if (nativeUltraWideStream) {
    await applyWidestAvailableZoom(nativeUltraWideStream, facingMode);
    return nativeUltraWideStream;
  }

  const stream = await requestCameraStream(withFacingMode(videoConstraints, facingMode), audio);

  const postPermissionUltraWideDeviceId = await findNativeUltraWideDeviceId(facingMode);
  const currentDeviceId = (stream.getVideoTracks()[0]?.getSettings() as ZoomMediaTrackSettings | undefined)?.deviceId;

  if (postPermissionUltraWideDeviceId && postPermissionUltraWideDeviceId !== currentDeviceId) {
    const exactUltraWideStream = await requestNativeUltraWideStream(
      postPermissionUltraWideDeviceId,
      videoConstraints,
      audio,
    );

    if (exactUltraWideStream) {
      stopStream(stream);
      await applyWidestAvailableZoom(exactUltraWideStream, facingMode);
      return exactUltraWideStream;
    }
  }

  await applyWidestAvailableZoom(stream, facingMode);

  return stream;
}
