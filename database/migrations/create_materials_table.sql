-- =========================================================================
-- MIGRATION: DEDICATED MATERIALS TABLE (SMP ANNIDA E-LEARNING)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_name TEXT NOT NULL,
    class_name TEXT NOT NULL,          -- '7A', '7B', '8A', '8B', '9A', '9B', atau 'Semua'
    subject TEXT NOT NULL,             -- 'Matematika', 'PAI', 'Bahasa Arab', dll
    title TEXT NOT NULL,
    description TEXT,
    material_url TEXT NOT NULL,        -- YouTube URL, PDF URL, HTML URL, Image URL
    material_type TEXT NOT NULL,       -- 'youtube' | 'pdf' | 'image' | 'html' | 'document'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_materials_class ON public.materials(class_name);
CREATE INDEX IF NOT EXISTS idx_materials_subject ON public.materials(subject);
CREATE INDEX IF NOT EXISTS idx_materials_created ON public.materials(created_at DESC);

-- RLS Security
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "materials_read_policy" ON public.materials;
CREATE POLICY "materials_read_policy" ON public.materials 
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "materials_write_policy" ON public.materials;
CREATE POLICY "materials_write_policy" ON public.materials 
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'teacher', 'pembina')));
