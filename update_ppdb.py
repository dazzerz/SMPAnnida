import re

# Update HTML
html_path = 'pages/ppdb/index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

old_html_regex = r'<div class="image-placeholder">.*?</div>'
new_html = '''<div class="hero-photo-grid">
        <!-- Foto 1 -->
        <div class="photo-card-glass">
            <img src="../../assets/images/aktivitas-1.jpg" alt="Aktivitas Belajar Kelas">
        </div>
        <!-- Foto 2 -->
        <div class="photo-card-glass">
            <img src="../../assets/images/aktivitas-2.jpg" alt="Siswa Bersama Guru">
        </div>
        <!-- Foto 3 -->
        <div class="photo-card-glass">
            <img src="../../assets/images/aktivitas-3.jpg" alt="Aktivitas di Luar Kelas">
        </div>
        <!-- Foto 4 -->
        <div class="photo-card-glass">
            <img src="../../assets/images/aktivitas-4.jpg" alt="Belajar Mengajar">
        </div>
    </div>'''

# Replace the inner part of hero-image
html = re.sub(old_html_regex, new_html, html, flags=re.DOTALL)
html = re.sub(r'<!-- Placeholder for hero image[^>]*-->\s*', '', html)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# Update CSS
css_path = 'css/ppdb/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Remove .image-placeholder
css = re.sub(r'\.image-placeholder\s*\{[^\}]+\}', '', css)

# Append new CSS
new_css = '''
/* Container Grid untuk Foto Hero */
.hero-photo-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    width: 100%;
    max-width: 500px;
    margin: 0 auto;
}
/* Bingkai Glassmorphism untuk Setiap Foto */
.photo-card-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    padding: 0.5rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
/* Gambar di Dalam Bingkai Kaca */
.photo-card-glass img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 10px;
    display: block;
    transition: transform 0.3s ease;
}
/* Efek Hover Interaktif */
.photo-card-glass:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px 0 rgba(0, 200, 83, 0.25);
    border-color: rgba(0, 200, 83, 0.4);
}
.photo-card-glass:hover img {
    transform: scale(1.03);
}
/* Responsive di Layar Kecil (Mobile) */
@media (max-width: 768px) {
    .hero-photo-grid {
        grid-template-columns: repeat(2, 1fr); /* Tetap 2x2 di tablet/mobile agar ringkas di bawah teks */
        gap: 0.75rem;
        margin-top: 2rem;
    }
    
    .photo-card-glass img {
        height: 130px;
    }
}
'''

css += new_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)

print("HTML and CSS updated successfully.")
