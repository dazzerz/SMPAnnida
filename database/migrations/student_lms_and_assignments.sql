-- =========================================================================
-- MIGRATION: STUDENT LMS, ASSIGNMENTS & STUDY MATERIALS
-- SMP Annida Integrated System
-- =========================================================================

-- 1. TABEL ASSIGNMENTS (Tugas & Materi Pembelajaran Guru)
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    class_name TEXT NOT NULL,          -- '7A', '7B', '8A', '8B', '9A', '9B', atau 'Semua'
    subject TEXT NOT NULL,             -- Contoh: 'Matematika', 'PAI', 'Bahasa Arab', 'IPA'
    title TEXT NOT NULL,
    description TEXT,
    attachment_url TEXT,              -- File lampiran soal/materi dari guru
    attachment_name TEXT,
    deadline TIMESTAMPTZ,              -- Tenggat waktu pengumpulan
    type TEXT DEFAULT 'assignment',    -- 'assignment' (tugas) | 'material' (materi ajar)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index performa query
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_name);
CREATE INDEX IF NOT EXISTS idx_assignments_created ON public.assignments(created_at DESC);

-- 2. TABEL ASSIGNMENT SUBMISSIONS (Pengumpulan Tugas Siswa)
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    file_url TEXT NOT NULL,            -- Path di storage bucket 'student-assignments'
    file_name TEXT NOT NULL,
    file_size INT,
    notes TEXT,                        -- Catatan jawaban dari siswa
    score NUMERIC(5,2),                -- Nilai dari guru (0 - 100)
    feedback TEXT,                     -- Catatan koreksi dari guru
    status TEXT DEFAULT 'submitted',   -- 'submitted' | 'graded' | 'resubmit_required'
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    UNIQUE(assignment_id, student_id)
);

-- Index performa query
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.assignment_submissions(student_id);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

-- RLS untuk tabel assignments
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_read_policy" ON public.assignments;
CREATE POLICY "assignments_read_policy" ON public.assignments
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "assignments_write_policy" ON public.assignments;
CREATE POLICY "assignments_write_policy" ON public.assignments
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
);

-- RLS untuk tabel assignment_submissions
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "submissions_read_policy" ON public.assignment_submissions;
CREATE POLICY "submissions_read_policy" ON public.assignment_submissions
FOR SELECT TO authenticated
USING (
  -- Guru & Admin membaca semua pengumpulan
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
  )
  -- Siswa hanya membaca pengumpulannya sendiri
  OR student_user_id = auth.uid()
  OR student_id IN (
    SELECT id FROM public.students 
    WHERE user_id = auth.uid() OR email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

DROP POLICY IF EXISTS "submissions_insert_policy" ON public.assignment_submissions;
CREATE POLICY "submissions_insert_policy" ON public.assignment_submissions
FOR INSERT TO authenticated
WITH CHECK (
  student_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);

DROP POLICY IF EXISTS "submissions_update_policy" ON public.assignment_submissions;
CREATE POLICY "submissions_update_policy" ON public.assignment_submissions
FOR UPDATE TO authenticated
USING (
  -- Siswa mengupdate submission sendiri (jika belum dinilai)
  student_user_id = auth.uid()
  -- Guru/Admin menilai tugas
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  )
);
