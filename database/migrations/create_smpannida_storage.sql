-- Create a new storage bucket for LMS materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('smpannida_storage', 'smpannida_storage', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
DROP POLICY IF EXISTS "Public Access LMS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads LMS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Updates LMS" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Deletes LMS" ON storage.objects;

CREATE POLICY "Public Access LMS" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'smpannida_storage');

CREATE POLICY "Authenticated Uploads LMS" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'smpannida_storage');

CREATE POLICY "Authenticated Updates LMS" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'smpannida_storage');

CREATE POLICY "Authenticated Deletes LMS" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'smpannida_storage');

