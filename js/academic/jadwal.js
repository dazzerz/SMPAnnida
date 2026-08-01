import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const btnLihatJadwal = document.getElementById('btn-lihat-jadwal');
    const filterKelasJadwal = document.getElementById('filter-kelas-jadwal');
    const filterHariJadwal = document.getElementById('filter-hari-jadwal');
    const tbodyJadwal = document.getElementById('tbody-jadwal');

    if (btnLihatJadwal) {
        btnLihatJadwal.addEventListener('click', async () => {
            const kelas = filterKelasJadwal.value, hari = filterHariJadwal.value;
            tbodyJadwal.innerHTML = '<tr><td colspan="5" style="text-align:center;">Memuat...</td></tr>';
            try {
                let query = db.from('schedules').select('*');
                if (kelas) query = query.eq('kelas', kelas);
                if (hari) query = query.eq('hari', hari);
                const { data, error } = await query;
                if (error) throw error;
                if (data.length === 0) return tbodyJadwal.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada jadwal.</td></tr>';
                
                const hariOrder = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6 };
                data.sort((a, b) => hariOrder[a.hari] !== hariOrder[b.hari] ? hariOrder[a.hari] - hariOrder[b.hari] : a.jam_mulai.localeCompare(b.jam_mulai));
                
                tbodyJadwal.innerHTML = '';
                data.forEach(j => {
                    const jamMulai = j.jam_mulai ? j.jam_mulai.substring(0, 5) : '-', jamSelesai = j.jam_selesai ? j.jam_selesai.substring(0, 5) : '-';
                    tbodyJadwal.insertAdjacentHTML('beforeend', `<tr><td><strong>${j.hari}</strong></td><td><span style="color:var(--primary);font-weight:500;">${jamMulai} - ${jamSelesai}</span></td><td>${j.kelas}</td><td>${j.mata_pelajaran}</td><td>${j.guru_pengajar}</td></tr>`);
                });
            } catch (err) { tbodyJadwal.innerHTML = '<tr><td colspan="5" style="color:var(--danger);">Gagal memuat jadwal.</td></tr>'; }
        });
    }
});
