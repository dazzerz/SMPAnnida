import { authState } from './authState.js';
import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tbodyGuru = document.getElementById('tbody-guru');
    const btnAddGuru = document.getElementById('btn-add-guru');
    const modalGuru = document.getElementById('modal-guru');
    const btnCloseModal = document.getElementById('btn-close-modal-guru');
    const formGuru = document.getElementById('form-guru');
    const modalTitle = document.getElementById('modal-guru-title');
    
    // Filters
    const filterStatus = document.getElementById('filter-status-guru');
    const filterMapel = document.getElementById('filter-mapel-guru');
    const filterWali = document.getElementById('filter-wali-guru');
    const filterSearch = document.getElementById('filter-search-guru');
    
    let currentData = [];

    // Guest Mode Protection
    if (authState.isGuest && btnAddGuru) {
        btnAddGuru.style.display = 'none'; 
    }

    // Load Data
    async function loadData() {
        if (!tbodyGuru) return;
        tbodyGuru.innerHTML = '<tr><td colspan="7" style="text-align: center;">Memuat data guru...</td></tr>';
        try {
            const { data, error } = await db.from('teachers').select('*').order('nama', { ascending: true });
            if (error) throw error;
            currentData = data || [];
            renderTable();
        } catch (err) {
            console.error("Error loading teachers:", err);
            tbodyGuru.innerHTML = '<tr><td colspan="7" style="color:var(--danger); text-align:center;">Gagal memuat data.</td></tr>';
        }
    }

    // Render Table
    function renderTable() {
        if (!tbodyGuru) return;
        const sStat = filterStatus.value.toLowerCase();
        const sMapel = filterMapel.value.toLowerCase();
        const sWali = filterWali.value.toLowerCase();
        const sSearch = filterSearch.value.toLowerCase();

        const filtered = currentData.filter(g => {
            const mStat = !sStat || 
                (sStat === 'aktif' && g.aktif) || 
                (sStat === 'nonaktif' && !g.aktif);
            const mMapel = !sMapel || (g.mata_pelajaran && g.mata_pelajaran.toLowerCase().includes(sMapel));
            const mWali = !sWali || (g.wali_kelas && g.wali_kelas.toLowerCase().includes(sWali));
            const mSearch = !sSearch || 
                (g.nama && g.nama.toLowerCase().includes(sSearch)) || 
                (g.nip && String(g.nip).toLowerCase().includes(sSearch));
            
            return mStat && mMapel && mWali && mSearch;
        });

        tbodyGuru.innerHTML = '';
        if (filtered.length === 0) {
            tbodyGuru.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
            return;
        }

        filtered.forEach((g, index) => {
            // Sinkronkan indikator Wali Kelas dari masterClasses (relasi classes.wali_kelas_id)
            const myClasses = window.masterClasses ? window.masterClasses.filter(c => c.wali_kelas_id === g.id) : [];
            const classNames = myClasses.map(c => c.nama_kelas).join(', ');
            const displayWali = classNames || g.wali_kelas || '-';

            const isAktif = g.aktif !== false; // default true if undefined
            const statusBadge = isAktif ? 
                '<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px; font-weight: bold;">Aktif</span>' : 
                '<span style="padding: 4px 8px; background: rgba(220,53,69,0.1); color: var(--danger); border-radius: 4px; font-size: 12px;">Nonaktif</span>';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${escapeHTML(g.nip || '-')}</td>
                <td><strong>${escapeHTML(g.nama || '-')}</strong></td>
                <td>${escapeHTML(g.mata_pelajaran || '-')}</td>
                <td><span class="${displayWali !== '-' ? 'badge badge-primary' : 'text-gray-400'}">${escapeHTML(displayWali)}</span></td>
                <td>${statusBadge}</td>
                <td style="text-align: center;">
                    <button class="btn-edit-guru btn btn-outline" data-id="${g.id}" style="padding: 4px 10px; font-size: 12px;">Edit</button>
                    <button class="btn-del-guru btn btn-outline" data-id="${g.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
                </td>
            `;
            tbodyGuru.appendChild(tr);
        });

        // Bind Edit Buttons
        document.querySelectorAll('.btn-edit-guru').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                const teacher = currentData.find(t => t.id == id);
                if (teacher) openModal(teacher);
            });
        });

        // Bind Delete Buttons
        document.querySelectorAll('.btn-del-guru').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus guru ini?')) {
                    try {
                        const { error } = await db.from('teachers').delete().eq('id', id);
                        if (error) throw error;
                        showToast('Guru berhasil dihapus', 'success');
                        loadData();
                    } catch (err) {
                        console.error(err);
                        showToast('Gagal menghapus guru', 'error');
                    }
                }
            });
        });
    }

    // Modal Operations
    function openModal(teacher = null) {
        formGuru.reset();
        modalGuru.style.display = 'flex'; modalGuru.classList.remove('hidden'); 
        if (teacher) {
            modalTitle.textContent = 'Edit Guru';
            document.getElementById('guru-id').value = teacher.id;
            document.getElementById('guru-nip').value = teacher.nip || '';
            document.getElementById('guru-nama').value = teacher.nama || '';
            document.getElementById('guru-email').value = teacher.email || '';
            document.getElementById('guru-hp').value = teacher.no_hp || '';
            document.getElementById('guru-jk').value = teacher.jenis_kelamin || '';
            document.getElementById('guru-status').value = teacher.status_guru || 'GTY';
            document.getElementById('guru-wali').value = teacher.wali_kelas || '';
            
            // Mapel Multi-Select Handling
            const mapelValues = (teacher.mata_pelajaran || '').split(',').map(s => s.trim()).filter(Boolean);
            const mapelSelect = document.getElementById('guru-mapel');
            if (mapelSelect) {
                Array.from(mapelSelect.options).forEach(opt => {
                    opt.selected = mapelValues.includes(opt.value);
                });
            }

            document.getElementById('guru-aktif').checked = teacher.aktif !== false;
        } else {
            modalTitle.textContent = 'Tambah Guru';
            document.getElementById('guru-id').value = '';
            const mapelSelect = document.getElementById('guru-mapel');
            if (mapelSelect) {
                Array.from(mapelSelect.options).forEach(opt => opt.selected = false);
            }
            document.getElementById('guru-aktif').checked = true;
        }
    }

    if (btnAddGuru) {
        btnAddGuru.addEventListener('click', () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            openModal();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            modalGuru.style.display = 'none'; modalGuru.classList.add('hidden'); 
        });
    }

    // Form Submit (Upsert)
    if (formGuru) {
        formGuru.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            
            const btnSave = document.getElementById('btn-save-guru');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            const mapelEl = document.getElementById('guru-mapel');
            let selectedMapels = [];
            if (mapelEl && mapelEl.options) {
                for (let i = 0; i < mapelEl.options.length; i++) {
                    if (mapelEl.options[i].selected && mapelEl.options[i].value) {
                        selectedMapels.push(mapelEl.options[i].value);
                    }
                }
            }
            const mapelString = selectedMapels.join(', ');

            const payload = {
                nip: document.getElementById('guru-nip').value.trim(),
                nama: document.getElementById('guru-nama').value.trim(),
                email: document.getElementById('guru-email').value.trim(),
                no_hp: document.getElementById('guru-hp').value.trim(),
                jenis_kelamin: document.getElementById('guru-jk').value,
                status_guru: document.getElementById('guru-status').value,
                wali_kelas: document.getElementById('guru-wali').value.trim(),
                mata_pelajaran: mapelString,
                aktif: document.getElementById('guru-aktif').checked
            };

            const id = document.getElementById('guru-id').value;

            try {
                if (id) {
                    const { error } = await db.from('teachers').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Data guru berhasil diperbarui', 'success');
                } else {
                    const { error } = await db.from('teachers').insert([payload]);
                    if (error) throw error;
                    showToast('Guru berhasil ditambahkan', 'success');
                }
                modalGuru.style.display = 'none'; modalGuru.classList.add('hidden'); 
                loadData();
                window.loadGlobalGuruOptions();
            } catch (err) {
                console.error("Error saving teacher:", err);
                showToast('Gagal: ' + (err.message || 'Kesalahan sistem'), 'error');
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }

    // Filter Events
    [filterStatus, filterMapel, filterWali, filterSearch].forEach(el => {
        if (el) el.addEventListener('input', renderTable);
    });
    [filterStatus].forEach(el => {
        if (el) el.addEventListener('change', renderTable);
    });

    // Global Guru Loader
    window.loadGlobalGuruOptions = async function() {
        try {
            const { data, error } = await db.from('teachers').select('id, nama, aktif').order('nama', { ascending: true });
            if (error) throw error;
            
            const activeTeachers = data.filter(t => t.aktif !== false);
            
            // Expose globally for UUID conversions (Sprint 32A Addendum)
            window.masterTeachers = activeTeachers;
            
            let optionsHtml = '<option value="">-- Pilih Guru --</option>';
            activeTeachers.forEach(t => {
                // Gunakan ID untuk value jika relasinya adalah UUID, atau nama jika backward compatible
                optionsHtml += `<option value="${t.id}">${escapeHTML(t.nama)}</option>`;
            });

            // Elemen dropdown yang perlu disinkronkan dengan data Guru
            const selectIds = ['mapel-guru', 'kelas-wali', 'filter-guru-mapel', 'filter-wali-kelas'];
            selectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    const prevVal = el.value;
                    el.innerHTML = optionsHtml;
                    if (prevVal) el.value = prevVal;
                }
            });
            
            // Dashboard Guru Statistics
            const statGuruTotal = document.getElementById('stat-guru-total');
            if (statGuruTotal) statGuruTotal.textContent = activeTeachers.length;
            
        } catch (err) {
            console.error("Gagal memuat global opsi guru:", err);
        }
    };

    window.loadGlobalGuruOptions();

    // Initialize
    const isGuruPage = window.location.hash === '#guru';
    if (isGuruPage) {
        loadData();
    }
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#guru') {
            loadData();
        }
    });
});
