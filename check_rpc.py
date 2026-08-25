import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
funcs = db.run("SELECT proname FROM pg_proc WHERE proname LIKE '%delete%'")
print([f[0] for f in funcs])
