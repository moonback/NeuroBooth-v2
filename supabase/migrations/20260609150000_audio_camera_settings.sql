-- AF/AE lock and microphone volume settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS lock_af_ae_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS mic_volume INTEGER NOT NULL DEFAULT 100;
