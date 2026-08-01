import supabaseClient from '../core/supabase.js';
const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const selectKelas = document.getElementById('select-kelas-absensi');
    const absensiContainer = document.getElementById('absensi-container');
    const tbodyAbsensi = document.getElementById('tbody-absensi');
    const btnSimpanAbsensi = document.getElementById('btn-simpan-absensi');

    if(selectKelas) {
        selectKelas.addEventListener('change', async (e) => {
            const kelas = e.target.value;
            if (!kelas) { absensiContainer.style.display = 'none'; return; }

            absensiContainer.style.display = 'block';
            tbodyAbsensi.innerHTML = '<tr><td colspan="2">Memuat data siswa...</td></tr>';

            try {
                const { data: students, error } = await db.from('students').select('*').eq('kelas', kelas).order('nama_lengkap', { ascending: true });
                if (error) throw error;

                if (students.length === 0) {
                    tbodyAbsensi.innerHTML = '<tr><td colspan="2">Belum ada siswa di kelas ini.</td></tr>';
                    return;
                }

                tbodyAbsensi.innerHTML = '';
                students.forEach(student => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${window.escapeHTML(student.nama_lengkap)}</strong><div style="font-size: 12px; color: var(--text-muted);">${window.escapeHTML(student.nisn) || '-'}</div></td>
                        <td>
                            <div class="attendance-toggle">
                                <input type="radio" name="attend_${student.id}" id="hadir_${student.id}" value="Hadir" checked> <label for="hadir_${student.id}">Hadir</label>
                                <input type="radio" name="attend_${student.id}" id="izin_${student.id}" value="Izin"> <label for="izin_${student.id}">Izin</label>
                                <input type="radio" name="attend_${student.id}" id="sakit_${student.id}" value="Sakit"> <label for="sakit_${student.id}">Sakit</label>
                                <input type="radio" name="attend_${student.id}" id="alpa_${student.id}" value="Alpa"> <label for="alpa_${student.id}">Alpa</label>
                            </div>
                        </td>`;
                    tbodyAbsensi.appendChild(tr);
                });

                if (window.isGuest) {
                    btnSimpanAbsensi.disabled = true;
                    btnSimpanAbsensi.title = "Guest (View Only)";
                    document.querySelectorAll('.attendance-toggle input').forEach(el => el.disabled = true);
                }

                btnSimpanAbsensi.onclick = async () => {
                    btnSimpanAbsensi.disabled = true; btnSimpanAbsensi.textContent = 'Menyimpan...';
                    const attendanceData = [];
                    const today = new Date().toISOString().split('T')[0];

                    students.forEach(student => {
                        const status = document.querySelector(`input[name="attend_${student.id}"]:checked`).value;
                        attendanceData.push({ student_id: student.id, tanggal: today, status_kehadiran: status });
                    });

                    try {
                        const { error: upsertError } = await db.from('attendance').upsert(attendanceData, { onConflict: 'tanggal, student_id' });
                        if (upsertError) throw upsertError;
                        alert('Data absensi berhasil disimpan!');
                    } catch (err) {
                        alert('Gagal menyimpan data.');
                    } finally {
                        btnSimpanAbsensi.disabled = false; btnSimpanAbsensi.textContent = 'Simpan Absensi';
                    }
                };
            } catch (err) {
                tbodyAbsensi.innerHTML = '<tr><td colspan="2">Terjadi kesalahan saat memuat data.</td></tr>';
            }
        });
    }

    // ==========================================
    // LOGIKA REKAP ABSENSI PIVOT GRID
    // ==========================================
    const filterDariAbsensi = document.getElementById('filter-dari-absensi');
    const filterSampaiAbsensi = document.getElementById('filter-sampai-absensi');
    const filterKelasRekapAbsensi = document.getElementById('filter-kelas-rekap-absensi');
    const btnLihatRekapAbsensi = document.getElementById('btn-lihat-rekap-absensi');
    const tbodyRekapAbsensi = document.getElementById('tbody-rekap-absensi');
    const theadPivot = document.getElementById('thead-pivot-absensi');

    // Set default tanggal: dari = awal minggu ini, sampai = hari ini
    if (filterDariAbsensi && filterSampaiAbsensi) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        filterDariAbsensi.value = monday.toISOString().split('T')[0];
        filterSampaiAbsensi.value = today.toISOString().split('T')[0];
    }

    function getStatusAbbr(status) {
        if (!status) return { abbr: '-', color: 'var(--text-muted)' };
        const map = {
            'Hadir': { abbr: 'H', color: 'var(--success)' },
            'Izin':  { abbr: 'I', color: 'var(--warning)' },
            'Sakit': { abbr: 'S', color: 'var(--warning)' },
            'Alpa':  { abbr: 'A', color: 'var(--danger)' },
        };
        return map[status] || { abbr: status[0], color: 'var(--text-main)' };
    }

    function getDatesInRange(dari, sampai) {
        const dates = [];
        let current = new Date(dari);
        const end = new Date(sampai);
        while (current <= end) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }

    if (btnLihatRekapAbsensi) {
        btnLihatRekapAbsensi.addEventListener('click', async () => {
            const dari = filterDariAbsensi.value;
            const sampai = filterSampaiAbsensi.value;
            const kelas = filterKelasRekapAbsensi.value;

            if (!dari || !sampai || !kelas) {
                alert('Mohon pilih kelas dan rentang tanggal!');
                return;
            }
            if (dari > sampai) {
                alert('Tanggal "Dari" tidak boleh lebih dari "Sampai"!');
                return;
            }

            const dates = getDatesInRange(dari, sampai);
            if (dates.length > 31) {
                alert('Maksimal rentang tanggal adalah 31 hari.');
                return;
            }

            tbodyRekapAbsensi.innerHTML = `<tr><td colspan="${dates.length + 1}" style="text-align:center;">Memuat data...</td></tr>`;

            try {
                // Ambil data siswa
                const { data: students, error: stuError } = await db
                    .from('students')
                    .select('id, nama_lengkap')
                    .eq('kelas', kelas)
                    .order('nama_lengkap', { ascending: true });
                if (stuError) throw stuError;

                // Ambil data absensi dalam rentang tanggal
                const { data: attData, error: attError } = await db
                    .from('attendance')
                    .select('student_id, tanggal, status_kehadiran')
                    .in('student_id', students.map(s => s.id))
                    .gte('tanggal', dari)
                    .lte('tanggal', sampai);
                if (attError) throw attError;

                // Buat map: {student_id: {tanggal: status}}
                const attMap = {};
                attData.forEach(a => {
                    if (!attMap[a.student_id]) attMap[a.student_id] = {};
                    attMap[a.student_id][a.tanggal] = a.status_kehadiran;
                });

                // Bangun header kolom (tanggal)
                const shortDays = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
                let headerHtml = '<tr><th style="min-width:140px;">Nama Siswa</th>';
                dates.forEach(d => {
                    const dt = new Date(d + 'T00:00:00');
                    const dayName = shortDays[dt.getDay()];
                    const dayNum = dt.getDate();
                    headerHtml += `<th style="text-align:center; min-width:48px;">${dayName}<br><span style="font-size:12px;">${dayNum}</span></th>`;
                });
                headerHtml += '</tr>';
                theadPivot.innerHTML = headerHtml;

                // Bangun baris data
                if (students.length === 0) {
                    tbodyRekapAbsensi.innerHTML = `<tr><td colspan="${dates.length + 1}" style="text-align:center;">Tidak ada siswa di kelas ini.</td></tr>`;
                    return;
                }

                tbodyRekapAbsensi.innerHTML = '';
                students.forEach(student => {
                    let rowHtml = `<td><strong>${window.escapeHTML(student.nama_lengkap)}</strong></td>`;
                    dates.forEach(d => {
                        const status = attMap[student.id]?.[d];
                        const { abbr, color } = getStatusAbbr(status);
                        rowHtml += `<td style="text-align:center; font-weight:700; color:${color};">${abbr}</td>`;
                    });
                    const tr = document.createElement('tr');
                    tr.innerHTML = rowHtml;
                    tbodyRekapAbsensi.appendChild(tr);
                });

            } catch (err) {
                console.error(err);
                tbodyRekapAbsensi.innerHTML = `<tr><td colspan="${dates.length + 1}" style="text-align:center; color:var(--danger);">Terjadi kesalahan saat memuat data.</td></tr>`;
            }
        });
    }
});
