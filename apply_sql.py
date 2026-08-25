import pg8000.native; 
db = pg8000.native.Connection('postgres', host='db.vxrgezyfxzynpucuomci.supabase.co', password='Annida12409.', database='postgres', port=5432);
with open('supabase/migrations/update_role_wali_murid.sql', 'r') as f:
    sql = f.read()
try:
    for statement in sql.split(';'):
        if statement.strip():
            print('Executing:', statement.strip())
            db.run(statement.strip())
    print('SUCCESS')
except Exception as e:
    print('ERROR:', e)

