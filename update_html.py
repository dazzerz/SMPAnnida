import re

html_path = 'pages/ppdb/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

new_slider_html = '''<div class="hero-image">
    <!-- Slider Container -->
    <div class="glass-slider-container">
        <div class="slider-wrapper">
            <!-- Slide 1 -->
            <div class="slide active">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-1.jpg');"></div>
                <img src="../../assets/images/aktivitas-1.jpg" alt="Aktivitas Belajar Kelas 1" class="slider-img" data-index="0">
            </div>
            <!-- Slide 2 -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-2.jpg');"></div>
                <img src="../../assets/images/aktivitas-2.jpg" alt="Petugas Menyiapkan Proyektor" class="slider-img" data-index="1">
            </div>
            <!-- Slide 3 -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-3.jpg');"></div>
                <img src="../../assets/images/aktivitas-3.jpg" alt="Siswa Bersama Guru di Depan Kelas" class="slider-img" data-index="2">
            </div>
            <!-- Slide 4 -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-4.jpg');"></div>
                <img src="../../assets/images/aktivitas-4.jpg" alt="Siswa Belajar di Kelas" class="slider-img" data-index="3">
            </div>
            <!-- Slide 5 -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-5.jpg');"></div>
                <img src="../../assets/images/aktivitas-5.jpg" alt="Kegiatan Bersama di Aula" class="slider-img" data-index="4">
            </div>
            <!-- Slide 6 (Portrait) -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-6.jpg');"></div>
                <img src="../../assets/images/aktivitas-6.jpg" alt="Ujian Siswa Kelas Ujung Depan" class="slider-img" data-index="5">
            </div>
            <!-- Slide 7 (Portrait) -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-7.jpg');"></div>
                <img src="../../assets/images/aktivitas-7.jpg" alt="Ujian Siswa Barisan Kanan" class="slider-img" data-index="6">
            </div>
            <!-- Slide 8 (Portrait) -->
            <div class="slide">
                <div class="slide-bg" style="background-image: url('../../assets/images/aktivitas-8.jpg');"></div>
                <img src="../../assets/images/aktivitas-8.jpg" alt="Ujian Siswa Fokus Belajar" class="slider-img" data-index="7">
            </div>
        </div>
        <!-- Tombol Navigasi Slider -->
        <button class="slider-btn prev-btn" aria-label="Slide Sebelumnya">◀</button>
        <button class="slider-btn next-btn" aria-label="Slide Berikutnya">▶</button>
        <!-- Indikator Dots -->
        <div class="slider-dots">
            <span class="dot active" data-slide="0"></span>
            <span class="dot" data-slide="1"></span>
            <span class="dot" data-slide="2"></span>
            <span class="dot" data-slide="3"></span>
            <span class="dot" data-slide="4"></span>
            <span class="dot" data-slide="5"></span>
            <span class="dot" data-slide="6"></span>
            <span class="dot" data-slide="7"></span>
        </div>
    </div>
</div>'''

lightbox_html = '''<!-- Lightbox Modal untuk Memperbesar Gambar (Letakkan sebelum tag </body>) -->
<div id="lightbox-modal" class="lightbox-modal">
    <span class="lightbox-close">&times;</span>
    <button class="lightbox-nav lightbox-prev">◀</button>
    <img class="lightbox-content" id="lightbox-img" src="" alt="Perbesar Foto">
    <button class="lightbox-nav lightbox-next">▶</button>
    <div id="lightbox-caption" class="lightbox-caption"></div>
</div>'''

html = re.sub(r'<div class="hero-image">.*?</div>\s*</div>', new_slider_html + '\n              </div>', html, flags=re.DOTALL)
html = html.replace('</body>', lightbox_html + '\n</body>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print("HTML updated")
