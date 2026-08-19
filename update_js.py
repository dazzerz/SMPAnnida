import re

js_path = 'js/ppdb/script.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

new_js = '''
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
'''

js += '\n' + new_js

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("JS updated")
