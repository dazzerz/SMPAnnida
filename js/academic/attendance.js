import supabaseClient from '../core/supabase.js';
const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const attendDate = document.getElementById('attend-date');
    const attendClass = document.getElementById('attend-class');
    const attendSearch = document.getElementById('attend-search');
    const attendTbody = document.getElementById('attend-tbody');
    const btnRefresh = document.getElementById('btn-attend-refresh');
    const btnSave = document.getElementById('btn-attend-save');

    if (!attendDate || !attendClass || !attendTbody) return;

    // Default state
    attendDate.value = new Date().toISOString().split('T')[0];
    let currentStudents = [];

    async function loadData() {
        const date = attendDate.value;
        const kelas = attendClass.value;

        if (!kelas) {
            attendTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">
                <div style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 10px;">Belum ada data.</div>
                <div style="color: var(--text-muted); font-size: 0.9rem;">Silakan pilih kelas terlebih dahulu.</div>
            </td></tr>`;
            btnSave.disabled = true;
            currentStudents = [];
            return;
        }

        attendTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Memuat data...</td></tr>';
        btnSave.disabled = true;

        try {
            // Load students for the class
            const { data: students, error: stuErr } = await db
                .from('students')
                .select('*')
                .eq('kelas', kelas)
                .order('nama_lengkap', { ascending: true });
            
            if (stuErr) throw stuErr;

            if (!students || students.length === 0) {
                attendTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px;">
                    <div style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 10px;">Kelas kosong.</div>
                    <div style="color: var(--text-muted); font-size: 0.9rem;">Belum ada siswa yang terdaftar di kelas ini.</div>
                </td></tr>`;
                currentStudents = [];
                return;
            }

            // Load existing attendance
            const { data: attData, error: attErr } = await db
                .from('attendance_students')
                .select('*')
                .in('student_id', students.map(s => s.id))
                .eq('attendance_date', date);

            if (attErr) throw attErr;

            // Map existing attendance
            const attMap = {};
            if (attData) {
                attData.forEach(a => {
                    attMap[a.student_id] = a;
                });
            }

            currentStudents = students.map(s => {
                const exist = attMap[s.id] || {};
                return {
                    ...s,
                    status_kehadiran: exist.status || 'Hadir',
                    notes: exist.notes || ''
                };
            });

            renderTable();
            if (!window.isGuest) btnSave.disabled = false;
        } catch (err) {
            console.error("Error loading attendance:", err);
            attendTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--danger);">Gagal memuat data.</td></tr>';
        }
    }

    function renderTable() {
        if (currentStudents.length === 0) return;
        
        const filter = (attendSearch.value || '').toLowerCase();
        const filtered = currentStudents.filter(s => s.nama_lengkap.toLowerCase().includes(filter));

        if (filtered.length === 0) {
            attendTbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tidak ada siswa yang cocok dengan pencarian.</td></tr>';
            return;
        }

        attendTbody.innerHTML = '';
        filtered.forEach((student, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${window.escapeHTML(student.nama_lengkap)}</strong></td>
                <td>${window.escapeHTML(student.nisn) || '-'}</td>
                <td>
                    <select class="input-control status-select" data-id="${student.id}" style="min-width: 120px; padding: 4px; font-size: 14px;">
                        <option value="Hadir" ${student.status_kehadiran === 'Hadir' ? 'selected' : ''}>Hadir</option>
                        <option value="Izin" ${student.status_kehadiran === 'Izin' ? 'selected' : ''}>Izin</option>
                        <option value="Sakit" ${student.status_kehadiran === 'Sakit' ? 'selected' : ''}>Sakit</option>
                        <option value="Alpha" ${student.status_kehadiran === 'Alpha' ? 'selected' : ''}>Alpha</option>
                    </select>
                </td>
                <td>
                    <input type="text" class="input-control notes-input" data-id="${student.id}" value="${window.escapeHTML(student.notes || '')}" placeholder="Opsional" style="padding: 4px; font-size: 14px;">
                </td>
            `;
            attendTbody.appendChild(tr);
        });

        // Add event listeners to update currentStudents on change
        document.querySelectorAll('.status-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const st = currentStudents.find(s => s.id === id);
                if (st) st.status_kehadiran = e.target.value;
            });
        });

        document.querySelectorAll('.notes-input').forEach(inp => {
            inp.addEventListener('input', (e) => {
                const id = e.target.getAttribute('data-id');
                const st = currentStudents.find(s => s.id === id);
                if (st) st.notes = e.target.value;
            });
        });
    }

    if (attendDate) attendDate.addEventListener('change', loadData);
    if (attendClass) attendClass.addEventListener('change', loadData);
    if (attendSearch) attendSearch.addEventListener('input', renderTable);
    if (btnRefresh) btnRefresh.addEventListener('click', loadData);

    if (btnSave) {
        btnSave.addEventListener('click', async () => {
            if (currentStudents.length === 0) return;
            const date = attendDate.value;
            const kelas = attendClass.value;
            
            btnSave.disabled = true;
            const originalText = btnSave.textContent;
            btnSave.textContent = 'Menyimpan...';

            const payload = currentStudents.map(s => ({
                student_id: s.id,
                class_id: kelas,
                attendance_date: date,
                status: s.status_kehadiran,
                notes: s.notes
            }));

            try {
                const { error } = await db
                    .from('attendance_students')
                    .upsert(payload, { onConflict: 'student_id, attendance_date' });
                
                if (error) throw error;
                alert('Berhasil menyimpan data absensi!');
            } catch (err) {
                console.error("Error saving attendance:", err);
                alert('Gagal menyimpan data absensi.');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }
});
