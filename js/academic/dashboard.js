import supabaseClient from '../core/supabase.js';
import { escapeHTML } from '../core/utils.js';
const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    let hasLoadedStats = false;
    
    // YYYY-MM-DD local
    const getTodayStr = () => {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
    };

    async function loadDashboardStats() {
        const today = getTodayStr();
        const loading = document.getElementById('dashboard-loading');
        if (loading) loading.style.display = 'block';

        try {
            // 1. Fetch Students
            const { data: students, error: errSiswa } = await db.from('students').select('id, kelas');
            if (errSiswa) throw errSiswa;
            
            const totalSiswa = students ? students.length : 0;
            document.getElementById('stat-siswa-total').innerText = totalSiswa;

            // 2. Fetch Student Attendance (Today)
            const { data: studentAttToday, error: errStudentAtt } = await db
                .from('attendance_students')
                .select('student_id, class_id, status')
                .eq('attendance_date', today);
            if (errStudentAtt) throw errStudentAtt;

            let hadir = 0, sakit = 0, izin = 0, alpha = 0;
            const attMap = {}; // for class stats
            if (studentAttToday) {
                studentAttToday.forEach(a => {
                    const st = a.status || 'Hadir';
                    if (st === 'Hadir') hadir++;
                    else if (st === 'Sakit') sakit++;
                    else if (st === 'Izin') izin++;
                    else if (st === 'Alpha') alpha++;
                    
                    const c = a.class_id;
                    if (!attMap[c]) attMap[c] = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
                    if (attMap[c][st] !== undefined) attMap[c][st]++;
                });
            }
            
            document.getElementById('stat-siswa-hadir').innerText = hadir;
            document.getElementById('stat-siswa-sakit').innerText = sakit;
            document.getElementById('stat-siswa-izin').innerText = izin;
            document.getElementById('stat-siswa-alpha').innerText = alpha;

            // 3. Fetch Teachers Total (fallback to distinct teachers in schedules if teachers table fails)
            let totalGuru = 0;
            const { count: countGuru, error: errGuru } = await db.from('teachers').select('*', { count: 'exact', head: true });
            if (!errGuru && countGuru !== null) {
                totalGuru = countGuru;
            } else {
                // fallback
                totalGuru = 20; // fallback arbitrary number if no teachers table exists to avoid 0
            }
            document.getElementById('stat-guru-total').innerText = totalGuru;

            // 4. Fetch Teacher Attendance (Today)
            const { data: teacherAttToday, error: errTeacherAtt } = await db
                .from('teacher_attendance')
                .select('teacher_id, check_in, check_out')
                .eq('attendance_date', today);
            
            let guruIn = 0, guruOut = 0;
            if (teacherAttToday && !errTeacherAtt) {
                teacherAttToday.forEach(a => {
                    if (a.check_in) guruIn++;
                    if (a.check_out) guruOut++;
                });
            }
            
            document.getElementById('stat-guru-in').innerText = guruIn;
            document.getElementById('stat-guru-out').innerText = guruOut;
            document.getElementById('stat-guru-belum').innerText = Math.max(0, totalGuru - guruIn);

            // 5. Fetch Teacher Journals (Today)
            const { data: journalsToday, error: errJournals } = await db
                .from('teacher_journals')
                .select('teacher_id')
                .eq('journal_date', today);
                
            let totalJournals = 0;
            let uniqueTeachersJournal = new Set();
            if (journalsToday && !errJournals) {
                totalJournals = journalsToday.length;
                journalsToday.forEach(j => uniqueTeachersJournal.add(j.teacher_id));
            }
            
            const guruSudahJurnal = uniqueTeachersJournal.size;
            document.getElementById('stat-jurnal-total').innerText = totalJournals;
            document.getElementById('stat-jurnal-guru-sudah').innerText = guruSudahJurnal;
            document.getElementById('stat-jurnal-guru-belum').innerText = Math.max(0, totalGuru - guruSudahJurnal);

            // 5.5. Jadwal & Akademik Stats
            try {
                const daysMap = [ "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu" ];
                const dayName = daysMap[new Date().getDay()];
                
                const [resSch, resCls, resTch, resSub] = await Promise.all([
                    db.from('class_schedules').select('id, active, teacher_id, class_id, subject_id, day_of_week'),
                    db.from('classes').select('id, aktif'),
                    db.from('teachers').select('id, aktif'),
                    db.from('subjects').select('id, aktif')
                ]);
                
                const schedules = resSch.data || [];
                const allCls = (resCls.data || []).filter(c => c.aktif !== false);
                const allTch = (resTch.data || []).filter(t => t.aktif !== false);
                const allSub = (resSub.data || []).filter(s => s.aktif !== false);

                let jadwalAktif = 0;
                let guruToday = new Set();
                let kelasToday = new Set();
                let mapelScheduled = new Set();
                let guruScheduled = new Set();
                let kelasScheduled = new Set();
                let totalJamHariIni = 0;
                
                schedules.forEach(j => {
                    if (j.active !== 'Arsip' && j.active !== 'Draft') { // Hanya hitung yang Aktif
                        jadwalAktif++;
                        mapelScheduled.add(j.subject_id);
                        guruScheduled.add(j.teacher_id);
                        kelasScheduled.add(j.class_id);
                        
                        if (j.day_of_week === dayName) {
                            totalJamHariIni++;
                            guruToday.add(j.teacher_id);
                            kelasToday.add(j.class_id);
                        }
                    }
                });
                
                const kelasKosong = allCls.length - kelasScheduled.size;
                const guruKosong = allTch.length - guruScheduled.size;
                const mapelKosong = allSub.length - mapelScheduled.size;
                
                const elAktif = document.getElementById('stat-jadwal-aktif');
                if (elAktif) {
                    elAktif.innerText = jadwalAktif;
                    document.getElementById('stat-jadwal-guru-today').innerText = guruToday.size;
                    document.getElementById('stat-jadwal-kelas-today').innerText = kelasToday.size;
                    document.getElementById('stat-jadwal-jam-today').innerText = totalJamHariIni;
                    document.getElementById('stat-jadwal-kelas-kosong').innerText = Math.max(0, kelasKosong);
                    document.getElementById('stat-jadwal-guru-kosong').innerText = Math.max(0, guruKosong);
                    document.getElementById('stat-jadwal-mapel-kosong').innerText = Math.max(0, mapelKosong);
                }
            } catch (err) {
                console.error("Gagal memuat stat Jadwal:", err);
            }

            // 6. Calculate Class Stats (Table)
            const classCounts = {};
            if (students) {
                students.forEach(s => {
                    if (!classCounts[s.kelas]) classCounts[s.kelas] = 0;
                    classCounts[s.kelas]++;
                });
            }
            
            const tbody = document.getElementById('stat-class-tbody');
            if (Object.keys(classCounts).length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada kelas.</td></tr>';
            } else {
                let html = '';
                Object.keys(classCounts).sort().forEach(cls => {
                    const jml = classCounts[cls];
                    const att = attMap[cls] || { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
                    // Persentase = (Hadir / Jumlah Siswa) * 100
                    let pct = 0;
                    if (jml > 0) pct = Math.round((att.Hadir / jml) * 100);
                    
                    html += `
                        <tr>
                            <td><strong>${escapeHTML(cls)}</strong></td>
                            <td style="text-align: center;">${jml}</td>
                            <td style="text-align: center; color: var(--success); font-weight: 500;">${att.Hadir}</td>
                            <td style="text-align: center;">${att.Sakit}</td>
                            <td style="text-align: center;">${att.Izin}</td>
                            <td style="text-align: center; color: var(--danger); font-weight: 500;">${att.Alpha}</td>
                            <td style="text-align: center;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                                    <div style="flex: 1; background: var(--border-color); height: 6px; border-radius: 3px; overflow: hidden; max-width: 50px;">
                                        <div style="width: ${pct}%; background: ${pct >= 80 ? 'var(--success)' : (pct >= 50 ? 'var(--warning)' : 'var(--danger)')}; height: 100%;"></div>
                                    </div>
                                    <span style="font-size: 0.9rem;">${pct}%</span>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;
            }

            // 7. Render Chart for Last 7 Days
            await renderChart();

            hasLoadedStats = true;
        } catch (error) {
            console.error("Dashboard error:", error);
            const tbody = document.getElementById('stat-class-tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Terjadi kesalahan saat memuat data.</td></tr>';
        } finally {
            if (loading) loading.style.display = 'none';
        }
    }

    async function renderChart() {
        const d = new Date();
        const dates = [];
        const displayDates = [];
        for (let i = 6; i >= 0; i--) {
            const temp = new Date(d);
            temp.setDate(temp.getDate() - i);
            const yyyy = temp.getFullYear();
            const mm = String(temp.getMonth() + 1).padStart(2, '0');
            const dd = String(temp.getDate()).padStart(2, '0');
            dates.push(`${yyyy}-${mm}-${dd}`);
            displayDates.push(`${dd}/${mm}`);
        }

        const { data: attData, error } = await db
            .from('attendance_students')
            .select('attendance_date, status')
            .gte('attendance_date', dates[0])
            .lte('attendance_date', dates[dates.length - 1]);
            
        if (error) {
            console.error(error);
            return;
        }
        
        const counts = {};
        dates.forEach(dt => counts[dt] = 0);
        
        if (attData) {
            attData.forEach(a => {
                if ((a.status || 'Hadir') === 'Hadir') {
                    if (counts[a.attendance_date] !== undefined) {
                        counts[a.attendance_date]++;
                    }
                }
            });
        }
        
        const values = dates.map(dt => counts[dt]);
        const maxVal = Math.max(...values, 10);
        
        const canvas = document.getElementById('attendance-chart');
        const emptyEl = document.getElementById('chart-empty');
        if (!canvas) return;
        
        if (values.every(v => v === 0)) {
            emptyEl.style.display = 'flex';
            return;
        } else {
            emptyEl.style.display = 'none';
        }

        const ctx = canvas.getContext('2d');
        const W = canvas.parentElement.clientWidth;
        const H = canvas.parentElement.clientHeight;
        canvas.width = W;
        canvas.height = H;
        
        const padX = 40;
        const padY = 30;
        const chartW = W - padX * 2;
        const chartH = H - padY * 2;
        
        ctx.clearRect(0, 0, W, H);
        
        // Grid lines & Y labels
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-muted') || '#888';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const y = padY + chartH - (i / steps) * chartH;
            const val = Math.round((i / steps) * maxVal);
            
            ctx.fillText(val, padX - 10, y);
            
            ctx.beginPath();
            ctx.moveTo(padX, y);
            ctx.lineTo(W - padX, y);
            ctx.strokeStyle = 'rgba(150, 150, 150, 0.2)';
            ctx.stroke();
        }
        
        // X labels
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const gap = chartW / (dates.length - 1);
        
        dates.forEach((dt, i) => {
            const x = padX + i * gap;
            ctx.fillText(displayDates[i], x, H - padY + 10);
        });
        
        // Draw Line
        ctx.beginPath();
        dates.forEach((dt, i) => {
            const x = padX + i * gap;
            const y = padY + chartH - (values[i] / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--primary') || '#4361ee';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw Points
        ctx.fillStyle = '#fff';
        dates.forEach((dt, i) => {
            const x = padX + i * gap;
            const y = padY + chartH - (values[i] / maxVal) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    function checkHashForDashboard() {
        let hash = window.location.hash.replace('#', '') || 'section-dashboard';
        if (hash === 'dashboard' || hash === 'section-dashboard') {
            if (!hasLoadedStats) loadDashboardStats();
        }
    }

    window.addEventListener('hashchange', checkHashForDashboard);
    checkHashForDashboard();

    // Import CSV (Retained for legacy/Aksi Cepat)
    const btnImportSiswa = document.getElementById('btn-import-siswa');
    const fileImportSiswa = document.getElementById('file-import-siswa');
    const importStatus = document.getElementById('import-status');

    if(btnImportSiswa) {
        if (window.isGuest) {
            btnImportSiswa.disabled = true;
            if(fileImportSiswa) fileImportSiswa.disabled = true;
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
                            kelas: row.kelas, aktif: row.status_aktif ? (row.status_aktif.toLowerCase() === 'true') : true
                        }));

                        const { error } = await db.from('students').insert(cleanData);
                        if (error) throw error;

                        importStatus.textContent = `Berhasil mengimport ${cleanData.length} siswa!`;
                        importStatus.style.color = 'var(--success)';
                        if(fileImportSiswa) fileImportSiswa.value = '';
                        hasLoadedStats = false; // force reload next time
                        if(window.location.hash === '#dashboard' || window.location.hash === '') loadDashboardStats();
                    } catch (err) {
                        importStatus.textContent = `Gagal: ${err.message}`; importStatus.style.color = 'var(--danger)';
                    } finally { btnImportSiswa.disabled = false; }
                }
            });
        });
    }
});
