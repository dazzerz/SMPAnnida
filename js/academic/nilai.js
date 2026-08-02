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

    // ==========================================
    // RAPOR DIGITAL LOGIC
    // ==========================================
    const raporTahun = document.getElementById('rapor-tahun');
    const raporSemester = document.getElementById('rapor-semester');
    const raporKelas = document.getElementById('rapor-kelas');
    const raporSiswa = document.getElementById('rapor-siswa');
    const btnTampilkanRapor = document.getElementById('btn-tampilkan-rapor');
    const btnCetakRapor = document.getElementById('btn-cetak-rapor');
    
    // Labels
    const lblNama = document.getElementById('rapor-nama');
    const lblNis = document.getElementById('rapor-nis');
    const lblKelas = document.getElementById('rapor-kelas-lbl');
    const lblSemester = document.getElementById('rapor-semester-lbl');
    const lblTahun = document.getElementById('rapor-tahun-lbl');
    const lblDate = document.getElementById('rapor-date-lbl');
    
    // Stats
    const lblRata = document.getElementById('rapor-rata');
    const lblMax = document.getElementById('rapor-max');
    const lblMin = document.getElementById('rapor-min');
    const lblRank = document.getElementById('rapor-rank');
    const raporTbody = document.getElementById('rapor-tbody');

    if (raporKelas) {
        raporKelas.addEventListener('change', (e) => {
            if (e.target.value) populateStudentsDropdown(e.target.value, raporSiswa);
            else { raporSiswa.innerHTML = '<option value="">-- Pilih Siswa --</option>'; raporSiswa.disabled = true; }
        });
    }

    if (btnTampilkanRapor) {
        btnTampilkanRapor.addEventListener('click', async () => {
            const tahun = raporTahun.value;
            const semester = raporSemester.value;
            const kelas = raporKelas.value;
            const studentId = raporSiswa.value;

            if (!kelas || !studentId) {
                if (window.showToast) window.showToast('Pilih kelas dan siswa terlebih dahulu.', 'warning');
                return;
            }

            btnTampilkanRapor.disabled = true;
            btnTampilkanRapor.textContent = 'Memuat...';
            raporTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Memuat data nilai...</td></tr>';
            btnCetakRapor.disabled = true;

            try {
                // Determine year string for query (e.g. "2026/2027" -> "2026")
                const yearStr = tahun.split('/')[0];

                // 1. Fetch current student details
                const { data: student, error: stuErr } = await db.from('students').select('id, nama_lengkap, nisn').eq('id', studentId).single();
                if (stuErr) throw stuErr;

                // 2. Fetch all students in class for ranking calculation
                const { data: classStudents, error: classStuErr } = await db.from('students').select('id').eq('kelas', kelas);
                if (classStuErr) throw classStuErr;
                const classStudentIds = classStudents.map(s => s.id);

                // 3. Fetch grades for ALL students in class for that semester & year
                const { data: allGrades, error: gradeErr } = await db.from('grades')
                    .select('student_id, mata_pelajaran, nilai')
                    .eq('semester', semester)
                    .eq('tahun_ajaran', yearStr)
                    .in('student_id', classStudentIds);
                if (gradeErr) throw gradeErr;

                // 4. Calculate rankings
                const studentAverages = {};
                classStudentIds.forEach(id => { studentAverages[id] = { total: 0, count: 0, avg: 0 }; });

                allGrades.forEach(g => {
                    studentAverages[g.student_id].total += g.nilai;
                    studentAverages[g.student_id].count++;
                });

                const rankingList = [];
                for (const id in studentAverages) {
                    if (studentAverages[id].count > 0) {
                        studentAverages[id].avg = studentAverages[id].total / studentAverages[id].count;
                    }
                    rankingList.push({ id, avg: studentAverages[id].avg });
                }

                // Sort descending
                rankingList.sort((a, b) => b.avg - a.avg);
                const currentRank = rankingList.findIndex(r => r.id === studentId) + 1;
                const totalStudentsWithGrades = rankingList.filter(r => r.avg > 0).length;

                // 5. Process current student grades grouped by subject
                const studentGrades = allGrades.filter(g => g.student_id === studentId);
                const mapelMap = {};
                let overallTotal = 0, overallCount = 0;
                let maxNilai = -Infinity, minNilai = Infinity;

                studentGrades.forEach(g => {
                    if (!mapelMap[g.mata_pelajaran]) mapelMap[g.mata_pelajaran] = { total: 0, count: 0 };
                    mapelMap[g.mata_pelajaran].total += g.nilai;
                    mapelMap[g.mata_pelajaran].count++;
                });

                raporTbody.innerHTML = '';
                
                if (Object.keys(mapelMap).length === 0) {
                    raporTbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada nilai di semester ini.</td></tr>';
                    // Clear identitas
                    lblNama.textContent = escapeHTML(student.nama_lengkap);
                    lblNis.textContent = escapeHTML(student.nisn || '-');
                    lblKelas.textContent = escapeHTML(kelas);
                    lblSemester.textContent = escapeHTML(semester);
                    lblTahun.textContent = escapeHTML(tahun);
                    lblRata.textContent = '-'; lblMax.textContent = '-'; lblMin.textContent = '-'; lblRank.textContent = '-';
                    return;
                }

                for (const [mapel, stats] of Object.entries(mapelMap)) {
                    const avgMapel = Math.round(stats.total / stats.count);
                    overallTotal += avgMapel;
                    overallCount++;
                    if (avgMapel > maxNilai) maxNilai = avgMapel;
                    if (avgMapel < minNilai) minNilai = avgMapel;

                    let predikat = 'D', deskripsi = 'Perlu bimbingan intensif.';
                    if (avgMapel >= 90) { predikat = 'A'; deskripsi = 'Sangat baik dalam menguasai materi.'; }
                    else if (avgMapel >= 80) { predikat = 'B'; deskripsi = 'Baik dalam menguasai materi.'; }
                    else if (avgMapel >= 70) { predikat = 'C'; deskripsi = 'Cukup dalam menguasai materi.'; }

                    raporTbody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td style="border: 1px solid #000; padding: 8px;">${escapeHTML(mapel)}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: center;">${avgMapel}</td>
                            <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">${predikat}</td>
                            <td style="border: 1px solid #000; padding: 8px;">${deskripsi}</td>
                        </tr>
                    `);
                }

                // Update Labels
                lblNama.textContent = escapeHTML(student.nama_lengkap);
                lblNis.textContent = escapeHTML(student.nisn || '-');
                lblKelas.textContent = escapeHTML(kelas);
                lblSemester.textContent = escapeHTML(semester);
                lblTahun.textContent = escapeHTML(tahun);
                
                const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                lblDate.textContent = `Jakarta, ${formatter.format(new Date())}`;

                const overallAvg = (overallTotal / overallCount).toFixed(1);
                lblRata.textContent = overallAvg;
                lblMax.textContent = maxNilai;
                lblMin.textContent = minNilai;
                
                // Rank formatting
                if (studentAverages[studentId].avg > 0) {
                    lblRank.textContent = `${currentRank} dari ${totalStudentsWithGrades}`;
                } else {
                    lblRank.textContent = '-';
                }

                btnCetakRapor.disabled = false;
                if (window.showToast) window.showToast('Rapor berhasil dimuat.', 'success');
            } catch (err) {
                console.error(err);
                raporTbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger); text-align:center;">Gagal memuat rapor.</td></tr>';
            } finally {
                btnTampilkanRapor.disabled = false;
                btnTampilkanRapor.textContent = 'Tampilkan Rapor';
            }
        });
    }

    if (btnCetakRapor) {
        btnCetakRapor.addEventListener('click', () => {
            window.print();
        });
    }
});
