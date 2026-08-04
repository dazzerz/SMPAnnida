import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, getUserEmail } from '../core/utils.js';

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

    if (!elDate || !btnCamera) return;

    let currentTeacherId = null;
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
        } else if (window.isGuest) {
            currentTeacherId = '00000000-0000-0000-0000-000000000000';
        }
    }

    function formatTime(isoString) {
        if (!isoString) return '--:--';
        const d = new Date(isoString);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
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
                    photoIn.src = attendanceRecord.photo_url_in;
                }
                
                if (attendanceRecord.check_out) {
                    // Already checked out
                    elCheckOut.innerHTML = escapeHTML(formatTime(attendanceRecord.check_out));
                    if (attendanceRecord.photo_url_out) {
                        photoOutPlaceholder.style.display = 'none';
                        photoOut.style.display = 'block';
                        photoOut.src = attendanceRecord.photo_url_out;
                    }
                    
                    statusText.textContent = 'Anda sudah menyelesaikan absensi hari ini.';
                    btnCamera.disabled = true;
                    btnCamera.textContent = 'Absensi Selesai';
                } else {
                    // Checked in, not checked out
                    if (!window.isGuest) {
                        btnCamera.disabled = false;
                        btnCamera.textContent = 'Ambil Foto (Check Out)';
                    }
                    statusText.textContent = 'Jangan lupa absen pulang.';
                }
            } else {
                // Not checked in
                if (!window.isGuest) {
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
            
            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            if (!blob) throw new Error("Gagal mengambil gambar");

            // Upload to Supabase Storage
            const fileName = `teacher_${currentTeacherId}_${Date.now()}.jpg`;
            const { error: uploadError } = await db.storage
                .from('teacher-attendance')
                .upload(fileName, blob, { contentType: 'image/jpeg' });
                
            if (uploadError) throw uploadError;

            const { data: publicUrlData } = db.storage.from('teacher-attendance').getPublicUrl(fileName);
            const photoUrl = publicUrlData.publicUrl;

            // Save to Database
            const now = new Date().toISOString();
            
            if (!attendanceRecord) {
                // Check In
                const payload = {
                    teacher_id: currentTeacherId,
                    attendance_date: today,
                    check_in: now,
                    photo_url_in: photoUrl,
                    status: 'Hadir'
                };
                const { error: dbError } = await db.from('teacher_attendance').insert(payload);
                if (dbError) throw dbError;
                showToast('Check In berhasil disimpan', 'success');
            } else {
                // Check Out
                const payload = {
                    check_out: now,
                    photo_url_out: photoUrl
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
