-- MIGRATION: Fix Auth Identities
-- Memasukkan identitas email yang gagal masuk sebelumnya karena masalah huruf besar/kecil

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
JOIN public.teachers t ON LOWER(u.email) = LOWER(t.email)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i WHERE i.user_id = u.id
);
