-- MIGRATION: Fix Email Case di auth.users
-- API Supabase (GoTrue) mencari email dengan huruf kecil. 
-- Karena sebelumnya kita memasukkan email yang mengandung huruf besar, 
-- Supabase gagal menemukan akun tersebut saat login.

-- 1. Ubah semua email di tabel auth.users menjadi huruf kecil
UPDATE auth.users 
SET email = LOWER(email)
WHERE email != LOWER(email);

-- 2. Ubah juga data email di tabel auth.identities agar cocok
UPDATE auth.identities
SET identity_data = jsonb_set(
  identity_data, 
  '{email}', 
  to_jsonb(LOWER(identity_data->>'email'))
)
WHERE identity_data->>'email' != LOWER(identity_data->>'email');
