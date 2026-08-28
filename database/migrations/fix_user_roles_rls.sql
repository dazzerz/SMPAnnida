-- =========================================================================
-- PERBAIKAN RLS: KEBIJAKAN AKSES KETAT PADA TABEL USER_ROLES
-- =========================================================================

-- Pastikan RLS aktif pada tabel user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Hapus policy SELECT lama yang terlalu permisif (auth.role() = 'authenticated')
DROP POLICY IF EXISTS "Users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role or admins can view all" ON public.user_roles;

-- Buat policy SELECT baru:
-- 1. Pengguna hanya dapat melihat baris perannya sendiri (user_id = auth.uid())
-- 2. Admin dapat melihat seluruh daftar role pengguna lain
CREATE POLICY "Users can view own role or admins can view all"
ON public.user_roles FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_roles admin_check
        WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
    )
);

-- Policy untuk Admin mengelola user_roles (Insert, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
CREATE POLICY "Admins can manage user_roles"
ON public.user_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles admin_check
        WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
    )
);
