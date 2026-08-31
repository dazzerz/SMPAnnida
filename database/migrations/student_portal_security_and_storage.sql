-- =========================================================================
-- MIGRATION: STUDENT PORTAL SECURITY HARDENING & STORAGE RLS POLICIES
-- SMP Annida Integrated System
-- =========================================================================

-- 1. SETUP STORAGE BUCKET: student-assignments (Maks 5MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-assignments',
  'student-assignments',
  false,
  5242880, -- 5 MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- 2. STORAGE RLS POLICIES FOR student-assignments
DROP POLICY IF EXISTS "student_assignments_upload_policy" ON storage.objects;
CREATE POLICY "student_assignments_upload_policy" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'student-assignments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "student_assignments_select_policy" ON storage.objects;
CREATE POLICY "student_assignments_select_policy" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'student-assignments' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
);

DROP POLICY IF EXISTS "student_assignments_delete_policy" ON storage.objects;
CREATE POLICY "student_assignments_delete_policy" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'student-assignments' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
);

-- 3. HARDENING RLS UNTUK ATTENDANCE_STUDENTS (Presensi Siswa)
ALTER TABLE IF EXISTS public.attendance_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_students_read_policy" ON public.attendance_students;
CREATE POLICY "attendance_students_read_policy" ON public.attendance_students
FOR SELECT TO authenticated
USING (
  -- Guru, Admin, Pembina
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
  -- Siswa hanya bisa membaca presensinya sendiri
  OR student_id IN (
    SELECT id FROM public.students 
    WHERE user_id = auth.uid() OR email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "attendance_students_write_policy" ON public.attendance_students;
CREATE POLICY "attendance_students_write_policy" ON public.attendance_students
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- 4. HARDENING RLS UNTUK GRADES (Nilai Akademik)
ALTER TABLE IF EXISTS public.grades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "grades_read_policy" ON public.grades;
CREATE POLICY "grades_read_policy" ON public.grades
FOR SELECT TO authenticated
USING (
  -- Guru, Admin, Pembina
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
  -- Siswa hanya bisa membaca nilainya sendiri
  OR student_id IN (
    SELECT id FROM public.students 
    WHERE user_id = auth.uid() OR email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "grades_write_policy" ON public.grades;
CREATE POLICY "grades_write_policy" ON public.grades
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- 5. HARDENING RLS UNTUK TEACHER_JOURNALS (Jurnal Materi Guru)
ALTER TABLE IF EXISTS public.teacher_journals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_journals_read_policy" ON public.teacher_journals;
CREATE POLICY "teacher_journals_read_policy" ON public.teacher_journals
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "teacher_journals_write_policy" ON public.teacher_journals;
CREATE POLICY "teacher_journals_write_policy" ON public.teacher_journals
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

-- 6. HARDENING RLS UNTUK STUDENT_TAHFIDZ_RECORDS (Tracker Tahfidz)
CREATE TABLE IF NOT EXISTS public.student_tahfidz_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  juz INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
  surah_ayat TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('Ziyadah', 'Muraja''ah')),
  kelancaran TEXT NOT NULL CHECK (kelancaran IN ('Lancar (Mumtaz)', 'Cukup (Jayyid)', 'Perlu Diulang (Dho''if)')),
  catatan TEXT,
  musyrif_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE IF EXISTS public.student_tahfidz_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tahfidz_read_policy" ON public.student_tahfidz_records;
CREATE POLICY "tahfidz_read_policy" ON public.student_tahfidz_records
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
  OR student_id IN (
    SELECT id FROM public.students 
    WHERE user_id = auth.uid() OR email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "tahfidz_write_policy" ON public.student_tahfidz_records;
CREATE POLICY "tahfidz_write_policy" ON public.student_tahfidz_records
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
);
