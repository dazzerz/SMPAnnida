import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';
const db = supabaseClient;

const ADMIN_EMAIL = 'daffa.al.akhdaan@gmail.com';

function getDateStr(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

async function loadSchedulesToday(date) {
    const dayName = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(date + 'T00:00:00').getDay()];
    
    let query = db
        .from('class_schedules')
        .select(`
            id, day_of_week, start_time, end_time, room, active,
            classes(id, nama_kelas),
            subjects(id, nama_mapel),
            teachers(id, nama),
            academic_years(tahun_ajaran, semester)
        `)
        .eq('day_of_week', dayName)
        .eq('active', 'Aktif')
        .order('start_time', { ascending: true });

    if (!window.isAdmin && window.currentTeacher) {
        query = query.eq('teacher_id', window.currentTeacher.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

async function getScheduleFillStatus(scheduleIds, date) {
    if (!scheduleIds.length) return {};
    const { data, error } = await db
        .from('attendance_students')
        .select('schedule_id')
        .eq('attendance_date', date)
        .in('schedule_id', scheduleIds);
    
    if (error) return {};
    
    const filled = new Set((data || []).map(r => r.schedule_id));
    return scheduleIds.reduce((acc, id) => {
        acc[id] = filled.has(id);
        return acc;
    }, {});
}

async function loadStudentsForSchedule(schedule, kelas, date) {
    const scheduleIds = schedule.grouped_ids || [schedule.id];
    const [ { data: students, error: stuErr }, { data: attData } ] = await Promise.all([
        db.from('students')
            .select('id, nama_lengkap, nis, nisn, status')
            .eq('kelas', kelas)
            .or('aktif.eq.true,aktif.is.null')
            .order('nama_lengkap', { ascending: true }),
        db.from('attendance_students')
            .select('student_id, status, notes')
            .in('schedule_id', scheduleIds)
            .eq('attendance_date', date)
    ]);

    if (stuErr) throw stuErr;

    const attMap = {};
    (attData || []).forEach(a => { attMap[a.student_id] = a; });

    return (students || []).map(s => ({
        ...s,
        status: attMap[s.id]?.status || 'Hadir',
        notes: attMap[s.id]?.notes || '',
        alreadyFilled: !!attMap[s.id]
    }));
}

async function saveAttendance(schedule, date, studentsPayload) {
    const teacherId = window.isAdmin
        ? schedule.teachers?.id || null
        : window.currentTeacher?.id || null;

    const records = [];
    const originalSchedules = schedule.original_schedules || [schedule];

    for (const origSched of originalSchedules) {
        for (const s of studentsPayload) {
            records.push({
                student_id:      s.id,
                class_id:        origSched.classes?.id || null,
                attendance_date: date,
                schedule_id:     origSched.id,
                subject_id:      origSched.subjects?.id || null,
                teacher_id:      teacherId,
                jam_ke:          null,
                start_time:      origSched.start_time,
                end_time:        origSched.end_time,
                status:          s.status,
                notes:           s.notes || null
            });
        }
    }

    const { error } = await db
        .from('attendance_students')
        .upsert(records, { onConflict: 'student_id,attendance_date,schedule_id' });

    if (error) throw error;
}

document.addEventListener('DOMContentLoaded', () => {
    const dateInput     = document.getElementById('attend-date');
    const scheduleList  = document.getElementById('schedule-list');
    const formPanel     = document.getElementById('attend-form-panel');
    const attendTbody   = document.getElementById('attend-tbody');
    const btnBack       = document.getElementById('btn-attend-back');
    const btnSave       = document.getElementById('btn-attend-save');
    const btnHadirSemua = document.getElementById('btn-hadir-semua');
    const panelTitle    = document.getElementById('attend-panel-title');
    
    if (!dateInput || !scheduleList) return;
    
    dateInput.value = getDateStr();
    
    let activeSchedule = null;
    let currentStudents = [];

    async function renderScheduleList() {
        const date = dateInput.value;
        scheduleList.innerHTML = '<div style="padding:20px;text-align:center;">Memuat jadwal...</div>';
        formPanel.style.display = 'none';
        
        try {
            const schedules = await loadSchedulesToday(date);
            
            if (!schedules.length) {
                scheduleList.innerHTML = `
                    <div style="text-align:center;padding:40px;">
                        <div style="font-size:3rem;margin-bottom:10px;">📅</div>
                        <h4 style="margin:0;">Tidak ada jadwal hari ini</h4>
                        <div style="color:var(--text-muted);font-size:0.9rem;margin-top:5px;">
                            ${window.isAdmin 
                                ? 'Belum ada jadwal aktif untuk hari ini.'
                                : 'Anda tidak memiliki jadwal mengajar hari ini.'}
                        </div>
                    </div>`;
                return;
            }

            const scheduleIds = schedules.map(s => s.id);
            const fillStatus = await getScheduleFillStatus(scheduleIds, date);

            // Group consecutive schedules
            const groupedSchedules = [];
            for (const current of schedules) {
                if (groupedSchedules.length > 0) {
                    const lastGroup = groupedSchedules[groupedSchedules.length - 1];
                    const sameClass = current.classes?.id === lastGroup.classes?.id;
                    const sameSubject = current.subjects?.id === lastGroup.subjects?.id;
                    const sameTeacher = current.teachers?.id === lastGroup.teachers?.id;
                    
                    if (sameClass && sameSubject && sameTeacher) {
                        lastGroup.grouped_ids.push(current.id);
                        lastGroup.end_time = current.end_time;
                        lastGroup.original_schedules.push(current);
                        // Group is considered filled if ALL of its parts are filled
                        lastGroup.is_filled = lastGroup.is_filled && fillStatus[current.id];
                        continue;
                    }
                }
                
                groupedSchedules.push({
                    ...current,
                    grouped_ids: [current.id],
                    original_schedules: [current],
                    is_filled: fillStatus[current.id]
                });
            }

            scheduleList.innerHTML = groupedSchedules.map(s => {
                const filled = s.is_filled;
                const jamMulai = s.start_time ? s.start_time.substring(0, 5) : '-';
                const jamSelesai = s.end_time ? s.end_time.substring(0, 5) : '-';
                const kelas = s.classes?.nama_kelas || '-';
                const mapel = s.subjects?.nama_mapel || '-';
                const guru  = s.teachers?.nama || '-';

                return `
                    <div class="schedule-card ${filled ? 'filled' : 'unfilled'}" 
                         data-id="${s.grouped_ids.join(',')}">
                        <div class="schedule-card-time">
                            <span class="time-badge">${jamMulai} - ${jamSelesai}</span>
                            <span class="fill-badge ${filled ? 'badge-filled' : 'badge-empty'}">
                                ${filled ? '✅ Sudah diisi' : '⏳ Belum diisi'}
                            </span>
                        </div>
                        <div class="schedule-card-info">
                            <div class="schedule-mapel">${escapeHTML(mapel)}${s.grouped_ids.length > 1 ? ` (${s.grouped_ids.length} Jam)` : ''}</div>
                            <div class="schedule-meta">
                                🏫 ${escapeHTML(kelas)} 
                                ${window.isAdmin ? `• 👨‍🏫 ${escapeHTML(guru)}` : ''}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm btn-input-absensi" data-schedule-id="${s.grouped_ids.join(',')}">
                            ${filled ? '✏️ Edit' : '📝 Input'}
                        </button>
                    </div>`;
            }).join('');

            document.querySelectorAll('.btn-input-absensi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const scheduleIdStr = e.currentTarget.getAttribute('data-schedule-id');
                    const schedule = groupedSchedules.find(s => s.grouped_ids.join(',') === scheduleIdStr);
                    if (schedule) await openAttendanceForm(schedule, date);
                });
            });

        } catch (err) {
            console.error(err);
            scheduleList.innerHTML = '<div style="color:red;text-align:center;">Gagal memuat jadwal.</div>';
        }
    }

    async function openAttendanceForm(schedule, date) {
        activeSchedule = schedule;
        const kelas = schedule.classes?.nama_kelas || '-';
        const mapel = schedule.subjects?.nama_mapel || '-';
        const jamMulai = schedule.start_time?.substring(0, 5) || '-';
        const jamSelesai = schedule.end_time?.substring(0, 5) || '-';

        panelTitle.textContent = `${mapel} — ${kelas} (${jamMulai}–${jamSelesai})`;
        formPanel.style.display = 'block';
        scheduleList.style.display = 'none';
        attendTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Memuat siswa...</td></tr>';

        try {
            currentStudents = await loadStudentsForSchedule(schedule, kelas, date);
            renderAttendanceTable();
            btnSave.disabled = false;
        } catch (err) {
            console.error(err);
            attendTbody.innerHTML = '<tr><td colspan="4" style="color:var(--danger);text-align:center">Gagal memuat siswa.</td></tr>';
        }
    }

    function renderAttendanceTable() {
        if (!currentStudents.length) {
            attendTbody.innerHTML = '<tr><td colspan="4" style="text-align:center">Tidak ada siswa di kelas ini.</td></tr>';
            return;
        }

        attendTbody.innerHTML = '';
        currentStudents.forEach((s, i) => {
            const opts = ['Hadir', 'Sakit', 'Izin', 'Alpha'];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center">${i + 1}</td>
                <td>
                    <strong>${escapeHTML(s.nama_lengkap)}</strong>
                    <div style="font-size:0.8rem;color:var(--text-muted)">${escapeHTML(s.nis || s.nisn || '-')}</div>
                </td>
                <td>
                    <select class="input-control status-select" data-id="${s.id}" style="min-width:110px">
                        ${opts.map(o => `<option value="${o}" ${s.status === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>
                </td>
                <td>
                    <input type="text" class="input-control notes-input" data-id="${s.id}" 
                        value="${escapeHTML(s.notes || '')}" 
                        placeholder="Keterangan..." 
                        style="width:100%;min-width:120px">
                </td>`;
            attendTbody.appendChild(tr);
        });

        document.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', e => {
                const st = currentStudents.find(s => s.id === e.target.getAttribute('data-id'));
                if (st) st.status = e.target.value;
            });
        });
        document.querySelectorAll('.notes-input').forEach(inp => {
            inp.addEventListener('input', e => {
                const st = currentStudents.find(s => s.id === e.target.getAttribute('data-id'));
                if (st) st.notes = e.target.value;
            });
        });
    }

    if (btnHadirSemua) {
        btnHadirSemua.addEventListener('click', () => {
            currentStudents.forEach(s => s.status = 'Hadir');
            document.querySelectorAll('.status-select').forEach(sel => sel.value = 'Hadir');
            if (window.showToast) window.showToast('Semua siswa ditandai Hadir', 'success');
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            formPanel.style.display = 'none';
            scheduleList.style.display = 'block';
            activeSchedule = null;
            currentStudents = [];
            renderScheduleList();
        });
    }

    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            if (!activeSchedule || !currentStudents.length) return;
            
            const date = dateInput.value;
            const origText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            try {
                await saveAttendance(activeSchedule, date, currentStudents);
                if (window.showToast) window.showToast(`Absensi berhasil disimpan! (${currentStudents.length} siswa)`, 'success');
                setTimeout(() => {
                    btnBack.click();
                }, 1200);
            } catch (err) {
                console.error(err);
                if (window.showToast) window.showToast('Gagal menyimpan: ' + err.message, 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = origText;
            }
        });
    }

    if (dateInput) {
        dateInput.addEventListener('change', renderScheduleList);
    }

    // ── Tab Management ────────────────────────────────────────────
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.style.display = 'none');
            btn.classList.add('active');
            const target = document.getElementById('tab-' + btn.getAttribute('data-tab'));
            if (target) target.style.display = 'block';
        });
    });

    const initWhenReady = () => {
        if (window.currentUser !== undefined) {
            renderScheduleList();
        } else {
            setTimeout(initWhenReady, 100);
        }
    };

    const section = document.getElementById('absensi');
    if (section) {
        const observer = new MutationObserver(() => {
            if (section.style.display !== 'none') {
                initWhenReady();
            }
        });
        observer.observe(section, { attributes: true, attributeFilter: ['style'] });
        if (section.style.display !== 'none') initWhenReady();
    }

    // ── Logika Rekap & Export (Tambahan) ────────────────────────────────────────────
    
    // Elemen UI Filter
    const filterKelasRekap = document.getElementById('rekap-kelas');
    const filterBulanRekap = document.getElementById('rekap-bulan');
    const filterMapelRekap = document.getElementById('rekap-mapel-filter');
    const btnLihatRekap = document.getElementById('btn-lihat-rekap-absensi-siswa');
    const tableRekapSiswa = document.getElementById('table-rekap-siswa');
    const theadRekapSiswa = document.getElementById('thead-rekap-siswa');
    const tbodyRekapSiswa = document.getElementById('tbody-rekap-siswa');

    const filterKelasPivot = document.getElementById('filter-kelas-rekap-absensi');
    const filterDariPivot = document.getElementById('filter-dari-absensi');
    const filterSampaiPivot = document.getElementById('filter-sampai-absensi');
    const filterMapelPivot = document.getElementById('filter-mapel-pivot');
    const btnLihatPivot = document.getElementById('btn-lihat-rekap-absensi-harian');
    const theadPivot = document.getElementById('thead-pivot-absensi');
    const tbodyPivot = document.getElementById('tbody-rekap-absensi');

    const exportTahun = document.getElementById('export-tahun');
    const exportSemester = document.getElementById('export-semester');
    const exportBulan = document.getElementById('export-bulan');
    const exportKelas = document.getElementById('export-kelas');
    const exportMapel = document.getElementById('export-mapel');
    const btnExportExcel = document.getElementById('btn-export-excel');

    // Populate Filters
    async function populateFilters() {
        try {
            // Load Classes
            const { data: classes } = await db.from('classes').select('id, nama_kelas').order('nama_kelas');
            if (classes) {
                const classOptions = '<option value="">-- Pilih Kelas --</option>' + classes.map(c => `<option value="${c.nama_kelas}">${escapeHTML(c.nama_kelas)}</option>`).join('');
                if (filterKelasRekap) filterKelasRekap.innerHTML = classOptions;
                if (filterKelasPivot) filterKelasPivot.innerHTML = classOptions;
                if (exportKelas) exportKelas.innerHTML = classOptions;
            }

            // Load Subjects
            const { data: subjects } = await db.from('subjects').select('id, nama_mapel').order('nama_mapel');
            if (subjects) {
                const subjectOptions = '<option value="">Semua Mapel</option>' + subjects.map(s => `<option value="${s.id}">${escapeHTML(s.nama_mapel)}</option>`).join('');
                if (filterMapelRekap) filterMapelRekap.innerHTML = subjectOptions;
                if (filterMapelPivot) filterMapelPivot.innerHTML = subjectOptions;
                if (exportMapel) exportMapel.innerHTML = '<option value="">Semua Mapel (Harian)</option>' + subjects.map(s => `<option value="${s.id}">${escapeHTML(s.nama_mapel)}</option>`).join('');
            }

            // Load Academic Years for Export
            const { data: academicYears } = await db.from('academic_years').select('tahun_ajaran, semester').order('tahun_ajaran', { ascending: false });
            if (academicYears) {
                const tahuns = [...new Set(academicYears.map(a => a.tahun_ajaran))];
                if (exportTahun) {
                    exportTahun.innerHTML = '<option value="">-- Pilih Tahun --</option>' + tahuns.map(t => `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`).join('');
                }
                const semesters = [...new Set(academicYears.map(a => a.semester))];
                if (exportSemester) {
                    exportSemester.innerHTML = '<option value="">-- Pilih Semester --</option>' + semesters.map(s => `<option value="${s}">${s}</option>`).join('');
                }
            }

            // Set default date range for Pivot
            if (filterDariPivot && filterSampaiPivot) {
                const todayStr = getDateStr();
                const firstDayStr = todayStr.substring(0, 8) + '01';
                filterDariPivot.value = firstDayStr;
                filterSampaiPivot.value = todayStr;
            }
        } catch (err) {
            console.error("Gagal memuat filter:", err);
        }
    }

    // Panggil populateFilters saat halaman siap
    populateFilters();

    // 1. REKAP PER SISWA
    if (btnLihatRekap) {
        btnLihatRekap.addEventListener('click', async () => {
            const kelas = filterKelasRekap.value;
            const bulan = filterBulanRekap.value;
            const mapel = filterMapelRekap.value;

            if (!kelas) {
                window.showToast?.('Pilih kelas terlebih dahulu', 'error');
                return;
            }

            tbodyRekapSiswa.innerHTML = '<tr><td colspan="8" style="text-align:center;">Memuat data...</td></tr>';
            theadRekapSiswa.innerHTML = '<tr><th style="width:50px">No</th><th>NIS</th><th>Nama Siswa</th><th style="text-align:center">Hadir</th><th style="text-align:center">Sakit</th><th style="text-align:center">Izin</th><th style="text-align:center">Alpha</th><th style="text-align:center">Total Pertemuan</th></tr>';

            try {
                // Get students in this class
                const { data: students, error: errStu } = await db.from('students').select('id, nama_lengkap, nisn').eq('kelas', kelas).order('nama_lengkap');
                if (errStu) throw errStu;
                
                if (!students || students.length === 0) {
                    tbodyRekapSiswa.innerHTML = '<tr><td colspan="8" style="text-align:center;">Tidak ada siswa di kelas ini.</td></tr>';
                    return;
                }

                // Build query for attendance
                let query = db.from('attendance_students').select('student_id, status, attendance_date').in('student_id', students.map(s => s.id));
                if (mapel) query = query.eq('subject_id', mapel);
                
                const { data: attData, error: errAtt } = await query;
                if (errAtt) throw errAtt;

                // Filter by month
                const filteredAtt = (attData || []).filter(a => {
                    const d = new Date(a.attendance_date);
                    return (d.getMonth() + 1) === parseInt(bulan);
                });

                // Group by student
                const rekap = {};
                students.forEach(s => {
                    rekap[s.id] = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0, Total: 0 };
                });

                filteredAtt.forEach(a => {
                    if (rekap[a.student_id] && rekap[a.student_id][a.status] !== undefined) {
                        rekap[a.student_id][a.status]++;
                        rekap[a.student_id].Total++;
                    }
                });

                tbodyRekapSiswa.innerHTML = students.map((s, i) => {
                    const r = rekap[s.id];
                    return `
                        <tr>
                            <td style="text-align:center">${i + 1}</td>
                            <td>${escapeHTML(s.nisn || '-')}</td>
                            <td><strong>${escapeHTML(s.nama_lengkap)}</strong></td>
                            <td style="text-align:center; color:var(--success); font-weight:bold">${r.Hadir}</td>
                            <td style="text-align:center; color:var(--warning); font-weight:bold">${r.Sakit}</td>
                            <td style="text-align:center; color:#0dcaf0; font-weight:bold">${r.Izin}</td>
                            <td style="text-align:center; color:var(--danger); font-weight:bold">${r.Alpha}</td>
                            <td style="text-align:center">${r.Total}</td>
                        </tr>
                    `;
                }).join('');

            } catch (err) {
                console.error(err);
                tbodyRekapSiswa.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--danger)">Gagal memuat rekap.</td></tr>';
            }
        });
    }

    // 2. REKAP HARIAN (PIVOT)
    if (btnLihatPivot) {
        btnLihatPivot.addEventListener('click', async () => {
            const kelas = filterKelasPivot.value;
            const dari = filterDariPivot.value;
            const sampai = filterSampaiPivot.value;
            const mapel = filterMapelPivot.value;

            if (!kelas || !dari || !sampai) {
                window.showToast?.('Pilih kelas, dari, dan sampai tanggal', 'error');
                return;
            }

            tbodyPivot.innerHTML = '<tr><td style="text-align:center;">Memuat data...</td></tr>';

            try {
                // Get students
                const { data: students, error: errStu } = await db.from('students').select('id, nama_lengkap, nisn').eq('kelas', kelas).order('nama_lengkap');
                if (errStu) throw errStu;

                if (!students || students.length === 0) {
                    theadPivot.innerHTML = '<tr><th>Informasi</th></tr>';
                    tbodyPivot.innerHTML = '<tr><td style="text-align:center;">Tidak ada siswa di kelas ini.</td></tr>';
                    return;
                }

                // Get dates in range
                const startDate = new Date(dari);
                const endDate = new Date(sampai);
                const dates = [];
                for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
                    // Make sure format is YYYY-MM-DD local time, avoiding timezone offset issues
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    dates.push(`${y}-${m}-${day}`);
                }

                // Get attendance
                let query = db.from('attendance_students').select('student_id, status, attendance_date').in('student_id', students.map(s => s.id)).gte('attendance_date', dari).lte('attendance_date', sampai);
                if (mapel) query = query.eq('subject_id', mapel);
                
                const { data: attData, error: errAtt } = await query;
                if (errAtt) throw errAtt;

                // Group: student_id -> date -> worst status
                // Status priority: Alpha (4) > Izin (3) > Sakit (2) > Hadir (1)
                const statusValue = { 'Alpha': 4, 'Izin': 3, 'Sakit': 2, 'Hadir': 1 };
                const getAbbr = (st) => {
                    if (st === 'Alpha') return { a: 'A', c: 'var(--danger)' };
                    if (st === 'Izin') return { a: 'I', c: '#0dcaf0' };
                    if (st === 'Sakit') return { a: 'S', c: 'var(--warning)' };
                    if (st === 'Hadir') return { a: 'H', c: 'var(--success)' };
                    return { a: '-', c: 'var(--text-muted)' };
                };

                const attMap = {};
                students.forEach(s => attMap[s.id] = {});

                (attData || []).forEach(a => {
                    if (attMap[a.student_id]) {
                        const current = attMap[a.student_id][a.attendance_date];
                        if (!current || statusValue[a.status] > statusValue[current]) {
                            attMap[a.student_id][a.attendance_date] = a.status;
                        }
                    }
                });

                // Render Header
                const shortDays = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
                let headerHtml = '<tr><th style="min-width:40px">No</th><th style="min-width:180px;">Nama Siswa</th>';
                dates.forEach(d => {
                    const dt = new Date(d + 'T00:00:00'); // Force local interpretation
                    headerHtml += `<th style="text-align:center; min-width:40px; font-size:11px;">${shortDays[dt.getDay()]}<br>${dt.getDate()}/${dt.getMonth()+1}</th>`;
                });
                headerHtml += '</tr>';
                theadPivot.innerHTML = headerHtml;

                // Render Body
                tbodyPivot.innerHTML = students.map((s, i) => {
                    let rowHtml = `<td style="text-align:center">${i + 1}</td><td><strong>${escapeHTML(s.nama_lengkap)}</strong></td>`;
                    dates.forEach(d => {
                        const st = attMap[s.id][d];
                        const abbr = getAbbr(st);
                        rowHtml += `<td style="text-align:center; font-weight:bold; color:${abbr.c};">${abbr.a}</td>`;
                    });
                    return `<tr>${rowHtml}</tr>`;
                }).join('');

            } catch (err) {
                console.error(err);
                tbodyPivot.innerHTML = '<tr><td style="text-align:center; color:var(--danger)">Gagal memuat pivot.</td></tr>';
            }
        });
    }

    // 3. EXPORT EXCEL
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', async () => {
            const tahun = exportTahun?.value;
            const semester = exportSemester?.value;
            const bulan = exportBulan?.value;
            const kelas = exportKelas?.value;
            const mapelId = exportMapel?.value;

            if (!tahun || !semester || !bulan || !kelas) {
                window.showToast?.('Pilih Tahun, Semester, Bulan, dan Kelas', 'error');
                return;
            }

            const origText = btnExportExcel.textContent;
            btnExportExcel.disabled = true;
            btnExportExcel.textContent = 'Memproses...';

            try {
                // Get students
                const { data: students, error: errStu } = await db.from('students').select('id, nama_lengkap, nisn').eq('kelas', kelas).order('nama_lengkap');
                if (errStu) throw errStu;
                if (!students || students.length === 0) throw new Error("Tidak ada siswa di kelas ini");

                // Get attendance
                let query = db.from('attendance_students')
                    .select('student_id, status, attendance_date, subject_id, subjects(nama_mapel), teachers(nama)')
                    .in('student_id', students.map(s => s.id));
                if (mapelId) query = query.eq('subject_id', mapelId);

                const { data: attDataRaw, error: errAtt } = await query;
                if (errAtt) throw errAtt;

                // Filter by month
                const attData = (attDataRaw || []).filter(a => {
                    const d = new Date(a.attendance_date);
                    return (d.getMonth() + 1) === parseInt(bulan);
                });

                let mapelName = mapelId ? (attData.length > 0 && attData[0].subjects ? attData[0].subjects.nama_mapel : 'Mapel') : 'Semua Mapel';
                let teacherName = mapelId ? (attData.length > 0 && attData[0].teachers ? attData[0].teachers.nama : 'Guru') : 'Semua Guru';

                // Extract unique dates that have attendance and sort them
                let uniqueDates = [...new Set(attData.map(a => a.attendance_date))];
                uniqueDates.sort();

                // If mapelId is empty (Semua Mapel), group by student_id and date, taking worst status
                const statusValue = { 'Alpha': 4, 'Izin': 3, 'Sakit': 2, 'Hadir': 1 };
                
                const attMap = {}; // { student_id: { date: status } }
                const rekap = {};  // { student_id: { Hadir, Sakit, Izin, Alpha } }
                
                students.forEach(s => {
                    attMap[s.id] = {};
                    rekap[s.id] = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };
                });

                attData.forEach(a => {
                    if (attMap[a.student_id]) {
                        const current = attMap[a.student_id][a.attendance_date];
                        if (!current || statusValue[a.status] > statusValue[current]) {
                            attMap[a.student_id][a.attendance_date] = a.status;
                        }
                    }
                });

                // Calculate rekap from the daily statuses
                students.forEach(s => {
                    for (const d of uniqueDates) {
                        const st = attMap[s.id][d];
                        if (st && rekap[s.id][st] !== undefined) {
                            rekap[s.id][st]++;
                        }
                    }
                });

                // Gunakan SheetJS
                if (typeof window.XLSX === 'undefined') {
                    throw new Error("Library SheetJS tidak ditemukan");
                }

                // Fetch template
                const response = await fetch('../../docs/Template_Rekap_Siswa.xlsx');
                if (!response.ok) throw new Error("Gagal mengambil file template Excel dari server");
                const arrayBuffer = await response.arrayBuffer();
                
                // Read template
                const wb = window.XLSX.read(arrayBuffer, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                
                const namaBulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"][parseInt(bulan)-1];

                // Ganti placeholder di template
                const headerF1 = mapelId ? `${teacherName} - Kelas ${kelas} - ${namaBulan} ${tahun}` : `Kelas ${kelas} - ${namaBulan} ${tahun}`;
                const headerA2 = mapelId ? `Rekapitulasi Absensi ${mapelName} (SMT ${semester})` : `Rekapitulasi Absensi (SMT ${semester})`;

                // [Mapel] di F1
                window.XLSX.utils.sheet_add_aoa(ws, [[headerF1]], { origin: "F1" });
                // [Guru Mapel] di A2
                window.XLSX.utils.sheet_add_aoa(ws, [[headerA2]], { origin: "A2" });

                // Fill Dates in Row 3 (Index 2, origin: C3)
                const dateHeaders = uniqueDates.slice(0, 24).map(d => {
                    const dt = new Date(d + 'T00:00:00');
                    return `${dt.getDate()}-${namaBulan.substring(0,3)}`; // e.g., 8-Aug
                });
                if (dateHeaders.length > 0) {
                    window.XLSX.utils.sheet_add_aoa(ws, [dateHeaders], { origin: "C3" });
                }

                // Build Excel Data untuk disisipkan mulai dari baris ke-4 (A4)
                const rows = students.map((s, i) => {
                    const r = rekap[s.id];
                    // Array dengan 29 kolom: 0(No), 1(Nama), 2-25(Kosong untuk tanggal), 26(A), 27(I), 28(S)
                    const rowData = new Array(29).fill('');
                    rowData[0] = i + 1;
                    rowData[1] = s.nama_lengkap;
                    
                    // Fill daily statuses
                    uniqueDates.slice(0, 24).forEach((d, idx) => {
                        const st = attMap[s.id][d];
                        rowData[2 + idx] = st ? st.toLowerCase() : '';
                    });

                    rowData[26] = r.Alpha || 0;
                    rowData[27] = r.Izin || 0;
                    rowData[28] = r.Sakit || 0;
                    return rowData;
                });

                window.XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A4" });

                const mapelFileSuffix = mapelId ? '_' + mapelName.replace(/[^a-zA-Z0-9]/g, '') : '_Harian';
                const filename = `Rekap_Absensi_${kelas}_${namaBulan}_${tahun.replace('/','-')}_SMT${semester}${mapelFileSuffix}.xlsx`;
                window.XLSX.writeFile(wb, filename);
                window.showToast?.('Berhasil di-export', 'success');

            } catch (err) {
                console.error(err);
                window.showToast?.(err.message || 'Gagal export', 'error');
            } finally {
                btnExportExcel.disabled = false;
                btnExportExcel.innerHTML = '📥 Export Excel';
            }
        });
    }

    window.renderScheduleList = renderScheduleList;
});
