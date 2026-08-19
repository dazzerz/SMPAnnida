-- Enable RLS on all relevant tables
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

ALTER TABLE IF EXISTS pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS biodata_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_orangtua ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sekolah_asal ENABLE ROW LEVEL SECURITY;

-- Helper function to check role easily
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS 
  SELECT role FROM user_roles WHERE user_id = auth.uid();
;

---------------------------------------------
-- FINANCE TABLES POLICIES
---------------------------------------------
-- Read access for Admin, Finance, and Pembina
CREATE POLICY "Finance Select" ON transactions FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON categories FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON budgets FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON rab_plans FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_slips FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_slip_items FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));
CREATE POLICY "Finance Select" ON salary_components FOR SELECT USING (get_user_role() IN ('admin', 'finance', 'pembina'));

-- Write access (Insert/Update/Delete) for Admin and Finance ONLY
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
-- PPDB TABLES POLICIES
---------------------------------------------
-- Read access for Admin, Pembina, and the owning calon_siswa
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

-- Write access for Admin and the owning calon_siswa ONLY
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
