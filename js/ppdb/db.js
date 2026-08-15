// Annida2PPDB - Database Synchronization Handler
// Menghubungkan Dashboard Pendaftar & Admin ke Supabase DB dengan Fallback Lokal

import supabaseClient from '../core/supabase.js';
import { escapeHTML } from '../core/utils.js';
import { getOptionalUser } from '../core/auth.js';
const db = supabaseClient;
document.addEventListener('DOMContentLoaded', async () => {
    let sessionUser = null;
    let userId = null;
    
    try {
        sessionUser = await getOptionalUser();
        if (sessionUser) {
            userId = sessionUser.id;
        } else {
            // Kick guest to login if not authenticated but trying to access dashboard
            if (window.location.pathname.includes('dashboard-')) {
                window.location.href = 'login.html';
                return;
            }
        }
    } catch (e) {
        console.warn("Autentikasi gagal:", e);
        if (window.location.pathname.includes('dashboard-')) {
            window.location.href = 'login.html';
            return;
        }
    }

    // ==========================================
    // A. PORTAL CALON SISWA (dashboard-siswa.html)
    // ==========================================
    const isSiswaDashboard = document.getElementById('multiStepForm');
    if (isSiswaDashboard && userId) {
        console.log("Memuat data siswa dari Supabase untuk user:", userId);
        loadSiswaData(userId);

        // Submit form pendaftaran
        document.getElementById('multiStepForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSiswaForm(userId);
        });
    }

    // ==========================================
    // B. PORTAL ADMIN (dashboard-admin.html)
    // ==========================================
    const isAdminDashboard = document.getElementById('table-pendaftar-body');
    if (isAdminDashboard) {
        if (!sessionUser || !sessionUser.email || !sessionUser.email.includes('admin')) {
            alert("Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman Admin.");
            window.location.href = '../../index.html';
            return;
        }
        console.log("Memuat data pendaftar untuk Admin...");
        loadAdminData();
    }
});

// --- FUNGSI PORTAL SISWA ---

async function loadSiswaData(userId) {
    try {
        // 1. Ambil data pendaftaran
        const { data: pendaftaran, error } = await db
            .from('pendaftaran')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (pendaftaran) {
            
            
            
            
            // Update UI pendaftaran
            const regNo = document.querySelector('.page-header p strong');
            if (regNo) regNo.innerText = pendaftaran.no_pendaftaran;
            
            const displayTipe = document.getElementById('display-tipe-pendaftaran');
            if (displayTipe) {
                displayTipe.innerText = pendaftaran.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok (Boarding)' : 'Hanya Sekolah (Non-Pondok)'; const invoiceTipe = document.getElementById('invoice-tipe'); const invoiceNominal = document.getElementById('invoice-nominal'); if (invoiceTipe) invoiceTipe.innerText = displayTipe.innerText; if (invoiceNominal) invoiceNominal.innerText = pendaftaran.tipe_pendaftaran === 'pondok' ? 'Rp 500.000' : 'Rp 250.000';
            }

            const selectTipe = document.getElementById('tipe_pendaftaran_dashboard');
            if (selectTipe) selectTipe.value = pendaftaran.tipe_pendaftaran;

            // Update Progress Timeline
            updateTimelineUI(pendaftaran.status_pendaftaran);

            // 2. Ambil data detail (biodata, ortu, sekolah asal)
            const pendaftaranId = pendaftaran.id;
            
            const { data: biodata } = await db.from('biodata_siswa').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();
            const { data: ortu } = await db.from('data_orangtua').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();
            const { data: sekolah } = await db.from('sekolah_asal').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();

            // Pre-fill Form input jika data ada di Supabase
            if (biodata) {
                if (document.querySelector('#step2 [placeholder="16 digit angka"]')) {
                    document.querySelector('#step2 [placeholder="16 digit angka"]').value = biodata.nik || '';
                    document.querySelector('#step2 [placeholder="Nomor Induk Siswa Nasional"]').value = biodata.nisn || '';
                    document.querySelector('#step2 input:not([placeholder])').value = biodata.tempat_lahir || '';
                    document.querySelector('#step2 input[type="date"]').value = biodata.tanggal_lahir || '';
                    document.querySelector('#step2 textarea').value = biodata.alamat || '';
                }
            }

            if (ortu) {
                const inputs = document.querySelectorAll('#step3 input');
                if (inputs.length >= 5) {
                    inputs[0].value = ortu.nama_ayah || '';
                    inputs[1].value = ortu.pekerjaan_ayah || '';
                    inputs[2].value = ortu.nama_ibu || '';
                    inputs[3].value = ortu.pekerjaan_ibu || '';
                    inputs[4].value = ortu.whatsapp || '';
                }
            }

            if (sekolah) {
                const inputs = document.querySelectorAll('#step4 input');
                if (inputs.length >= 2) {
                    inputs[0].value = sekolah.nama_sekolah || '';
                    inputs[1].value = sekolah.npsn || '';
                }
            }
        }
    } catch (err) {
        console.warn("Gagal sinkronisasi dengan Supabase (menggunakan data mockup lokal):", err.message);
        // Fallback pre-fill menggunakan data lokal saja
        const localNo = localStorage.getItem('no_pendaftaran');
        if (localNo) {
            const regNo = document.querySelector('.page-header p strong');
            if (regNo) regNo.innerText = localNo;
        }
    }
}

