import { authState } from './authState.js';
import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    // Elements - Tahun Ajaran
    const tbodyTahun = document.getElementById('tbody-tahun');
    const btnAddTahun = document.getElementById('btn-add-tahun');
    const modalTahun = document.getElementById('modal-tahun');
    const btnCloseModalTahun = document.getElementById('btn-close-modal-tahun');
    const formTahun = document.getElementById('form-tahun');
    const modalTitleTahun = document.getElementById('modal-tahun-title');

    // Elements - Kelas
    const tbodyKelas = document.getElementById('tbody-kelas');
    const btnAddKelas = document.getElementById('btn-add-kelas');
    const modalKelas = document.getElementById('modal-kelas');
    const btnCloseModalKelas = document.getElementById('btn-close-modal-kelas');
    const formKelas = document.getElementById('form-kelas');
    const modalTitleKelas = document.getElementById('modal-kelas-title');
    const inputKelasWali = document.getElementById('kelas-wali');

    // Filters Kelas
    const filterTingkatKelas = document.getElementById('filter-tingkat-kelas');
    const filterStatusKelas = document.getElementById('filter-status-kelas');
    const filterWaliKelas = document.getElementById('filter-wali-kelas');
    const filterSearchKelas = document.getElementById('filter-search-kelas');

    let currentTahunData = [];
    let currentKelasData = [];

    // Guest protection
    if (authState.isGuest) {
        if (btnAddTahun) btnAddTahun.style.display = 'none';
        if (btnAddKelas) btnAddKelas.style.display = 'none';
    }

    // ---------------------------------------------------------
    // MASTER TAHUN AJARAN
    // ---------------------------------------------------------

    async function loadDataTahunAjaran() {
        if (!tbodyTahun) return;
        tbodyTahun.innerHTML = '<tr><td colspan="5" style="text-align: center;">Memuat data tahun ajaran...</td></tr>';
        try {
            const { data, error } = await db.from('academic_years').select('*').order('tahun_ajaran', { ascending: false });
            if (error) throw error;
            currentTahunData = data || [];
            renderTableTahun();
        } catch (err) {
            console.error("Error loading academic years:", err);
            tbodyTahun.innerHTML = '<tr><td colspan="5" style="color:var(--danger); text-align:center;">Gagal memuat data.</td></tr>';
        }
    }

    function renderTableTahun() {
        if (!tbodyTahun) return;
        tbodyTahun.innerHTML = '';
        if (currentTahunData.length === 0) {
            tbodyTahun.innerHTML = '<tr><td colspan="5" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
            return;
        }

        currentTahunData.forEach((t, index) => {
            const isAktif = t.aktif === true;
            const statusBadge = isAktif ? 
                '<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px; font-weight: bold;">Aktif Saat Ini</span>' : 
                '<span style="padding: 4px 8px; background: rgba(108,117,125,0.1); color: var(--text-muted); border-radius: 4px; font-size: 12px;">Nonaktif</span>';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(t.tahun_ajaran || '-')}</strong></td>
                <td>${escapeHTML(t.semester || '-')}</td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <button class="btn-edit-tahun btn btn-outline" data-id="${t.id}" style="padding: 4px 10px; font-size: 12px;">Edit</button>
                    <button class="btn-del-tahun btn btn-outline" data-id="${t.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
                </td>
            `;
            tbodyTahun.appendChild(tr);
        });

        // Edit
        document.querySelectorAll('.btn-edit-tahun').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                const t = currentTahunData.find(x => x.id == id);
                if (t) openModalTahun(t);
            });
        });

        // Delete
        document.querySelectorAll('.btn-del-tahun').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus tahun ajaran ini?')) {
                    try {
                        const { error } = await db.from('academic_years').delete().eq('id', id);
                        if (error) throw error;
                        showToast('Tahun Ajaran berhasil dihapus', 'success');
                        await loadDataTahunAjaran();
                        window.loadGlobalKelasTahunOptions();
                    } catch (err) {
                        console.error(err);
                        showToast('Gagal menghapus tahun ajaran', 'error');
                    }
                }
            });
        });
    }

    function openModalTahun(t = null) {
        formTahun.reset();
        modalTahun.style.display = 'flex';
        if (t) {
            modalTitleTahun.textContent = 'Edit Tahun Ajaran';
            document.getElementById('tahun-id').value = t.id;
            document.getElementById('tahun-nama').value = t.tahun_ajaran || '';
            document.getElementById('tahun-semester').value = t.semester || 'Ganjil';
            document.getElementById('tahun-aktif').checked = t.aktif === true;
        } else {
            modalTitleTahun.textContent = 'Tambah Tahun Ajaran';
            document.getElementById('tahun-id').value = '';
            document.getElementById('tahun-aktif').checked = false;
        }
    }

    if (btnAddTahun) {
        btnAddTahun.addEventListener('click', () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            openModalTahun();
        });
    }

    if (btnCloseModalTahun) {
        btnCloseModalTahun.addEventListener('click', () => {
            modalTahun.style.display = 'none';
        });
    }

    if (formTahun) {
        formTahun.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            
            const btnSave = document.getElementById('btn-save-tahun');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            const payload = {
                tahun_ajaran: document.getElementById('tahun-nama').value.trim(),
                semester: document.getElementById('tahun-semester').value,
                aktif: document.getElementById('tahun-aktif').checked
            };

            const id = document.getElementById('tahun-id').value;

            try {
                // Constraint: Only ONE active year is allowed.
                // If this is set to active, deactivate all others first.
                if (payload.aktif) {
                    await db.from('academic_years').update({ aktif: false }).neq('id', id || '00000000-0000-0000-0000-000000000000');
                }

                if (id) {
                    payload.updated_at = new Date().toISOString();
                    const { error } = await db.from('academic_years').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Tahun Ajaran berhasil diperbarui', 'success');
                } else {
                    payload.created_at = new Date().toISOString();
                    const { error } = await db.from('academic_years').insert([payload]);
                    if (error) throw error;
                    showToast('Tahun Ajaran berhasil ditambahkan', 'success');
                }
                modalTahun.style.display = 'none';
                await loadDataTahunAjaran();
                window.loadGlobalKelasTahunOptions();
            } catch (err) {
                console.error("Error saving tahun:", err);
                showToast('Gagal menyimpan tahun ajaran', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }


    // ---------------------------------------------------------
    // MASTER KELAS
    // ---------------------------------------------------------

    async function loadDataKelas() {
        if (!tbodyKelas) return;
        tbodyKelas.innerHTML = '<tr><td colspan="8" style="text-align: center;">Memuat data kelas...</td></tr>';
        try {
            const { data, error } = await db.from('classes').select('*, teachers(nama)').order('tingkat', { ascending: true }).order('nama_kelas', { ascending: true });
            if (error) throw error;
            currentKelasData = data || [];
            renderTableKelas();
        } catch (err) {
            console.error("Error loading kelas:", err);
            tbodyKelas.innerHTML = '<tr><td colspan="8" style="color:var(--danger); text-align:center;">Gagal memuat data kelas.</td></tr>';
        }
    }

    function renderTableKelas() {
        if (!tbodyKelas) return;
        const sTingkat = filterTingkatKelas.value;
        const sStat = filterStatusKelas.value.toLowerCase();
        const sWali = filterWaliKelas.value; // It's a UUID now
        const sSearch = filterSearchKelas.value.toLowerCase();

        const filtered = currentKelasData.filter(k => {
            const mTingkat = !sTingkat || String(k.tingkat) === sTingkat;
            const mStat = !sStat || 
                (sStat === 'aktif' && k.aktif !== false) || 
                (sStat === 'nonaktif' && k.aktif === false);
            
            let waliName = k.teachers && k.teachers.nama ? k.teachers.nama : '';
            const mWali = !sWali || (k.wali_kelas_id === sWali);
            const mSearch = !sSearch || 
                (k.nama_kelas && k.nama_kelas.toLowerCase().includes(sSearch));
            
            return mTingkat && mStat && mWali && mSearch;
        });

        tbodyKelas.innerHTML = '';
        if (filtered.length === 0) {
            tbodyKelas.innerHTML = '<tr><td colspan="8" style="text-align: center;">Tidak ada data kelas ditemukan.</td></tr>';
            return;
        }

        filtered.forEach((k, index) => {
            const isAktif = k.aktif !== false;
            const statusBadge = isAktif ? 
                '<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px;">Aktif</span>' : 
                '<span style="padding: 4px 8px; background: rgba(220,53,69,0.1); color: var(--danger); border-radius: 4px; font-size: 12px;">Nonaktif</span>';
            
            let waliName = k.teachers && k.teachers.nama ? k.teachers.nama : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(k.nama_kelas || '-')}</strong></td>
                <td style="text-align: center;">Kelas ${escapeHTML(k.tingkat || '-')}</td>
                <td>${escapeHTML(waliName)}</td>
                <td style="text-align: center;">${escapeHTML(k.ruangan || '-')}</td>
                <td style="text-align: center;">${escapeHTML(k.kapasitas || '-')}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td style="text-align: center;">
                    <button class="btn-edit-kelas btn btn-outline" data-id="${k.id}" style="padding: 4px 10px; font-size: 12px;">Edit</button>
                    <button class="btn-del-kelas btn btn-outline" data-id="${k.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
                </td>
            `;
            tbodyKelas.appendChild(tr);
        });

        // Edit
        document.querySelectorAll('.btn-edit-kelas').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                const k = currentKelasData.find(x => x.id == id);
                if (k) openModalKelas(k);
            });
        });

        // Delete
        document.querySelectorAll('.btn-del-kelas').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus kelas ini?')) {
                    try {
                        const { error } = await db.from('classes').delete().eq('id', id);
                        if (error) throw error;
                        showToast('Kelas berhasil dihapus', 'success');
                        await loadDataKelas();
                        window.loadGlobalKelasTahunOptions();
                    } catch (err) {
                        console.error(err);
                        showToast('Gagal menghapus kelas', 'error');
                    }
                }
            });
        });
    }

    function openModalKelas(k = null) {
        formKelas.reset();
        modalKelas.style.display = 'flex';
        if (k) {
            modalTitleKelas.textContent = 'Edit Kelas';
            document.getElementById('kelas-id').value = k.id;
            document.getElementById('kelas-nama').value = k.nama_kelas || '';
            document.getElementById('kelas-tingkat').value = k.tingkat || '';
            document.getElementById('kelas-wali').value = k.wali_kelas_id || '';
            document.getElementById('kelas-ruangan').value = k.ruangan || '';
            document.getElementById('kelas-kapasitas').value = k.kapasitas || '';
            document.getElementById('kelas-aktif').checked = k.aktif !== false;
        } else {
            modalTitleKelas.textContent = 'Tambah Kelas';
            document.getElementById('kelas-id').value = '';
            document.getElementById('kelas-aktif').checked = true;
        }
    }

    if (btnAddKelas) {
        btnAddKelas.addEventListener('click', () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            openModalKelas();
        });
    }

    if (btnCloseModalKelas) {
        btnCloseModalKelas.addEventListener('click', () => {
            modalKelas.style.display = 'none';
        });
    }

    if (formKelas) {
        formKelas.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            
            const btnSave = document.getElementById('btn-save-kelas');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            const payload = {
                nama_kelas: document.getElementById('kelas-nama').value.trim(),
                tingkat: parseInt(document.getElementById('kelas-tingkat').value) || null,
                wali_kelas_id: document.getElementById('kelas-wali').value || null,
                ruangan: document.getElementById('kelas-ruangan').value.trim(),
                kapasitas: parseInt(document.getElementById('kelas-kapasitas').value) || 0,
                aktif: document.getElementById('kelas-aktif').checked
            };

            const id = document.getElementById('kelas-id').value;

            try {
                if (id) {
                    payload.updated_at = new Date().toISOString();
                    const { error } = await db.from('classes').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Kelas berhasil diperbarui', 'success');
                } else {
                    payload.created_at = new Date().toISOString();
                    const { error } = await db.from('classes').insert([payload]);
                    if (error) throw error;
                    showToast('Kelas berhasil ditambahkan', 'success');
                }
                modalKelas.style.display = 'none';
                await loadDataKelas();
                window.loadGlobalKelasTahunOptions();
            } catch (err) {
                console.error("Error saving kelas:", err);
                showToast('Gagal menyimpan data kelas', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }

    // Filter Events
    [filterTingkatKelas, filterStatusKelas, filterWaliKelas, filterSearchKelas].forEach(el => {
        if (el) el.addEventListener('input', renderTableKelas);
    });
    [filterTingkatKelas, filterStatusKelas].forEach(el => {
        if (el) el.addEventListener('change', renderTableKelas);
    });

    // ---------------------------------------------------------
    // GLOBAL INTEGRATION & DASHBOARD STATS
    // ---------------------------------------------------------

    window.loadGlobalKelasTahunOptions = async function() {
        try {
            // Load both classes and academic_years once for the whole app
            const [resKelas, resTahun] = await Promise.all([
                db.from('classes').select('*').order('tingkat', { ascending: true }).order('nama_kelas', { ascending: true }),
                db.from('academic_years').select('*').order('tahun_ajaran', { ascending: false })
            ]);

            const allKelas = resKelas.data || [];
            const activeKelas = allKelas.filter(k => k.aktif !== false);
            const allTahun = resTahun.data || [];

            // Expose globally for UUID conversions (Sprint 32A Addendum)
            window.masterClasses = activeKelas;
            window.masterTahunAjaran = allTahun;

            // Populate Classes Dropdowns
            const classSelectIds = [
                'export-kelas', 'attend-class', 'select-kelas-nilai', 
                'filter-kelas-rekap', 'filter-kelas-jadwal', 'rapor-kelas', 'jurnal-class',
                'guru-wali', 'filter-wali-guru'
            ];
            
            let classOptions = '<option value="">-- Pilih Kelas --</option>';
            activeKelas.forEach(k => {
                classOptions += `<option value="${escapeHTML(k.nama_kelas)}">${escapeHTML(k.nama_kelas)}</option>`;
            });

            classSelectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = classOptions;
            });

            // Populate Academic Years & Semesters Dropdowns
            const tahunSelectIds = ['export-tahun', 'rapor-tahun'];
            let tahunOptions = '<option value="">-- Pilih Tahun --</option>';
            // Get unique tahun_ajaran
            const uniqueTahun = [...new Set(allTahun.map(t => t.tahun_ajaran))].filter(Boolean);
            uniqueTahun.forEach(t => {
                tahunOptions += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`;
            });

            tahunSelectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const prevVal = el.value;
                    el.innerHTML = tahunOptions;
                    if (prevVal) el.value = prevVal; // preserve selection
                }
            });

            const activeYearData = allTahun.find(t => t.aktif === true);
            const activeYearText = activeYearData ? activeYearData.tahun_ajaran : '-';
            const activeSemesterText = activeYearData ? activeYearData.semester : '-';
            
            // Export globally for insertions
            window.activeTahunAjaran = activeYearText !== '-' ? activeYearText : null;
            window.activeSemester = activeSemesterText !== '-' ? activeSemesterText : null;

            // Populate Semester Dropdowns
            const semesterSelectIds = ['export-semester', 'rapor-semester'];
            const semesterOptions = `
                <option value="">-- Pilih Semester --</option>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
            `;
            
            semesterSelectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const prevVal = el.value;
                    el.innerHTML = semesterOptions;
                    if (prevVal) el.value = prevVal;
                    else el.value = activeSemesterText !== '-' ? activeSemesterText : '';
                }
            });

            tahunSelectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.value) el.value = activeYearText !== '-' ? activeYearText : '';
            });

            // Update Dashboard Stats
            const statKelasEl = document.getElementById('stat-kelas-total');
            const statWaliEl = document.getElementById('stat-walikelas-total');
            const statTahunEl = document.getElementById('stat-tahun-aktif');
            const statSemesterEl = document.getElementById('stat-semester-aktif');

            if (statKelasEl) statKelasEl.textContent = activeKelas.length;
            if (statWaliEl) {
                const uniqueWali = [...new Set(activeKelas.map(k => k.wali_kelas_id).filter(Boolean))];
                statWaliEl.textContent = uniqueWali.length;
            }
            if (statTahunEl) statTahunEl.textContent = activeYearText;
            if (statSemesterEl) statSemesterEl.textContent = activeSemesterText;

        } catch (err) {
            console.error("Gagal memuat global opsi kelas dan tahun:", err);
        }
    };

    // Initialize Global
    window.loadGlobalKelasTahunOptions();
    
    // Hash routing setup
    const initPage = () => {
        if (window.location.hash === '#kelas') {
            loadDataTahunAjaran();
            loadDataKelas();
        }
    };
    
    initPage();
    window.addEventListener('hashchange', initPage);
});

