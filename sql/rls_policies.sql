-- Enable RLS on tables
ALTER TABLE IF EXISTS public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "transactions_policy" ON public.transactions;
DROP POLICY IF EXISTS "budgets_policy" ON public.budgets;
DROP POLICY IF EXISTS "teacher_journals_policy" ON public.teacher_journals;
DROP POLICY IF EXISTS "profiles_policy" ON public.profiles;
DROP POLICY IF EXISTS "user_roles_policy" ON public.user_roles;

-- Create Policies
-- transactions
CREATE POLICY "transactions_policy" ON public.transactions
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- budgets
CREATE POLICY "budgets_policy" ON public.budgets
FOR ALL
USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- teacher_journals (uses teacher_id)
CREATE POLICY "teacher_journals_policy" ON public.teacher_journals
FOR ALL
USING (
  auth.uid() = teacher_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = teacher_id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
);

-- profiles (uses id)
CREATE POLICY "profiles_policy" ON public.profiles
FOR ALL
USING (
  auth.uid() = id OR 
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')
)
WITH CHECK (
  auth.uid() = id OR 
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
