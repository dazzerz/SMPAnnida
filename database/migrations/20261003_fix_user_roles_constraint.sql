-- =====================================================================
-- 20261003_fix_user_roles_constraint.sql
--
-- SATU-SATUNYA sumber daftar role yang sah untuk public.user_roles.
-- Migrasi lama (database/migrations/add_pembina_role.sql,
-- supabase/migrations/20260819_rbac_rls.sql,
-- supabase/migrations/update_role_wali_murid.sql) saling menimpa
-- user_roles_role_check dan tidak satu pun mengizinkan 'panitia_ppdb',
-- padahal RLS dan aplikasi (js/core/auth.js) memakai role itu.
--
-- ATURAN:
--   * JANGAN membuat constraint role tandingan di migrasi lain.
--     Role baru? Ubah daftar di file baru yang menggantikan file ini,
--     dengan pola DROP ... IF EXISTS + ADD yang sama.
--   * 'siswa' dan 'student' adalah alias. Keduanya harus tetap diterima
--     selama UI/kode masih memakai keduanya (login menormalisasi
--     'student' -> 'siswa').
--
-- Idempoten: aman dijalankan ulang.
-- Dijalankan MANUAL di Supabase SQL Editor (tidak ada runner otomatis).
-- =====================================================================

-- Pra-cek (opsional, jalankan dulu): baris yang akan MENGGAGALKAN ADD CONSTRAINT.
-- SELECT user_id, role FROM public.user_roles
-- WHERE role IS NOT NULL
--   AND role NOT IN ('admin','teacher','finance','pembina','panitia_ppdb',
--                    'wali_murid','calon_siswa','siswa','student');

BEGIN;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (
  role IN (
    'admin',
    'teacher',
    'finance',
    'pembina',
    'panitia_ppdb',
    'wali_murid',
    'calon_siswa',
    'siswa',
    'student'
  )
);

COMMIT;

-- Verifikasi (jalankan setelah migrasi):
-- SELECT role, count(*) FROM public.user_roles GROUP BY role;
-- SELECT pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conname = 'user_roles_role_check';
