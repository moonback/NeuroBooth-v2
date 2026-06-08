
-- Settings table
CREATE TABLE settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  event_name TEXT NOT NULL DEFAULT 'Photobooth 360',
  event_logo TEXT, -- base64 data URL
  capture_duration INTEGER NOT NULL DEFAULT 10,
  countdown_duration INTEGER NOT NULL DEFAULT 3,
  video_quality TEXT NOT NULL DEFAULT 'high',
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  theme TEXT NOT NULL DEFAULT 'dark',
  kiosk_mode BOOLEAN NOT NULL DEFAULT false,
  kiosk_pin TEXT NOT NULL DEFAULT '1234',
  motor_enabled BOOLEAN NOT NULL DEFAULT false,
  motor_speed INTEGER NOT NULL DEFAULT 50,
  motor_direction TEXT NOT NULL DEFAULT 'cw',
  motor_sync_recording BOOLEAN NOT NULL DEFAULT true,
  camera_facing TEXT NOT NULL DEFAULT 'environment',
  show_watermark BOOLEAN NOT NULL DEFAULT true,
  watermark_text TEXT NOT NULL DEFAULT '',
  slow_motion_enabled BOOLEAN NOT NULL DEFAULT false,
  slow_motion_factor NUMERIC NOT NULL DEFAULT 0.5,
  slow_motion_start_percent INTEGER NOT NULL DEFAULT 50,
  slow_motion_duration_percent INTEGER NOT NULL DEFAULT 50,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read/write for settings
CREATE POLICY "select_settings" ON settings FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "update_settings" ON settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "insert_settings" ON settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Insert default settings
INSERT INTO settings DEFAULT VALUES;

