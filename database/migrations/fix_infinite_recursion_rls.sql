
-- =========================================================================
-- 1. HELPER FUNCTIONS ANTI-REKURSI DENGAN SECURITY DEFINER
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher', 'finance', 'pembina', 'panitia_ppdb')
  );
$$;

-- =========================================================================
-- 2. USER_ROLES POLICIES (ANTI-RECURSION)
-- =========================================================================
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_manage_policy" ON public.user_roles;
DROP POLICY IF EXISTS "Allow user to insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow user to view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role or admins can view all" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_roles_select_policy" ON public.user_roles
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "user_roles_admin_manage_policy" ON public.user_roles
FOR ALL TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- =========================================================================
-- 3. MODUL AKADEMIK POLICIES
-- =========================================================================
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Students
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_write_policy" ON public.students;
DROP POLICY IF EXISTS "Academic Select" ON public.students;
DROP POLICY IF EXISTS "Academic Write" ON public.students;
DROP POLICY IF EXISTS "Allow anon read-write students" ON public.students;
DROP POLICY IF EXISTS "authenticated_all_students" ON public.students;

CREATE POLICY "students_select_policy" ON public.students
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher', 'pembina', 'finance', 'panitia_ppdb')
);

CREATE POLICY "students_write_policy" ON public.students
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'teacher')
);

-- Grades
DROP POLICY IF EXISTS "grades_select_policy" ON public.grades;
DROP POLICY IF EXISTS "grades_write_policy" ON public.grades;
DROP POLICY IF EXISTS "Academic Select" ON public.grades;
DROP POLICY IF EXISTS "Academic Write" ON public.grades;
DROP POLICY IF EXISTS "Allow anon read-write grades" ON public.grades;
DROP POLICY IF EXISTS "authenticated_all_grades" ON public.grades;

CREATE POLICY "grades_select_policy" ON public.grades
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher', 'pembina')
);

CREATE POLICY "grades_write_policy" ON public.grades
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'teacher')
);

-- Attendance Students
DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance_students;
DROP POLICY IF EXISTS "attendance_write_policy" ON public.attendance_students;
DROP POLICY IF EXISTS "attendance_students_select_policy" ON public.attendance_students;
DROP POLICY IF EXISTS "attendance_students_write_policy" ON public.attendance_students;
DROP POLICY IF EXISTS "Academic Select" ON public.attendance_students;
DROP POLICY IF EXISTS "Academic Write" ON public.attendance_students;

CREATE POLICY "attendance_students_select_policy" ON public.attendance_students
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher', 'pembina')
);

CREATE POLICY "attendance_students_write_policy" ON public.attendance_students
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'teacher')
);

-- Teacher Journals
DROP POLICY IF EXISTS "journals_select_policy" ON public.teacher_journals;
DROP POLICY IF EXISTS "journals_write_policy" ON public.teacher_journals;
DROP POLICY IF EXISTS "teacher_journals_select_policy" ON public.teacher_journals;
DROP POLICY IF EXISTS "teacher_journals_write_policy" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can view all journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admin can insert, update, delete all journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can insert journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can update journals" ON public.teacher_journals;
DROP POLICY IF EXISTS "Admins can delete journals" ON public.teacher_journals;

CREATE POLICY "teacher_journals_select_policy" ON public.teacher_journals
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher', 'pembina')
);

CREATE POLICY "teacher_journals_write_policy" ON public.teacher_journals
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'teacher')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'teacher')
);

