-- =========================================================================
-- MIGRATION: HAPUS SEMUA AKUN GURU DENGAN AMAN
-- Menghapus semua akun (kecuali Admin) dari bawah ke atas agar tidak kena error Foreign Key
-- =========================================================================

-- 1. Hapus dari public.profiles terlebih dahulu (Ini penyebab error saat Anda hapus manual)
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email != 'daffa.al.akhdaan@gmail.com'
);

-- 2. Hapus identitas login (auth.identities)
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email != 'daffa.al.akhdaan@gmail.com'
);

-- 3. Baru Hapus akun utamanya dari auth.users
DELETE FROM auth.users 
WHERE email != 'daffa.al.akhdaan@gmail.com';
