const { createClient } = require('@supabase/supabase-js');
const db = createClient(process.env.VITE_SUPABASE_URL || 'https://vxrgezyfxzynpucuomci.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgxNDEsImV4cCI6MjA5OTM1NDE0MX0.3Y9Mal4M76D8fJfcVXQLbPSpLL_m8H7zQ-oVQG6e5IA');
async function checkRPC() {
  const { data, error } = await db.rpc('admin_create_user');
  console.log("admin_create_user:", error ? error.message : "Exists!");
}
checkRPC();
