const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `);
    
    console.log('Tables in public schema:');
    res.rows.forEach(r => console.log('- ' + r.tablename));
    
  } catch (err) {
    console.error('Error executing script:', err.message);
  } finally {
    await client.end();
  }
}

run();
