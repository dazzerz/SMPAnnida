DROP POLICY IF EXISTS "Teachers can view own salary slips" ON public.salary_slips;
CREATE POLICY "Teachers can view own salary slips" ON public.salary_slips
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = teacher_id AND t.email = (auth.jwt()->>'email')::text)
);

DROP POLICY IF EXISTS "Teachers can view own slip items" ON public.salary_slip_items;
CREATE POLICY "Teachers can view own slip items" ON public.salary_slip_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.salary_slips s 
    JOIN public.teachers t ON t.id = s.teacher_id 
    WHERE s.id = slip_id AND t.email = (auth.jwt()->>'email')::text
  )
);
