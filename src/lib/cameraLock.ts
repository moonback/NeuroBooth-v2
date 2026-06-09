import { logger } from './logger';

type TrackCaps = MediaTrackCapabilities & {
  focusMode?: string[];
  focusDistance?: { min: number; max: number };
  exposureMode?: string[];
  exposureCompensation?: { min: number; max: number; step: number };
};

type TrackSettings = MediaTrackSettings & {
  focusMode?: string;
  focusDistance?: number;
  exposureMode?: string;
  exposureCompensation?: number;
};

let lockedTrackId: string | null = null;

async function readCurrentPhotoSettings(
  track: MediaStreamTrack,
): Promise<{ focusDistance?: number; exposureCompensation?: number }> {
  if (!('ImageCapture' in window)) return {};

  try {
    const ic = new ImageCapture(track);
    const photoSettings = await ic.getPhotoSettings();
    return {
      focusDistance: photoSettings.focusDistance,
      exposureCompensation: photoSettings.exposureCompensation,
    };
  } catch {
    return {};
  }
}

function buildLockConstraints(
  caps: TrackCaps,
  settings: TrackSettings,
  photo: { focusDistance?: number; exposureCompensation?: number },
): Record<string, unknown> {
  const adv: Record<string, unknown> = {};
  const focusModes = caps.focusMode ?? [];
  const exposureModes = caps.exposureMode ?? [];

  const focusDistance = photo.focusDistance ?? settings.focusDistance;
  const exposureCompensation = photo.exposureCompensation ?? settings.exposureCompensation;

  if (focusModes.includes('manual')) {
    adv.focusMode = 'manual';
    if (focusDistance != null) adv.focusDistance = focusDistance;
  } else if (focusModes.includes('single-shot')) {
    adv.focusMode = 'single-shot';
  }

  if (exposureModes.includes('manual')) {
    adv.exposureMode = 'manual';
    if (exposureCompensation != null) adv.exposureCompensation = exposureCompensation;
  } else if (exposureModes.includes('single-shot')) {
    adv.exposureMode = 'single-shot';
  }

  return adv;
}

export async function lockFocusAndExposure(stream: MediaStream): Promise<boolean> {
  const track = stream.getVideoTracks()[0];
  if (!track) return false;

  const caps = track.getCapabilities() as TrackCaps;
  const settings = track.getSettings() as TrackSettings;
  const photo = await readCurrentPhotoSettings(track);

  let adv = buildLockConstraints(caps, settings, photo);
  if (Object.keys(adv).length === 0) {
    logger.debug('AF/AE lock: no supported modes on this device');
    return false;
  }

  try {
    if (adv.focusMode === 'single-shot' || adv.exposureMode === 'single-shot') {
      await track.applyConstraints({ advanced: [adv as MediaTrackConstraintSet] });
      await new Promise((r) => setTimeout(r, 350));

      const settled = track.getSettings() as TrackSettings;
      const focusModes = caps.focusMode ?? [];
      const exposureModes = caps.exposureMode ?? [];
      adv = {};

      if (focusModes.includes('manual')) {
        adv.focusMode = 'manual';
        if (settled.focusDistance != null) adv.focusDistance = settled.focusDistance;
      }
      if (exposureModes.includes('manual')) {
        adv.exposureMode = 'manual';
        if (settled.exposureCompensation != null) {
          adv.exposureCompensation = settled.exposureCompensation;
        }
      }
    }

    if (Object.keys(adv).length > 0) {
      await track.applyConstraints({ advanced: [adv as MediaTrackConstraintSet] });
    }

    lockedTrackId = track.id;
    logger.info('AF/AE locked before capture', { constraints: adv });
    return true;
  } catch (err) {
    logger.warn('AF/AE lock failed', { error: (err as Error).message });
    return false;
  }
}

export async function unlockFocusAndExposure(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  if (!track || lockedTrackId !== track.id) return;

  const caps = track.getCapabilities() as TrackCaps;
  const adv: Record<string, unknown> = {};

  if (caps.focusMode?.includes('continuous')) adv.focusMode = 'continuous';
  if (caps.exposureMode?.includes('continuous')) adv.exposureMode = 'continuous';

  try {
    if (Object.keys(adv).length > 0) {
      await track.applyConstraints({ advanced: [adv as MediaTrackConstraintSet] });
    }
    lockedTrackId = null;
    logger.info('AF/AE unlocked after capture');
  } catch (err) {
    logger.warn('AF/AE unlock failed', { error: (err as Error).message });
  }
}

export function isFocusExposureLocked(stream: MediaStream | null): boolean {
  const track = stream?.getVideoTracks()[0];
  return !!track && lockedTrackId === track.id;
}
