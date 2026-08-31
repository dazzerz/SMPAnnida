-- =========================================================================
-- MIGRATION: CBT ONLINE EXAM (ANTI-CHEAT) & INTERACTIVE E-LEARNING
-- SMP Annida Integrated System
-- =========================================================================

-- 1. TABEL QUIZZES (Ujian / Kuis Online CBT)
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    class_name TEXT NOT NULL,          -- '7A', '7B', '8A', '8B', '9A', '9B', atau 'Semua'
    subject TEXT NOT NULL,             -- 'Matematika', 'PAI', 'Bahasa Arab', dll
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 60,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    shuffle_questions BOOLEAN DEFAULT true,
    shuffle_options BOOLEAN DEFAULT true,
    anti_cheat_enabled BOOLEAN DEFAULT true,
    total_score NUMERIC(5,2) DEFAULT 100,
    status TEXT DEFAULT 'published',   -- 'draft' | 'published' | 'closed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_class ON public.quizzes(class_name);
CREATE INDEX IF NOT EXISTS idx_quizzes_created ON public.quizzes(created_at DESC);

-- 2. TABEL QUIZ_QUESTIONS (Butir Soal CBT)
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_order INT DEFAULT 1,
    type TEXT NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' | 'essay'
    question_text TEXT NOT NULL,
    options JSONB,                     -- [{"key":"A","text":"..."},{"key":"B","text":"..."}]
    correct_key TEXT,                  -- 'A','B','C','D','E'
    points NUMERIC(5,2) DEFAULT 10,
    explanation TEXT,                  -- Pembahasan soal
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);

-- 3. TABEL QUIZ_ATTEMPTS (Pengerjaan & Skor Siswa)
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    answers JSONB DEFAULT '{}',        -- {"q_id_1": "A", "q_id_2": "Jawaban..."}
    tab_switch_count INT DEFAULT 0,    -- Pelanggaran pindah tab
    pg_score NUMERIC(5,2) DEFAULT 0,
    essay_score NUMERIC(5,2) DEFAULT 0,
    total_score NUMERIC(5,2) DEFAULT 0,
    status TEXT DEFAULT 'submitted',   -- 'in_progress' | 'submitted' | 'graded'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    UNIQUE(quiz_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON public.quiz_attempts(student_id);

-- 4. TABEL LEARNING_MODULES (Modul Pembelajaran E-Learning per Bab)
CREATE TABLE IF NOT EXISTS public.learning_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    chapter_title TEXT NOT NULL,       -- Contoh: 'Bab 3: Aljabar dan Persamaan Linier'
    content_html TEXT,                 -- Teori rangkuman materi
    video_url TEXT,                    -- Video YouTube tersemat
    pdf_attachment_url TEXT,           -- File modul bacaan
    linked_quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_modules_class ON public.learning_modules(class_name);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_read_policy" ON public.quizzes;
CREATE POLICY "quizzes_read_policy" ON public.quizzes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "quizzes_write_policy" ON public.quizzes;
CREATE POLICY "quizzes_write_policy" ON public.quizzes FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')));

DROP POLICY IF EXISTS "quiz_questions_read_policy" ON public.quiz_questions;
CREATE POLICY "quiz_questions_read_policy" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "quiz_questions_write_policy" ON public.quiz_questions;
CREATE POLICY "quiz_questions_write_policy" ON public.quiz_questions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')));

DROP POLICY IF EXISTS "quiz_attempts_read_policy" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_read_policy" ON public.quiz_attempts FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina'))
  OR student_user_id = auth.uid()
  OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid() OR email ILIKE (SELECT email FROM auth.users WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "quiz_attempts_write_policy" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_write_policy" ON public.quiz_attempts FOR ALL TO authenticated
USING (
  student_user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher'))
);

DROP POLICY IF EXISTS "learning_modules_read_policy" ON public.learning_modules;
CREATE POLICY "learning_modules_read_policy" ON public.learning_modules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "learning_modules_write_policy" ON public.learning_modules;
CREATE POLICY "learning_modules_write_policy" ON public.learning_modules FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')));
