-- =========================================================================
-- MIGRATION: ADD 'PEMBINA' ROLE
-- =========================================================================

-- 1. Modify user_roles CHECK constraint to allow 'pembina'
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'teacher', 'student', 'pembina'));

-- 2. Grant SELECT access to pembina on key tables
-- We will use a function or directly check user_roles in the policy.

-- Finance: salary_slips
DROP POLICY IF EXISTS "Pembina can view all salary slips" ON public.salary_slips;
CREATE POLICY "Pembina can view all salary slips"
ON public.salary_slips FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'pembina'));

-- Finance: salary_slip_items
DROP POLICY IF EXISTS "Pembina can view all slip items" ON public.salary_slip_items;
CREATE POLICY "Pembina can view all slip items"
ON public.salary_slip_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'pembina'));

-- Finance: transactions
DROP POLICY IF EXISTS "Pembina can view transactions" ON public.transactions;
CREATE POLICY "Pembina can view transactions"
ON public.transactions FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'pembina'));

-- Finance: budgets
DROP POLICY IF EXISTS "Pembina can view budgets" ON public.budgets;
CREATE POLICY "Pembina can view budgets"
ON public.budgets FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'pembina'));

-- If there are other tables like academic that are strictly restricted to admin, 
-- they might need pembina read-access too. But usually academic tables are readable by 'authenticated'.
-- Let's explicitly add pembina to teacher_journals just in case it's heavily restricted.
DROP POLICY IF EXISTS "Pembina can view teacher journals" ON public.teacher_journals;
CREATE POLICY "Pembina can view teacher journals"
ON public.teacher_journals FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'pembina'));

