-- Migration: Update user_roles check constraint to support 'wali_murid' role
-- Created: 2026-08-20

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'teacher', 'student', 'pembina', 'finance', 'calon_siswa', 'wali_murid'));
