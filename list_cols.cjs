const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    const tables = ['transactions', 'budgets', 'teacher_journals', 'profiles', 'user_roles'];
    
    for (const table of tables) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [table]);
      
      console.log(`\nColumns for ${table}:`);
      res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
    }
    
  } catch (err) {
    console.error('Error executing script:', err.message);
  } finally {
    await client.end();
  }
}

run();
