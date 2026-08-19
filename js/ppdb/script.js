import { injectSidebar, injectTopbar } from '../core/layout.js';
injectSidebar('sidebar');

const isSiswa = window.location.pathname.includes('siswa');
injectTopbar('topbar', {
    greeting: isSiswa ? 'Portal PPDB' : 'Gelombang 1 - SMP Sekolah Alam + Tahfidz 2026/2027',
    title: isSiswa ? 'Portal Calon Siswa' : 'Admin PPDB Panel'
});


// Annida2PPDB - Main JavaScript

document.addEventListener('DOMContentLoaded', () => {
    console.log('Annida2PPDB App initialized.');
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 1. Tab Switching Logic (Siswa & Admin Dashboard)
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');
            
            if (!targetId) return;

            // Remove active class from all triggers and panels
            tabTriggers.forEach(t => t.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Find triggers pointing to the same target and activate them
            document.querySelectorAll(`.tab-trigger[data-target="${targetId}"]`).forEach(t => {
                t.classList.add('active');
            });

            // Activate corresponding panel
            const panel = document.getElementById(`tab-${targetId}`);
            if (panel) {
                panel.classList.add('active');
            }
        });
    });

    // 2. Multi-step Form Wizard Logic
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    
    let currentStep = 0;
    
    if (formSteps.length > 0) {
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep < formSteps.length - 1) {
                    currentStep++;
                    updateFormSteps();
                    updateProgressbar();
                }
            });
        });
        
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (currentStep > 0) {
                    currentStep--;
                    updateFormSteps();
                    updateProgressbar();
                }
            });
        });
    }
    
    function updateFormSteps() {
        formSteps.forEach((formStep, index) => {
            if (index === currentStep) {
                formStep.classList.add('active');
            } else {
                formStep.classList.remove('active');
            }
        });
    }
    
    function updateProgressbar() {
        progressSteps.forEach((progressStep, index) => {
            if (index < currentStep) {
                progressStep.classList.add('completed');
                progressStep.classList.remove('active');
            } else if (index === currentStep) {
                progressStep.classList.add('active');
                progressStep.classList.remove('completed');
            } else {
                progressStep.classList.remove('active', 'completed');
            }
        });
    }

    // 3. Multi-step Form Submission
    const multiStepForm = document.getElementById('multiStepForm');
    if (multiStepForm) {
        multiStepForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Formulir Pendaftaran berhasil disimpan! Status Anda kini masuk ke tahap Verifikasi Berkas.');
            
            // Update UI/Timeline state
            const progress = document.querySelector('.wizard-progress');
            if (progress) {
                const steps = progress.querySelectorAll('.progress-step');
                steps[1].classList.add('completed');
                steps[1].classList.remove('active');
                steps[2].classList.add('active');
            }

            // Redirect tab to Document Upload
            document.querySelector('.tab-trigger[data-target="dokumen"]').click();
        });
    }

    // 4. File Upload Simulator (Dashboard Siswa)
    const setupFileSimulator = (fileInputId, statusId, nameId) => {
        const fileInput = document.getElementById(fileInputId);
        const statusEl = document.getElementById(statusId);
        const nameEl = document.getElementById(nameId);

        if (fileInput && statusEl && nameEl) {
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const file = this.files[0];
                    nameEl.innerText = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                    statusEl.innerText = 'Menunggu Verifikasi';
                    statusEl.className = 'status-badge status-verifikasi';
                }
            });
        }
    };

    setupFileSimulator('file-kk', 'kk-status', 'kk-name');
    setupFileSimulator('file-akta', 'akta-status', 'akta-name');
    setupFileSimulator('file-skl', 'skl-status', 'skl-name');

    // 5. Payment Details Setup & Confirmation
    // 5. Payment Details Setup & Confirmation
    // (UI tipe pendaftaran di-handle oleh db.js secara asinkron dari Supabase)

    const paymentForm = document.getElementById('paymentForm');
    const paymentSuccessMsg = document.getElementById('payment-success-msg');
    
    if (paymentForm && paymentSuccessMsg) {
        paymentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            paymentForm.style.display = 'none';
            paymentSuccessMsg.style.display = 'block';
            alert('Bukti transfer berhasil dikirim! Silakan tunggu konfirmasi bendahara sekolah.');
        });
    }
});