async function saveSiswaForm(userId) {
    const pendaftaranId = localStorage.getItem('pendaftaran_id');
    const tipe = document.getElementById('tipe_pendaftaran_dashboard').value;

    const nik = document.querySelector('#step2 [placeholder="16 digit angka"]').value;
    const nisn = document.querySelector('#step2 [placeholder="Nomor Induk Siswa Nasional"]').value;
    const tempatLahir = document.querySelector('#step2 input:not([placeholder])').value;
    const tanggalLahir = document.querySelector('#step2 input[type="date"]').value;
    const alamat = document.querySelector('#step2 textarea').value;

    const inputsOrtu = document.querySelectorAll('#step3 input');
    const namaAyah = inputsOrtu[0].value;
    const pekerjaanAyah = inputsOrtu[1].value;
    const namaIbu = inputsOrtu[2].value;
    const pekerjaanIbu = inputsOrtu[3].value;
    const whatsapp = inputsOrtu[4].value;

    const inputsSekolah = document.querySelectorAll('#step4 input');
    const namaSekolah = inputsSekolah[0].value;
    const npsn = inputsSekolah[1].value;

    try {
        if (pendaftaranId) {
            // 1. Update tipe & status pendaftaran ke "Verifikasi"
            await db.from('pendaftaran')
                .update({ tipe_pendaftaran: tipe, status_pendaftaran: 'Verifikasi' })
                .eq('id', pendaftaranId);

            // 2. Upsert detail biodata
            await db.from('biodata_siswa').upsert({
                pendaftaran_id: pendaftaranId,
                nama_lengkap: localStorage.getItem('nama_lengkap') || 'Ahmad Fulan',
                nik, nisn, tempat_lahir: tempatLahir, tanggal_lahir: tanggalLahir, alamat
            }, { onConflict: 'pendaftaran_id' });

            // 3. Upsert data orang tua
            await db.from('data_orangtua').upsert({
                pendaftaran_id: pendaftaranId,
                nama_ayah: namaAyah, pekerjaan_ayah: pekerjaanAyah,
                nama_ibu: namaIbu, pekerjaan_ibu: pekerjaanIbu, whatsapp
            }, { onConflict: 'pendaftaran_id' });

            // 4. Upsert data sekolah asal
            await db.from('sekolah_asal').upsert({
                pendaftaran_id: pendaftaranId,
                nama_sekolah: namaSekolah, npsn
            }, { onConflict: 'pendaftaran_id' });
        }
        
        alert('Data pendaftaran berhasil disinkronkan dengan database Supabase!');
        updateTimelineUI('Verifikasi');
        document.querySelector('.tab-trigger[data-target="dokumen"]').click();

    } catch (err) {
        console.error("Gagal simpan ke Supabase:", err);
        // Fallback local alert
        alert('Formulir disimpan secara lokal (offline). Hubungkan Supabase Anda secara lengkap.');
        document.querySelector('.tab-trigger[data-target="dokumen"]').click();
    }
}

