import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20;

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })
  : null;

export const BUCKET = 'photobooth-videos';

// Row type matching our DB schema
export interface CaptureRow {
  id: string;
  event_name: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  shared: boolean;
  created_at: string;
}

export interface SettingsRow {
  id: string;
  event_name: string;
  event_logo: string | null;
  capture_duration: number;
  countdown_duration: number;
  video_quality: string;
  sound_enabled: boolean;
  theme: string;
  kiosk_mode: boolean;
  kiosk_pin: string;
  motor_enabled: boolean;
  motor_speed: number;
  motor_direction: string;
  motor_sync_recording: boolean;
  camera_facing: string;
  show_watermark: boolean;
  watermark_text: string;
  slow_motion_enabled: boolean;
  slow_motion_factor: number;
  slow_motion_start_percent: number;
  slow_motion_duration_percent: number;
  ultra_wide_enabled: boolean;
  gyro_stabilization_enabled: boolean;
  gyro_stabilization_strength: number;
  updated_at: string;
}