-- Teachers, Classes, Subjects, Schedules
DROP POLICY IF EXISTS "teachers_select_policy" ON public.teachers;
DROP POLICY IF EXISTS "teachers_write_policy" ON public.teachers;
DROP POLICY IF EXISTS "Academic Select" ON public.teachers;
DROP POLICY IF EXISTS "Academic Write" ON public.teachers;
DROP POLICY IF EXISTS "authenticated_all_teachers" ON public.teachers;
CREATE POLICY "teachers_select_policy" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "teachers_write_policy" ON public.teachers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "classes_select_policy" ON public.classes;
DROP POLICY IF EXISTS "classes_write_policy" ON public.classes;
DROP POLICY IF EXISTS "Academic Select" ON public.classes;
DROP POLICY IF EXISTS "Academic Write" ON public.classes;
DROP POLICY IF EXISTS "authenticated_all_classes" ON public.classes;
CREATE POLICY "classes_select_policy" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes_write_policy" ON public.classes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "subjects_select_policy" ON public.subjects;
DROP POLICY IF EXISTS "subjects_write_policy" ON public.subjects;
DROP POLICY IF EXISTS "Academic Select" ON public.subjects;
DROP POLICY IF EXISTS "Academic Write" ON public.subjects;
DROP POLICY IF EXISTS "authenticated_all_subjects" ON public.subjects;
CREATE POLICY "subjects_select_policy" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "subjects_write_policy" ON public.subjects FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "schedules_select_policy" ON public.class_schedules;
DROP POLICY IF EXISTS "schedules_write_policy" ON public.class_schedules;
CREATE POLICY "schedules_select_policy" ON public.class_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedules_write_policy" ON public.class_schedules FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'teacher')) WITH CHECK (public.get_my_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "academic_years_select_policy" ON public.academic_years;
DROP POLICY IF EXISTS "academic_years_write_policy" ON public.academic_years;
CREATE POLICY "academic_years_select_policy" ON public.academic_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "academic_years_write_policy" ON public.academic_years FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teacher_attendance_select_policy" ON public.teacher_attendance;
DROP POLICY IF EXISTS "teacher_attendance_write_policy" ON public.teacher_attendance;
CREATE POLICY "teacher_attendance_select_policy" ON public.teacher_attendance FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'teacher', 'pembina'));
CREATE POLICY "teacher_attendance_write_policy" ON public.teacher_attendance FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'teacher')) WITH CHECK (public.get_my_role() IN ('admin', 'teacher'));

-- =========================================================================
-- 4. MODUL KEUANGAN POLICIES
-- =========================================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rab_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salary_config ENABLE ROW LEVEL SECURITY;

-- Transactions
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_write_policy" ON public.transactions;
DROP POLICY IF EXISTS "Finance Select" ON public.transactions;
DROP POLICY IF EXISTS "Finance Write" ON public.transactions;
DROP POLICY IF EXISTS "Pembina can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public can view all transactions" ON public.transactions;

CREATE POLICY "transactions_select_policy" ON public.transactions
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'finance', 'pembina')
);

CREATE POLICY "transactions_write_policy" ON public.transactions
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'finance')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'finance')
);

-- Categories
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_write_policy" ON public.categories;
CREATE POLICY "categories_select_policy" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_write_policy" ON public.categories FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

-- Budgets & RAB Plans
DROP POLICY IF EXISTS "budgets_select_policy" ON public.budgets;
DROP POLICY IF EXISTS "budgets_write_policy" ON public.budgets;
CREATE POLICY "budgets_select_policy" ON public.budgets FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "budgets_write_policy" ON public.budgets FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

DROP POLICY IF EXISTS "rab_plans_select_policy" ON public.rab_plans;
DROP POLICY IF EXISTS "rab_plans_write_policy" ON public.rab_plans;
CREATE POLICY "rab_plans_select_policy" ON public.rab_plans FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "rab_plans_write_policy" ON public.rab_plans FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

-- Salary Slips & Components
DROP POLICY IF EXISTS "salary_slips_select_policy" ON public.salary_slips;
DROP POLICY IF EXISTS "salary_slips_write_policy" ON public.salary_slips;
DROP POLICY IF EXISTS "Admin Full Access salary_slips" ON public.salary_slips;
DROP POLICY IF EXISTS "Teachers can view own salary slips" ON public.salary_slips;

CREATE POLICY "salary_slips_select_policy" ON public.salary_slips
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'finance', 'pembina')
  OR EXISTS (
    SELECT 1 FROM public.teachers t 
    WHERE t.id = teacher_id AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

CREATE POLICY "salary_slips_write_policy" ON public.salary_slips
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'finance')
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'finance')
);

DROP POLICY IF EXISTS "salary_components_select_policy" ON public.salary_components;
DROP POLICY IF EXISTS "salary_components_write_policy" ON public.salary_components;
DROP POLICY IF EXISTS "Admin Full Access salary_components" ON public.salary_components;
CREATE POLICY "salary_components_select_policy" ON public.salary_components FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "salary_components_write_policy" ON public.salary_components FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

