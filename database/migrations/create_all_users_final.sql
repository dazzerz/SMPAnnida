-- =========================================================================
-- MIGRATION: BUAT ULANG SEMUA AKUN GURU (VERSI KOMPLIT)
-- =========================================================================

-- 1. Buat Akun di auth.users dengan format field yang LENGKAP
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
  LOWER(t.email), 
  crypt('abc123', gen_salt('bf')),
  now(), 
  '{"provider":"email","providers":["email"]}', 
  json_build_object('full_name', t.nama), 
  now(), 
  now(),
  '', 
  '', 
  '', 
  ''
FROM public.teachers t
WHERE t.email IS NOT NULL AND t.email != ''
AND NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.email = LOWER(t.email)
);

-- 2. Buat auth.identities untuk kelancaran login
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  u.id::text, 
  u.id, 
  json_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true), 
  'email', 
  now(), 
  now()
FROM auth.users u
WHERE u.email != 'daffa.al.akhdaan@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);

-- 3. Hubungkan ke public.profiles
INSERT INTO public.profiles (id, full_name, avatar_url, currency)
SELECT 
  u.id, t.nama, NULL, 'IDR'
FROM auth.users u
JOIN public.teachers t ON u.email = LOWER(t.email)
WHERE u.email != 'daffa.al.akhdaan@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
