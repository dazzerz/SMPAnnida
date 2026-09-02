const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres' });
async function checkStats() {
    try {
        await client.connect();
        
        // Check DB Size
        const dbRes = await client.query('SELECT pg_size_pretty(pg_database_size(current_database())) as size');
        console.log('Database Size:', dbRes.rows[0].size);
        
        // Check Storage Size (files)
        const storageRes = await client.query(`SELECT COALESCE(SUM((metadata->>'size')::bigint), 0) as total_bytes FROM storage.objects`);
        const bytes = storageRes.rows[0].total_bytes;
        const mb = (bytes / (1024 * 1024)).toFixed(2);
        console.log('Storage Size:', mb + ' MB');
        
        await client.end();
    } catch (e) {
        console.error(e.message);
    }
}
checkStats();
