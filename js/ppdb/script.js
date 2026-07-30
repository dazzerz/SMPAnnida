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
    const displayTipe = document.getElementById('display-tipe-pendaftaran');
    const invoiceTipe = document.getElementById('invoice-tipe');
    const invoiceNominal = document.getElementById('invoice-nominal');

    const savedTipe = localStorage.getItem('tipe_pendaftaran') || 'sekolah';
    
    if (displayTipe) {
        displayTipe.innerText = savedTipe === 'pondok' ? 'Sekolah + Pondok (Boarding)' : 'Hanya Sekolah (Non-Pondok)';
    }
    if (invoiceTipe) {
        invoiceTipe.innerText = savedTipe === 'pondok' ? 'Sekolah + Pondok (Boarding)' : 'Hanya Sekolah (Non-Pondok)';
    }
    if (invoiceNominal) {
        invoiceNominal.innerText = savedTipe === 'pondok' ? 'Rp 500.000' : 'Rp 250.000';
    }

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
