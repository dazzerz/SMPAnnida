const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres' });
async function check() {
    try {
        await client.connect();
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'kelas'");
        console.log(res.rows);
        
        const resData = await client.query("SELECT * FROM kelas LIMIT 5");
        console.log("Data:", resData.rows);
        
        await client.end();
    } catch(e) { console.error(e.message); }
}
check();
