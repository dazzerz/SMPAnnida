import { authState } from './authState.js';
import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tbodySiswa = document.getElementById('tbody-siswa');
    const btnAddSiswa = document.getElementById('btn-add-siswa');
    const modalSiswa = document.getElementById('modal-siswa');
    const btnCloseModal = document.getElementById('btn-close-modal-siswa');
    const formSiswa = document.getElementById('form-siswa');
    const modalTitle = document.getElementById('modal-siswa-title');
    
    // Filters
    const filterStatus = document.getElementById('filter-status-siswa');
    const filterKelas = document.getElementById('filter-kelas-siswa');
    const filterSearch = document.getElementById('filter-search-siswa');
    
    // Pagination
    const infoSiswa = document.getElementById('siswa-info');
    const paginationSiswa = document.getElementById('siswa-pagination');
    
    let currentData = [];
    let classesData = [];
    let currentPage = 1;
    let totalItems = 0;
    const itemsPerPage = 20;

    // Guest Mode Protection
    if (authState.isGuest && btnAddSiswa) {
        btnAddSiswa.style.display = 'none'; 
    }

    // Build Server-Side Query for Students with Filters
    function buildStudentsQuery(isCountOnly = false) {
        let query = db.from('students');

        if (isCountOnly) {
            query = query.select('id', { count: 'exact', head: true });
        } else {
            query = query.select('*', { count: 'exact' });
        }

        const sStat = filterStatus ? filterStatus.value.trim().toLowerCase() : '';
        const sKelas = filterKelas ? filterKelas.value.trim() : '';
        const sSearch = filterSearch ? filterSearch.value.trim() : '';

        // Server-side filter: status aktif
        if (sStat === 'aktif') {
            query = query.eq('aktif', true);
        } else if (sStat === 'nonaktif') {
            query = query.eq('aktif', false);
        }

        // Server-side filter: kelas
        if (sKelas) {
            query = query.eq('kelas', sKelas);
        }

        // Server-side filter: search with ilike
        if (sSearch) {
            // Support searching by nama_lengkap, nis, or email via or clause
            query = query.or(`nama_lengkap.ilike.%${sSearch}%,nis.ilike.%${sSearch}%,email.ilike.%${sSearch}%`);
        }

        return query;
    }

    // Load Data using Server-Side Pagination
    async function loadData() {
        if (!tbodySiswa) return;
        tbodySiswa.innerHTML = '<tr><td colspan="7" style="text-align: center;">Memuat data siswa...</td></tr>';
        try {
            // Load Classes for dropdowns if not loaded yet
            if (classesData.length === 0) {
                const { data: cData } = await db.from('classes').select('id, nama_kelas').order('nama_kelas');
                classesData = cData || [];
                updateKelasDropdowns();
            }

            const from = (currentPage - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            const query = buildStudentsQuery(false)
                .order('nama_lengkap', { ascending: true })
                .range(from, to);

            const { data, count, error } = await query;
            if (error) throw error;

            currentData = data || [];
            totalItems = count !== null && count !== undefined ? count : currentData.length;

            renderTable();
        } catch (err) {
            console.error("Error loading students:", err);
            tbodySiswa.innerHTML = '<tr><td colspan="7" style="color:var(--danger); text-align:center;">Gagal memuat data.</td></tr>';
            if (infoSiswa) infoSiswa.textContent = 'Gagal memuat data';
            if (paginationSiswa) paginationSiswa.innerHTML = '';
        }
    }

    function updateKelasDropdowns() {
        const options = '<option value="">Semua Kelas</option>' + 
            classesData.map(c => `<option value="${escapeHTML(c.nama_kelas)}">${escapeHTML(c.nama_kelas)}</option>`).join('');
        if(filterKelas) filterKelas.innerHTML = options;

        const formOptions = '<option value="">-- Belum ada kelas --</option>' + 
            classesData.map(c => `<option value="${escapeHTML(c.nama_kelas)}">${escapeHTML(c.nama_kelas)}</option>`).join('');
        const formKelasSelect = document.getElementById('siswa-kelas');
        if(formKelasSelect) formKelasSelect.innerHTML = formOptions;
    }

    function getStudentEmailAndPass(s) {
        const cleanName = (s.nama_lengkap || '')
            .toLowerCase()
            .replace(/['`’\-\.\,\_]/g, '')
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .replace(/\s+/g, ' ');
        const parts = cleanName.split(' ').filter(Boolean);
        const baseUsername = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : (parts[0] || 'siswa');
        const email = s.email || `${baseUsername}@smpannida.sch.id`;
        const defaultPass = 'abc123';
        return { email, defaultPass };
    }

    // Render Table from Server-Paginated Data
    function renderTable() {
        if (!tbodySiswa) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            loadData();
            return;
        }

        const startIdx = (currentPage - 1) * itemsPerPage;
        const endIdx = startIdx + currentData.length;

        tbodySiswa.innerHTML = '';
        if (currentData.length === 0) {
            tbodySiswa.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
            if (infoSiswa) infoSiswa.textContent = 'Menampilkan 0 dari 0 data';
            if (paginationSiswa) paginationSiswa.innerHTML = '';
            return;
        }

        currentData.forEach((s, index) => {
            const isAktif = s.aktif !== false;
            const statusBadge = isAktif ? 
                '<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px;">Aktif</span>' : 
                '<span style="padding: 4px 8px; background: rgba(220,53,69,0.1); color: var(--danger); border-radius: 4px; font-size: 12px;">Nonaktif</span>';
            
            const jk = s.jenis_kelamin === 'L' ? 'L' : (s.jenis_kelamin === 'P' ? 'P' : '-');
            const { email, defaultPass } = getStudentEmailAndPass(s);

            let waBtn = '';
            if (s.no_hp_orang_tua) {
                const cleanPhone = s.no_hp_orang_tua.replace(/[^0-9]/g, '');
                const waMsg = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nAyah/Bunda dari ananda *${s.nama_lengkap}*,\n\nBerikut adalah akun resmi Portal Siswa SMP Annida ananda:\n🌐 Login: https://smpannida.sch.id/login.html\n📧 Email: ${email}\n🔑 Password Awal: ${defaultPass}\n\nMohon ananda segera login dan mengganti kata sandi pada saat masuk perdana.\n\nJazakumullah Khairan,\n*SMP Annida*`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
                waBtn = `<a href="${waUrl}" target="_blank" class="btn btn-outline" style="padding: 4px 8px; font-size: 11px; color: #10b981; border-color: #10b981; text-decoration: none;" title="Kirim Kredensial via WA">💬 WA</a>`;
            }
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${startIdx + index + 1}</td>
                <td>${escapeHTML(s.nis || '-')}</td>
                <td>
                    <strong>${escapeHTML(s.nama_lengkap || '-')}</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${escapeHTML(email)}</div>
                </td>
                <td>${jk}</td>
                <td>${escapeHTML(s.kelas || '-')}</td>
                <td>${statusBadge}</td>
                <td style="text-align: right; white-space: nowrap; display: flex; gap: 4px; justify-content: flex-end;">
                    ${waBtn}
                    <button class="btn-edit-siswa btn btn-outline" data-id="${s.id}" style="padding: 4px 8px; font-size: 12px;">Edit</button>
                    <button class="btn-del-siswa btn btn-outline" data-id="${s.id}" style="padding: 4px 8px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
                </td>
            `;
            tbodySiswa.appendChild(tr);
        });

        // Update Pagination UI
        if (infoSiswa) {
            infoSiswa.textContent = `Menampilkan ${startIdx + 1} - ${endIdx} dari ${totalItems} data`;
        }
        renderPaginationControls(totalPages);

        // Bind Edit Buttons
        document.querySelectorAll('.btn-edit-siswa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                const student = currentData.find(st => String(st.id) === String(id));
                if (student) openModal(student);
            });
        });

        // Bind Delete Buttons
        document.querySelectorAll('.btn-del-siswa').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const id = e.target.getAttribute('data-id');
                if (confirm('Yakin ingin menghapus siswa ini?')) {
                    try {
                        const { error } = await db.from('students').delete().eq('id', id);
                        if (error) throw error;
                        showToast('Siswa berhasil dihapus', 'success');
                        loadData();
                    } catch (err) {
                        console.error(err);
                        showToast('Gagal menghapus siswa', 'error');
                    }
                }
            });
        });
    }

    function renderPaginationControls(totalPages) {
        if (!paginationSiswa) return;
        paginationSiswa.innerHTML = '';
        if (totalPages <= 1) return;

        const btnPrev = document.createElement('button');
        btnPrev.className = 'btn btn-outline';
        btnPrev.style.padding = '2px 8px';
        btnPrev.textContent = '«';
        btnPrev.disabled = currentPage === 1;
        btnPrev.onclick = () => { 
            if (currentPage > 1) { 
                currentPage--; 
                loadData(); 
            } 
        };
        paginationSiswa.appendChild(btnPrev);

        // Show window of page buttons around currentPage
        for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
            const btn = document.createElement('button');
            btn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-outline';
            btn.style.padding = '2px 8px';
            btn.textContent = i;
            btn.onclick = () => { 
                if (currentPage !== i) {
                    currentPage = i; 
                    loadData(); 
                }
            };
            paginationSiswa.appendChild(btn);
        }

        const btnNext = document.createElement('button');
        btnNext.className = 'btn btn-outline';
        btnNext.style.padding = '2px 8px';
        btnNext.textContent = '»';
        btnNext.disabled = currentPage === totalPages;
        btnNext.onclick = () => { 
            if (currentPage < totalPages) { 
                currentPage++; 
                loadData(); 
            } 
        };
        paginationSiswa.appendChild(btnNext);
    }

    // Modal Operations
    function openModal(student = null) {
        formSiswa.reset();
        modalSiswa.style.display = 'flex'; modalSiswa.classList.remove('hidden'); 
        if (student) {
            modalTitle.textContent = 'Edit Siswa';
            document.getElementById('siswa-id').value = student.id;
            document.getElementById('siswa-nis').value = student.nis || '';
            document.getElementById('siswa-nisn').value = student.nisn || '';
            document.getElementById('siswa-nama').value = student.nama_lengkap || '';
            document.getElementById('siswa-jk').value = student.jenis_kelamin || '';
            document.getElementById('siswa-kelas').value = student.kelas || '';
            document.getElementById('siswa-ortu').value = student.nama_orang_tua || '';
            document.getElementById('siswa-hp').value = student.no_hp_orang_tua || '';
            document.getElementById('siswa-alamat').value = student.alamat || '';
            document.getElementById('siswa-aktif').checked = student.aktif !== false;
        } else {
            modalTitle.textContent = 'Tambah Siswa';
            document.getElementById('siswa-id').value = '';
            document.getElementById('siswa-aktif').checked = true;
        }
    }

    if (btnAddSiswa) {
        btnAddSiswa.addEventListener('click', () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            openModal();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', () => {
            modalSiswa.style.display = 'none'; modalSiswa.classList.add('hidden'); 
        });
    }

    // Form Submit (Upsert)
    if (formSiswa) {
        formSiswa.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            
            const btnSave = document.getElementById('btn-save-siswa');
            const originalText = btnSave.textContent;
            btnSave.disabled = true;
            btnSave.textContent = 'Menyimpan...';

            const kelasVal = document.getElementById('siswa-kelas').value;
            const cObj = classesData.find(c => c.nama_kelas === kelasVal);
            
            let nisnVal = document.getElementById('siswa-nisn').value.trim();
            if (nisnVal === '') nisnVal = null; // Important: null for unique constraints

            let nisVal = document.getElementById('siswa-nis').value.trim();
            if (nisVal === '') nisVal = null; // Mencegah error Unique Constraint jika kosong

            let jkVal = document.getElementById('siswa-jk').value;
            if (jkVal !== 'L' && jkVal !== 'P') jkVal = null; // Mencegah error Check Constraint

            const payload = {
                nis: nisVal,
                nisn: nisnVal,
                nama_lengkap: document.getElementById('siswa-nama').value.trim(),
                jenis_kelamin: jkVal,
                kelas: kelasVal || null,
                kelas_id: cObj ? cObj.id : null,
                nama_orang_tua: document.getElementById('siswa-ortu').value.trim() || null,
                no_hp_orang_tua: document.getElementById('siswa-hp').value.trim() || null,
                alamat: document.getElementById('siswa-alamat').value.trim() || null,
                aktif: document.getElementById('siswa-aktif').checked
            };

            const id = document.getElementById('siswa-id').value;

            try {
                if (id) {
                    const { error } = await db.from('students').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Data siswa berhasil diperbarui', 'success');
                } else {
                    const { error } = await db.from('students').insert([payload]);
                    if (error) throw error;
                    showToast('Siswa berhasil ditambahkan', 'success');
                }
                modalSiswa.style.display = 'none'; modalSiswa.classList.add('hidden'); 
                loadData();
            } catch (err) {
                console.error("Error saving student:", err);
                if (err.message && err.message.includes('unique')) {
                    showToast('Gagal: NIS atau NISN sudah terdaftar.', 'error');
                } else {
                    showToast('Gagal menyimpan data siswa', 'error');
                }
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = originalText;
            }
        });
    }

    // Helper to fetch filtered dataset for bulk operations (Excel / PDF)
    async function fetchFilteredStudentsForBulk() {
        const query = buildStudentsQuery(false)
            .order('nama_lengkap', { ascending: true });
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    // Event Listeners for Filters
    let searchDebounceTimer = null;

    [filterStatus, filterKelas].forEach(el => {
        if (el) el.addEventListener('change', () => { 
            currentPage = 1; 
            loadData(); 
        });
    });

    if (filterSearch) {
        filterSearch.addEventListener('input', () => { 
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                currentPage = 1;
                loadData();
            }, 300);
        });
    }

    // ── Export Akun Kredensial Siswa to Excel ──────────────────────────────
    const btnExportKredensial = document.getElementById('btn-export-kredensial-siswa');
    if (btnExportKredensial) {
        btnExportKredensial.addEventListener('click', async () => {
            try {
                btnExportKredensial.disabled = true;
                btnExportKredensial.textContent = '⏳ Mengunduh...';

                const targetStudents = await fetchFilteredStudentsForBulk();
                if (targetStudents.length === 0) {
                    showToast('Tidak ada data siswa untuk diekspor', 'warning');
                    return;
                }

                const XLSX = await import('xlsx');
                
                const exportRows = targetStudents.map((s, index) => {
                    const { email, defaultPass } = getStudentEmailAndPass(s);
                    return {
                        'No': index + 1,
                        'NIS': s.nis || '-',
                        'NISN': s.nisn || '-',
                        'Nama Lengkap': s.nama_lengkap || '-',
                        'L/P': s.jenis_kelamin || '-',
                        'Kelas': s.kelas || '-',
                        'Email Login Portal': email,
                        'Password Default': defaultPass,
                        'Nama Orang Tua': s.nama_orang_tua || '-',
                        'No HP Orang Tua': s.no_hp_orang_tua || '-',
                        'Status': s.aktif !== false ? 'Aktif' : 'Nonaktif'
                    };
                });

                const ws = XLSX.utils.json_to_sheet(exportRows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Kredensial Siswa');

                const fileName = `Rekap_Kredensial_Akun_Siswa_SMP_Annida_${new Date().toISOString().split('T')[0]}.xlsx`;
                XLSX.writeFile(wb, fileName);
                showToast('Rekap kredensial siswa berhasil diunduh', 'success');
            } catch (err) {
                console.error("Export kredensial error:", err);
                showToast('Gagal mengekspor data: ' + err.message, 'error');
            } finally {
                btnExportKredensial.disabled = false;
                btnExportKredensial.textContent = '📥 Ekspor Akun (Excel)';
            }
        });
    }

    // ── Cetak Kartu Akun / Slip Login Siswa PDF ────────────────────────────
    const btnCetakKartu = document.getElementById('btn-cetak-kartu-siswa');
    if (btnCetakKartu) {
        btnCetakKartu.addEventListener('click', async () => {
            try {
                btnCetakKartu.disabled = true;
                btnCetakKartu.textContent = '⏳ Membuat PDF...';

                const targetStudents = await fetchFilteredStudentsForBulk();
                if (targetStudents.length === 0) {
                    showToast('Tidak ada data siswa untuk dicetak', 'warning');
                    return;
                }

                const { jsPDF } = await import('jspdf');
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Render 8 cards per page (2 columns x 4 rows)
                const cardWidth = 85;
                const cardHeight = 55;
                const marginX = 15;
                const marginY = 15;
                const gapX = 10;
                const gapY = 12;

                let col = 0;
                let row = 0;
                let cardsOnPage = 0;

                targetStudents.forEach((s) => {
                    if (cardsOnPage === 8) {
                        doc.addPage();
                        col = 0;
                        row = 0;
                        cardsOnPage = 0;
                    }

                    const x = marginX + (col * (cardWidth + gapX));
                    const y = marginY + (row * (cardHeight + gapY));

                    // Card Background Border
                    doc.setDrawColor(16, 185, 129);
                    doc.setFillColor(248, 250, 252);
                    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

                    // Card Header Bar
                    doc.setFillColor(16, 185, 129);
                    doc.roundedRect(x, y, cardWidth, 11, 3, 3, 'F');
                    doc.rect(x, y + 6, cardWidth, 5, 'F');

                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text('SMP ANNIDA - KARTU PORTAL SISWA', x + 5, y + 7);

                    const { email, defaultPass } = getStudentEmailAndPass(s);

                    // Student Information
                    doc.setTextColor(30, 41, 59);
                    doc.setFontSize(8.5);
                    doc.setFont('helvetica', 'bold');
                    doc.text((s.nama_lengkap || '').substring(0, 30), x + 5, y + 18);

                    doc.setFontSize(7.5);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(71, 85, 105);
                    doc.text(`Kelas: ${s.kelas || '-'}   |   NIS: ${s.nis || '-'}`, x + 5, y + 23);

                    // Divider line
                    doc.setDrawColor(226, 232, 240);
                    doc.line(x + 5, y + 26, x + cardWidth - 5, y + 26);

                    // Login Credentials Box
                    doc.setFillColor(241, 245, 249);
                    doc.roundedRect(x + 5, y + 28, cardWidth - 10, 16, 2, 2, 'F');

                    doc.setTextColor(100, 116, 139);
                    doc.setFontSize(6.5);
                    doc.text('EMAIL AKUN:', x + 7, y + 33);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(15, 23, 42);
                    doc.setFontSize(7.5);
                    doc.text(email, x + 7, y + 37);

                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100, 116, 139);
                    doc.setFontSize(6.5);
                    doc.text('PASSWORD AWAL:', x + 7, y + 41);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(5, 150, 105);
                    doc.setFontSize(7.5);
                    doc.text(defaultPass, x + 35, y + 41);

                    // Footer URL
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(148, 163, 184);
                    doc.setFontSize(6);
                    doc.text('Login di: https://smpannida.sch.id/login.html', x + 5, y + 51);

                    col++;
                    if (col >= 2) {
                        col = 0;
                        row++;
                    }
                    cardsOnPage++;
                });

                doc.save(`Kartu_Login_Siswa_SMP_Annida_${new Date().toISOString().split('T')[0]}.pdf`);
                showToast('Kartu login siswa siap cetak berhasil dibuat (PDF)', 'success');
            } catch (err) {
                console.error("Print cards error:", err);
                showToast('Gagal membuat file PDF: ' + err.message, 'error');
            } finally {
                btnCetakKartu.disabled = false;
                btnCetakKartu.textContent = '🖨️ Cetak Kartu Akun (PDF)';
            }
        });
    }

    // Initial load when section is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'data-siswa' && mutation.target.style.display !== 'none') {
                if (currentData.length === 0) loadData();
            }
        });
    });
    
    const siswaSection = document.getElementById('data-siswa');
    if (siswaSection) {
        observer.observe(siswaSection, { attributes: true, attributeFilter: ['style'] });
        if (siswaSection.style.display !== 'none') loadData();
    }
});

