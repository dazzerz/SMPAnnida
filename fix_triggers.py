import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
try:
    db.run("DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;")
    db.run("DROP FUNCTION IF EXISTS handle_new_user_role();")
    print('SUCCESS')
except Exception as e:
    print('ERROR:', e)
