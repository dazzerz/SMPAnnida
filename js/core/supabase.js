// =====================================================
// SMPAnnida - Supabase Client
// =====================================================
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("VITE_SUPABASE_URL or KEY is missing! URL: ", SUPABASE_URL);
  throw new Error('ENV VITE_SUPABASE_URL tidak di-set - pastikan .env berisi URL Supabase yang valid');
}

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabaseClient;
