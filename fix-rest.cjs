const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vxrgezyfxzynpucuomci.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc3ODE0MSwiZXhwIjoyMDk5MzU0MTQxfQ.bBth5MNrEufMNaXmqYeHdfkpJHUDB9GXeVAFqx9jvQA';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function fixRoles() {
    try {
        console.log('Fetching auth users...');
        const { data: { users }, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        if (usersErr) throw usersErr;

        console.log(`Found ${users.length} auth users.`);

        console.log('Fetching teachers...');
        const { data: teachers, error: teachersErr } = await supabase.from('teachers').select('email');
        if (teachersErr) throw teachersErr;
        
        console.log(`Found ${teachers.length} teachers.`);

        const teacherEmails = teachers.map(t => t.email.toLowerCase());
        const rolesToUpsert = [];

        for (const user of users) {
            if (user.email && teacherEmails.includes(user.email.toLowerCase())) {
                rolesToUpsert.push({
                    user_id: user.id,
                    role: 'teacher'
                });
            }
        }

        console.log(`Prepared ${rolesToUpsert.length} roles to upsert.`);

        if (rolesToUpsert.length > 0) {
            const { data, error: upsertErr } = await supabase.from('user_roles').upsert(rolesToUpsert, { onConflict: 'user_id' });
            if (upsertErr) throw upsertErr;
            console.log('Success! Roles updated.');
        } else {
            console.log('No roles to update.');
        }

    } catch (e) {
        console.error('Script failed:', e);
    }
}

fixRoles();
