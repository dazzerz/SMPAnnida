import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    async function loadDashboardStats() {
        try {
            const { count: totalSiswa, error: errorSiswa } = await db.from('students').select('*', { count: 'exact', head: true });
            if (errorSiswa) throw errorSiswa;
            document.getElementById('total-siswa').innerText = totalSiswa || 0;

            const { data: classData, error: errorKelas } = await db.from('students').select('kelas');
            if (errorKelas) throw errorKelas;
            
            const uniqueClasses = new Set(classData.map(s => s.kelas)).size;
            document.getElementById('total-kelas').innerText = uniqueClasses || 0;
        } catch (error) {
            console.error(error);
            document.getElementById('total-siswa').innerText = 0;
            document.getElementById('total-kelas').innerText = 0;
        }
    }

    loadDashboardStats();
    if(window.loadAbsensiClasses) window.loadAbsensiClasses();

    // Import CSV
    const btnImportSiswa = document.getElementById('btn-import-siswa');
    const fileImportSiswa = document.getElementById('file-import-siswa');
    const importStatus = document.getElementById('import-status');

    if(btnImportSiswa) {
        if (window.isGuest) {
            btnImportSiswa.disabled = true;
            fileImportSiswa.disabled = true;
            btnImportSiswa.title = "Guest (View Only)";
        }
        btnImportSiswa.addEventListener('click', () => {
            const file = fileImportSiswa.files[0];
            if (!file) { importStatus.textContent = 'Pilih file CSV.'; importStatus.style.color = 'var(--danger)'; return; }

            importStatus.textContent = 'Membaca file...'; importStatus.style.color = 'var(--text-muted)';
            btnImportSiswa.disabled = true;

            Papa.parse(file, {
                header: true, skipEmptyLines: true,
                complete: async function(results) {
                    try {
                        const data = results.data;
                        if (data.length === 0) throw new Error("File kosong.");
                        if (!data[0].hasOwnProperty('nama_lengkap') || !data[0].hasOwnProperty('kelas')) throw new Error("Format salah.");

                        importStatus.textContent = 'Menyimpan...';
                        const cleanData = data.map(row => ({
                            nama_lengkap: row.nama_lengkap, nisn: row.nisn || null,
                            kelas: row.kelas, status_aktif: row.status_aktif ? (row.status_aktif.toLowerCase() === 'true') : true
                        }));

                        const { error } = await db.from('students').insert(cleanData);
                        if (error) throw error;

                        importStatus.textContent = `Berhasil mengimport ${cleanData.length} siswa!`;
                        importStatus.style.color = 'var(--success)';
                        fileImportSiswa.value = '';
                        loadDashboardStats();
                        if(window.loadAbsensiClasses) window.loadAbsensiClasses();
                    } catch (err) {
                        importStatus.textContent = `Gagal: ${err.message}`; importStatus.style.color = 'var(--danger)';
                    } finally { btnImportSiswa.disabled = false; }
                }
            });
        });
    }
});
