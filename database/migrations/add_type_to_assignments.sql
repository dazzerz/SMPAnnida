-- =========================================================================
-- MIGRATION: ADD TYPE COLUMN TO ASSIGNMENTS TABLE (LMS INTERACTIVE MATERIAL)
-- SMP Annida Integrated System
-- =========================================================================

ALTER TABLE IF EXISTS public.assignments 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'tugas';

-- Set default value for any NULL records
UPDATE public.assignments 
SET type = 'tugas' 
WHERE type IS NULL;
