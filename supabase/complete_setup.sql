
-- =======================================================
-- NEUROBOOTH COMPLETE DATABASE & STORAGE SETUP
-- =======================================================

-- -------------------------------------------------------
-- 1. CREATE CAPTURES TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL DEFAULT '',
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,
  shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE captures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid errors
DROP POLICY IF EXISTS "select_captures" ON captures;
DROP POLICY IF EXISTS "insert_captures" ON captures;
DROP POLICY IF EXISTS "update_captures" ON captures;
DROP POLICY IF EXISTS "delete_captures" ON captures;

-- RLS Policies for captures table
CREATE POLICY "select_captures" ON captures FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_captures" ON captures FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE POLICY "update_captures" ON captures FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_captures" ON captures FOR DELETE
  TO anon, authenticated USING (true);

-- Index for ordering
CREATE INDEX IF NOT EXISTS captures_created_at_idx ON captures (created_at DESC);

-- -------------------------------------------------------
-- 2. CREATE STORAGE BUCKET (photobooth-videos)
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photobooth-videos',
  'photobooth-videos',
  true,
  52428800, -- 50MB limit
  ARRAY['video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- 3. STORAGE RLS POLICIES
-- -------------------------------------------------------
-- Drop existing storage policies first
DROP POLICY IF EXISTS "allow_public_uploads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_reads" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_deletes" ON storage.objects;
DROP POLICY IF EXISTS "allow_public_updates" ON storage.objects;

-- Allow public uploads
CREATE POLICY "allow_public_uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'photobooth-videos');

-- Allow public reads
CREATE POLICY "allow_public_reads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'photobooth-videos');

-- Allow public deletes
CREATE POLICY "allow_public_deletes"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'photobooth-videos');

-- Allow public updates
CREATE POLICY "allow_public_updates"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'photobooth-videos')
WITH CHECK (bucket_id = 'photobooth-videos');

-- =======================================================
-- SETUP COMPLETE! 🎉
-- =======================================================
