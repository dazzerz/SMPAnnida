import supabaseClient from '../core/supabase.js';
import { showToast, formatDate, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const elDate = document.getElementById('tg-date');
    const elCheckIn = document.getElementById('tg-checkin-time');
    const elCheckOut = document.getElementById('tg-checkout-time');
    
    const previewPlaceholder = document.getElementById('tg-preview-placeholder');
    const video = document.getElementById('tg-video');
    const canvas = document.getElementById('tg-canvas');
    const photo = document.getElementById('tg-photo');
    
    const btnCamera = document.getElementById('btn-tg-camera');
    const btnUpload = document.getElementById('btn-tg-upload');
    const fileInput = document.getElementById('tg-file-input');
    
    const btnCheckIn = document.getElementById('btn-tg-checkin');
    const btnCheckOut = document.getElementById('btn-tg-checkout');

    if (!elDate || !btnCheckIn) return;

    let currentTeacherId = null;
    let currentPhotoUrl = null;
    let stream = null;
    let isCameraOpen = false;
    let hasLoaded = false;
    
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
        
        try {
            const { data, error } = await db
                .from('teacher_attendance')
                .select('*')
                .eq('teacher_id', currentTeacherId)
                .eq('attendance_date', today)
                .limit(1);

            if (error) throw error;

            resetUI();

            if (data && data.length > 0) {
                const record = data[0];
                elCheckIn.innerHTML = escapeHTML(formatTime(record.check_in));
                if (record.photo_url) {
                    showPhoto(record.photo_url);
                }
                
                if (record.check_out) {
                    // Already checked out
                    elCheckOut.innerHTML = escapeHTML(formatTime(record.check_out));
                    disableAll();
                } else {
                    // Checked in, not checked out
                    btnCamera.disabled = true;
                    btnUpload.disabled = true;
                    btnCheckIn.disabled = true;
                    if (!window.isGuest) btnCheckOut.disabled = false;
                }
            } else {
                // Not checked in
                if (!window.isGuest) {
                    btnCamera.disabled = false;
                    btnUpload.disabled = false;
                }
            }
            hasLoaded = true;
        } catch (err) {
            console.error("Error loading attendance:", err);
            showToast('Gagal memuat status absensi', 'error');
        }
    }

    function resetUI() {
        stopCamera();
        elCheckIn.innerHTML = '--:--';
        elCheckOut.innerHTML = '--:--';
        previewPlaceholder.style.display = 'block';
        video.style.display = 'none';
        photo.style.display = 'none';
        btnCamera.disabled = true;
        btnUpload.disabled = true;
        btnCheckIn.disabled = true;
        btnCheckOut.disabled = true;
        currentPhotoUrl = null;
        btnCamera.textContent = 'Ambil Foto';
        isCameraOpen = false;
    }

    function disableAll() {
        btnCamera.disabled = true;
        btnUpload.disabled = true;
        btnCheckIn.disabled = true;
        btnCheckOut.disabled = true;
    }

    function showPhoto(url) {
        stopCamera();
        previewPlaceholder.style.display = 'none';
        video.style.display = 'none';
        photo.style.display = 'block';
        photo.src = url;
    }

    async function toggleCamera() {
        if (isCameraOpen) {
            // Capture
            capturePhoto();
        } else {
            // Open camera
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                video.srcObject = stream;
                previewPlaceholder.style.display = 'none';
                photo.style.display = 'none';
                video.style.display = 'block';
                isCameraOpen = true;
                btnCamera.textContent = 'Capture';
            } catch (err) {
                console.error("Camera error:", err);
                showToast('Tidak dapat mengakses kamera', 'error');
            }
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        isCameraOpen = false;
    }

    async function capturePhoto() {
        if (!video.videoWidth) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        showPhoto(dataUrl);
        btnCamera.textContent = 'Ambil Foto';
        
        canvas.toBlob(async (blob) => {
            if (blob) {
                await uploadBlob(blob);
            }
        }, 'image/jpeg', 0.8);
    }

    btnUpload.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Hanya file gambar yang diperbolehkan', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            showPhoto(ev.target.result);
        };
        reader.readAsDataURL(file);

        await uploadBlob(file);
        fileInput.value = '';
    });

    async function uploadBlob(blob) {
        btnCamera.disabled = true;
        btnUpload.disabled = true;
        const originalText = btnUpload.textContent;
        btnUpload.textContent = 'Loading...';

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${currentTeacherId}/${timestamp}.jpg`;

        try {
            const { error } = await db.storage
                .from('teacher-attendance')
                .upload(fileName, blob, { contentType: 'image/jpeg' });
            
            if (error) throw error;
            
            const { data: publicUrlData } = db.storage.from('teacher-attendance').getPublicUrl(fileName);
            currentPhotoUrl = publicUrlData.publicUrl;
            
            showToast('Foto berhasil diunggah', 'success');
            btnCheckIn.disabled = false;
        } catch (err) {
            console.error("Upload error:", err);
            showToast('Gagal mengunggah foto', 'error');
            resetUI();
            btnCamera.disabled = false;
            btnUpload.disabled = false;
        } finally {
            btnUpload.textContent = originalText;
        }
    }

    btnCamera.addEventListener('click', toggleCamera);

    btnCheckIn.addEventListener('click', async () => {
        if (!currentPhotoUrl) return showToast('Foto wajib ada', 'warning');
        
        btnCheckIn.disabled = true;
        const origText = btnCheckIn.textContent;
        btnCheckIn.textContent = 'Menyimpan...';

        const payload = {
            teacher_id: currentTeacherId,
            attendance_date: today,
            check_in: new Date().toISOString(),
            photo_url: currentPhotoUrl
        };

        try {
            const { error } = await db
                .from('teacher_attendance')
                .insert(payload);
                
            if (error) throw error;
            showToast('Check In berhasil', 'success');
            loadAttendance();
        } catch (err) {
            console.error("Check in error:", err);
            if (err.code === '23505') {
                showToast('Anda sudah Check In hari ini', 'warning');
            } else {
                showToast('Gagal Check In', 'error');
            }
            btnCheckIn.disabled = false;
        } finally {
            btnCheckIn.textContent = origText;
        }
    });

    btnCheckOut.addEventListener('click', async () => {
        btnCheckOut.disabled = true;
        const origText = btnCheckOut.textContent;
        btnCheckOut.textContent = 'Menyimpan...';

        const payload = {
            teacher_id: currentTeacherId,
            attendance_date: today,
            check_out: new Date().toISOString()
        };

        try {
            const { error } = await db
                .from('teacher_attendance')
                .upsert(payload, { onConflict: 'teacher_id, attendance_date' });
                
            if (error) throw error;
            showToast('Check Out berhasil', 'success');
            loadAttendance();
        } catch (err) {
            console.error("Check out error:", err);
            showToast('Gagal Check Out', 'error');
            btnCheckOut.disabled = false;
        } finally {
            btnCheckOut.textContent = origText;
        }
    });

    function checkHash() {
        if (window.location.hash === '#absensi-guru') {
            if (!hasLoaded) loadAttendance();
        }
    }

    initAuth().then(() => {
        window.addEventListener('hashchange', checkHash);
        checkHash();
    });
});
