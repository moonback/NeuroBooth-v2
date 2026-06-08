
-- Captures table
CREATE TABLE captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE captures ENABLE ROW LEVEL SECURITY;

-- Public read (gallery display on kiosk)
CREATE POLICY "select_captures" ON captures FOR SELECT
  TO anon, authenticated USING (true);

-- Public insert (guest creates capture)
CREATE POLICY "insert_captures" ON captures FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Public update (mark as shared)
CREATE POLICY "update_captures" ON captures FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_captures" ON captures FOR DELETE
  TO anon, authenticated USING (true);

-- Index for ordering
CREATE INDEX captures_created_at_idx ON captures (created_at DESC);
