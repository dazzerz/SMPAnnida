-- =========================================================================
-- MIGRATION: SKEMA PORTAL SISWA & INTEGRASI PPDB (FASE 1)
-- SMP Annida Integrated System
-- =========================================================================

-- 1. EXTEND TABEL STUDENTS
ALTER TABLE IF EXISTS public.students 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pendaftaran_id UUID REFERENCES public.pendaftaran(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- 2. EXTEND TABEL PENDAFTARAN (PPDB)
ALTER TABLE IF EXISTS public.pendaftaran 
  ADD COLUMN IF NOT EXISTS status_akademik VARCHAR DEFAULT 'calon';

-- 3. BUAT TABEL TAHFIDZ SISWA (JIKA BELUM ADA)
CREATE TABLE IF NOT EXISTS public.student_tahfidz_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    juz INT NOT NULL,
    surah_mulai VARCHAR(100) NOT NULL,
    ayat_mulai INT,
    surah_selesai VARCHAR(100) NOT NULL,
    ayat_selesai INT,
    kategori VARCHAR(50) NOT NULL DEFAULT 'Ziyadah',
    nilai_kelancaran VARCHAR(10) DEFAULT 'A',
    catatan TEXT,
    pembimbing_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENABLE RLS & DEFENSIVE POLICIES
ALTER TABLE public.student_tahfidz_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tahfidz_read_policy" ON public.student_tahfidz_records;
CREATE POLICY "tahfidz_read_policy" ON public.student_tahfidz_records
FOR SELECT TO authenticated
USING (
  student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina'))
);

DROP POLICY IF EXISTS "tahfidz_write_policy" ON public.student_tahfidz_records;
CREATE POLICY "tahfidz_write_policy" ON public.student_tahfidz_records
FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);
