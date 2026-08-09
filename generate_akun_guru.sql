-- ================================================================
-- MIGRATION: Auto Create Akun Guru ke Supabase Auth
-- Menambahkan semua guru yang memiliki email ke tabel auth.users
-- ================================================================

-- 0. Pastikan kolom auth_email sudah ada di tabel teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS auth_email VARCHAR(255);

-- 1. Tambahkan ke auth.users (Pastikan ekstensi pgcrypto aktif, default Supabase sudah aktif)
INSERT INTO auth.users (
  instance_id, 
  id, 
  aud, 
  role, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  raw_app_meta_data, 
  raw_user_meta_data, 
  created_at, 
  updated_at, 
  confirmation_token, 
  email_change, 
  email_change_token_new, 
  recovery_token
)
SELECT 
  '00000000-0000-0000-0000-000000000000', 
  gen_random_uuid(), 
  'authenticated', 
  'authenticated', 
  t.email, 
  crypt(t.nama, gen_salt('bf')), -- Password mengikuti nama guru
  now(), -- Otomatis terkonfirmasi tanpa klik link email
  '{"provider":"email","providers":["email"]}', 
  json_build_object('full_name', t.nama), 
  now(), 
  now(), 
  '', 
  '', 
  '', 
  ''
FROM public.teachers t
WHERE t.email IS NOT NULL 
  AND t.email != ''
  -- Pastikan tidak duplikat dengan akun yang sudah ada
  AND NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = t.email
  );

-- 2. Tambahkan ke auth.identities (Dibutuhkan oleh Supabase untuk proses login)
INSERT INTO auth.identities (
  provider_id, 
  user_id, 
  identity_data, 
  provider, 
  created_at, 
  updated_at
)
SELECT 
  u.id::text, 
  u.id, 
  json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 
  'email', 
  now(), 
  now()
FROM auth.users u
JOIN public.teachers t ON u.email = t.email
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- 3. (Opsional tapi direkomendasikan) 
-- Update kolom auth_email di tabel teachers dengan email yang terdaftar
UPDATE public.teachers 
SET auth_email = email 
WHERE auth_email IS NULL OR auth_email = '';
