-- ==========================================
-- SPRINT 32C - SUPABASE DATABASE READINESS
-- ==========================================
-- Skrip ini dirancang untuk memastikan seluruh tabel,
-- constraint, foreign key, index, dan storage siap.
-- Aman dijalankan berkali-kali (Idempotent).

-- ==========================================
-- 1. PRIMARY KEY UUID & TIMESTAMP
-- ==========================================
-- (Diasumsikan tabel sudah memiliki kolom id UUID PRIMARY KEY 
-- dan default gen_random_uuid(), karena ini standar Supabase.
-- Berikut ini hanya memastikan alter table jika diperlukan,
-- namun alter tipe data PK sangat kompleks dan biasanya
-- sudah dibuat dari awal. Kita lewati alter PK dan 
-- fokus pada constraint dan index.)

-- ==========================================
-- 2. SCHEMA PREPARATION (ADD MISSING COLUMNS)
-- ==========================================

-- students
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nis VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nisn VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nama_lengkap VARCHAR(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tanggal_lahir DATE;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kelas_id UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS nama_orang_tua VARCHAR(255);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS no_hp_orang_tua VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- teachers
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS nip VARCHAR(50);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS no_hp VARCHAR(50);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS status_guru VARCHAR(50);
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS mata_pelajaran_id UUID;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS is_wali_kelas BOOLEAN DEFAULT false;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- subjects
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS kode_mapel VARCHAR(50);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS nama_mapel VARCHAR(255);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS kelompok VARCHAR(50);
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS guru_id UUID;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS kkm INTEGER DEFAULT 75;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS jam_pelajaran INTEGER DEFAULT 2;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- classes
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS nama_kelas VARCHAR(50);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS tingkat INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS wali_kelas_id UUID;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS ruangan VARCHAR(50);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS kapasitas_siswa INTEGER DEFAULT 32;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- academic_years
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS tahun_ajaran VARCHAR(20);
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS semester VARCHAR(20);
ALTER TABLE public.academic_years ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT false;

-- class_schedules
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20);
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS class_id UUID;
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS teacher_id UUID;
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS subject_id UUID;
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS room VARCHAR(50);
ALTER TABLE public.class_schedules ADD COLUMN IF NOT EXISTS academic_year_id UUID;

-- ==========================================
-- 3. UNIQUE CONSTRAINTS
-- ==========================================

-- students
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_nis_key;
ALTER TABLE public.students ADD CONSTRAINT students_nis_key UNIQUE (nis);
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_nisn_key;
ALTER TABLE public.students ADD CONSTRAINT students_nisn_key UNIQUE (nisn);

-- teachers
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_nip_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_nip_key UNIQUE (nip);
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_email_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);

-- subjects
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_kode_mapel_key;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_kode_mapel_key UNIQUE (kode_mapel);

-- classes
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_nama_kelas_key;
ALTER TABLE public.classes ADD CONSTRAINT classes_nama_kelas_key UNIQUE (nama_kelas);

-- academic_years
-- Catatan: Supabase tidak mendukung "hanya satu true" constraint sederhana.
-- Anda dapat menggunakan Partial Unique Index untuk ini:
DROP INDEX IF EXISTS unique_active_academic_year;
CREATE UNIQUE INDEX unique_active_academic_year ON public.academic_years (aktif) WHERE aktif = true;

-- class_schedules (Mencegah Jadwal Duplikat persis)
ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS class_schedules_unique_slot;
ALTER TABLE public.class_schedules ADD CONSTRAINT class_schedules_unique_slot UNIQUE (academic_year_id, class_id, teacher_id, subject_id, day_of_week, start_time, end_time);

-- attendance_students
ALTER TABLE public.attendance_students DROP CONSTRAINT IF EXISTS attendance_students_unique_daily;
ALTER TABLE public.attendance_students ADD CONSTRAINT attendance_students_unique_daily UNIQUE (student_id, attendance_date);

-- teacher_attendance
ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_unique_daily;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT teacher_attendance_unique_daily UNIQUE (teacher_id, attendance_date);

-- teacher_journals
ALTER TABLE public.teacher_journals DROP CONSTRAINT IF EXISTS teacher_journals_unique_slot;
ALTER TABLE public.teacher_journals ADD CONSTRAINT teacher_journals_unique_slot UNIQUE (teacher_id, journal_date, class_id, subject_id);

