import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

const SUPABASE_URL = 'https://vxrgezyfxzynpucuomci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgxNDEsImV4cCI6MjA5OTM1NDE0MX0.3Y9Mal4M76D8fJfcVXQLbPSpLL_m8H7zQ-oVQG6e5IA';
window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect ke index jika sudah login
    const { data: { session } } = await db.auth.getSession();
    if (session) {
        window.location.href = 'index.html';
    }

    const form = document.getElementById('login-form');
    const errorMsg = document.getElementById('login-error');
    const btn = document.getElementById('btn-login');

    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            btn.disabled = true;
            btn.textContent = 'Memproses...';
            errorMsg.style.display = 'none';

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { data, error } = await db.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                errorMsg.textContent = 'Login gagal: Email atau Password salah.';
                errorMsg.style.display = 'block';
                btn.disabled = false;
                btn.textContent = 'Masuk';
            } else {
                localStorage.removeItem('isGuest');
                window.location.href = 'index.html';
            }
        });
    }

    const btnGuest = document.getElementById('btn-guest-login');
    if (btnGuest) {
        btnGuest.addEventListener('click', () => {
            localStorage.setItem('isGuest', 'true');
            window.location.href = 'index.html';
        });
    }
});
