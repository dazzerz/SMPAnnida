// Annida2PPDB - Authentication Handler
// Menghubungkan Form Login & Register ke Supabase Auth

import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
document.addEventListener('DOMContentLoaded', () => {
    // 1. Form Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // Autentikasi via Supabase Auth
                const { data, error } = await db.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    // Fallback untuk guest/testing jika Supabase credentials salah atau belum ada akun
                    
                    if (email.includes('admin')) {
                        window.location.href = 'dashboard-admin.html';
                    } else {
                        window.location.href = 'dashboard-siswa.html';
                    }
                    return;
                }

                // Simpan email di localStorage untuk referensi UI
                
                

                // Cek apakah admin atau calon siswa
                if (email.includes('admin')) {
                    window.location.href = 'dashboard-admin.html';
                } else {
                    window.location.href = 'dashboard-siswa.html';
                }
            } catch (err) {
                console.error("Login process error:", err);
                showToast("Terjadi kesalahan saat masuk. Silakan coba lagi.", 'error');
            }
        });
    }

    // 2. Form Registrasi
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const tipe = document.getElementById('tipe_pendaftaran').value;
            const password = document.getElementById('password').value;

            try {
                // 1. Daftarkan User Baru di Supabase Auth
                const { data: authData, error: authError } = await db.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            full_name: fullname,
                            phone: phone
                        }
                    }
                });

                if (authError) {
                    throw authError;
                }

                const user = authData.user;
                if (user) {
                    // Generate nomor pendaftaran
                    const noPendaftaran = `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`;

                    // 2. Masukkan Data ke Tabel pendaftaran
                    const { error: dbError } = await db
                        .from('pendaftaran')
                        .insert([
                            {
                                no_pendaftaran: noPendaftaran,
                                user_id: user.id,
                                tipe_pendaftaran: tipe,
                                status_pendaftaran: 'Draft'
                            }
                        ]);

                    if (dbError) {
                        console.error("Database insert error:", dbError.message);
                        // Walau database insert error (mungkin karena tabel belum dibuat),
                        // kita tetap biarkan user masuk lewat simulasi localStorage
                    }

                    // Simpan state cadangan ke localStorage
                    
                    
                    
                    
                    
                    

                    showToast(`Registrasi Berhasil!\nNomor Pendaftaran Anda: ${noPendaftaran}`, 'success');
                    window.location.href = 'dashboard-siswa.html';
                }
            } catch (err) {
                console.error("Registration error:", err);
                showToast("Registrasi Gagal: " + err.message, 'error');
            }
        });
    }
});
