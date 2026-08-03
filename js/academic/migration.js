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

    // Initialize Dashboard Stats & Integrity Check
    async function runIntegrityCheck() {
        try {
            document.getElementById('db-readiness-status').innerHTML = '🔄 Mengaudit Database...';
            document.getElementById('db-readiness-status').style.color = 'var(--text-muted)';
            
            // Load all required data concurrently
            const [rGuru, rSiswa, rMapel, rKelas, rJadwal, rTahun, rAtt, rGrade, rJourn] = await Promise.all([
                db.from('teachers').select('id, nip, nama, aktif, mata_pelajaran_id, is_wali_kelas'),
                db.from('students').select('id, nis, nisn, kelas'),
                db.from('subjects').select('id, kode_mapel, nama_mapel, guru_id'),
                db.from('classes').select('id, nama_kelas, wali_kelas_id'),
                db.from('class_schedules').select('id, teacher_id, class_id, subject_id, room, start_time, end_time, day_of_week'),
                db.from('academic_years').select('id, aktif'),
                db.from('attendance_students').select('id, student_id').limit(10), // just to check if exists for orphan logic
                db.from('grades').select('id, student_id').limit(10),
                db.from('teacher_journals').select('id, teacher_id').limit(10)
            ]);

            const teachers = rGuru.data || [];
            const students = rSiswa.data || [];
            const subjects = rMapel.data || [];
            const classes = rKelas.data || [];
            const schedules = rJadwal.data || [];
            const years = rTahun.data || [];

            // Update Wizard Controller UI
            const setOpt = (id, enabled) => {
                const opt = document.getElementById(id);
                if (opt) {
                    opt.disabled = !enabled;
                    if (enabled) opt.innerText = opt.innerText.replace(' (Locked)', '') + ' (Ready)';
                    else if (!opt.innerText.includes('Locked')) opt.innerText = opt.innerText.replace(' (Ready)', '') + ' (Locked)';
                }
            };
            
            const hasTahun = years.length > 0;
            const hasGuru = teachers.length > 0;
            const hasMapel = subjects.length > 0;
            const hasKelas = classes.length > 0;
            const hasSiswa = students.length > 0;
            const hasJadwal = schedules.length > 0;

            setOpt('opt-tahun', true);
            setOpt('opt-guru', hasTahun);
            setOpt('opt-mapel', hasGuru);
            setOpt('opt-kelas', hasGuru);
            setOpt('opt-siswa', hasKelas);
            setOpt('opt-jadwal', hasGuru && hasMapel && hasKelas && hasTahun);

            // Update Health Checker Table
            if(document.getElementById('hc-teachers')) {
                document.getElementById('hc-teachers').innerText = teachers.length;
                document.getElementById('hc-students').innerText = students.length;
                document.getElementById('hc-subjects').innerText = subjects.length;
                document.getElementById('hc-classes').innerText = classes.length;
                document.getElementById('hc-schedules').innerText = schedules.length;
                document.getElementById('hc-years').innerText = years.length;
            }

            let errors = 0;
            let warnings = 0;
            let orphans = 0;
            let duplicates = 0;

            const guruNoMapel = teachers.filter(t => !t.mata_pelajaran_id).length;
            const guruNoKelas = teachers.filter(t => !classes.find(c => c.wali_kelas_id === t.id)).length;
            const siswaNoKelas = students.filter(s => !s.kelas).length;
            const mapelNoGuru = subjects.filter(s => !s.guru_id).length;
            const kelasNoWali = classes.filter(c => !c.wali_kelas_id).length;
            
            warnings += mapelNoGuru + kelasNoWali;
            errors += guruNoMapel + guruNoKelas + siswaNoKelas;

            // Check jadwal bentrok
            let bentrok = 0;
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
            errors += bentrok;

            // Update Banner
            document.getElementById('rb-master-count').innerText = teachers.length + students.length + subjects.length + classes.length;
            document.getElementById('rb-error-count').innerText = errors;
            document.getElementById('rb-orphan-count').innerText = orphans;
            document.getElementById('rb-duplicate-count').innerText = duplicates;

            const banner = document.getElementById('db-readiness-banner');
            const status = document.getElementById('db-readiness-status');

            if (errors === 0 && warnings === 0 && hasTahun && hasGuru && hasMapel && hasKelas && hasSiswa && hasJadwal) {
                banner.style.borderLeft = '5px solid var(--success)';
                status.innerHTML = '🟢 DATABASE STATUS: PRODUCTION READY';
                status.style.color = 'var(--success)';
            } else if (hasGuru || hasSiswa) {
                banner.style.borderLeft = '5px solid var(--warning)';
                status.innerHTML = '🟡 DATABASE STATUS: PARTIALLY READY';
                status.style.color = 'var(--warning)';
            } else {
                banner.style.borderLeft = '5px solid var(--danger)';
                status.innerHTML = '🔴 DATABASE STATUS: NOT READY';
                status.style.color = 'var(--danger)';
            }

        } catch (err) {
            console.error('Gagal menjalankan Integrity Check:', err);
        }
    }

    // Call on load if hash is data-migration
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#data-migration') {
            if (!window.isGuest) runIntegrityCheck();
        }
    });
    if (window.location.hash === '#data-migration') {
        if (!window.isGuest) runIntegrityCheck();
    }
    
    // Bind integrity button
    const btnIntegrity = document.getElementById('btn-run-integrity');
    if (btnIntegrity) {
        btnIntegrity.addEventListener('click', runIntegrityCheck);
    }

    // Dropdown Type Change
    selectType.addEventListener('change', () => {
        const type = selectType.value;
        if (type) {
            btnDownload.disabled = false;
            inputUpload.disabled = false;
            labelUpload.classList.remove('disabled');
            document.getElementById('panel-import-action').style.display = 'block';
        } else {
            btnDownload.disabled = true;
            inputUpload.disabled = true;
            labelUpload.classList.add('disabled');
            document.getElementById('panel-import-action').style.display = 'none';
        }
        clearPreview();
    });

    // 3. Download Template
    btnDownload.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("CLICK DOWNLOAD TEMPLATE");
        
        if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        
        const type = selectType.value;
        console.log("Type selected:", type);
        
        const headers = templates[type];
        console.log("Headers:", headers);
        
        if (!headers) {
            console.error("Headers tidak ditemukan");
            return;
        }

        try {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers]);
            XLSX.utils.book_append_sheet(wb, ws, 'Template ' + type.charAt(0).toUpperCase() + type.slice(1));
            XLSX.writeFile(wb, `Template_Import_${type}.xlsx`);
            console.log("DONE DOWNLOAD");
        } catch (err) {
            console.error("ERROR WRITING EXCEL:", err);
        }
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
        prevTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Pilih jenis data dan upload file Excel untuk melihat preview.</td></tr>';
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
            thHtml += `<th>${h}</th>`;
        });
        prevThead.innerHTML = thHtml;

        prevTbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Memvalidasi data...</td></tr>';
        
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

                // FK Kelas
                let cId = null;
                if (kelasName) {
                    const c = masterKelas.find(x => x.nama_kelas.toLowerCase() === kelasName.toLowerCase());
                    if (c) cId = c.id;
                    else { status = 'error'; messages.push(`Kelas '${kelasName}' tidak ditemukan`); }
                }

                const existing = masterSiswa.find(x => x.nis === nis);
                if (existing) {
                    status = 'duplicate';
                    messages.push('NIS sudah terdaftar');
                    payload.id = existing.id;
                }

                payload = { ...payload, nis, nisn, nama_lengkap: nama, jenis_kelamin: row['Jenis Kelamin'], kelas: kelasName, kelas_id: cId, alamat: row['Alamat'], no_hp_orang_tua: row['No HP Orang Tua'], nama_orang_tua: row['Nama Orang Tua'], aktif: String(row['Aktif'] || '').toLowerCase() !== 'tidak' };
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
                    else { status = 'error'; messages.push(`Guru '${guruName}' tidak ditemukan`); }
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
                    else { status = 'error'; messages.push(`Guru '${waliName}' tidak ditemukan`); }
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
                if (c) cId = c.id; else { status = 'error'; messages.push(`Kelas '${kelasName}' tidak ditemukan`); }
                
                const g = masterGuru.find(x => x.nama.toLowerCase() === guruName.toLowerCase());
                if (g) gId = g.id; else { status = 'error'; messages.push(`Guru '${guruName}' tidak ditemukan`); }
                
                const m = masterMapel.find(x => x.nama_mapel.toLowerCase() === mapelName.toLowerCase());
                if (m) mId = m.id; else { status = 'error'; messages.push(`Mapel '${mapelName}' tidak ditemukan`); }
                
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
            if (item.status === 'valid') badge = `<span style="color:white;background:var(--success);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Valid</span>`;
            else if (item.status === 'error') badge = `<span style="color:white;background:var(--danger);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Error</span>`;
            else if (item.status === 'duplicate') badge = `<span style="color:white;background:var(--text-muted);padding:2px 6px;border-radius:4px;font-size:0.8rem;">Duplicate</span>`;
            
            let msgHtml = item.messages.map(m => `<div>- ${m}</div>`).join('');
            if (!msgHtml) msgHtml = '-';

            let dataHtml = '';
            headers.forEach(h => {
                dataHtml += `<td>${item.row[h] || '-'}</td>`;
            });

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${badge}</td>
                <td style="color:var(--danger);font-size:0.85rem;">${msgHtml}</td>
                ${dataHtml}
            `;
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
    btnImport.addEventListener('click', async (e) => {
        e.preventDefault();
        if (window.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        
        const type = selectType.value;
        const strategy = selectStrategy.value; // skip, update, cancel

        // Import Order Validation — using existing Health Checker counters
        const tGuru = parseInt(document.getElementById('hc-teachers')?.textContent) || 0;
        const tMapel = parseInt(document.getElementById('hc-subjects')?.textContent) || 0;
        const tKelas = parseInt(document.getElementById('hc-classes')?.textContent) || 0;
        const tTahun = parseInt(document.getElementById('hc-years')?.textContent) || 0;

        if (type === 'guru' && tTahun === 0) return showToast('Mohon import Tahun Ajaran terlebih dahulu', 'error');
        if (type === 'mapel' && tGuru === 0) return showToast('Mohon import Guru terlebih dahulu', 'error');
        if (type === 'kelas' && tGuru === 0) return showToast('Mohon import Guru terlebih dahulu', 'error');
        if (type === 'siswa' && tKelas === 0) return showToast('Mohon import Kelas terlebih dahulu', 'error');
        if (type === 'jadwal' && (tGuru === 0 || tMapel === 0 || tKelas === 0 || tTahun === 0)) {
            return showToast('Mohon pastikan Tahun Ajaran, Guru, Mapel, dan Kelas sudah diimport sebelum Jadwal', 'error');
        }

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

        if (!confirm(`Yakin ingin mengimpor ${toImport.length} baris data?`)) return;

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

        // UI Reset
        btnImport.disabled = true;
        btnClear.disabled = true;
        progressContainer.style.display = 'block';
        importLog.style.display = 'block';
        importLog.innerHTML = `<div>[${new Date().toLocaleTimeString()}] Memulai import ${toImport.length} baris ke tabel ${tableName}...</div>`;
        progressBar.style.width = '0%';
        progressText.innerText = '0%';
        progressStats.innerText = `0 / ${toImport.length}`;



        // 9. Chunking
        const chunkSize = 200;
        let successCount = 0;
        let failCount = 0;
        let failedRows = [];
        const startTime = Date.now();

        for (let i = 0; i < toImport.length; i += chunkSize) {
            const chunk = toImport.slice(i, i + chunkSize);
            const chunkNum = Math.floor(i/chunkSize) + 1;
            try {
                // Upsert handles both insert and update if primary key (id) is provided
                const { error } = await db.from(tableName).upsert(chunk);
                if (error) throw error;
                
                successCount += chunk.length;
                importLog.innerHTML += `<div style="color:var(--success);">[SUCCESS] Chunk ${chunkNum} (${chunk.length} data) tersimpan.</div>`;
            } catch (err) {
                console.error('Batch error:', err);
                failCount += chunk.length;
                const errDetail = err.message || JSON.stringify(err);
                importLog.innerHTML += `<div style="color:var(--danger);">[ERROR] Chunk ${chunkNum} gagal (Data ke ${i+1}-${i+chunk.length}): ${escapeHTML(errDetail)}</div>`;
                chunk.forEach((row, idx) => {
                    failedRows.push({
                        "Excel Row": i + idx + 1,
                        "Database Table": tableName,
                        "Reason": errDetail,
                        "Field": "-",
                        "Current Value": "-",
                        "Expected Value": "-",
                        "Suggestion": "Periksa tipe data, duplikasi unik, atau Foreign Key."
                    });
                });
            }

            // Update Progress
            const progress = Math.round(((i + chunk.length) / toImport.length) * 100);
            progressBar.style.width = `${progress}%`;
            progressText.innerText = `${progress}%`;
            progressStats.innerText = `${Math.min(successCount + failCount, toImport.length)} / ${toImport.length}`;
            
            // Allow UI to update before next chunk
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        const endTime = Date.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(2);
        const successRate = ((successCount / toImport.length) * 100).toFixed(1);
        const insertC = successCount - updateC; // Estimate

        // 11. Final Log
        importLog.innerHTML += `
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
                <strong>Hasil Akhir Import ${type.toUpperCase()}:</strong><br>
                ✅ Berhasil: ${successCount}<br>
                ❌ Gagal: ${failCount}<br>
                ⏭️ Duplicate (Skip): ${skipped}<br>
                🔄 Update (Upsert): ${updateC}<br>
                ➕ Insert Baru: ${insertC > 0 ? insertC : 0}<br>
                ⏱️ Waktu Eksekusi: ${durationSec} detik<br>
                🎯 Success Rate: ${successRate}%
            </div>
        `;

        showToast('Proses impor selesai', successCount > 0 ? 'success' : 'error');
        btnImport.disabled = false;
        btnClear.disabled = false;
        
        if (failedRows.length > 0) {
            window.lastFailedRows = failedRows;
            document.getElementById('btn-download-error-report').style.display = 'block';
        } else {
            document.getElementById('btn-download-error-report').style.display = 'none';
        }

        // Refresh Data
        await runIntegrityCheck();

        // Auto Refresh Global Options & Lists
        if (typeof window.loadGlobalGuruOptions === 'function') window.loadGlobalGuruOptions();
        if (typeof window.loadGlobalMapelOptions === 'function') window.loadGlobalMapelOptions();
        if (typeof window.loadGlobalKelasTahunOptions === 'function') window.loadGlobalKelasTahunOptions();
        if (typeof window.loadDataSiswa === 'function') window.loadDataSiswa();
        if (typeof window.loadDataGuru === 'function') window.loadDataGuru();
        if (typeof window.loadDataJadwal === 'function') window.loadDataJadwal();
        if (typeof window.refreshDashboardStats === 'function') window.refreshDashboardStats();
    });

    document.getElementById('btn-download-error-report').addEventListener('click', (e) => {
        e.preventDefault();
        if (!window.lastFailedRows || window.lastFailedRows.length === 0) return;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(window.lastFailedRows);
        XLSX.utils.book_append_sheet(wb, ws, "Error Report");
        XLSX.writeFile(wb, "Import_Error_Report.xlsx");
    });

});
