export type AppScreen = 'welcome' | 'countdown' | 'capture' | 'preview' | 'admin';

export type VideoQuality = 'low' | 'medium' | 'high' | '4k';

export type AppTheme = 'dark' | 'neon' | 'elegant' | 'party' | 'brand' | 'desktop';

export type DisplayFont = 'inter' | 'satoshi' | 'clash';

export type CameraFacing = 'user' | 'environment';

export type MotorDirection = 'cw' | 'ccw';

export type MotorConnectionType = 'serial' | 'bluetooth' | 'none';

export interface Settings {
  eventName: string;
  eventLogo: string; // base64 data URL
  captureDuration: number; // seconds
  countdownDuration: number; // seconds
  videoQuality: VideoQuality;
  soundEnabled: boolean;
  theme: AppTheme;
  kioskMode: boolean;
  kioskPin: string;
  motorEnabled: boolean;
  motorSpeed: number; // 0-100
  motorDirection: MotorDirection;
  motorSyncRecording: boolean;
  cameraFacing: CameraFacing;
  showWatermark: boolean;
  watermarkText: string;
  slowMotionEnabled: boolean;
  slowMotionFactor: number; // 0.1 to 1 (1 is normal speed)
  slowMotionStartPercent: number; // 0 to 100 (percent of video where slow motion starts)
  slowMotionDurationPercent: number; // 0 to 100 (percent of total video duration to slow down)
  ultraWideEnabled: boolean;
  gyroStabilizationEnabled: boolean;
  gyroStabilizationStrength: number; // 0.3 to 1.0
  brandAccentColor: string;
  brandBgColor: string;
  displayFont: DisplayFont;
  screensaverEnabled: boolean;
  screensaverDelaySeconds: number;
  lockAfAeEnabled: boolean;
  micVolume: number; // 0-100
}

export interface CaptureRecord {
  id: string;
  eventName: string;
  videoBlob?: Blob;
  videoUrl?: string; // Supabase URL after upload
  thumbnailUrl?: string;
  duration: number;
  shared: boolean;
  createdAt: Date;
  uploadedToCloud: boolean;
}

export interface Stats {
  totalCaptures: number;
  totalShared: number;
  capturesThisHour: number;
  capturesToday: number;
  averageDuration: number;
  pendingUploads: number;
  cloudCaptures: number;
}

export const QUALITY_CONSTRAINTS: Record<VideoQuality, MediaTrackConstraints> = {
  low:    { width: 640,  height: 480,  frameRate: 24 },
  medium: { width: 1280, height: 720,  frameRate: 30 },
  high:   { width: 1920, height: 1080, frameRate: 30 },
  '4k':   { width: 3840, height: 2160, frameRate: 30 },
};

export const DEFAULT_SETTINGS: Settings = {
  eventName: 'NeuroBooth 360',
  eventLogo: '',
  captureDuration: 10,
  countdownDuration: 3,
  videoQuality: 'high',
  soundEnabled: true,
  theme: 'dark',
  kioskMode: false,
  kioskPin: '1234',
  motorEnabled: false,
  motorSpeed: 50,
  motorDirection: 'cw',
  motorSyncRecording: true,
  cameraFacing: 'user',
  showWatermark: false,
  watermarkText: '',
  slowMotionEnabled: true,
  slowMotionFactor: 0.5, // Half speed
  slowMotionStartPercent: 50, // Start at middle of video
  slowMotionDurationPercent: 50, // Slow down 50% of video
  ultraWideEnabled: false,
  gyroStabilizationEnabled: false,
  gyroStabilizationStrength: 0.7,
  brandAccentColor: '#3b82f6',
  brandBgColor: '#0a0a0a',
  displayFont: 'clash',
  screensaverEnabled: true,
  screensaverDelaySeconds: 60,
  lockAfAeEnabled: true,
  micVolume: 100,
};
