
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photobooth-videos',
  'photobooth-videos',
  true,
  52428800, -- 50MB
  ARRAY['video/webm', 'video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Pour configurer les politiques RLS du bucket, utilisez le Dashboard Supabase:
-- 1. Allez dans Storage > photobooth-videos
-- 2. Cliquez sur "Policies"
-- 3. Ajoutez ces politiques:
--
--    Policy 1: Allow public uploads
--    - Name: allow_public_uploads
--    - Allowed operation: INSERT
--    - Policy definition: bucket_id = 'photobooth-videos'
--    - Target roles: anon, authenticated
--
--    Policy 2: Allow public reads
--    - Name: allow_public_reads
--    - Allowed operation: SELECT
--    - Policy definition: bucket_id = 'photobooth-videos'
--    - Target roles: anon, authenticated
--
--    Policy 3: Allow public deletes
--    - Name: allow_public_deletes
--    - Allowed operation: DELETE
--    - Policy definition: bucket_id = 'photobooth-videos'
--    - Target roles: anon, authenticated
