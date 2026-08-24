-- MIGRATION: Sync Profiles Khusus untuk Guru
-- Ini akan mendeteksi akun guru di auth.users (case-insensitive) dan memasukannya ke profiles

INSERT INTO public.profiles (
  id, 
  full_name, 
  avatar_url, 
  currency
)
SELECT 
  u.id, 
  t.nama, 
  NULL, 
  'IDR'
FROM auth.users u
JOIN public.teachers t ON LOWER(u.email) = LOWER(t.email)
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Memastikan auth_email juga tersinkron
UPDATE public.teachers 
SET auth_email = email 
WHERE auth_email IS NULL OR auth_email = '';
