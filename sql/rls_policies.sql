-- Enable RLS on tables
ALTER TABLE IF EXISTS public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.finance_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "finance_transactions_policy" ON public.finance_transactions;
DROP POLICY IF EXISTS "finance_budgets_policy" ON public.finance_budgets;
DROP POLICY IF EXISTS "academic_jurnal_policy" ON public.academic_jurnal;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;

-- Create Policies
-- finance_transactions
CREATE POLICY "finance_transactions_policy" ON public.finance_transactions
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- finance_budgets
CREATE POLICY "finance_budgets_policy" ON public.finance_budgets
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- academic_jurnal
CREATE POLICY "academic_jurnal_policy" ON public.academic_jurnal
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- profiles
CREATE POLICY "profiles_policy" ON public.profiles
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- user_roles
CREATE POLICY "user_roles_policy" ON public.user_roles
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);
