-- =========================================================================
-- PERBAIKAN P0: SECURITY ROLES & UNIQUE CONSTRAINTS
-- =========================================================================

-- 1. BUAT TABEL USER ROLES
-- Tabel ini menggantikan validasi Hardcoded Email untuk menentukan Admin.
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role text NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    created_at timestamp with time zone DEFAULT now()
);

-- Masukkan akun Admin secara otomatis (Mengubah email Daffa menjadi Admin di tabel)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'daffa.al.akhdaan@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- Tambahkan RLS agar user_roles bisa dibaca dengan aman
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read user_roles" ON public.user_roles;
CREATE POLICY "Users can read user_roles" 
ON public.user_roles FOR SELECT 
USING (auth.role() = 'authenticated');

-- =========================================================================

-- 2. PERBAIKAN RLS TEACHER_JOURNALS (Ganti email hardcoded)
-- Hapus policy lama yang rentan
DROP POLICY IF EXISTS "Admins can view all journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admin can insert, update, delete all journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can update journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can delete journals" ON public.teacher_journals;

-- Buat policy baru yang mengambil hak dari tabel user_roles
CREATE POLICY "Admins can insert journals" 
ON public.teacher_journals FOR INSERT 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update journals" 
ON public.teacher_journals FOR UPDATE 
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete journals" 
ON public.teacher_journals FOR DELETE 
USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- (Catatan: Hak SELECT untuk semua jurnal sudah diatur di "Authenticated users can view all journals")

-- =========================================================================

-- 3. UNIQUE CONSTRAINTS (ANTI-DUPLIKAT ABSOLUT)
-- Mencegah entri ganda atau bentrok langsung dari jantung database

-- A. Untuk Jurnal: Tidak boleh ada kelas yang sama belajar jam yang sama di tanggal yang sama.
ALTER TABLE public.teacher_journals
DROP CONSTRAINT IF EXISTS teacher_journals_unique_entry;

ALTER TABLE public.teacher_journals
ADD CONSTRAINT teacher_journals_unique_entry UNIQUE (date, class_id, jam_pelajaran);

-- B. Untuk Jadwal (Kelas): Tidak boleh ada 2 mapel berbeda di hari dan jam yang sama untuk 1 kelas
ALTER TABLE public.class_schedules
DROP CONSTRAINT IF EXISTS class_schedules_unique_class_time;

ALTER TABLE public.class_schedules
ADD CONSTRAINT class_schedules_unique_class_time UNIQUE (academic_year_id, class_id, day_of_week, start_time);

-- C. Untuk Jadwal (Guru): Tidak boleh ada guru yang disuruh ngajar di 2 kelas di hari & jam yang sama
ALTER TABLE public.class_schedules
DROP CONSTRAINT IF EXISTS class_schedules_unique_teacher_time;

ALTER TABLE public.class_schedules
ADD CONSTRAINT class_schedules_unique_teacher_time UNIQUE (academic_year_id, teacher_id, day_of_week, start_time);

-- =========================================================================
-- SELESAI
-- Pastikan muncul tulisan "Success" di Supabase saat skrip ini dijalankan.
