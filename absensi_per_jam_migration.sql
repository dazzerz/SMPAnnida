-- ================================================================
-- MIGRATION: Absensi Per Jam Pelajaran — SMPAnnida
-- Tanggal: 10 Agustus 2026
-- ================================================================

-- 1. HAPUS data absensi lama (reset bersih)
TRUNCATE TABLE attendance_students RESTART IDENTITY CASCADE;
TRUNCATE TABLE attendance RESTART IDENTITY CASCADE;

-- 2. DROP constraint lama (unique per siswa + tanggal saja)
ALTER TABLE attendance_students
  DROP CONSTRAINT IF EXISTS attendance_students_student_id_attendance_date_key;
ALTER TABLE attendance_students
  DROP CONSTRAINT IF EXISTS attendance_per_schedule_unique;

-- 3. TAMBAH kolom baru ke attendance_students
ALTER TABLE attendance_students
  ADD COLUMN IF NOT EXISTS schedule_id  UUID REFERENCES class_schedules(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject_id   UUID REFERENCES subjects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_id   UUID REFERENCES teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jam_ke       SMALLINT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_time   TIME DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS end_time     TIME DEFAULT NULL;

-- 4. TAMBAH constraint baru: 1 siswa hanya 1 record per jadwal per hari
ALTER TABLE attendance_students
  ADD CONSTRAINT attendance_per_schedule_unique
  UNIQUE (student_id, attendance_date, schedule_id);

-- 5. INDEX untuk performa
CREATE INDEX IF NOT EXISTS idx_att_schedule_id ON attendance_students(schedule_id);
CREATE INDEX IF NOT EXISTS idx_att_teacher_id  ON attendance_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_att_date        ON attendance_students(attendance_date);
CREATE INDEX IF NOT EXISTS idx_att_subject_id  ON attendance_students(subject_id);

-- 6. PASTIKAN kolom 'auth_email' ada di tabel teachers
ALTER TABLE teachers
  ADD COLUMN IF NOT EXISTS auth_email TEXT UNIQUE;

-- 7. Update auth_email dari kolom email yang sudah ada (jika kolom 'email' sudah ada)
UPDATE teachers SET auth_email = email WHERE auth_email IS NULL AND email IS NOT NULL;