// --- Extracted from inline HTML ---


        // 1. Doc Verification Split-View Mock
        window.showDocPreview = function(student, docName, file) {
            document.getElementById('preview-student-name').innerText = student;
            document.getElementById('preview-doc-title').innerText = docName;
            document.getElementById('preview-img-box').innerHTML = `
                <div style="text-align:center;">
                    <span style="font-size:3rem; display:block;">📄</span>
                    <strong>${file}</strong>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-top:5px;">[Klik Setujui Berkas di bawah untuk memproses]</p>
                </div>
            `;
        }

        window.verifyDocumentAction = function(action) {
            const student = document.getElementById('preview-student-name').innerText;
            if (student === "Pilih Berkas Calon Siswa") {
                alert("Silakan pilih berkas pendaftar di sebelah kiri terlebih dahulu.");
                return;
            }
            alert(`Dokumen pendaftaran atas nama ${student} telah di- ${action === 'Approve' ? 'Setujui' : 'Tolak untuk Revisi'}!`);
        }

        // 2. Payment Verify Mock
        window.verifyPaymentAction = function(rowId) {
            const row = document.getElementById(`pay-row-${rowId}`);
            if (row) {
                row.style.opacity = '0.5';
                row.querySelector('button').disabled = true;
                row.querySelector('button').innerText = '✓ Terverifikasi';
                row.querySelector('button').style.backgroundColor = '#38a169';
                
                // Update KPI Card Lulus Mock
                const kpiLulus = document.getElementById('kpi-lulus');
                let count = parseInt(kpiLulus.innerText);
                kpiLulus.innerText = count + 1;
                
                alert("Verifikasi Pembayaran Berhasil! Status pendaftar diupdate untuk mengikuti tes seleksi.");
            }
        }

        // 3. Score Calculator & Ranking Update Mock
        const calcInputs = document.querySelectorAll('.val-input');
        calcInputs.forEach(input => {
            input.addEventListener('input', calculateLiveScore);
        });

        window.calculateLiveScore = function() {
            const akademik = parseFloat(document.getElementById('val-akademik').value) || 0;
            const tahfidz = parseFloat(document.getElementById('val-tahfidz').value) || 0;
            const interview = parseFloat(document.getElementById('val-interview').value) || 0;
            const admin = parseFloat(document.getElementById('val-admin').value) || 0;
            
            // Weightage: 40%, 30%, 20%, 10%
            const total = (akademik * 0.4) + (tahfidz * 0.3) + (interview * 0.2) + (admin * 0.1);
            document.getElementById('calculated-total-score').innerText = total.toFixed(1);
        }

        window.saveSeleksiGrade = function() {
            const student = document.getElementById('seleksi-student-select').value;
            const finalScore = parseFloat(document.getElementById('calculated-total-score').innerText);
            
            if (student === "Ahmad Fulan") {
                document.getElementById('score-Ahmad-Fulan').innerHTML = `<strong>${finalScore.toFixed(1)}</strong>`;
            } else if (student === "Budi Santoso") {
                const budiRow = document.getElementById('rank-row-Budi-Santoso');
                budiRow.style.display = 'table-row';
                document.getElementById('score-Budi-Santoso').innerHTML = `<strong>${finalScore.toFixed(1)}</strong>`;
            }
            
            alert(`Nilai seleksi untuk ${student} berhasil disimpan. Peringkat hasil seleksi diperbarui!`);
        }

        // 4. Activate to Academic Mock
        window.activateToAcademic = function(studentName) {
            const confirmActivation = confirm(`Apakah Anda yakin ingin mengaktivasi ${studentName} menjadi SISWA AKTIF?\n\nProses ini otomatis:\n1. Menggenerate NIS (Nomor Induk Siswa).\n2. Memasukkan data ke Modul Akademik (Presensi & Rapor Kelas).\n3. Membuka portal tagihan SPP bulanan di Modul Finance.`);
            
            if (confirmActivation) {
                alert(`Selamat! ${studentName} resmi diaktivasi menjadi Siswa Aktif.\nAkun portal Orang Tua & Siswa telah aktif.`);
            }
        }
    


document.addEventListener('DOMContentLoaded', () => {
    // === LOGIC SLIDER ===
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;
    let slideInterval;
    
    function showSlide(index) {
        if (!slides.length) return;
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
    }
    
    function nextSlide() {
        showSlide(currentSlide + 1);
    }
    
    function prevSlide() {
        showSlide(currentSlide - 1);
    }
    
    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 5000); // Ganti slide setiap 5 detik
    }
    
    function stopAutoSlide() {
        clearInterval(slideInterval);
    }
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoSlide();
            startAutoSlide();
        });
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide();
        });
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const targetIndex = parseInt(e.target.getAttribute('data-slide'));
                showSlide(targetIndex);
                stopAutoSlide();
                startAutoSlide();
            });
        });
        // Jalankan autoplay
        startAutoSlide();
    }
    
    // === LOGIC LIGHTBOX MODAL ===
    const modal = document.getElementById('lightbox-modal');
    const modalImg = document.getElementById('lightbox-img');
    const captionText = document.getElementById('lightbox-caption');
    const closeBtn = document.querySelector('.lightbox-close');
    const lboxPrev = document.querySelector('.lightbox-prev');
    const lboxNext = document.querySelector('.lightbox-next');
    let activeImgIndex = 0;
    
    // Kumpulan data gambar untuk lightbox
    const imagesData = Array.from(document.querySelectorAll('.slider-img')).map(img => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt')
    }));
    
    function openLightbox(index) {
        if (!modal) return;
        modal.style.display = "block";
        updateLightboxImage(index);
        stopAutoSlide(); // Hentikan auto-slide saat gambar diperbesar
    }
    
    function closeLightbox() {
        if (!modal) return;
        modal.style.display = "none";
        startAutoSlide();
    }
    
    function updateLightboxImage(index) {
        if (!imagesData.length) return;
        activeImgIndex = (index + imagesData.length) % imagesData.length;
        modalImg.src = imagesData[activeImgIndex].src;
        captionText.innerHTML = imagesData[activeImgIndex].alt;
    }
    
    // Event listener klik pada gambar slider
    document.querySelectorAll('.slider-img').forEach(img => {
        img.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            openLightbox(index);
        });
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
        
        // Klik di luar gambar untuk menutup modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLightbox();
            }
        });
        lboxPrev.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxImage(activeImgIndex - 1); });
        lboxNext.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxImage(activeImgIndex + 1); });
        
        // Dukungan Keyboard
        document.addEventListener('keydown', (e) => {
            if (modal.style.display === "block") {
                if (e.key === "Escape") closeLightbox();
                if (e.key === "ArrowLeft") updateLightboxImage(activeImgIndex - 1);
                if (e.key === "ArrowRight") updateLightboxImage(activeImgIndex + 1);
            }
        });
    }
});
