import db from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const section = document.getElementById('jurnal-guru');
    if (!section) return;

    const elDate = document.getElementById('jurnal-date');
    const elClass = document.getElementById('jurnal-class');
    const elSubject = document.getElementById('jurnal-subject');
    const elTime = document.getElementById('jurnal-time');
    const elMaterial = document.getElementById('jurnal-material');
    const elNotes = document.getElementById('jurnal-notes');
    const btnSave = document.getElementById('btn-jurnal-save');
    
    const tbodyHistory = document.getElementById('jurnal-history-tbody');
    const elFilterMonth = document.getElementById('jurnal-filter-month');
    const btnExport = document.getElementById('btn-jurnal-export');

    let isInit = false;
    let classesMap = {};
    let subjectsMap = {};
    let authUserId = null;

    // Default current month filter
    const today = new Date();
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (elFilterMonth) elFilterMonth.value = currentMonthStr;
    if (elDate) {
        elDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'jurnal-guru' && mutation.target.style.display !== 'none') {
                if (!isInit && (window.isAdmin || window.currentTeacher)) {
                    initJurnal();
                }
            }
        });
    });

    observer.observe(section, { attributes: true, attributeFilter: ['style'] });

    if (section.style.display !== 'none') {
        setTimeout(() => {
            if (window.isAdmin || window.currentTeacher) {
                initJurnal();
            }
        }, 1000);
    }

    async function initJurnal() {
        if (isInit) return;
        isInit = true;

        try {
            const { data: { session } } = await db.auth.getSession();
            authUserId = session?.user?.id;

            await loadDropdowns();
            await loadHistory();
            
            // Event Listeners
            btnSave.addEventListener('click', saveJurnal);
            btnSave.disabled = false;

            if (elFilterMonth) elFilterMonth.addEventListener('change', loadHistory);
            if (btnExport) btnExport.addEventListener('click', exportToExcel);
            
            // Validate inputs on change
            const validate = () => {
                const isValid = elDate.value && elClass.value && elSubject.value && elTime.value.trim() && elMaterial.value.trim();
                btnSave.disabled = !isValid;
            };

            [elDate, elClass, elSubject].forEach(el => el.addEventListener('change', validate));
            [elTime, elMaterial].forEach(el => el.addEventListener('input', validate));

        } catch (e) {
            console.error("Init Jurnal Error:", e);
        }
    }

    async function loadDropdowns() {
        try {
            // Load Classes
            const { data: clsData } = await db.from('classes').select('id, nama_kelas').order('nama_kelas');
            if (clsData) {
                elClass.innerHTML = '<option value="">-- Pilih Kelas --</option>' + 
                    clsData.map(c => {
                        classesMap[c.id] = c.nama_kelas;
                        return `<option value="${c.id}">${escapeHTML(c.nama_kelas)}</option>`;
                    }).join('');
            }

            // Load Subjects (Admin gets all, Teacher gets theirs)
            let subjData = [];
            if (window.isAdmin) {
                const { data } = await db.from('subjects').select('id, nama_mapel').order('nama_mapel');
                subjData = data || [];
            } else if (window.currentTeacher) {
                const { data } = await db.from('class_schedules')
                    .select('teacher_id, subjects(id, nama_mapel), teachers(nama)');
                
                if (data) {
                    const map = new Map();
                    data.forEach(d => {
                        const isMySubject = d.teacher_id === window.currentTeacher.id;
                        const isDewanGuru = d.teachers && d.teachers.nama && d.teachers.nama.toLowerCase().includes('dewan guru');
                        if (d.subjects && (isMySubject || isDewanGuru)) {
                            map.set(d.subjects.id, d.subjects);
                        }
                    });
                    subjData = Array.from(map.values()).sort((a,b) => a.nama_mapel.localeCompare(b.nama_mapel));
                }
            }

            if (subjData.length > 0) {
                elSubject.innerHTML = '<option value="">-- Pilih Mapel --</option>' + 
                    subjData.map(s => {
                        subjectsMap[s.id] = s.nama_mapel;
                        return `<option value="${s.id}">${escapeHTML(s.nama_mapel)}</option>`;
                    }).join('');
            }

        } catch (e) {
            console.error("Failed to load dropdowns:", e);
        }
    }

    async function loadHistory() {
        if (!tbodyHistory) return;
        tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Memuat riwayat jurnal...</td></tr>';
        
        try {
            let monthStr = elFilterMonth.value || currentMonthStr;
            const startDate = `${monthStr}-01`;
            // Get last day of the month
            const [yyyy, mm] = monthStr.split('-');
            const endDate = new Date(parseInt(yyyy), parseInt(mm), 0).toISOString().split('T')[0];

            let query = db.from('teacher_journals')
                .select(`
                    id, date, jam_pelajaran, materi, catatan, teacher_id,
                    classes(nama_kelas),
                    subjects(nama_mapel),
                    profiles(full_name)
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: false });

            if (!window.isAdmin && authUserId) {
                query = query.eq('teacher_id', authUserId);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada jurnal yang terisi pada bulan ini.</td></tr>';
                return;
            }

            tbodyHistory.innerHTML = data.map(j => {
                const pName = j.profiles ? j.profiles.full_name : 'Guru';
                const cName = j.classes ? j.classes.nama_kelas : '-';
                const sName = j.subjects ? j.subjects.nama_mapel : '-';
                
                // Format tanggal dari YYYY-MM-DD ke DD-MM-YYYY
                const parts = j.date.split('-');
                const dFormatted = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : j.date;

                const isOwner = !window.isAdmin && j.teacher_id === authUserId;
                const canDelete = window.isAdmin || isOwner;

                let actionHtml = '';
                if (canDelete) {
                    actionHtml = `
                        <button class="btn btn-outline btn-sm btn-jurnal-del" data-id="${j.id}" style="color: var(--danger); border-color: var(--danger); padding: 4px 8px;" title="Hapus Jurnal">🗑️</button>
                    `;
                }

                return `
                    <tr style="background: rgba(255,255,255,0.02);">
                        <td>${escapeHTML(dFormatted)}</td>
                        <td><strong>${escapeHTML(pName)}</strong></td>
                        <td>${escapeHTML(cName)}</td>
                        <td>${escapeHTML(sName)}</td>
                        <td>${escapeHTML(j.jam_pelajaran)}</td>
                        <td>
                            <div style="font-weight: 500;">${escapeHTML(j.materi)}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(j.catatan || '')}</div>
                        </td>
                        <td style="text-align: center;">${actionHtml}</td>
                    </tr>
                `;
            }).join('');

            // Attach delete events
            document.querySelectorAll('.btn-jurnal-del').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if (confirm('Yakin ingin menghapus jurnal ini?')) {
                        try {
                            const { error: delErr } = await db.from('teacher_journals').delete().eq('id', id);
                            if (delErr) throw delErr;
                            showToast('Jurnal berhasil dihapus', 'success');
                            loadHistory();
                            if(window.updateDashboardStats) window.updateDashboardStats();
                        } catch (err) {
                            showToast('Gagal menghapus jurnal', 'error');
                            console.error(err);
                        }
                    }
                });
            });

        } catch (e) {
            console.error("Load history error:", e);
            tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Gagal memuat data.</td></tr>';
        }
    }

    async function saveJurnal() {
        if (!elDate.value || !elClass.value || !elSubject.value || !elTime.value.trim() || !elMaterial.value.trim()) {
            showToast('Mohon lengkapi semua field yang wajib', 'warning');
            return;
        }

        const payload = {
            teacher_id: authUserId,
            date: elDate.value,
            class_id: elClass.value,
            subject_id: elSubject.value,
            jam_pelajaran: elTime.value.trim(),
            materi: elMaterial.value.trim(),
            catatan: elNotes.value.trim() || null
        };

        btnSave.disabled = true;
        btnSave.textContent = 'Menyimpan...';

        try {
            const { error } = await db.from('teacher_journals').insert(payload);
            if (error) throw error;
            
            showToast('Jurnal berhasil disimpan', 'success');
            
            // Reset form
            elTime.value = '';
            elMaterial.value = '';
            elNotes.value = '';
            btnSave.disabled = true;

            loadHistory();
            if(window.updateDashboardStats) window.updateDashboardStats();
            
        } catch (e) {
            console.error("Save jurnal error:", e);
            showToast('Gagal menyimpan jurnal', 'error');
        } finally {
            btnSave.textContent = 'Simpan Jurnal';
            // re-validate
            btnSave.disabled = !(elDate.value && elClass.value && elSubject.value && elTime.value.trim() && elMaterial.value.trim());
        }
    }

    async function exportToExcel() {
        if (!window.XLSX) {
            showToast('Library Excel belum siap', 'error');
            return;
        }

        try {
            const btnOrig = btnExport.innerHTML;
            btnExport.innerHTML = '⏱️ Exporting...';
            btnExport.disabled = true;

            let monthStr = elFilterMonth.value || currentMonthStr;
            const startDate = `${monthStr}-01`;
            const [yyyy, mm] = monthStr.split('-');
            const endDate = new Date(parseInt(yyyy), parseInt(mm), 0).toISOString().split('T')[0];

            let query = db.from('teacher_journals')
                .select(`
                    date, jam_pelajaran, materi, catatan,
                    classes(nama_kelas),
                    subjects(nama_mapel),
                    profiles(full_name)
                `)
                .gte('date', startDate)
                .lte('date', endDate)
                .order('date', { ascending: true });

            if (!window.isAdmin && authUserId) {
                query = query.eq('teacher_id', authUserId);
            }

            const { data, error } = await query;
            if (error) throw error;

            if (!data || data.length === 0) {
                showToast('Tidak ada data untuk diexport bulan ini', 'warning');
                btnExport.innerHTML = btnOrig;
                btnExport.disabled = false;
                return;
            }

            const excelData = data.map((j, i) => ({
                'No': i + 1,
                'Tanggal': j.date,
                'Nama Guru': j.profiles ? j.profiles.full_name : 'Guru',
                'Kelas': j.classes ? j.classes.nama_kelas : '',
                'Mata Pelajaran': j.subjects ? j.subjects.nama_mapel : '',
                'Jam Pelajaran': j.jam_pelajaran,
                'Materi Pokok': j.materi,
                'Catatan / Hambatan': j.catatan || ''
            }));

            const ws = window.XLSX.utils.json_to_sheet(excelData);
            
            // Adjust column widths
            const colWidths = [
                { wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 20 }, 
                { wch: 15 }, { wch: 40 }, { wch: 40 }
            ];
            ws['!cols'] = colWidths;

            const wb = window.XLSX.utils.book_new();
            window.XLSX.utils.book_append_sheet(wb, ws, "Jurnal_Guru");
            
            window.XLSX.writeFile(wb, `Jurnal_Guru_${monthStr}.xlsx`);
            
            btnExport.innerHTML = btnOrig;
            btnExport.disabled = false;
            showToast('Export berhasil!', 'success');

        } catch (e) {
            console.error("Export error:", e);
            showToast('Gagal export excel', 'error');
            btnExport.innerHTML = '📊 Export Excel';
            btnExport.disabled = false;
        }
    }
});
