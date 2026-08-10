-- Create teacher_journals table
CREATE TABLE IF NOT EXISTS public.teacher_journals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    jam_pelajaran VARCHAR(100) NOT NULL,
    materi TEXT NOT NULL,
    catatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.teacher_journals ENABLE ROW LEVEL SECURITY;

-- Policies for teacher_journals
-- Admin can view all journals
CREATE POLICY "Admins can view all journals" 
ON public.teacher_journals 
FOR SELECT 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'daffa.al.akhdaan@gmail.com'
);

-- Admin can insert, update, delete all journals
CREATE POLICY "Admins can insert journals" 
ON public.teacher_journals 
FOR INSERT 
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'daffa.al.akhdaan@gmail.com'
);

CREATE POLICY "Admins can update journals" 
ON public.teacher_journals 
FOR UPDATE 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'daffa.al.akhdaan@gmail.com'
);

CREATE POLICY "Admins can delete journals" 
ON public.teacher_journals 
FOR DELETE 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'daffa.al.akhdaan@gmail.com'
);

-- Teachers can view their own journals
CREATE POLICY "Teachers can view own journals" 
ON public.teacher_journals 
FOR SELECT 
USING (auth.uid() = teacher_id);

-- Teachers can insert their own journals
CREATE POLICY "Teachers can insert own journals" 
ON public.teacher_journals 
FOR INSERT 
WITH CHECK (auth.uid() = teacher_id);

-- Teachers can update their own journals
CREATE POLICY "Teachers can update own journals" 
ON public.teacher_journals 
FOR UPDATE 
USING (auth.uid() = teacher_id);

-- Teachers can delete their own journals
CREATE POLICY "Teachers can delete own journals" 
ON public.teacher_journals 
FOR DELETE 
USING (auth.uid() = teacher_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_journals TO authenticated;
GRANT SELECT ON public.teacher_journals TO anon;
