import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
sql = """
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not logged in';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
"""
db.run(sql)
print('SUCCESS')
