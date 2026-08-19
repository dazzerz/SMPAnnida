import { authState } from './authState.js';
import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const elDate = document.getElementById('tg-date');
    const elCheckIn = document.getElementById('tg-checkin-time');
    const elCheckOut = document.getElementById('tg-checkout-time');
    
    const photoInContainer = document.getElementById('tg-photo-in-container');
    const photoInPlaceholder = document.getElementById('tg-photo-in-placeholder');
    const photoIn = document.getElementById('tg-photo-in');
    
    const photoOutContainer = document.getElementById('tg-photo-out-container');
    const photoOutPlaceholder = document.getElementById('tg-photo-out-placeholder');
    const photoOut = document.getElementById('tg-photo-out');
    
    const cameraContainer = document.getElementById('tg-camera-container');
    const video = document.getElementById('tg-video');
    const canvas = document.getElementById('tg-canvas');
    
    const btnCamera = document.getElementById('btn-tg-camera');
    const statusText = document.getElementById('tg-status-text');

    const btnTabPribadi = document.getElementById('btn-tg-tab-pribadi');
    const btnTabRekap = document.getElementById('btn-tg-tab-rekap');
    const tabPribadi = document.getElementById('tab-tg-pribadi');
    const tabRekap = document.getElementById('tab-tg-rekap');
    const dateRekap = document.getElementById('tg-rekap-date');
    const tbodyRekap = document.getElementById('tg-rekap-tbody');

    if (!elDate || !btnCamera) return;

    let currentTeacherId = null;
    let currentLat = null;
    let currentLng = null;
    let stream = null;
    let isCameraOpen = false;
    let hasLoaded = false;
    let attendanceRecord = null; // Store current record
    
    // YYYY-MM-DD local
    const getTodayStr = () => {
        const d = new Date();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
    };
    const today = getTodayStr();

    async function initAuth() {
        const { data: { session } } = await db.auth.getSession();
        if (session && session.user) {
            currentTeacherId = session.user.id;
            // Cek admin secara langsung untuk menghindari race condition dengan main.js
            if (session.user.email === 'daffa.al.akhdaan@gmail.com') {
                if (btnTabRekap) btnTabRekap.style.display = 'inline-block';
                if (dateRekap) {
                    dateRekap.value = today;
                    dateRekap.addEventListener('change', loadRekap);
                }
            }
        } else if (authState.isGuest) {
            currentTeacherId = '00000000-0000-0000-0000-000000000000';
        }
    }

    function formatTime(isoString) {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    // Helper to convert Google Drive viewer link to direct image link for <img> tags
    function getDisplayImageUrl(url) {
        if (!url) return '';
        if (url.includes('drive.google.com/uc?export=view&id=')) {
            return url.replace('uc?export=view&id=', 'thumbnail?id=') + '&sz=w1000';
        }
        return url;
    }

    async function loadAttendance() {
        if (!currentTeacherId) return;
        elDate.innerHTML = escapeHTML(formatDate(today));
        statusText.textContent = 'Memuat data...';
        
        try {
            const { data, error } = await db
                .from('teacher_attendance')
                .select('*')
                .eq('teacher_id', currentTeacherId)
                .eq('attendance_date', today)
                .limit(1);

            if (error) throw error;

            resetUI();
            attendanceRecord = (data && data.length > 0) ? data[0] : null;

            if (attendanceRecord) {
                // Check In is present
                elCheckIn.innerHTML = escapeHTML(formatTime(attendanceRecord.check_in));
                if (attendanceRecord.photo_url_in) {
                    photoInPlaceholder.style.display = 'none';
                    photoIn.style.display = 'block';
                    photoIn.src = getDisplayImageUrl(attendanceRecord.photo_url_in);
                }
                
                if (attendanceRecord.check_out) {
                    // Already checked out
                    elCheckOut.innerHTML = escapeHTML(formatTime(attendanceRecord.check_out));
                    if (attendanceRecord.photo_url_out) {
                        photoOutPlaceholder.style.display = 'none';
                        photoOut.style.display = 'block';
                        photoOut.src = getDisplayImageUrl(attendanceRecord.photo_url_out);
                    }
                    
                    statusText.textContent = 'Anda sudah menyelesaikan absensi hari ini.';
                    btnCamera.disabled = true;
                    btnCamera.textContent = 'Absensi Selesai';
                } else {
                    // Checked in, not checked out
                    if (!authState.isGuest) {
                        btnCamera.disabled = false;
                        btnCamera.textContent = 'Ambil Foto (Check Out)';
                    }
                    statusText.textContent = 'Jangan lupa absen pulang.';
                }
            } else {
                // Not checked in
                if (!authState.isGuest) {
                    btnCamera.disabled = false;
                    btnCamera.textContent = 'Ambil Foto (Check In)';
                }
                statusText.textContent = 'Silakan lakukan absen kedatangan.';
            }
            hasLoaded = true;
        } catch (err) {
            console.error("Error loading attendance:", err);
            statusText.textContent = 'Gagal memuat status absensi.';
            showToast('Gagal memuat status absensi', 'error');
        }
    }

    function resetUI() {
        stopCamera();
        elCheckIn.innerHTML = '--:--';
        elCheckOut.innerHTML = '--:--';
        
        photoInPlaceholder.style.display = 'block';
        photoIn.style.display = 'none';
        photoIn.src = '';
        
        photoOutPlaceholder.style.display = 'block';
        photoOut.style.display = 'none';
        photoOut.src = '';

        btnCamera.disabled = true;
        btnCamera.textContent = 'Memuat...';
    }

    async function toggleCamera() {
        if (isCameraOpen) {
            // Capture and Submit
            captureAndSubmit();
        } else {
            // Open camera
            try {
                // Request location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            currentLat = position.coords.latitude;
                            currentLng = position.coords.longitude;
                        },
                        (error) => {
                            console.warn("Location error:", error);
                        },
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                    );
                }

                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: 'user' }, 
                    audio: false 
                });
                video.srcObject = stream;
                cameraContainer.style.display = 'flex';
                isCameraOpen = true;
                btnCamera.textContent = 'Jepret & Simpan Absen';
                btnCamera.classList.replace('btn-primary', 'btn-success');
                statusText.textContent = 'Kamera menyala. Sesuaikan posisi Anda.';
            } catch (err) {
                console.error("Error accessing camera:", err);
                showToast('Gagal mengakses kamera. Pastikan memberikan izin akses.', 'error');
                statusText.textContent = 'Akses kamera ditolak.';
            }
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        cameraContainer.style.display = 'none';
        isCameraOpen = false;
        btnCamera.classList.remove('btn-success');
        btnCamera.classList.add('btn-primary');
    }

    async function captureAndSubmit() {
        if (!isCameraOpen) return;

        // Visual feedback
        btnCamera.disabled = true;
        const origText = btnCamera.textContent;
        btnCamera.textContent = 'Memproses...';
        statusText.textContent = 'Menyimpan absensi...';

        try {
            // Draw to canvas
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to Base64 directly
            const base64Image = canvas.toDataURL('image/jpeg', 0.8);

            // Construct file name
            let tName = 'Guru';
            try {
                const { data: { session } } = await db.auth.getSession();
                if (session && session.user && session.user.email) {
                    const { data: tData } = await db.from('teachers')
                        .select('nama')
                        .ilike('email', session.user.email)
                        .maybeSingle();
                        
                    if (tData && tData.nama) {
                        tName = tData.nama.replace(/\s+/g, '_');
                    } else if (session.user.email === 'daffa.al.akhdaan@gmail.com') {
                        tName = 'Admin';
                    } else if (session.user.user_metadata && session.user.user_metadata.full_name) {
                        tName = session.user.user_metadata.full_name.replace(/\s+/g, '_');
                    } else {
                        tName = session.user.email.split('@')[0];
                    }
                }
            } catch (e) {
                console.error("Gagal mendapatkan nama guru:", e);
            }
            const fileName = `${tName}_${currentTeacherId}_${Date.now()}.jpg`;

            // Upload to Google Drive via GAS Web App
            statusText.textContent = 'Mengunggah ke Drive...';
            const gasUrl = 'https://script.google.com/macros/s/AKfycbwgrN_Q75I06zGRygrivLYAJm7MC1p9n1H_sZFrmEexS5xfS5tYtwjQSd2zNef_xBxR/exec';
            
            // Note: Google Apps Script Web App standard mode doesn't strictly adhere to CORS, 
            // `mode: 'no-cors'` might be needed if it fails, but then we can't read the response JSON.
            // A properly configured GAS Web App returns proper JSON. Let's try standard fetch first.
            const response = await fetch(gasUrl, {
                method: 'POST',
                // Content-Type text/plain is used because GAS handles it better without CORS preflight issues sometimes
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify({
                    filename: fileName,
                    image: base64Image
                })
            });
            
            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || 'Gagal mengunggah ke Google Drive');
            }
            
            const photoUrl = result.url;

            // Save to Database
            const now = new Date().toISOString();
            
            if (!attendanceRecord) {
                // Check In
                const payload = {
                    teacher_id: currentTeacherId,
                    attendance_date: today,
                    check_in: now,
                    photo_url_in: photoUrl,
                    latitude: currentLat,
                    longitude: currentLng,
                    status: 'Hadir'
                };
                const { error: dbError } = await db.from('teacher_attendance').insert(payload);
                if (dbError) throw dbError;
                showToast('Check In berhasil disimpan', 'success');
            } else {
                // Check Out
                const payload = {
                    check_out: now,
                    photo_url_out: photoUrl,
                    latitude: currentLat || attendanceRecord.latitude,
                    longitude: currentLng || attendanceRecord.longitude
                };
                const { error: dbError } = await db.from('teacher_attendance')
                    .update(payload)
                    .eq('teacher_id', currentTeacherId)
                    .eq('attendance_date', today);
                if (dbError) throw dbError;
                showToast('Check Out berhasil disimpan', 'success');
            }

            stopCamera();
            await loadAttendance();

        } catch (err) {
            console.error("Capture error:", err);
            showToast('Gagal menyimpan absensi', 'error');
            statusText.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
            btnCamera.disabled = false;
            btnCamera.textContent = origText;
        }
    }

    btnCamera.addEventListener('click', toggleCamera);

    if (btnTabPribadi && btnTabRekap) {
        btnTabPribadi.addEventListener('click', () => {
            btnTabPribadi.classList.add('active');
            btnTabRekap.classList.remove('active');
            tabPribadi.style.display = 'block';
            tabRekap.style.display = 'none';
            if (dateRekap) dateRekap.style.display = 'none';
        });
        btnTabRekap.addEventListener('click', () => {
            btnTabRekap.classList.add('active');
            btnTabPribadi.classList.remove('active');
            tabRekap.style.display = 'block';
            tabPribadi.style.display = 'none';
            if (dateRekap) {
                dateRekap.style.display = 'inline-block';
                loadRekap();
            }
        });
    }

    async function loadRekap() {
        const { data: { session } } = await db.auth.getSession();
        if (!session || session.user.email !== 'daffa.al.akhdaan@gmail.com') return;

        const d = dateRekap.value || today;
        if (tbodyRekap) tbodyRekap.innerHTML = '<tr><td colspan="7" style="text-align: center;">Memuat data...</td></tr>';
        
        try {
            // 1. Fetch profiles to map id to full_name
            const { data: pData } = await db.from('profiles').select('id, full_name');
            const teacherMap = {};
            if (pData) pData.forEach(p => { if (p.id) teacherMap[p.id] = p.full_name; });

            // 2. Fetch attendance
            const { data, error } = await db.from('teacher_attendance')
                .select('*')
                .eq('attendance_date', d)
                .order('check_in', { ascending: true });
                
            if (error) throw error;
            
            if (!data || data.length === 0) {
                if (tbodyRekap) tbodyRekap.innerHTML = '<tr><td colspan="7" style="text-align: center;">Belum ada absensi guru pada tanggal ini.</td></tr>';
                return;
            }
            
            if (tbodyRekap) tbodyRekap.innerHTML = data.map((r, i) => {
                let nama = teacherMap[r.teacher_id] || 'Guru';
                
                // Ekstrak nama dari URL foto masuk jika ada
                if (nama === 'Guru' && r.photo_url_in) {
                    try {
                        const urlParts = r.photo_url_in.split('/');
                        let filename = decodeURIComponent(urlParts[urlParts.length - 1]);
                        // Hapus ekstensi file
                        filename = filename.replace(/\.[^/.]+$/, "");
                        
                        const parts = filename.split('_');
                        if (parts.length >= 3) {
                            parts.pop(); // buang timestamp
                            parts.pop(); // buang UUID
                            nama = parts.join(' '); // sisa string adalah nama yang digabung kembali dengan spasi
                        }
                    } catch(e) {
                        console.error("Gagal parse nama dari URL", e);
                    }
                }

                const jamIn = formatTime(r.check_in);
                const jamOut = formatTime(r.check_out);
                const dispIn = getDisplayImageUrl(r.photo_url_in);
                const dispOut = getDisplayImageUrl(r.photo_url_out);
                
                const imgIn = r.photo_url_in ? `<a href="${r.photo_url_in}" target="_blank"><img src="${dispIn}" style="height: 40px; width: 40px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);"></a>` : '-';
                const imgOut = r.photo_url_out ? `<a href="${r.photo_url_out}" target="_blank"><img src="${dispOut}" style="height: 40px; width: 40px; border-radius: 4px; object-fit: cover; border: 1px solid rgba(255,255,255,0.2);"></a>` : '-';
                const st = r.status === 'Hadir' ? `<span style="padding: 4px 8px; background: rgba(40,167,69,0.15); color: var(--success); border-radius: 4px; font-size: 12px; border: 1px solid rgba(40,167,69,0.3);">Hadir</span>` : escapeHTML(r.status);
                
                const loc = (r.latitude && r.longitude) 
                    ? `<a href="https://www.google.com/maps?q=${r.latitude},${r.longitude}" target="_blank" style="padding: 4px 8px; background: rgba(13,110,253,0.1); color: #4da6ff; border-radius: 4px; font-size: 12px; border: 1px solid rgba(13,110,253,0.3); text-decoration: none;">📍 Maps</a>` 
                    : '-';

                return `
                    <tr style="background: rgba(255,255,255,0.02); transition: all 0.3s ease;">
                        <td>${i + 1}</td>
                        <td><strong>${escapeHTML(nama)}</strong></td>
                        <td style="text-align: center;">
                            <input type="time" class="edit-checkin form-input" data-id="${r.id}" value="${jamIn !== '--:--' ? jamIn : ''}" style="width:100px; text-align:center; padding:0.2rem; font-size:0.9rem;">
                        </td>
                        <td style="text-align: center;">${imgIn}</td>
                        <td style="text-align: center;">
                            <input type="time" class="edit-checkout form-input" data-id="${r.id}" value="${jamOut !== '--:--' ? jamOut : ''}" style="width:100px; text-align:center; padding:0.2rem; font-size:0.9rem;">
                        </td>
                        <td style="text-align: center;">${imgOut}</td>
                        <td style="text-align: center;">${loc}</td>
                        <td style="text-align: center;">${st}</td>
                        <td style="text-align: center;">
                            <button class="btn btn-sm btn-success btn-save-att" data-id="${r.id}" data-date="${r.attendance_date}" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; background-color:#10b981; color:white; border:none; border-radius:4px; cursor:pointer;">💾 Simpan</button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Bind save buttons
            document.querySelectorAll('.btn-save-att').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.dataset.id;
                    const date = e.target.dataset.date;
                    const inInput = document.querySelector(`.edit-checkin[data-id="${id}"]`).value;
                    const outInput = document.querySelector(`.edit-checkout[data-id="${id}"]`).value;
                    
                    try {
                        e.target.textContent = '...';
                        let updateData = {};
                        if (inInput) updateData.check_in = `${date}T${inInput}:00+07:00`;
                        if (outInput) updateData.check_out = `${date}T${outInput}:00+07:00`;
                        
                        if (Object.keys(updateData).length > 0) {
                            await db.from('teacher_attendance').update(updateData).eq('id', id);
                            showToast('Jam absensi berhasil diperbarui!', 'success');
                        } else {
                            showToast('Tidak ada yang diupdate', 'info');
                        }
                    } catch(err) {
                        console.error(err);
                        showToast('Gagal update absensi', 'error');
                    } finally {
                        e.target.textContent = '💾 Simpan';
                    }
                });
            });
            
        } catch(err) {
            console.error(err);
            if (tbodyRekap) tbodyRekap.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--danger);">Gagal memuat rekap.</td></tr>';
        }
    }

    const btnExportExcel = document.getElementById('btn-tg-export-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', async () => {
            if (!tbodyRekap) return; const XLSX = await import('xlsx');
            // Hanya export tabel yang tampil
            // Kita bisa mengekstrak data dari tabel secara langsung untuk kesederhanaan, atau re-fetch.
            // Paling mudah menggunakan SheetJS table_to_book
            const table = document.querySelector('#tab-tg-rekap table');
            if (!table) return;

            try {
                // Clone tabel untuk memanipulasi teks jika ada gambar/ikon sebelum di-export
                const cloneTable = table.cloneNode(true);
                // Ganti img/link dengan teks alternatif
                cloneTable.querySelectorAll('img').forEach(img => {
                    const parent = img.parentElement;
                    if(parent) parent.innerHTML = 'Ada Foto';
                });
                cloneTable.querySelectorAll('a').forEach(a => {
                    if (a.textContent.includes('Maps')) {
                        a.parentElement.innerHTML = 'Ada Lokasi';
                    }
                });

                const wb = XLSX.utils.table_to_book(cloneTable, { sheet: "Rekap_Guru" });
                const d = dateRekap ? dateRekap.value : today;
                XLSX.writeFile(wb, `Rekap_Absensi_Guru_${d}.xlsx`);
                showToast('Data berhasil diexport', 'success');
            } catch (err) {
                console.error("Gagal export:", err);
                showToast('Gagal melakukan export excel', 'error');
            }
        });
    }

    // Initial load when section is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'absensi-guru' && mutation.target.style.display !== 'none') {
                if (!hasLoaded && currentTeacherId) loadAttendance();
            } else if (mutation.target.id === 'absensi-guru' && mutation.target.style.display === 'none') {
                stopCamera();
            }
        });
    });
    
    const absensiSection = document.getElementById('absensi-guru');
    if (absensiSection) {
        observer.observe(absensiSection, { attributes: true, attributeFilter: ['style'] });
    }

    // Initialize
    const formatDate = (dateStr) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    initAuth().then(() => {
        if (!currentTeacherId) {
            // Maybe they are a teacher in the database, fetch by email fallback if needed, 
            // but we removed FK so session.user.id is fine.
        }
        if (absensiSection && absensiSection.style.display !== 'none') {
            loadAttendance();
        }
    });
});

