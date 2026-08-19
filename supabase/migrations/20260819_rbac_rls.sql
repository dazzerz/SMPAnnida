-- 1. Update user_roles check constraint to allow new roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'teacher', 'student', 'pembina', 'finance', 'calon_siswa'));

-- 2. Create helper function in PL/pgSQL
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
    RETURN user_role;
END;
$$;

-- 3. Enable RLS on all relevant tables (If they exist)
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rab_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_slip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS salary_components ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS teacher_attendance ENABLE ROW LEVEL SECURITY;

---------------------------------------------
-- FINANCE TABLES POLICIES
---------------------------------------------
-- Read access for Admin, Finance, and Pembina
DROP POLICY IF EXISTS "Finance Select" ON transactions;
DROP POLICY IF EXISTS "Finance Select" ON categories;
DROP POLICY IF EXISTS "Finance Select" ON budgets;
DROP POLICY IF EXISTS "Finance Select" ON rab_plans;
DROP POLICY IF EXISTS "Finance Select" ON salary_slips;
DROP POLICY IF EXISTS "Finance Select" ON salary_slip_items;
DROP POLICY IF EXISTS "Finance Select" ON salary_components;

CREATE POLICY "Finance Select" ON transactions FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON categories FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON budgets FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON rab_plans FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_slips FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_slip_items FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_components FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));

-- Write access (Insert/Update/Delete) for Admin and Finance ONLY
DROP POLICY IF EXISTS "Finance Write" ON transactions;
DROP POLICY IF EXISTS "Finance Write" ON categories;
DROP POLICY IF EXISTS "Finance Write" ON budgets;
DROP POLICY IF EXISTS "Finance Write" ON rab_plans;
DROP POLICY IF EXISTS "Finance Write" ON salary_slips;
DROP POLICY IF EXISTS "Finance Write" ON salary_slip_items;
DROP POLICY IF EXISTS "Finance Write" ON salary_components;

CREATE POLICY "Finance Write" ON transactions FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON categories FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON budgets FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON rab_plans FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON salary_slips FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON salary_slip_items FOR ALL USING (get_user_role() IN ('admin', 'finance'));
CREATE POLICY "Finance Write" ON salary_components FOR ALL USING (get_user_role() IN ('admin', 'finance'));

---------------------------------------------
-- ACADEMIC TABLES POLICIES
---------------------------------------------
-- Read access for Admin, Teacher, and Pembina
DROP POLICY IF EXISTS "Academic Select" ON teachers;
DROP POLICY IF EXISTS "Academic Select" ON academic_years;
DROP POLICY IF EXISTS "Academic Select" ON classes;
DROP POLICY IF EXISTS "Academic Select" ON subjects;
DROP POLICY IF EXISTS "Academic Select" ON class_schedules;
DROP POLICY IF EXISTS "Academic Select" ON students;
DROP POLICY IF EXISTS "Academic Select" ON attendance_students;
DROP POLICY IF EXISTS "Academic Select" ON grades;
DROP POLICY IF EXISTS "Academic Select" ON teacher_journals;
DROP POLICY IF EXISTS "Academic Select" ON teacher_attendance;

CREATE POLICY "Academic Select" ON teachers FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON academic_years FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON classes FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON subjects FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON class_schedules FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON students FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON attendance_students FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON grades FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON teacher_journals FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "Academic Select" ON teacher_attendance FOR SELECT USING (get_user_role() IN ('admin', 'teacher', 'pembina'));

-- Write access for Admin and Teacher ONLY
DROP POLICY IF EXISTS "Academic Write" ON teachers;
DROP POLICY IF EXISTS "Academic Write" ON academic_years;
DROP POLICY IF EXISTS "Academic Write" ON classes;
DROP POLICY IF EXISTS "Academic Write" ON subjects;
DROP POLICY IF EXISTS "Academic Write" ON class_schedules;
DROP POLICY IF EXISTS "Academic Write" ON students;
DROP POLICY IF EXISTS "Academic Write" ON attendance_students;
DROP POLICY IF EXISTS "Academic Write" ON grades;
DROP POLICY IF EXISTS "Academic Write" ON teacher_journals;
DROP POLICY IF EXISTS "Academic Write" ON teacher_attendance;

CREATE POLICY "Academic Write" ON teachers FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON academic_years FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON classes FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON subjects FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON class_schedules FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON students FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON attendance_students FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON grades FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON teacher_journals FOR ALL USING (get_user_role() IN ('admin', 'teacher'));
CREATE POLICY "Academic Write" ON teacher_attendance FOR ALL USING (get_user_role() IN ('admin', 'teacher'));

---------------------------------------------
-- PPDB TABLES POLICIES (DYNAMIC EXECUTION IF TABLES EXIST)
---------------------------------------------
DO $$
BEGIN
  -- Execute policies only if PPDB tables exist in the database
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pendaftaran') THEN
    ALTER TABLE IF EXISTS pendaftaran ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS biodata_siswa ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS data_orangtua ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS sekolah_asal ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "PPDB Select" ON pendaftaran;
    DROP POLICY IF EXISTS "PPDB Select" ON biodata_siswa;
    DROP POLICY IF EXISTS "PPDB Select" ON data_orangtua;
    DROP POLICY IF EXISTS "PPDB Select" ON sekolah_asal;

    CREATE POLICY "PPDB Select" ON pendaftaran FOR SELECT USING (
      get_user_role() IN ('admin', 'pembina') OR user_id = auth.uid()
    );
    CREATE POLICY "PPDB Select" ON biodata_siswa FOR SELECT USING (
      get_user_role() IN ('admin', 'pembina') OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );
    CREATE POLICY "PPDB Select" ON data_orangtua FOR SELECT USING (
      get_user_role() IN ('admin', 'pembina') OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );
    CREATE POLICY "PPDB Select" ON sekolah_asal FOR SELECT USING (
      get_user_role() IN ('admin', 'pembina') OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );

    DROP POLICY IF EXISTS "PPDB Write" ON pendaftaran;
    DROP POLICY IF EXISTS "PPDB Write" ON biodata_siswa;
    DROP POLICY IF EXISTS "PPDB Write" ON data_orangtua;
    DROP POLICY IF EXISTS "PPDB Write" ON sekolah_asal;

    CREATE POLICY "PPDB Write" ON pendaftaran FOR ALL USING (
      get_user_role() = 'admin' OR user_id = auth.uid()
    );
    CREATE POLICY "PPDB Write" ON biodata_siswa FOR ALL USING (
      get_user_role() = 'admin' OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );
    CREATE POLICY "PPDB Write" ON data_orangtua FOR ALL USING (
      get_user_role() = 'admin' OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );
    CREATE POLICY "PPDB Write" ON sekolah_asal FOR ALL USING (
      get_user_role() = 'admin' OR pendaftaran_id IN (SELECT id FROM pendaftaran WHERE user_id = auth.uid())
    );
  END IF;
END
$$;
