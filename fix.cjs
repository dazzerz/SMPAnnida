const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres' });
client.connect()
  .then(() => client.query(`
    INSERT INTO public.user_roles (user_id, role)
    SELECT u.id, 'teacher'
    FROM auth.users u
    JOIN public.teachers t ON LOWER(u.email) = LOWER(t.email)
    ON CONFLICT (user_id) DO UPDATE SET role = 'teacher';
  `))
  .then(res => { console.log('Success! Rows affected:', res.rowCount); client.end(); })
  .catch(err => { console.error('Error:', err); client.end(); });
