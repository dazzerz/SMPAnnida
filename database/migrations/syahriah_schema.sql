-- Migration: Setup Syahriah (Teacher Payroll) Schema

-- 1. Table: salary_components (Master Komponen Gaji)
CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    calculation_type TEXT NOT NULL CHECK (calculation_type IN ('per_day', 'per_session', 'flat')),
    default_rate INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 99,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Data untuk 7 komponen wajib + Mengajar Pesantren
INSERT INTO public.salary_components (code, name, calculation_type, default_rate, sort_order)
VALUES
    ('transport', 'Transport', 'per_day', 50000, 1),
    ('mengajar', 'Mengajar', 'per_session', 25000, 2),
    ('insentif_hadir', 'Insentif Hadir', 'per_day', 5000, 3),
    ('insentif_pagi', 'Insentif Pagi', 'per_day', 5000, 4),
    ('tunj_kepsek', 'Tunj. Kepsek', 'flat', 100000, 5),
    ('tunj_wali_kelas', 'Tunj. Wali Kelas', 'flat', 50000, 6),
    ('tata_usaha', 'Tata Usaha', 'flat', 100000, 7),
    ('mengajar_pesantren', 'Mengajar Pesantren', 'per_session', 15000, 8)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    calculation_type = EXCLUDED.calculation_type,
    default_rate = EXCLUDED.default_rate,
    sort_order = EXCLUDED.sort_order;


-- 2. Table: teacher_salary_config (Override Rate Per Guru)
CREATE TABLE IF NOT EXISTS public.teacher_salary_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id) ON DELETE CASCADE,
    custom_rate INTEGER,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, component_id)
);


-- 3. Table: salary_slips (Header Slip Gaji Bulanan)
CREATE TABLE IF NOT EXISTS public.salary_slips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slip_number SERIAL,
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INTEGER NOT NULL,
    total_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'paid')),
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_salary_slips_period ON public.salary_slips(period_month, period_year);
CREATE INDEX IF NOT EXISTS idx_salary_slips_teacher ON public.salary_slips(teacher_id);


-- 4. Table: salary_slip_items (Detail Komponen Slip Gaji)
CREATE TABLE IF NOT EXISTS public.salary_slip_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slip_id UUID NOT NULL REFERENCES public.salary_slips(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.salary_components(id),
    rate INTEGER NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    subtotal INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_salary_slip_items_slip ON public.salary_slip_items(slip_id);


-- Row Level Security (RLS)
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_salary_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_slip_items ENABLE ROW LEVEL SECURITY;

-- Policy: Hanya Admin (dari tabel user_roles) yang bisa akses penuh
-- Asumsi tabel user_roles sudah dibuat pada fix_p0_security_constraints.sql
CREATE POLICY "Admin Full Access salary_components" ON public.salary_components
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin Full Access teacher_salary_config" ON public.teacher_salary_config
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin Full Access salary_slips" ON public.salary_slips
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin Full Access salary_slip_items" ON public.salary_slip_items
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Policy untuk read-only bagi guru agar bisa melihat slip gajinya sendiri
CREATE POLICY "Teachers can view own salary slips" ON public.salary_slips
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "Teachers can view own slip items" ON public.salary_slip_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.salary_slips s 
    JOIN public.teachers t ON t.id = s.teacher_id 
    WHERE s.id = slip_id AND t.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
