-- Memastikan kolom di tabel classes tersedia
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS ruangan VARCHAR(255);
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS kapasitas INTEGER DEFAULT 0;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS wali_kelas_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Memastikan kolom di tabel teachers tersedia
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS mata_pelajaran TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS wali_kelas VARCHAR(255);

-- Memaksa Supabase mereset cache API-nya agar error hilang seketika
NOTIFY pgrst, 'reload schema';
