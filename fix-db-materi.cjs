const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-ap-northeast-1.pooler.supabase.com',
  port: 5432,
  user: 'postgres.vxrgezyfxzynpucuomci',
  password: 'Annida12409.',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL (Tokyo Region)!');

    const sql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      CREATE TABLE IF NOT EXISTS public.materials (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          teacher_id TEXT,
          teacher_name TEXT,
          class_name TEXT,
          subject TEXT,
          title TEXT,
          description TEXT,
          material_url TEXT,
          material_type TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
      );

      ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "public_all_materials" ON public.materials;
      CREATE POLICY "public_all_materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

      ALTER TABLE IF EXISTS public.assignments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'tugas';

      -- Ensure storage buckets exist
      INSERT INTO storage.buckets (id, name, public)
      VALUES ('smpannida_storage', 'smpannida_storage', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      INSERT INTO storage.buckets (id, name, public)
      VALUES ('student-assignments', 'student-assignments', true)
      ON CONFLICT (id) DO UPDATE SET public = true;

      DROP POLICY IF EXISTS "public_all_storage" ON storage.objects;
      CREATE POLICY "public_all_storage" ON storage.objects FOR ALL USING (true) WITH CHECK (true);

      NOTIFY pgrst, 'reload schema';
    `;

    await client.query(sql);
    console.log('Successfully executed SQL DDL and reloaded PostgREST schema!');

    const cols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'materials'");
    console.log('Columns in public.materials:', cols.rows.map(r => `${r.column_name} (${r.data_type})`));

    const buckets = await client.query("SELECT id, name, public FROM storage.buckets");
    console.log('Storage buckets:', buckets.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
}

main();
