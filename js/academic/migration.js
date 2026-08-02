import supabaseClient from '../core/supabase.js';
import { escapeHTML, showToast } from '../core/utils.js';

const db = supabaseClient;
window.db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    // Check elements exist
    const secMigration = document.getElementById('data-migration');
    if (!secMigration) return;

    // UI Elements
    const selectType = document.getElementById('dm-type');
    const btnDownload = document.getElementById('btn-dm-download');
    const inputUpload = document.getElementById('dm-upload');
    const labelUpload = document.getElementById('label-dm-upload');
    const btnImport = document.getElementById('btn-dm-import');
    const btnClear = document.getElementById('btn-dm-clear');
    
    // Preview Elements
    const prevTotal = document.getElementById('prev-total');
    const prevValid = document.getElementById('prev-valid');
    const prevUpdate = document.getElementById('prev-update');
    const prevError = document.getElementById('prev-error');
    const prevDuplicate = document.getElementById('prev-duplicate');
    const prevThead = document.getElementById('prev-thead');
    const prevTbody = document.getElementById('prev-tbody');
    const strategyContainer = document.getElementById('dm-duplicate-strategy-container');
    const selectStrategy = document.getElementById('dm-duplicate-strategy');

    // Progress Elements
    const progressContainer = document.getElementById('dm-progress-container');
    const progressBar = document.getElementById('dm-progress-bar');
    const progressText = document.getElementById('dm-progress-text');
    const progressStats = document.getElementById('dm-progress-stats');
    const importLog = document.getElementById('dm-import-log');

    // State
    let parsedData = [];
    let processedData = []; // With validation info

    // Templates Definition
    const templates = {
        guru: ["NIP", "Nama", "Email", "No HP", "Jenis Kelamin", "Status Guru", "Mata Pelajaran", "Wali Kelas", "Aktif"],
        siswa: ["NIS", "NISN", "Nama", "Jenis Kelamin", "Tanggal Lahir", "Kelas", "Alamat", "Nama Orang Tua", "No HP Orang Tua", "Aktif"],
        mapel: ["Kode", "Nama", "Kelompok", "Guru", "KKM", "Jam", "Aktif"],
        kelas: ["Nama Kelas", "Tingkat", "Wali Kelas", "Ruangan", "Kapasitas", "Aktif"],
        tahun: ["Tahun", "Semester", "Aktif"],
        jadwal: ["Hari", "Jam Mulai", "Jam Selesai", "Kelas", "Guru", "Mapel", "Ruangan", "Status"]
    };

    // Initialize Dashboard Stats
    async function refreshValidationDashboard() {
        try {
            // Load all required data concurrently
            const [rGuru, rSiswa, rMapel, rKelas, rJadwal, rTahun] = await Promise.all([
                db.from('teachers').select('id, nip, nama, aktif, mata_pelajaran_id, is_wali_kelas'),
                db.from('students').select('id, nis, nisn, kelas'),
                db.from('subjects').select('id, kode_mapel, nama_mapel, guru_id'),
                db.from('classes').select('id, nama_kelas, wali_kelas_id'),
                db.from('class_schedules').select('id, teacher_id, class_id, subject_id, room, start_time, end_time, day_of_week'),
                db.from('academic_years').select('id, aktif')
            ]);

            const teachers = rGuru.data || [];
            const students = rSiswa.data || [];
            const subjects = rMapel.data || [];
            const classes = rKelas.data || [];
            const schedules = rJadwal.data || [];
            const years = rTahun.data || [];

            document.getElementById('dm-total-guru').innerText = teachers.length;
            document.getElementById('dm-total-siswa').innerText = students.length;
            document.getElementById('dm-total-mapel').innerText = subjects.length;
            document.getElementById('dm-total-kelas').innerText = classes.length;
            document.getElementById('dm-total-jadwal').innerText = schedules.length;

            const guruNoMapel = teachers.filter(t => !t.mata_pelajaran_id).length;
            // Guru tanpa kelas (wali kelas)
            const guruNoKelas = teachers.filter(t => !classes.find(c => c.wali_kelas_id === t.id)).length;
            const siswaNoKelas = students.filter(s => !s.kelas).length;
            const mapelNoGuru = subjects.filter(s => !s.guru_id).length;
            const kelasNoWali = classes.filter(c => !c.wali_kelas_id).length;
            const tahunAktif = years.filter(y => y.aktif === true).length;

            // Check jadwal bentrok
            let bentrok = 0;
            // Simple overlap check
            for (let i = 0; i < schedules.length; i++) {
                for (let j = i + 1; j < schedules.length; j++) {
                    const s1 = schedules[i];
                    const s2 = schedules[j];
                    if (s1.day_of_week === s2.day_of_week) {
                        const t1s = parseInt(s1.start_time.replace(':', ''));
                        const t1e = parseInt(s1.end_time.replace(':', ''));
                        const t2s = parseInt(s2.start_time.replace(':', ''));
                        const t2e = parseInt(s2.end_time.replace(':', ''));
                        
                        if ((t1s < t2e) && (t1e > t2s)) {
                            if (s1.teacher_id === s2.teacher_id || s1.class_id === s2.class_id || (s1.room && s1.room === s2.room)) {
                                bentrok++;
                            }
                        }
                    }
                }
            }

            document.getElementById('dm-guru-no-mapel').innerText = guruNoMapel;
            document.getElementById('dm-guru-no-kelas').innerText = guruNoKelas;
            document.getElementById('dm-siswa-no-kelas').innerText = siswaNoKelas;
            document.getElementById('dm-mapel-no-guru').innerText = mapelNoGuru;
            document.getElementById('dm-kelas-no-wali').innerText = kelasNoWali;
            document.getElementById('dm-tahun-aktif').innerText = tahunAktif;
            document.getElementById('dm-jadwal-bentrok').innerText = bentrok;

        } catch (err) {
            console.error('Gagal memuat dashboard validasi:', err);
        }
    }

    // Call on load if hash is data-migration
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#data-migration') {
            if (!window.isGuest) refreshValidationDashboard();
        }
    });
    if (window.location.hash === '#data-migration') {
        if (!window.isGuest) refreshValidationDashboard();
    }

    // Dropdown Type Change
    selectType.addEventListener('change', () => {
        const type = selectType.value;
        if (type) {
            btnDownload.disabled = false;
            inputUpload.disabled = false;
            labelUpload.classList.remove('disabled');
        } else {
            btnDownload.disabled = true;
            inputUpload.disabled = true;
            labelUpload.classList.add('disabled');
        }
        clearPreview();
    });

    // 3. Download Template
    btnDownload.addEventListener('click', () => {
        if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        const type = selectType.value;
        const headers = templates[type];
        if (!headers) return;

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, 'Template ' + type.charAt(0).toUpperCase() + type.slice(1));
        XLSX.writeFile(wb, \Template_Import_\.xlsx\);
    });

    // 4. Upload Excel
    inputUpload.addEventListener('change', (e) => {
        if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: '' });
                
                parsedData = rows;
                inputUpload.value = ''; // reset
                validateAndPreview();
            } catch (err) {
                console.error(err);
                showToast('Gagal membaca file Excel', 'error');
            }
        };
        reader.readAsBinaryString(file);
    });

    // Clear Preview
    btnClear.addEventListener('click', clearPreview);
    function clearPreview() {
        parsedData = [];
        processedData = [];
        prevTbody.innerHTML = '<tr><td colspan=\4\ style=\	ext-align: center;\>Pilih jenis data dan upload file Excel untuk melihat preview.</td></tr>';
        prevTotal.innerText = '0';
        prevValid.innerText = '0';
        prevUpdate.innerText = '0';
        prevError.innerText = '0';
        prevDuplicate.innerText = '0';
        strategyContainer.style.display = 'none';
        btnImport.disabled = true;
        btnClear.disabled = true;
    }

    // Fetch memory caches dynamically just in case they are not loaded
    async function getMemoryCache(table) {
        const { data } = await db.from(table).select('*');
        return data || [];
    }

    // 5 & 6. Validation and Preview
    async function validateAndPreview() {
        if (!parsedData.length) {
            showToast('File Excel kosong', 'warning');
            return;
        }

        const type = selectType.value;
        const headers = templates[type];
        
        // Build table header
        let thHtml = '<th>No</th><th>Status</th><th>Keterangan</th>';
        headers.forEach(h => {
            thHtml += \<th>\</th>\;
        });
        prevThead.innerHTML = thHtml;

        prevTbody.innerHTML = '<tr><td colspan=\4\ style=\	ext-align: center;\>Memvalidasi data...</td></tr>';
        
        let validCount = 0, errorCount = 0, dupCount = 0, updateCount = 0;
        processedData = [];

        // Load necessary master data for FK matching
        const [masterGuru, masterSiswa, masterMapel, masterKelas, masterTahun] = await Promise.all([
            getMemoryCache('teachers'),
            getMemoryCache('students'),
            getMemoryCache('subjects'),
            getMemoryCache('classes'),
            getMemoryCache('academic_years')
        ]);

        parsedData.forEach((row, index) => {
            let status = 'valid'; // valid, error, duplicate
            let messages = [];
            let payload = {};

            if (type === 'guru') {
                const nip = String(row['NIP'] || '').trim();
                const nama = String(row['Nama'] || '').trim();
                const email = String(row['Email'] || '').trim();
                const mapel = String(row['Mata Pelajaran'] || '').trim();
                
                if (!nip) { status = 'error'; messages.push('NIP wajib diisi'); }
                if (!nama) { status = 'error'; messages.push('Nama wajib diisi'); }
                
                // FK Mapel
                let mapelId = null;
                if (mapel) {
                    const m = masterMapel.find(x => x.nama_mapel.toLowerCase() === mapel.toLowerCase());
                    if (m) mapelId = m.id;
                    else { status = 'error'; messages.push('Mapel tidak ditemukan di Master'); }
                }

                // Check Duplicate
                const existing = masterGuru.find(x => x.nip === nip);
                if (existing) {
                    status = 'duplicate';
                    messages.push('NIP sudah terdaftar');
                    payload.id = existing.id;
                }

                payload = { ...payload, nip, nama, email, no_hp: row['No HP'], jenis_kelamin: row['Jenis Kelamin'], status_guru: row['Status Guru'], mata_pelajaran_id: mapelId, aktif: String(row['Aktif'] || '').toLowerCase() !== 'tidak' };
            }
            else if (type === 'siswa') {
                const nis = String(row['NIS'] || '').trim();
                const nisn = String(row['NISN'] || '').trim();
                const nama = String(row['Nama'] || '').trim();
                const kelasName = String(row['Kelas'] || '').trim();

                if (!nis) { status = 'error'; messages.push('NIS wajib'); }
                if (!nama) { status = 'error'; messages.push('Nama wajib'); }

                // FK Kelas - using nama_kelas
                if (kelasName) {
                    const c = masterKelas.find(x => x.nama_kelas.toLowerCase() === kelasName.toLowerCase());
                    if (!c) { status = 'error'; messages.push(\Kelas '\' tidak ditemukan\); }
                }

                const existing = masterSiswa.find(x => x.nis === nis);
                if (existing) {
                    status = 'duplicate';
                    messages.push('NIS sudah terdaftar');
                    payload.id = existing.id;
                }

                payload = { ...payload, nis, nisn, nama, jenis_kelamin: row['Jenis Kelamin'], kelas: kelasName, alamat: row['Alamat'], no_hp: row['No HP'], nama_orang_tua: row['Nama Orang Tua'], aktif: String(row['Aktif'] || '').toLowerCase() !== 'tidak' };
            }
            else if (type === 'mapel') {
                const kode = String(row['Kode'] || '').trim();
                const nama = String(row['Nama'] || '').trim();
                const guruName = String(row['Guru'] || '').trim();
                
                if (!kode) { status = 'error'; messages.push('Kode wajib'); }
                if (!nama) { status = 'error'; messages.push('Nama wajib'); }

                let guruId = null;
                if (guruName) {
                    const g = masterGuru.find(x => x.nama.toLowerCase() === guruName.toLowerCase());
                    if (g) guruId = g.id;
                    else { status = 'error'; messages.push(\Guru '\' tidak ditemukan\); }
                }

                const existing = masterMapel.find(x => x.kode_mapel === kode);
                if (existing) {
                    status = 'duplicate';
                    messages.push('Kode Mapel sudah ada');
                    payload.id = existing.id;
                }

                payload = { ...payload, kode_mapel: kode, nama_mapel: nama, kelompok: row['Kelompok'], guru_id: guruId, kkm: parseInt(row['KKM']) || 75, jam_pelajaran: parseInt(row['Jam']) || 2, aktif: String(row['Aktif'] || '').toLowerCase() !== 'tidak' };
            }
            else if (type === 'kelas') {
                const namaK = String(row['Nama Kelas'] || '').trim();
                const waliName = String(row['Wali Kelas'] || '').trim();
                
                if (!namaK) { status = 'error'; messages.push('Nama Kelas wajib'); }
                
                let waliId = null;
                if (waliName) {
                    const g = masterGuru.find(x => x.nama.toLowerCase() === waliName.toLowerCase());
                    if (g) waliId = g.id;
                    else { status = 'error'; messages.push(\Guru '\' tidak ditemukan\); }
                }

                const existing = masterKelas.find(x => x.nama_kelas.toLowerCase() === namaK.toLowerCase());
                if (existing) {
                    status = 'duplicate';
                    messages.push('Kelas sudah ada');
                    payload.id = existing.id;
                }

                payload = { ...payload, nama_kelas: namaK, tingkat: parseInt(row['Tingkat']) || 7, wali_kelas_id: waliId, ruangan: row['Ruangan'], kapasitas_siswa: parseInt(row['Kapasitas']) || 32, aktif: String(row['Aktif'] || '').toLowerCase() !== 'tidak' };
            }
            else if (type === 'tahun') {
                const tahun = String(row['Tahun'] || '').trim();
                const semester = String(row['Semester'] || '').trim();
                if (!tahun || !semester) { status = 'error'; messages.push('Tahun dan Semester wajib'); }
                
                const existing = masterTahun.find(x => x.tahun_ajaran === tahun && x.semester === semester);
                if (existing) {
                    status = 'duplicate';
                    messages.push('Tahun & Semester sudah ada');
                    payload.id = existing.id;
                }
                
                payload = { ...payload, tahun_ajaran: tahun, semester: semester, aktif: String(row['Aktif'] || '').toLowerCase() === 'ya' };
            }
            else if (type === 'jadwal') {
                const hari = String(row['Hari'] || '').trim();
                const jamM = String(row['Jam Mulai'] || '').trim();
                const jamS = String(row['Jam Selesai'] || '').trim();
                const kelasName = String(row['Kelas'] || '').trim();
                const guruName = String(row['Guru'] || '').trim();
                const mapelName = String(row['Mapel'] || '').trim();
                
                if (!hari || !jamM || !jamS) { status = 'error'; messages.push('Waktu wajib lengkap'); }
                
                let cId=null, gId=null, mId=null;
                
                const c = masterKelas.find(x => x.nama_kelas.toLowerCase() === kelasName.toLowerCase());
                if (c) cId = c.id; else { status = 'error'; messages.push(\Kelas '\' tidak ditemukan\); }
                
                const g = masterGuru.find(x => x.nama.toLowerCase() === guruName.toLowerCase());
                if (g) gId = g.id; else { status = 'error'; messages.push(\Guru '\' tidak ditemukan\); }
                
                const m = masterMapel.find(x => x.nama_mapel.toLowerCase() === mapelName.toLowerCase());
                if (m) mId = m.id; else { status = 'error'; messages.push(\Mapel '\' tidak ditemukan\); }
                
                payload = { day_of_week: hari, start_time: jamM, end_time: jamS, class_id: cId, teacher_id: gId, subject_id: mId, room: row['Ruangan'], active: row['Status'] || 'Aktif' };
            }

            if (status === 'valid') validCount++;
            if (status === 'error') errorCount++;
            if (status === 'duplicate') dupCount++;
            
            processedData.push({ row, status, messages, payload });
        });

        // Render Table
        prevTbody.innerHTML = '';
        processedData.forEach((item, index) => {
            const tr = document.createElement('tr');
            
            let badge = '';
            if (item.status === 'valid') badge = \<span style="color:white;background:var(--success);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Valid</span>\;
            else if (item.status === 'error') badge = \<span style="color:white;background:var(--danger);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Error</span>\;
            else if (item.status === 'duplicate') badge = \<span style="color:white;background:var(--text-muted);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Duplicate</span>\;
            
            let msgHtml = item.messages.map(m => \<div>\</div>\).join('');
            if (!msgHtml) msgHtml = '-';

            let dataHtml = '';
            headers.forEach(h => {
                dataHtml += \<td>\</td>\;
            });

            tr.innerHTML = \
                <td>\</td>
                <td>\</td>
                <td style="color:var(--danger);font-size:0.85rem;">\</td>
                \
            \;
            prevTbody.appendChild(tr);
        });

        prevTotal.innerText = processedData.length;
        prevValid.innerText = validCount;
        prevError.innerText = errorCount;
        prevDuplicate.innerText = dupCount;
        prevUpdate.innerText = 0;

        btnImport.disabled = errorCount > 0 && processedData.length === errorCount; // Disabled if all errors
        btnClear.disabled = false;
        
        if (dupCount > 0) {
            strategyContainer.style.display = 'block';
        } else {
            strategyContainer.style.display = 'none';
        }
    }

    // 8 & 9. Import Data (Batch Processing)
    btnImport.addEventListener('click', async () => {
        if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        
        const type = selectType.value;
        const strategy = selectStrategy.value; // skip, update, cancel

        // Check if strategy is cancel and duplicates exist
        const hasDups = processedData.some(d => d.status === 'duplicate');
        if (hasDups && strategy === 'cancel') {
            return showToast('Import dibatalkan karena terdapat duplikasi data', 'warning');
        }

        // Filter valid payloads
        const toImport = [];
        let skipped = 0;
        let updateC = 0;

        processedData.forEach(item => {
            if (item.status === 'valid') {
                toImport.push(item.payload);
            } else if (item.status === 'duplicate') {
                if (strategy === 'update') {
                    toImport.push(item.payload); // ID is already attached
                    updateC++;
                } else {
                    skipped++;
                }
            }
        });

        if (toImport.length === 0) {
            return showToast('Tidak ada data valid yang dapat diimpor', 'warning');
        }

        if (!confirm(\Yakin ingin mengimpor \ baris data?\)) return;

        // UI Reset
        btnImport.disabled = true;
        btnClear.disabled = true;
        progressContainer.style.display = 'block';
        importLog.style.display = 'block';
        importLog.innerHTML = \<div>[\] Memulai import \ baris ke tabel \...</div>\;
        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        progressStats.innerText = \  / \\;

        // DB table mapping
        const tableMap = {
            guru: 'teachers',
            siswa: 'students',
            mapel: 'subjects',
            kelas: 'classes',
            tahun: 'academic_years',
            jadwal: 'class_schedules'
        };
        const tableName = tableMap[type];

        // 9. Chunking
        const chunkSize = 200;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < toImport.length; i += chunkSize) {
            const chunk = toImport.slice(i, i + chunkSize);
            try {
                // Upsert handles both insert and update if primary key (id) is provided
                const { error } = await db.from(tableName).upsert(chunk);
                if (error) throw error;
                
                successCount += chunk.length;
            } catch (err) {
                console.error('Batch error:', err);
                failCount += chunk.length;
                importLog.innerHTML += \<div style="color:var(--danger);">[ERROR] Gagal mengimpor batch \ - \.</div>\;
            }

            // Update Progress
            const progress = Math.round(((i + chunk.length) / toImport.length) * 100);
            progressBar.style.width = \\%\;
            progressText.innerText = \\%\;
            progressStats.innerText = \\ / \\;
        }

        // 11. Final Log
        importLog.innerHTML += \
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
                <strong>Hasil Akhir Import \:</strong><br>
                Berhasil: \<br>
                Gagal: \<br>
                Lewati (Duplicate Skip): \<br>
                Update (Upsert): \
            </div>
        \;

        showToast('Proses impor selesai', successCount > 0 ? 'success' : 'error');
        btnImport.disabled = false;
        btnClear.disabled = false;

        // Refresh Data
        refreshValidationDashboard();
    });

});
