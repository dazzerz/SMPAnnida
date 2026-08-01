import supabaseClient from '../core/supabase.js';
import { escapeHTML } from '../core/utils.js';
const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const selectKelasNilai = document.getElementById('select-kelas-nilai');
    const selectSiswaNilai = document.getElementById('select-siswa-nilai');
    const btnSimpanNilai = document.getElementById('btn-simpan-nilai');
    const statusSimpanNilai = document.getElementById('status-simpan-nilai');
    const filterKelasRekap = document.getElementById('filter-kelas-rekap');
    const filterSiswaRekap = document.getElementById('filter-siswa-rekap');
    const btnLihatRekap = document.getElementById('btn-lihat-rekap');
    const tbodyRekapNilai = document.getElementById('tbody-rekap-nilai');

    async function populateStudentsDropdown(kelas, selectElement) {
        selectElement.innerHTML = '<option value="">Memuat...</option>';
        selectElement.disabled = true;
        try {
            const { data, error } = await db.from('students').select('id, nama_lengkap').eq('kelas', kelas).order('nama_lengkap');
            if (error) throw error;
            selectElement.innerHTML = '<option value="">-- Pilih Siswa --</option>';
            data.forEach(student => {
                selectElement.insertAdjacentHTML('beforeend', `<option value="${student.id}">${escapeHTML(student.nama_lengkap)}</option>`);
            });
            selectElement.disabled = false;
        } catch (err) { selectElement.innerHTML = '<option value="">Gagal</option>'; }
    }

    if(selectKelasNilai) selectKelasNilai.addEventListener('change', (e) => e.target.value ? populateStudentsDropdown(e.target.value, selectSiswaNilai) : (selectSiswaNilai.innerHTML = '<option value="">-- Pilih Siswa --</option>', selectSiswaNilai.disabled = true));
    if(filterKelasRekap) filterKelasRekap.addEventListener('change', (e) => e.target.value ? populateStudentsDropdown(e.target.value, filterSiswaRekap) : (filterSiswaRekap.innerHTML = '<option value="">-- Pilih Siswa --</option>', filterSiswaRekap.disabled = true));

    if(btnSimpanNilai) {
        if (window.isGuest) {
            btnSimpanNilai.disabled = true;
            btnSimpanNilai.title = "Guest (View Only)";
            document.getElementById('input-mapel-nilai').disabled = true;
            document.getElementById('select-jenis-nilai').disabled = true;
            document.getElementById('input-angka-nilai').disabled = true;
        }
        btnSimpanNilai.addEventListener('click', async () => {
            const studentId = selectSiswaNilai.value, mapel = document.getElementById('input-mapel-nilai').value.trim(), jenis = document.getElementById('select-jenis-nilai').value, nilai = document.getElementById('input-angka-nilai').value;
            if (!studentId || !mapel || !nilai) return statusSimpanNilai.textContent = "Mohon lengkapi semua data.", statusSimpanNilai.style.color = "var(--danger)";
            btnSimpanNilai.disabled = true; statusSimpanNilai.textContent = "Menyimpan..."; statusSimpanNilai.style.color = "var(--text-muted)";
            try {
                const { error } = await db.from('grades').insert([{ student_id: studentId, mata_pelajaran: mapel, jenis_penilaian: jenis, nilai: parseInt(nilai), semester: 'Ganjil', tahun_ajaran: new Date().getFullYear().toString() }]);
                if (error) throw error;
                statusSimpanNilai.textContent = "Disimpan!"; statusSimpanNilai.style.color = "var(--success)"; document.getElementById('input-angka-nilai').value = '';
            } catch (err) { statusSimpanNilai.textContent = "Gagal."; statusSimpanNilai.style.color = "var(--danger)"; } finally { btnSimpanNilai.disabled = false; }
        });
    }

    if(btnLihatRekap) {
        btnLihatRekap.addEventListener('click', async () => {
            const studentId = filterSiswaRekap.value;
            if (!studentId) return alert("Pilih siswa!");
            tbodyRekapNilai.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat...</td></tr>';
            try {
                const { data, error } = await db.from('grades').select('*').eq('student_id', studentId);
                if (error) throw error;
                if (data.length === 0) return tbodyRekapNilai.innerHTML = '<tr><td colspan="6" style="text-align:center;">Belum ada data.</td></tr>';
                const mapelGroups = {};
                data.forEach(g => {
                    if (!mapelGroups[g.mata_pelajaran]) mapelGroups[g.mata_pelajaran] = { Tugas: '-', UH: '-', UTS: '-', UAS: '-' };
                    let key = g.jenis_penilaian === 'Ulangan Harian' ? 'UH' : g.jenis_penilaian;
                    mapelGroups[g.mata_pelajaran][key] = g.nilai;
                });
                tbodyRekapNilai.innerHTML = '';
                for (const [mapel, n] of Object.entries(mapelGroups)) {
                    let total = 0, count = 0;
                    ['Tugas', 'UH', 'UTS', 'UAS'].forEach(k => { if (n[k] !== '-') total += n[k], count++; });
                    const rata = count > 0 ? (total / count).toFixed(1) : '-';
                    tbodyRekapNilai.insertAdjacentHTML('beforeend', `<tr><td><strong>${escapeHTML(mapel)}</strong></td><td>${n.Tugas}</td><td>${n.UH}</td><td>${n.UTS}</td><td>${n.UAS}</td><td style="color:var(--primary);font-weight:bold;">${rata}</td></tr>`);
                }
            } catch (err) { tbodyRekapNilai.innerHTML = '<tr><td colspan="6" style="color:var(--danger);">Gagal</td></tr>'; }
        });
    }
});
