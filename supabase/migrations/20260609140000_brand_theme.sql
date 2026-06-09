-- Phase 3 Design System: Brand theme, display font, screensaver
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS brand_accent_color TEXT NOT NULL DEFAULT '#3b82f6',
  ADD COLUMN IF NOT EXISTS brand_bg_color TEXT NOT NULL DEFAULT '#0a0a0a',
  ADD COLUMN IF NOT EXISTS display_font TEXT NOT NULL DEFAULT 'clash',
  ADD COLUMN IF NOT EXISTS screensaver_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS screensaver_delay_seconds INTEGER NOT NULL DEFAULT 60;
