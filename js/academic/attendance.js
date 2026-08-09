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
            classes(nama_kelas),
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

async function loadStudentsForSchedule(scheduleId, kelas, date) {
    const [{ data: students, error: stuErr }, { data: attData, error: attErr }] = await Promise.all([
        db.from('students')
            .select('id, nama_lengkap, nisn, nis')
            .eq('kelas', kelas)
            .or('aktif.eq.true,aktif.is.null')
            .order('nama_lengkap', { ascending: true }),
        db.from('attendance_students')
            .select('student_id, status, notes')
            .eq('schedule_id', scheduleId)
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

    const records = studentsPayload.map(s => ({
        student_id:      s.id,
        class_id:        schedule.classes?.nama_kelas,
        attendance_date: date,
        schedule_id:     schedule.id,
        subject_id:      schedule.subjects?.id || null,
        teacher_id:      teacherId,
        jam_ke:          null,
        start_time:      schedule.start_time,
        end_time:        schedule.end_time,
        status:          s.status,
        notes:           s.notes || null
    }));

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

            scheduleList.innerHTML = schedules.map(s => {
                const filled = fillStatus[s.id];
                const jamMulai = s.start_time ? s.start_time.substring(0, 5) : '-';
                const jamSelesai = s.end_time ? s.end_time.substring(0, 5) : '-';
                const kelas = s.classes?.nama_kelas || '-';
                const mapel = s.subjects?.nama_mapel || '-';
                const guru  = s.teachers?.nama || '-';

                return `
                    <div class="schedule-card ${filled ? 'filled' : 'unfilled'}" 
                         data-id="${s.id}">
                        <div class="schedule-card-time">
                            <span class="time-badge">${jamMulai} - ${jamSelesai}</span>
                            <span class="fill-badge ${filled ? 'badge-filled' : 'badge-empty'}">
                                ${filled ? '✅ Sudah diisi' : '⏳ Belum diisi'}
                            </span>
                        </div>
                        <div class="schedule-card-info">
                            <div class="schedule-mapel">${escapeHTML(mapel)}</div>
                            <div class="schedule-meta">
                                🏫 ${escapeHTML(kelas)} 
                                ${window.isAdmin ? `• 👨‍🏫 ${escapeHTML(guru)}` : ''}
                            </div>
                        </div>
                        <button class="btn btn-primary btn-sm btn-input-absensi" data-schedule-id="${s.id}">
                            ${filled ? '✏️ Edit' : '📝 Input'}
                        </button>
                    </div>`;
            }).join('');

            document.querySelectorAll('.btn-input-absensi').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const scheduleId = e.currentTarget.getAttribute('data-schedule-id');
                    const schedule = schedules.find(s => s.id === scheduleId);
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
            currentStudents = await loadStudentsForSchedule(schedule.id, kelas, date);
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

    window.renderScheduleList = renderScheduleList;
});
