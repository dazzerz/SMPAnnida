-- =========================================================================
-- MIGRATION: REMEDIASI TOTAL RLS POLICIES (AUDIT GO-LIVE)
-- SMP Annida Integrated System
-- =========================================================================

-- 1. BERSIHKAN SEMUA LEGACY / OPEN POLICIES
DROP POLICY IF EXISTS "Allow anon read-write students" ON public.students;
DROP POLICY IF EXISTS "authenticated_all_students" ON public.students;

DROP POLICY IF EXISTS "Allow anon read-write grades" ON public.grades;
DROP POLICY IF EXISTS "authenticated_all_grades" ON public.grades;

DROP POLICY IF EXISTS "authenticated_all_teachers" ON public.teachers;
DROP POLICY IF EXISTS "authenticated_all_classes" ON public.classes;
DROP POLICY IF EXISTS "authenticated_all_subjects" ON public.subjects;

DROP POLICY IF EXISTS "Allow user to insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow user to view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role or admins can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all_policy" ON public.user_roles;

DROP POLICY IF EXISTS "Public can view all transactions" ON public.transactions;

-- 2. PASTIKAN RLS AKTIF DI SEMUA TABEL UTAMA
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES KETAT UNTUK USER_ROLES
CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.user_roles admin_check
        WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
    )
);

CREATE POLICY "user_roles_admin_all_policy" ON public.user_roles
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles admin_check
        WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles admin_check
        WHERE admin_check.user_id = auth.uid() AND admin_check.role = 'admin'
    )
);

-- 4. POLICIES KETAT UNTUK STUDENTS
DROP POLICY IF EXISTS "Academic Select" ON public.students;
DROP POLICY IF EXISTS "Academic Write" ON public.students;
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_write_policy" ON public.students;

CREATE POLICY "students_select_policy" ON public.students
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
    )
);

CREATE POLICY "students_write_policy" ON public.students
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
);

-- 5. POLICIES KETAT UNTUK GRADES (NILAI)
DROP POLICY IF EXISTS "Academic Select" ON public.grades;
DROP POLICY IF EXISTS "Academic Write" ON public.grades;
DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;
DROP POLICY IF EXISTS "grades_write_policy" ON public.grades;

CREATE POLICY "grades_select_policy" ON public.grades
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
    )
);

CREATE POLICY "grades_write_policy" ON public.grades
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
);

-- 6. POLICIES KETAT UNTUK TEACHERS
DROP POLICY IF EXISTS "Academic Select" ON public.teachers;
DROP POLICY IF EXISTS "Academic Write" ON public.teachers;
DROP POLICY IF EXISTS "teachers_select_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_write_policy" ON public.teachers;

CREATE POLICY "teachers_select_policy" ON public.teachers
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina', 'finance')
    )
);

CREATE POLICY "teachers_write_policy" ON public.teachers
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 7. POLICIES KETAT UNTUK CLASSES & SUBJECTS
DROP POLICY IF EXISTS "Academic Select" ON public.classes;
DROP POLICY IF EXISTS "Academic Write" ON public.classes;
DROP POLICY IF EXISTS "classes_select_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_write_policy" ON public.classes;

DROP POLICY IF EXISTS "Academic Select" ON public.subjects;
DROP POLICY IF EXISTS "Academic Write" ON public.subjects;
DROP POLICY IF EXISTS "subjects_select_policy" ON public.subjects;
DROP POLICY IF EXISTS "subjects_write_policy" ON public.subjects;

CREATE POLICY "classes_select_policy" ON public.classes
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
    )
);

CREATE POLICY "classes_write_policy" ON public.classes
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "subjects_select_policy" ON public.subjects
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')
    )
);

CREATE POLICY "subjects_write_policy" ON public.subjects
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);
