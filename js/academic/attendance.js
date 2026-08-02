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

    // ==========================================
    // EXPORT EXCEL LOGIC
    // ==========================================
    const btnExport = document.getElementById('btn-export-excel');
    const exportTahun = document.getElementById('export-tahun');
    const exportSemester = document.getElementById('export-semester');
    const exportBulan = document.getElementById('export-bulan');
    const exportKelas = document.getElementById('export-kelas');

    if (btnExport) {
        btnExport.addEventListener('click', async () => {
            if (!exportKelas.value) {
                if (window.showToast) window.showToast('Silakan pilih kelas terlebih dahulu.', 'warning');
                else alert('Silakan pilih kelas terlebih dahulu.');
                return;
            }

            const origText = btnExport.textContent;
            btnExport.disabled = true;
            btnExport.textContent = 'Memproses...';

            try {
                const tahunStr = exportTahun.value; // e.g. "2026/2027"
                const parts = tahunStr.split('/');
                const bulanInt = parseInt(exportBulan.value, 10);
                
                // Determine actual year based on month (July-Dec = first year, Jan-June = second year)
                let actualYear = parseInt(parts[0], 10);
                if (bulanInt >= 1 && bulanInt <= 6) {
                    actualYear = parseInt(parts[1], 10);
                }

                const daysInMonth = new Date(actualYear, bulanInt, 0).getDate();
                const startDate = `${actualYear}-${String(bulanInt).padStart(2, '0')}-01`;
                const endDate = `${actualYear}-${String(bulanInt).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

                // Fetch Students
                const { data: students, error: stuErr } = await db
                    .from('students')
                    .select('id, nama_lengkap, nisn')
                    .eq('kelas', exportKelas.value)
                    .order('nama_lengkap', { ascending: true });
                
                if (stuErr) throw stuErr;

                if (!students || students.length === 0) {
                    if (window.showToast) window.showToast('Tidak ada siswa di kelas ini.', 'warning');
                    return;
                }

                // Fetch Attendance
                const { data: attData, error: attErr } = await db
                    .from('attendance_students')
                    .select('student_id, attendance_date, status')
                    .in('student_id', students.map(s => s.id))
                    .gte('attendance_date', startDate)
                    .lte('attendance_date', endDate);

                if (attErr) throw attErr;

                // Memory Mapping
                const attMap = {}; // attMap[student_id][day] = status
                if (attData) {
                    attData.forEach(a => {
                        if (!attMap[a.student_id]) attMap[a.student_id] = {};
                        const day = parseInt(a.attendance_date.split('-')[2], 10);
                        attMap[a.student_id][day] = a.status;
                    });
                }

                // Building Matrix
                const matrix = [];
                const monthName = exportBulan.options[exportBulan.selectedIndex].text;
                
                const titleStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
                const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center', vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
                const cellStyleCenter = { alignment: { horizontal: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
                const cellStyleLeft = { border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };

                // Row 1 & 2
                matrix.push([{ v: 'SMP ANNIDA', s: titleStyle }]);
                matrix.push([{ v: 'REKAP ABSENSI SISWA', s: titleStyle }]);
                matrix.push([]);
                matrix.push([{ v: 'Tahun Ajaran', s: { font: { bold: true } } }, { v: `: ${tahunStr}` }, null, { v: 'Semester', s: { font: { bold: true } } }, { v: `: ${exportSemester.value}` }]);
                matrix.push([{ v: 'Kelas', s: { font: { bold: true } } }, { v: `: ${exportKelas.value}` }, null, { v: 'Bulan', s: { font: { bold: true } } }, { v: `: ${monthName}` }]);
                matrix.push([]);

                // Headers (Row 7)
                const headers = [
                    { v: 'No', s: headerStyle },
                    { v: 'Nama Siswa', s: headerStyle },
                    { v: 'NIS', s: headerStyle }
                ];
                for (let d = 1; d <= 31; d++) {
                    headers.push({ v: d, s: headerStyle });
                }
                headers.push(
                    { v: 'Jumlah Hadir', s: headerStyle },
                    { v: 'Jumlah Sakit', s: headerStyle },
                    { v: 'Jumlah Izin', s: headerStyle },
                    { v: 'Jumlah Alpha', s: headerStyle },
                    { v: 'Persentase Kehadiran', s: headerStyle }
                );
                matrix.push(headers);

                // Data Rows
                students.forEach((s, idx) => {
                    const row = [
                        { v: idx + 1, s: cellStyleCenter },
                        { v: s.nama_lengkap, s: cellStyleLeft },
                        { v: s.nisn || '-', s: cellStyleCenter }
                    ];

                    let h = 0, sakit = 0, i = 0, a = 0;
                    let totalTerisi = 0;

                    for (let d = 1; d <= 31; d++) {
                        let code = '';
                        if (d <= daysInMonth) {
                            const status = (attMap[s.id] && attMap[s.id][d]) ? attMap[s.id][d] : null;
                            if (status === 'Hadir') { code = 'H'; h++; totalTerisi++; }
                            else if (status === 'Sakit') { code = 'S'; sakit++; totalTerisi++; }
                            else if (status === 'Izin') { code = 'I'; i++; totalTerisi++; }
                            else if (status === 'Alpha') { code = 'A'; a++; totalTerisi++; }
                        }
                        row.push({ v: code, s: cellStyleCenter });
                    }

                    let pct = 0;
                    if (totalTerisi > 0) {
                        pct = Math.round((h / totalTerisi) * 100);
                    }

                    row.push(
                        { v: h, s: cellStyleCenter },
                        { v: sakit, s: cellStyleCenter },
                        { v: i, s: cellStyleCenter },
                        { v: a, s: cellStyleCenter },
                        { v: `${pct}%`, s: cellStyleCenter }
                    );

                    matrix.push(row);
                });

                // Convert to Workbook
                const ws = XLSX.utils.aoa_to_sheet(matrix);

                // Merges for headers
                const totalCols = 34 + 5; // 3 cols + 31 days + 5 sums
                if (!ws['!merges']) ws['!merges'] = [];
                ws['!merges'].push(
                    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
                    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } }
                );

                // Column widths
                const wscols = [
                    { wch: 5 },  // No
                    { wch: 30 }, // Nama
                    { wch: 15 }  // NIS
                ];
                for (let d = 1; d <= 31; d++) wscols.push({ wch: 4 });
                wscols.push({ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 20 });
                ws['!cols'] = wscols;

                // Freeze Panes
                ws['!freeze'] = { xSplit: 3, ySplit: 7, topLeftCell: "D8", activePane: "bottomRight" };

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');

                const fileName = `Absensi_${exportKelas.value}_${monthName}_${actualYear}.xlsx`;
                XLSX.writeFile(wb, fileName);

                if (window.showToast) window.showToast('Data absensi berhasil diexport!', 'success');
            } catch (err) {
                console.error("Export error:", err);
                if (window.showToast) window.showToast('Gagal mengeksekusi export.', 'error');
            } finally {
                btnExport.disabled = false;
                btnExport.textContent = origText;
            }
        });
    }
});
