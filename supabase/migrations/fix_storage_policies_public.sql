-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Re-create stricter Public Read policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Update: Allow PUBLIC (anon + auth) to upload/update/delete
-- IMPORTANT: This allows anyone with your API key to upload. 
-- Since this is a dashboard, ensure your APP checks permissions if possible.
-- For a quick fix to the "RLS" error, this works.

CREATE POLICY "Public Upload"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'products' );

CREATE POLICY "Public Update"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'products' );

CREATE POLICY "Public Delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'products' );
