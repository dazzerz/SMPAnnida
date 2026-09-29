const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL');
    
    const sql = fs.readFileSync('sql/rls_policies.sql', 'utf8');
    
    console.log('Executing RLS policies script...');
    await client.query(sql);
    
    console.log('Successfully executed RLS policies!');
  } catch (err) {
    console.error('Error executing script:', err.message);
  } finally {
    await client.end();
  }
}

run();