-- grades
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_unique_score;
ALTER TABLE public.grades ADD CONSTRAINT grades_unique_score UNIQUE (student_id, subject_id, semester, tahun_ajaran);

-- ==========================================
-- 3. FOREIGN KEYS (ON DELETE CASCADE / SET NULL)
-- ==========================================

-- students.kelas -> kelas dihapus, siswa diset NULL
-- Karena kita pakai UUID, kolom kelas di students perlu dipastikan berelasi ke classes.
-- (Bila kolom "kelas" berupa nama kelas, maka perlu ditambahkan kolom class_id UUID.
-- Saya asumsikan kolom sudah ada class_id atau kelas bertipe UUID).
-- ALTER TABLE public.students DROP CONSTRAINT IF EXISTS fk_students_class;
-- ALTER TABLE public.students ADD CONSTRAINT fk_students_class FOREIGN KEY (kelas) REFERENCES public.classes(id) ON DELETE SET NULL;

-- subjects.guru_id
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS fk_subjects_teacher;
ALTER TABLE public.subjects ADD CONSTRAINT fk_subjects_teacher FOREIGN KEY (guru_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- classes.wali_kelas_id
ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS fk_classes_teacher;
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (wali_kelas_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

-- class_schedules
ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_academic;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_academic FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_class;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_teacher;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_teacher FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_subject;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_subject FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- attendance_students
ALTER TABLE public.attendance_students DROP CONSTRAINT IF EXISTS fk_att_students;
ALTER TABLE public.attendance_students ADD CONSTRAINT fk_att_students FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- teacher_attendance
ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS fk_att_teachers;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT fk_att_teachers FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- teacher_journals
ALTER TABLE public.teacher_journals DROP CONSTRAINT IF EXISTS fk_jour_teachers;
ALTER TABLE public.teacher_journals ADD CONSTRAINT fk_jour_teachers FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_journals DROP CONSTRAINT IF EXISTS fk_jour_classes;
ALTER TABLE public.teacher_journals ADD CONSTRAINT fk_jour_classes FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_journals DROP CONSTRAINT IF EXISTS fk_jour_subjects;
ALTER TABLE public.teacher_journals ADD CONSTRAINT fk_jour_subjects FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- grades
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS fk_grades_students;
ALTER TABLE public.grades ADD CONSTRAINT fk_grades_students FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS fk_grades_subjects;
ALTER TABLE public.grades ADD CONSTRAINT fk_grades_subjects FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

-- ==========================================
-- 4. INDEXING (Mempercepat query)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_students_kelas ON public.students (kelas);
CREATE INDEX IF NOT EXISTS idx_subjects_guru_id ON public.subjects (guru_id);
CREATE INDEX IF NOT EXISTS idx_classes_wali_kelas_id ON public.classes (wali_kelas_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_day_of_week ON public.class_schedules (day_of_week);
CREATE INDEX IF NOT EXISTS idx_class_schedules_teacher_id ON public.class_schedules (teacher_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class_id ON public.class_schedules (class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_students_date ON public.attendance_students (attendance_date);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance (attendance_date);
CREATE INDEX IF NOT EXISTS idx_teacher_journals_date ON public.teacher_journals (journal_date);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON public.grades (student_id, subject_id);


-- ==========================================
-- 5. STORAGE BUCKET & POLICY
-- ==========================================

-- Membuat bucket (hanya jika belum ada)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('teacher-attendance', 'teacher-attendance', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy Select (Public)
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;
CREATE POLICY "Public View Access" ON storage.objects FOR SELECT 
USING (bucket_id = 'teacher-attendance');

-- Policy Insert (Public, karena kita tidak memiliki auth Supabase native, kita izinkan anonymous)
DROP POLICY IF EXISTS "Public Upload Access" ON storage.objects;
CREATE POLICY "Public Upload Access" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'teacher-attendance');

-- Policy Update (Public)
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
CREATE POLICY "Public Update Access" ON storage.objects FOR UPDATE 
USING (bucket_id = 'teacher-attendance');

-- Policy Delete (Public)
DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
CREATE POLICY "Public Delete Access" ON storage.objects FOR DELETE 
USING (bucket_id = 'teacher-attendance');

-- Selesai.
