import { CameraFacing, VideoQuality, QUALITY_CONSTRAINTS } from '../types';
import { logger } from './logger';

const WIDE_LABEL_PATTERNS = [/ultra[\s-]?wide/i, /\bwide\b/i, /grand[\s-]?angle/i, /0\.5x/i, /angle\s*ultra/i];

type ZoomCapabilities = MediaTrackCapabilities & { zoom?: { min: number; max: number } };
type ZoomSettings = MediaTrackSettings & { zoom?: number };

export interface CameraAcquisitionResult {
  stream: MediaStream;
  ultraWideActive: boolean;
}

export async function acquireCameraStream(
  facing: CameraFacing,
  quality: VideoQuality,
  options: { ultraWide: boolean; audio: boolean },
): Promise<CameraAcquisitionResult> {
  const base: MediaTrackConstraints = { ...QUALITY_CONSTRAINTS[quality], facingMode: facing };

  if (!options.ultraWide) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: base, audio: options.audio });
    return { stream, ultraWideActive: false };
  }

  // Strategy 1: zoom constraint at capture time (iOS 17+, Chrome Android)
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        ...base,
        // @ts-expect-error zoom not yet in lib.dom MediaTrackConstraints
        zoom: { ideal: 0.5, min: 0.5 },
      },
      audio: options.audio,
    });
    const applied = await applyMinZoom(stream);
    if (applied) {
      logger.info('Ultra-wide: zoom constraint at capture');
      return { stream, ultraWideActive: true };
    }
    stream.getTracks().forEach(t => t.stop());
  } catch {
    logger.debug('Ultra-wide: zoom-at-capture not supported, trying fallbacks');
  }

  // Strategy 2: dedicated wide-angle lens via deviceId
  const wideDeviceId = await findWideAngleDevice(facing);
  if (wideDeviceId) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { ...base, deviceId: { exact: wideDeviceId } },
        audio: options.audio,
      });
      logger.info('Ultra-wide: dedicated wide-angle device selected');
      return { stream, ultraWideActive: true };
    } catch (err) {
      logger.warn('Ultra-wide: device selection failed', { error: (err as Error).message });
    }
  }

  // Strategy 3: standard stream + applyConstraints zoom
  const stream = await navigator.mediaDevices.getUserMedia({ video: base, audio: options.audio });
  const applied = await applyMinZoom(stream);
  return { stream, ultraWideActive: applied };
}

async function findWideAngleDevice(facing: CameraFacing): Promise<string | null> {
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
    probe.getTracks().forEach(t => t.stop());
  } catch {
    return null;
  }

  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter(d => d.kind === 'videoinput' && d.label);

  const wideDevices = videoDevices.filter(d =>
    WIDE_LABEL_PATTERNS.some(p => p.test(d.label)),
  );

  if (!wideDevices.length) return null;

  const facingPatterns =
    facing === 'environment'
      ? [/back/i, /rear/i, /arrière/i, /environment/i]
      : [/front/i, /selfie/i, /avant/i, /user/i, /facetime/i];

  const matched = wideDevices.find(d => facingPatterns.some(p => p.test(d.label)));
  return (matched ?? wideDevices[0]).deviceId;
}

async function applyMinZoom(stream: MediaStream): Promise<boolean> {
  const track = stream.getVideoTracks()[0];
  if (!track) return false;

  const caps = track.getCapabilities() as ZoomCapabilities;
  if (!caps.zoom || caps.zoom.min >= 1) return false;

  const target = Math.max(caps.zoom.min, Math.min(0.5, caps.zoom.max));
  if (target >= 0.95) return false;

  try {
    await track.applyConstraints({
      // @ts-expect-error zoom not yet in lib.dom
      zoom: target,
    });
    const settings = track.getSettings() as ZoomSettings;
    const active = (settings.zoom ?? 1) < 0.9;
    logger.info('Ultra-wide: zoom applied via applyConstraints', { zoom: settings.zoom, target });
    return active;
  } catch (err) {
    logger.warn('Ultra-wide: applyConstraints zoom failed', { error: (err as Error).message });
    return false;
  }
}

export async function detectUltraWideSupport(facing: CameraFacing): Promise<boolean> {
  try {
    const probe = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } });
    const track = probe.getVideoTracks()[0];
    const caps = track.getCapabilities() as ZoomCapabilities;
    const hasZoom = caps.zoom != null && caps.zoom.min < 1;
    probe.getTracks().forEach(t => t.stop());
    if (hasZoom) return true;
    return (await findWideAngleDevice(facing)) != null;
  } catch {
    return false;
  }
}

export function getActiveZoom(stream: MediaStream | null): number | null {
  const track = stream?.getVideoTracks()[0];
  if (!track) return null;
  const settings = track.getSettings() as ZoomSettings;
  return settings.zoom ?? null;
}