DROP POLICY IF EXISTS "salary_slip_items_select_policy" ON public.salary_slip_items;
DROP POLICY IF EXISTS "salary_slip_items_write_policy" ON public.salary_slip_items;
DROP POLICY IF EXISTS "Admin Full Access salary_slip_items" ON public.salary_slip_items;
DROP POLICY IF EXISTS "Teachers can view own slip items" ON public.salary_slip_items;
CREATE POLICY "salary_slip_items_select_policy" ON public.salary_slip_items FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY "salary_slip_items_write_policy" ON public.salary_slip_items FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

DROP POLICY IF EXISTS "teacher_salary_config_select_policy" ON public.teacher_salary_config;
DROP POLICY IF EXISTS "teacher_salary_config_write_policy" ON public.teacher_salary_config;
DROP POLICY IF EXISTS "Admin Full Access teacher_salary_config" ON public.teacher_salary_config;
CREATE POLICY "teacher_salary_config_select_policy" ON public.teacher_salary_config FOR SELECT TO authenticated USING (public.get_my_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "teacher_salary_config_write_policy" ON public.teacher_salary_config FOR ALL TO authenticated USING (public.get_my_role() IN ('admin', 'finance')) WITH CHECK (public.get_my_role() IN ('admin', 'finance'));

-- =========================================================================
-- 5. MODUL PPDB POLICIES
-- =========================================================================
ALTER TABLE public.pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biodata_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_orangtua ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sekolah_asal ENABLE ROW LEVEL SECURITY;

-- Pendaftaran
DROP POLICY IF EXISTS "pendaftaran_select_policy" ON public.pendaftaran;
DROP POLICY IF EXISTS "pendaftaran_insert_policy" ON public.pendaftaran;
DROP POLICY IF EXISTS "pendaftaran_update_policy" ON public.pendaftaran;
DROP POLICY IF EXISTS "pendaftaran_delete_policy" ON public.pendaftaran;

CREATE POLICY "pendaftaran_select_policy" ON public.pendaftaran
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR public.get_my_role() IN ('admin', 'pembina', 'panitia_ppdb')
);

CREATE POLICY "pendaftaran_insert_policy" ON public.pendaftaran
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR public.get_my_role() IN ('admin', 'panitia_ppdb')
);

CREATE POLICY "pendaftaran_update_policy" ON public.pendaftaran
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR public.get_my_role() IN ('admin', 'panitia_ppdb')
)
WITH CHECK (
  user_id = auth.uid() OR public.get_my_role() IN ('admin', 'panitia_ppdb')
);

CREATE POLICY "pendaftaran_delete_policy" ON public.pendaftaran
FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR public.is_admin()
);

-- Biodata Siswa, Data Orang Tua, Sekolah Asal (Linked via pendaftaran_id)
DROP POLICY IF EXISTS "biodata_siswa_select_policy" ON public.biodata_siswa;
DROP POLICY IF EXISTS "biodata_siswa_all_policy" ON public.biodata_siswa;

CREATE POLICY "biodata_siswa_select_policy" ON public.biodata_siswa
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'pembina', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

CREATE POLICY "biodata_siswa_all_policy" ON public.biodata_siswa
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "data_orangtua_select_policy" ON public.data_orangtua;
DROP POLICY IF EXISTS "data_orangtua_all_policy" ON public.data_orangtua;

CREATE POLICY "data_orangtua_select_policy" ON public.data_orangtua
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'pembina', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

CREATE POLICY "data_orangtua_all_policy" ON public.data_orangtua
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

DROP POLICY IF EXISTS "sekolah_asal_select_policy" ON public.sekolah_asal;
DROP POLICY IF EXISTS "sekolah_asal_all_policy" ON public.sekolah_asal;

CREATE POLICY "sekolah_asal_select_policy" ON public.sekolah_asal
FOR SELECT TO authenticated
USING (
  public.get_my_role() IN ('admin', 'pembina', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

CREATE POLICY "sekolah_asal_all_policy" ON public.sekolah_asal
FOR ALL TO authenticated
USING (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
)
WITH CHECK (
  public.get_my_role() IN ('admin', 'panitia_ppdb')
  OR EXISTS (SELECT 1 FROM public.pendaftaran p WHERE p.id = pendaftaran_id AND p.user_id = auth.uid())
);

-- =========================================================================
-- 6. SINKRONISASI AKUN ADMIN
-- =========================================================================
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE email ILIKE 'daffa%@gmail.com' OR email ILIKE '%admin%'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
