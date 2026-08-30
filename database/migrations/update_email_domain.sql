-- =========================================================================
-- MIGRATION: Update Domain Email Akun dari @annidasetu.com ke @smpannida.sch.id
-- Menyelaraskan seluruh akun di auth.users, auth.identities, teachers, & profiles
-- =========================================================================

-- 1. Update tabel auth.users di Supabase
UPDATE auth.users 
SET 
  email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id'),
  raw_user_meta_data = CASE 
    WHEN raw_user_meta_data ? 'email' 
    THEN jsonb_set(raw_user_meta_data, '{email}', to_jsonb(REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id')))
    ELSE raw_user_meta_data 
  END,
  updated_at = NOW()
WHERE email LIKE '%@annidasetu.com';

-- 2. Update tabel auth.identities (Dibutuhkan Supabase Auth untuk mencocokkan kredensial login)
UPDATE auth.identities 
SET 
  email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id'),
  identity_data = CASE 
    WHEN identity_data ? 'email' 
    THEN jsonb_set(identity_data, '{email}', to_jsonb(REPLACE(LOWER(identity_data->>'email'), '@annidasetu.com', '@smpannida.sch.id')))
    ELSE identity_data 
  END,
  updated_at = NOW()
WHERE email LIKE '%@annidasetu.com' 
   OR identity_data->>'email' LIKE '%@annidasetu.com';

-- 3. Update tabel teachers (Guru & Tenaga Pendidik)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teachers') THEN
    UPDATE public.teachers 
    SET 
      email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id'),
      auth_email = REPLACE(LOWER(auth_email), '@annidasetu.com', '@smpannida.sch.id')
    WHERE email LIKE '%@annidasetu.com' OR auth_email LIKE '%@annidasetu.com';
  END IF;
END $$;

-- 4. Update tabel guru (jika ada alias/tabel terpisah)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'guru') THEN
    UPDATE public.guru 
    SET email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id')
    WHERE email LIKE '%@annidasetu.com';
  END IF;
END $$;

-- 5. Update tabel profiles & data_orangtua (jika ada field email)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
  ) THEN
    UPDATE public.profiles 
    SET email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id')
    WHERE email LIKE '%@annidasetu.com';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'data_orangtua' AND column_name = 'email'
  ) THEN
    UPDATE public.data_orangtua 
    SET email = REPLACE(LOWER(email), '@annidasetu.com', '@smpannida.sch.id')
    WHERE email LIKE '%@annidasetu.com';
  END IF;
END $$;

-- 6. Verifikasi Hasil
SELECT id, email, created_at, updated_at FROM auth.users WHERE email LIKE '%@smpannida.sch.id';
