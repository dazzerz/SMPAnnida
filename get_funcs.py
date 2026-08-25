import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
funcs = db.run("SELECT proname, prosrc FROM pg_proc WHERE proname IN ('handle_new_user', 'handle_new_user_role')")
for f in funcs:
    print('FUNCTION:', f[0])
    print('SOURCE:\n', f[1])
    print('-'*40)
