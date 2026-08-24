-- MIGRATION: Ganti Password Semua Guru Secara Massal
-- Jalankan skrip ini jika Anda ingin mengubah / menyeragamkan password semua guru

UPDATE auth.users
SET 
  encrypted_password = crypt('abc123', gen_salt('bf')),
  updated_at = now()
WHERE email IN (
  SELECT LOWER(email) 
  FROM public.teachers 
  WHERE email IS NOT NULL AND email != ''
) 
AND LOWER(email) != 'daffa.al.akhdaan@gmail.com';
