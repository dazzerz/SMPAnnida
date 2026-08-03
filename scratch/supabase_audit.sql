-- ==========================================
-- SPRINT 32E - SUPABASE SCHEMA COMPLETION
-- ==========================================
-- Skrip ini dirancang untuk memastikan seluruh tabel,
-- kolom, constraint, foreign key, index, dan storage siap.
-- Aman dijalankan berkali-kali (Idempotent).

-- ==========================================
-- 1. PENCIPTAAN TABEL DASAR
-- ==========================================

CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nip VARCHAR(50),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    no_hp VARCHAR(50),
    jenis_kelamin VARCHAR(20) CHECK (jenis_kelamin IN ('L', 'P', 'Laki-laki', 'Perempuan')),
    status_guru VARCHAR(50),
    mata_pelajaran_id UUID,
    is_wali_kelas BOOLEAN DEFAULT false,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_mapel VARCHAR(50) NOT NULL,
    nama_mapel VARCHAR(255) NOT NULL,
    kelompok VARCHAR(50),
    guru_id UUID,
    kkm INTEGER DEFAULT 75,
    jam_pelajaran INTEGER DEFAULT 2,
    urutan INTEGER DEFAULT 0,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kelas VARCHAR(50) NOT NULL,
    tingkat INTEGER,
    wali_kelas_id UUID,
    ruangan VARCHAR(50),
    kapasitas_siswa INTEGER DEFAULT 32,
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nis VARCHAR(50),
    nisn VARCHAR(50),
    nama_lengkap VARCHAR(255) NOT NULL,
    jenis_kelamin VARCHAR(20) CHECK (jenis_kelamin IN ('L', 'P', 'Laki-laki', 'Perempuan')),
    tanggal_lahir DATE,
    kelas VARCHAR(50),
    kelas_id UUID,
    alamat TEXT,
    nama_orang_tua VARCHAR(255),
    no_hp_orang_tua VARCHAR(50),
    aktif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tahun_ajaran VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    aktif BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.class_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID,
    class_id UUID,
    teacher_id UUID,
    subject_id UUID,
    room VARCHAR(50),
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpa')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    mata_pelajaran VARCHAR(255),
    jenis_penilaian VARCHAR(50),
    nilai INTEGER CHECK (nilai >= 0 AND nilai <= 100),
    semester VARCHAR(20),
    tahun_ajaran VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL,
    class_id VARCHAR(50),
    journal_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- 2. PENAMBAHAN KOLOM UNTUK TABEL LAMA (Jika belum tercover CREATE TABLE)
-- ==========================================
-- Karena Supabase tidak men-drop data saat CREATE IF NOT EXISTS,
-- pastikan kolom-kolom baru (addendum) ter-apply jika tabelnya sudah ada.

ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS urutan INTEGER DEFAULT 0;
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS urutan INTEGER DEFAULT 0;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kelas VARCHAR(50);
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS kelas_id UUID;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- ==========================================
-- 3. UNIQUE CONSTRAINTS
-- ==========================================
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_nis_key;
ALTER TABLE public.students ADD CONSTRAINT students_nis_key UNIQUE (nis);
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_nisn_key;
ALTER TABLE public.students ADD CONSTRAINT students_nisn_key UNIQUE (nisn);

ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_nip_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_nip_key UNIQUE (nip);
ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_email_key;
ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);

ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_kode_mapel_key;
ALTER TABLE public.subjects ADD CONSTRAINT subjects_kode_mapel_key UNIQUE (kode_mapel);

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_nama_kelas_key;
ALTER TABLE public.classes ADD CONSTRAINT classes_nama_kelas_key UNIQUE (nama_kelas);

DROP INDEX IF EXISTS unique_active_academic_year;
CREATE UNIQUE INDEX unique_active_academic_year ON public.academic_years (aktif) WHERE aktif = true;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS class_schedules_unique_slot;
ALTER TABLE public.class_schedules ADD CONSTRAINT class_schedules_unique_slot UNIQUE (academic_year_id, class_id, teacher_id, day_of_week, start_time, end_time);

-- ==========================================
-- 4. FOREIGN KEYS
-- ==========================================
-- Note: Menggunakan SET NULL pada delete untuk Master Data agar tidak 
-- memecahkan log/history jika Master dihapus.
-- Tetapi menggunakan CASCADE pada mapping jadwal/nilai jika siswanya dihapus.

ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS fk_teachers_subject;
ALTER TABLE public.teachers ADD CONSTRAINT fk_teachers_subject 
    FOREIGN KEY (mata_pelajaran_id) REFERENCES public.subjects(id) ON DELETE SET NULL;

ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS fk_subjects_teacher;
ALTER TABLE public.subjects ADD CONSTRAINT fk_subjects_teacher 
    FOREIGN KEY (guru_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS fk_classes_wali;
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_wali 
    FOREIGN KEY (wali_kelas_id) REFERENCES public.teachers(id) ON DELETE SET NULL;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS fk_students_kelas;
ALTER TABLE public.students ADD CONSTRAINT fk_students_kelas 
    FOREIGN KEY (kelas_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_year;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_year 
    FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_class;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_class 
    FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_teacher;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_teacher 
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

ALTER TABLE public.class_schedules DROP CONSTRAINT IF EXISTS fk_schedules_subject;
ALTER TABLE public.class_schedules ADD CONSTRAINT fk_schedules_subject 
    FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.attendance_students DROP CONSTRAINT IF EXISTS fk_attendance_student;
ALTER TABLE public.attendance_students ADD CONSTRAINT fk_attendance_student 
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS fk_grades_student;
ALTER TABLE public.grades ADD CONSTRAINT fk_grades_student 
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_journals DROP CONSTRAINT IF EXISTS fk_journals_teacher;
ALTER TABLE public.teacher_journals ADD CONSTRAINT fk_journals_teacher 
    FOREIGN KEY (teacher_id) REFERENCES public.teachers(id) ON DELETE CASCADE;

-- ==========================================
-- 5. INDEXES (Untuk Optimalisasi Query)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_teachers_mapel ON public.teachers(mata_pelajaran_id);
CREATE INDEX IF NOT EXISTS idx_students_kelas_id ON public.students(kelas_id);
CREATE INDEX IF NOT EXISTS idx_students_kelas_str ON public.students(kelas);
CREATE INDEX IF NOT EXISTS idx_schedules_class ON public.class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_schedules_teacher ON public.class_schedules(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_students(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);

-- ==========================================
-- 6. STORAGE POLICIES
-- ==========================================
-- (Jika diperlukan untuk avatar guru/siswa, biarkan saja agar idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;
