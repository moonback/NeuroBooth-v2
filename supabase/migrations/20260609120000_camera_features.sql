-- Ultra-wide and gyro stabilization settings
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS ultra_wide_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gyro_stabilization_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gyro_stabilization_strength NUMERIC NOT NULL DEFAULT 0.7;
