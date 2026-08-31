-- =========================================================================
-- MIGRATION: HARDENING TOTAL RLS POLICIES (DEFENSIVE SECURITY COMPLIANCE)
-- SMP Annida Integrated System
-- =========================================================================

-- 1. PASTIKAN RLS AKTIF DI SEMUA TABEL
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.biodata_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.data_orangtua ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dokumen_pendaftar ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES KETAT UNTUK ATTENDANCE_STUDENTS
DROP POLICY IF EXISTS "attendance_read_policy" ON public.attendance_students;
CREATE POLICY "attendance_read_policy" ON public.attendance_students
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
);

DROP POLICY IF EXISTS "attendance_write_policy" ON public.attendance_students;
CREATE POLICY "attendance_write_policy" ON public.attendance_students
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- 3. POLICIES KETAT UNTUK TEACHER_JOURNALS
DROP POLICY IF EXISTS "journals_read_policy" ON public.teacher_journals;
CREATE POLICY "journals_read_policy" ON public.teacher_journals
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
);

DROP POLICY IF EXISTS "journals_write_policy" ON public.teacher_journals;
CREATE POLICY "journals_write_policy" ON public.teacher_journals
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- 4. POLICIES KETAT UNTUK PENDAFTARAN & PPDB
DROP POLICY IF EXISTS "pendaftaran_select_policy" ON public.pendaftaran;
CREATE POLICY "pendaftaran_select_policy" ON public.pendaftaran
FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "pendaftaran_write_policy" ON public.pendaftaran;
CREATE POLICY "pendaftaran_write_policy" ON public.pendaftaran
FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
