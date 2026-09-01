
-- Create a new storage bucket for attendance photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attendance_photos', 'attendance_photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;

CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'attendance_photos');

CREATE POLICY "Authenticated Uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'attendance_photos');

CREATE POLICY "Authenticated Updates" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'attendance_photos');
