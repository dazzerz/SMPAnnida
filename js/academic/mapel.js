import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tbodyMapel = document.getElementById('tbody-mapel');
    const btnAddMapel = document.getElementById('btn-add-mapel');
    const modalMapel = document.getElementById('modal-mapel');
    const btnCloseModal = document.getElementById('btn-close-modal-mapel');
    const formMapel = document.getElementById('form-mapel');
    const modalTitle = document.getElementById('modal-mapel-title');
    
    // Filters
    const filterStatus = document.getElementById('filter-status-mapel');
    const filterKelompok = document.getElementById('filter-kelompok-mapel');
    const filterGuru = document.getElementById('filter-guru-mapel');
    const filterSearch = document.getElementById('filter-search-mapel');
    
    // Form Inputs
    const inputGuru = document.getElementById('mapel-guru');

    let currentData = [];

    // Guest Mode Protection
    if (window.isGuest && btnAddMapel) {
        btnAddMapel.style.display = 'none';
    }

    // Load Data
    async function loadData() {
        if (!tbodyMapel) return;
        tbodyMapel.innerHTML = '<tr><td colspan="9" style="text-align: center;">Memuat data mata pelajaran...</td></tr>';
        try {
            const { data, error } = await db.from('subjects').select('*, teachers(nama)').order('urutan', { ascending: true });
            if (error) throw error;
            currentData = data || [];
            
            renderTable();
        } catch (err) {
            console.error("Error loading subjects:", err);
            tbodyMapel.innerHTML = '<tr><td colspan="9" style="color:var(--danger); text-align:center;">Gagal memuat data.</td></tr>';
        }
    }

    // Render Table
    function renderTable() {
        if (!tbodyMapel) return;
        const sStat = filterStatus.value.toLowerCase();
        const sKel = filterKelompok.value.toLowerCase();
        const sGuru = filterGuru.value; // It's a UUID now
        const sSearch = filterSearch.value.toLowerCase();

        const filtered = currentData.filter(m => {
            const mStat = !sStat || 
                (sStat === 'aktif' && m.aktif) || 
                (sStat === 'nonaktif' && !m.aktif);
            const mKel = !sKel || (m.kelompok && m.kelompok.toLowerCase() === sKel);
            
            // Get teacher name for filtering
            let teacherName = m.teachers && m.teachers.nama ? m.teachers.nama : '';
            
            const mGuru = !sGuru || (m.guru_id === sGuru);
            
            const mSearch = !sSearch || 
                (m.nama_mapel && m.nama_mapel.toLowerCase().includes(sSearch)) || 
                (m.kode_mapel && m.kode_mapel.toLowerCase().includes(sSearch));
            
            return mStat && mKel && mGuru && mSearch;
        });

        tbodyMapel.innerHTML = '';
        if (filtered.length === 0) {
            tbodyMapel.innerHTML = '<tr><td colspan="9" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
            return;
        }

        filtered.forEach((m, index) => {
            const isAktif = m.aktif !== false; // default true
            const statusBadge = isAktif ? 
                '<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px;">Aktif</span>' : 
                '<span style="padding: 4px 8px; background: rgba(220,53,69,0.1); color: var(--danger); border-radius: 4px; font-size: 12px;">Nonaktif</span>';
            
            let teacherName = m.teachers && m.teachers.nama ? m.teachers.nama : '-';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${escapeHTML(m.kode_mapel || '-')}</strong></td>
                <td>${escapeHTML(m.nama_mapel || '-')}</td>
                <td>${escapeHTML(teacherName)}</td>
                <td>Kelompok ${escapeHTML(m.kelompok || '-')}</td>
                <td style="text-align: center;">${escapeHTML(m.kkm || '-')}</td>
                <td style="text-align: center;">${escapeHTML(m.jam_per_minggu || '-')}</td>
                <td style="text-align: center;">${statusBadge}</td>
                <td style="text-align: center;">
                    <button class="btn-edit-mapel btn btn-outline" data-id="${m.id}" style="padding: 4px 10px; font-size: 12px;">Edit</button>
                    <button class="btn-del-mapel btn btn-outline" data-id="${m.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
                </td>
            `;
            tbodyMapel.appendChild(tr);
        });

        // Bind Edit Buttons
        document.querySelectorAll('.btn-edit-mapel').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                const mapel = currentData.find(x => x.id == id);
                if (mapel) openModal(mapel);
            });
        });

        // Bind Delete Buttons
        document.querySelectorAll('.btn-del-mapel').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus mata pelajaran ini?')) {
                    try {
                        const { error } = await db.from('subjects').delete().eq('id', id);
                        if (error) throw error;
                        showToast('Mapel berhasil dihapus', 'success');
                        loadData();
                        if (window.loadGlobalMapelOptions) window.loadGlobalMapelOptions();
                    } catch (err) {
                        console.error(err);
                        showToast('Gagal menghapus mapel', 'error');
                    }
                }
            });
        });
    }

    // Modal Operations
    function openModal(mapel = null) {
        formMapel.reset();
        modalMapel.style.display = 'flex';
        if (mapel) {
            modalTitle.textContent = 'Edit Mata Pelajaran';
            document.getElementById('mapel-id').value = mapel.id;
            document.getElementById('mapel-kode').value = mapel.kode_mapel || '';
            document.getElementById('mapel-nama').value = mapel.nama_mapel || '';
            document.getElementById('mapel-kelompok').value = mapel.kelompok || '';
            document.getElementById('mapel-guru').value = mapel.guru_id || '';
            document.getElementById('mapel-kkm').value = mapel.kkm || '';
            document.getElementById('mapel-jam').value = mapel.jam_per_minggu || '';
            document.getElementById('mapel-urutan').value = mapel.urutan || '';
            document.getElementById('mapel-aktif').checked = mapel.aktif !== false;
        } else {
            modalTitle.textContent = 'Tambah Mata Pelajaran';
            document.getElementById('mapel-id').value = '';
            document.getElementById('mapel-aktif').checked = true;
        }
    }

    if (btnAddMapel) {
        btnAddMapel.addEventListener('click', () => {
            if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            openModal();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            modalMapel.style.display = 'none';
        });
    }

    // Form Submit (Upsert)
    if (formMapel) {
        formMapel.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            
            const btnSave = document.getElementById('btn-save-mapel');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            const payload = {
                kode_mapel: document.getElementById('mapel-kode').value.trim(),
                nama_mapel: document.getElementById('mapel-nama').value.trim(),
                kelompok: document.getElementById('mapel-kelompok').value,
                guru_id: document.getElementById('mapel-guru').value || null,
                kkm: parseInt(document.getElementById('mapel-kkm').value) || 0,
                jam_per_minggu: parseInt(document.getElementById('mapel-jam').value) || 0,
                urutan: parseInt(document.getElementById('mapel-urutan').value) || 99,
                aktif: document.getElementById('mapel-aktif').checked
            };

            const id = document.getElementById('mapel-id').value;

            try {
                if (id) {
                    payload.updated_at = new Date().toISOString();
                    const { error } = await db.from('subjects').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Mapel berhasil diperbarui', 'success');
                } else {
                    payload.created_at = new Date().toISOString();
                    const { error } = await db.from('subjects').insert([payload]);
                    if (error) throw error;
                    showToast('Mapel berhasil ditambahkan', 'success');
                }
                modalMapel.style.display = 'none';
                loadData();
                if (window.loadGlobalMapelOptions) window.loadGlobalMapelOptions();
            } catch (err) {
                console.error("Error saving mapel:", err);
                showToast('Gagal menyimpan data mapel', 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }

    // Filter Events
    [filterStatus, filterKelompok, filterGuru, filterSearch].forEach(el => {
        if (el) el.addEventListener('input', renderTable);
    });
    [filterStatus, filterKelompok].forEach(el => {
        if (el) el.addEventListener('change', renderTable);
    });

    // Global function to load Mapel options into other dropdowns
    window.loadGlobalMapelOptions = async function() {
        try {
            const { data, error } = await db.from('subjects').select('nama_mapel, aktif').order('urutan', { ascending: true });
            if (error) throw error;
            
            const activeSubjects = data.filter(s => s.aktif !== false);
            
            // Expose globally for UUID conversions (Sprint 32A Addendum)
            window.masterSubjects = activeSubjects;
            
            let optionsHtml = '<option value="">-- Pilih Mapel --</option>';
            activeSubjects.forEach(s => {
                // We use nama_mapel as value to maintain backward compatibility with old hardcoded inputs
                optionsHtml += `<option value="${escapeHTML(s.nama_mapel)}">${escapeHTML(s.nama_mapel)}</option>`;
            });

            const selectIds = ['input-mapel-nilai', 'jurnal-subject', 'guru-mapel', 'filter-mapel-guru'];
            selectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const prevVal = el.value;
                    el.innerHTML = optionsHtml;
                    if (prevVal) el.value = prevVal;
                }
            });
        } catch (err) {
            console.error("Gagal memuat opsi mapel global:", err);
        }
    };

    // Initialize
    window.loadGlobalMapelOptions();
    
    const isMapelPage = window.location.hash === '#mata-pelajaran';
    if (isMapelPage) {
        loadData();
    }
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#mata-pelajaran') {
            loadData();
        }
    });
});
