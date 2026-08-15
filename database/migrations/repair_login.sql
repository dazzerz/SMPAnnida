-- =========================================================================
-- MIGRATION: BULK REPAIR LOGIN
-- Jalankan skrip ini HANYA SATU KALI di SQL Editor untuk memperbaiki
-- sekaligus masalah login (huruf besar/kecil & identitas) untuk SEMUA GURU.
-- =========================================================================

-- 1. Paksa semua email di sistem auth menjadi huruf kecil (syarat mutlak Supabase API)
UPDATE auth.users 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- 2. Buat 'KTP' (Identitas) sistem untuk semua guru yang gagal terbuat sebelumnya
INSERT INTO auth.identities (
  id,
  provider_id, 
  user_id, 
  identity_data, 
  provider, 
  created_at, 
  updated_at
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
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
) AND u.email != 'daffa.al.akhdaan@gmail.com';
