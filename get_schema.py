import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
columns = db.run("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_roles'")
print(columns)