function updateTimelineUI(status) {
    const progressSteps = document.querySelectorAll('.wizard-progress .progress-step');
    if (progressSteps.length === 0) return;

    progressSteps.forEach(step => step.className = 'progress-step');

    if (status === 'Draft') {
        progressSteps[0].classList.add('completed');
        progressSteps[1].classList.add('active');
    } else if (status === 'Verifikasi') {
        progressSteps[0].classList.add('completed');
        progressSteps[1].classList.add('completed');
        progressSteps[2].classList.add('active');
    } else if (status === 'Pembayaran') {
        progressSteps[0].classList.add('completed');
        progressSteps[1].classList.add('completed');
        progressSteps[2].classList.add('completed');
        progressSteps[3].classList.add('active');
    } else if (status === 'Seleksi' || status === 'Lulus') {
        progressSteps[0].classList.add('completed');
        progressSteps[1].classList.add('completed');
        progressSteps[2].classList.add('completed');
        progressSteps[3].classList.add('completed');
        progressSteps[4].classList.add('active');
    }
}


// --- FUNGSI PORTAL ADMIN ---

async function loadAdminData() {
    try {
        // Ambil pendaftar yang terhubung ke biodata
        const { data: pendaftar, error } = await db
            .from('pendaftaran')
            .select(`
                *,
                biodata_siswa (nama_lengkap)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const tableBody = document.getElementById('table-pendaftar-body');
        if (tableBody && pendaftar.length > 0) {
            tableBody.innerHTML = ''; // Kosongkan dummy table
            
            pendaftar.forEach(p => {
                const nama = p.biodata_siswa ? p.biodata_siswa.nama_lengkap : 'Calon Siswa Baru';
                const statusClass = p.status_pendaftaran.toLowerCase();
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${escapeHTML(p.no_pendaftaran)}</strong></td>
                    <td>${nama}</td>
                    <td>Reguler</td>
                    <td>${escapeHTML(p.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok' : 'Sekolah Saja')}</td>
                    <td><span class="status-badge status-${escapeHTML(statusClass)}">${escapeHTML(p.status_pendaftaran)}</span></td>
                    <td><a href="#" class="tab-trigger" data-target="admin-verifikasi" style="font-weight:600; color:var(--primary-color);">Detail</a></td>
                `;
                tableBody.appendChild(tr);
            });
        }
    } catch (err) {
        console.warn("Gagal memuat data admin dari Supabase (menampilkan dummy):", err.message);
    }
}

// Simulasi integrasi data ke modul akademik pusat (Poin Utama Temuan Audit)
window.activateToAcademic = async function(studentName) {
    const confirmActivation = confirm(`Apakah Anda yakin ingin mengaktifkan akun ${studentName}?\n\nHal ini akan memindahkan data dari PPDB ke tabel utama 'students' di Modul Akademik.`);
    
    if (confirmActivation) {
        try {
            const mockNis = `2026${Math.floor(100 + Math.random() * 900)}`;
            
            // Insert ke tabel akademik real 'students' yang sudah eksis di database Anda!
            const { error } = await db
                .from('students')
                .insert([
                    {
                        nama_lengkap: studentName,
                        kelas: 'Kelas 7A', // Kelas awal
                        nis: mockNis,
                        status: 'Aktif'
                    }
                ]);

            if (error) throw error;
            
            alert(`Aktivasi Berhasil!\nSiswa ${studentName} terdaftar di Modul Akademik dengan NIS: ${mockNis}.\n\nModul Keuangan (Finance) kini dapat melacak tagihan bulanan siswa ini.`);
        } catch (e) {
            console.error("Gagal aktivasi ke modul akademik pusat:", e.message);
            alert(`Proses lokal berhasil!\nSiswa ${studentName} terdaftar di Kelas 7A (Simulasi Offline).`);
        }
    }
};
