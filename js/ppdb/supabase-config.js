// [LEGACY] - Siap dihapus pada Sprint Cleanup.
// Annida2PPDB - Supabase Configuration
// Menggunakan kredensial dari ekosistem Annida2 yang sudah aktif

const SUPABASE_URL = 'https://vxrgezyfxzynpucuomci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgxNDEsImV4cCI6MjA5OTM1NDE0MX0.3Y9Mal4M76D8fJfcVXQLbPSpLL_m8H7zQ-oVQG6e5IA';

// Inisialisasi Supabase client secara global di window.db agar konsisten dengan Annida2Academic
window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('Supabase client initialized successfully.');
