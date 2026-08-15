import { authState } from './authState.js';
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
        if (authState.isGuest) {
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
                const actSmt = window.activeSemester || 'Ganjil';
                const actThn = window.activeTahunAjaran || new Date().getFullYear().toString();
                const { error } = await db.from('grades').insert([{ student_id: studentId, mata_pelajaran: mapel, jenis_penilaian: jenis, nilai: parseInt(nilai), semester: actSmt, tahun_ajaran: actThn }]);
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
    // RAPOR DIGITAL LOGIC (SPRINT 30B)
    // ==========================================
    const raporTahun = document.getElementById('rapor-tahun');
    const raporSemester = document.getElementById('rapor-semester');
    const raporKelas = document.getElementById('rapor-kelas');
    const raporSiswa = document.getElementById('rapor-siswa');
    const btnTampilkanRapor = document.getElementById('btn-tampilkan-rapor');
    const btnCetakRapor = document.getElementById('btn-cetak-rapor');
    
    // Identitas
    const lblNama = document.getElementById('rapor-nama');
    const lblNis = document.getElementById('rapor-nis');
    const lblWali = document.getElementById('rapor-wali');
    const lblKelas = document.getElementById('rapor-kelas-lbl');
    const lblSemester = document.getElementById('rapor-semester-lbl');
    const lblTahun = document.getElementById('rapor-tahun-lbl');
    const lblDate = document.getElementById('rapor-date-lbl');
    const lblTtdWali = document.getElementById('rapor-ttd-wali');
    
    // Stats & Attendance
    const lblRata = document.getElementById('rapor-rata');
    const lblMax = document.getElementById('rapor-max');
    const lblMin = document.getElementById('rapor-min');
    const lblRank = document.getElementById('rapor-rank');
    const lblJmlMapel = document.getElementById('rapor-jml-mapel');
    const lblPredikatAkhir = document.getElementById('rapor-predikat-akhir');
    
    const lblHadir = document.getElementById('rapor-hadir');
    const lblSakit = document.getElementById('rapor-sakit');
    const lblIzin = document.getElementById('rapor-izin');
    const lblAlpha = document.getElementById('rapor-alpha');
    const lblJurnalCount = document.getElementById('rapor-jurnal-count');
    
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
                const yearStr = tahun.split('/')[0];
                let startDate = '', endDate = '';
                if (semester === 'Ganjil') {
                    startDate = `${yearStr}-07-01`;
                    endDate = `${yearStr}-12-31`;
                } else {
                    startDate = `${parseInt(yearStr)+1}-01-01`;
                    endDate = `${parseInt(yearStr)+1}-06-30`;
                }

                // P1 Fix: Use RPC for ranking, and only fetch grades for the specific student
                const [resStudents, resRanking, resStudentGrades, resAttendance, resJournals, resClass] = await Promise.all([
                    db.from('students').select('id, nama_lengkap, nisn').eq('kelas', kelas),
                    db.rpc('get_class_ranking', { p_kelas: kelas, p_tahun_ajaran: yearStr, p_semester: semester }),
                    db.from('grades').select('student_id, mata_pelajaran, nilai').eq('student_id', studentId).eq('semester', semester).eq('tahun_ajaran', yearStr),
                    db.from('attendance_students').select('status').eq('student_id', studentId).gte('attendance_date', startDate).lte('attendance_date', endDate),
                    db.from('teacher_journals').select('id, classes!inner(nama_kelas)', { count: 'exact', head: true }).eq('classes.nama_kelas', kelas).gte('date', startDate).lte('date', endDate),
                    db.from('classes').select('nama_kelas, teachers(nama)').eq('nama_kelas', kelas).single()
                ]);

                if (resStudents.error) throw resStudents.error;
                if (resRanking.error) throw resRanking.error;
                if (resStudentGrades.error) throw resStudentGrades.error;
                if (resAttendance.error) throw resAttendance.error;
                if (resJournals.error) throw resJournals.error;
                if (resClass.error && resClass.error.code !== 'PGRST116') throw resClass.error;

                const classStudents = resStudents.data;
                const student = classStudents.find(s => s.id === studentId);
                if (!student) throw new Error("Siswa tidak ditemukan dalam kelas.");

                // Kalkulasi Ranking dari RPC
                const rankingData = resRanking.data || [];
                const studentRankData = rankingData.find(r => r.student_id === studentId);
                const currentRank = studentRankData ? parseInt(studentRankData.rank) : '-';
                const totalStudentsWithGrades = rankingData.filter(r => parseFloat(r.avg_nilai) > 0).length;

                // Proses Nilai Siswa
                const studentGrades = resStudentGrades.data || [];
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
                    lblJmlMapel.textContent = '0';
                    lblRata.textContent = '-'; lblMax.textContent = '-'; lblMin.textContent = '-'; lblRank.textContent = '-';
                    lblPredikatAkhir.textContent = '-';
                } else {
                    for (const [mapel, stats] of Object.entries(mapelMap)) {
                        const avgMapel = Math.round(stats.total / stats.count);
                        overallTotal += avgMapel;
                        overallCount++;
                        if (avgMapel > maxNilai) maxNilai = avgMapel;
                        if (avgMapel < minNilai) minNilai = avgMapel;

                        let predikat = 'D', deskripsi = 'Perlu Bimbingan';
                        if (avgMapel >= 90) { predikat = 'A'; deskripsi = 'Sangat Baik'; }
                        else if (avgMapel >= 80) { predikat = 'B'; deskripsi = 'Baik'; }
                        else if (avgMapel >= 70) { predikat = 'C'; deskripsi = 'Cukup'; }

                        raporTbody.insertAdjacentHTML('beforeend', `
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px;">${escapeHTML(mapel)}</td>
                                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${avgMapel}</td>
                                <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">${predikat}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${deskripsi}</td>
                            </tr>
                        `);
                    }

                    const overallAvg = Math.round(overallTotal / overallCount);
                    lblJmlMapel.textContent = overallCount;
                    lblRata.textContent = overallAvg;
                    lblMax.textContent = maxNilai;
                    lblMin.textContent = minNilai;
                    
                    let predAkhir = 'D';
                    if (overallAvg >= 90) predAkhir = 'A (Sangat Baik)';
                    else if (overallAvg >= 80) predAkhir = 'B (Baik)';
                    else if (overallAvg >= 70) predAkhir = 'C (Cukup)';
                    else predAkhir = 'D (Perlu Bimbingan)';
                    lblPredikatAkhir.textContent = predAkhir;
                    
                    if (studentAverages[studentId].avg > 0) {
                        lblRank.textContent = `${currentRank} dari ${totalStudentsWithGrades}`;
                    } else {
                        lblRank.textContent = '-';
                    }
                }

                // Hitung Kehadiran
                let h = 0, i = 0, s = 0, a = 0;
                resAttendance.data.forEach(att => {
                    if (att.status === 'Hadir') h++;
                    else if (att.status === 'Izin') i++;
                    else if (att.status === 'Sakit') s++;
                    else if (att.status === 'Alpha') a++;
                });
                lblHadir.textContent = h;
                lblIzin.textContent = i;
                lblSakit.textContent = s;
                lblAlpha.textContent = a;

                // Hitung Jurnal
                lblJurnalCount.textContent = resJournals.count || 0;

                // Update Identitas
                lblNama.textContent = escapeHTML(student.nama_lengkap);
                lblNis.textContent = escapeHTML(student.nisn || '-');
                lblKelas.textContent = escapeHTML(kelas);
                lblSemester.textContent = escapeHTML(semester);
                lblTahun.textContent = escapeHTML(tahun);
                
                // Get Wali Kelas from classes table
                let waliName = "Belum Diatur";
                if (resClass.data && resClass.data.teachers && resClass.data.teachers.nama) {
                    waliName = resClass.data.teachers.nama;
                }
                
                lblWali.textContent = waliName; 
                lblTtdWali.textContent = `( ${waliName} )`;

                const formatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                lblDate.textContent = `Jakarta, ${formatter.format(new Date())}`;

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

