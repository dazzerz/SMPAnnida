import pg8000.native
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432)
triggers = db.run("SELECT trigger_name, action_statement FROM information_schema.triggers WHERE event_object_schema = 'auth' AND event_object_table = 'users'")
for t in triggers:
    print('TRIGGER:', t[0])
    print('ACTION:', t[1])
