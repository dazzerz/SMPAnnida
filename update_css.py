css_path = 'css/ppdb/style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

# Remove the old grid
grid_start = css.find('/* Container Grid untuk Foto Hero */')
if grid_start != -1:
    css = css[:grid_start]

new_css = '''
/* =========================================================================
   GLASS SLIDER STYLES
   ========================================================================= */
.glass-slider-container {
    position: relative;
    width: 100%;
    max-width: 550px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 0.75rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}
.slider-wrapper {
    position: relative;
    width: 100%;
    aspect-ratio: 4/3; /* Frame utama rasio 4:3 */
    border-radius: 12px;
    overflow: hidden;
}
.slide {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.5s ease-in-out;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}
.slide.active {
    opacity: 1;
    z-index: 2;
}
/* Background Efek Blur Kaca di belakang foto utama */
.slide-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    filter: blur(25px) brightness(0.6);
    transform: scale(1.1); /* Hilangkan tepi putih blur */
    opacity: 0.5;
    z-index: 1;
}
/* Foto Utama di depan (Tampil utuh tanpa terpotong) */
.slider-img {
    position: relative;
    z-index: 2;
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain; /* Utuh, proporsional, tidak terpotong */
    cursor: pointer;
    transition: transform 0.3s ease;
}
.slider-img:hover {
    transform: scale(1.02);
}
/* Navigasi Button di Slider */
.slider-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1rem;
    transition: all 0.2s ease;
}
.slider-btn:hover {
    background: var(--primary-color, #00c853);
    border-color: var(--primary-color, #00c853);
    box-shadow: 0 0 10px rgba(0, 200, 83, 0.5);
}
.prev-btn { left: 1.5rem; }
.next-btn { right: 1.5rem; }
/* Dots Indikator */
.slider-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 0.75rem;
    flex-wrap: wrap; /* dots baris baru jika layar sempit */
}
.dot {
    width: 8px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
}
.dot.active {
    background: var(--primary-color, #00c853);
    width: 24px;
    border-radius: 4px;
    box-shadow: 0 0 8px var(--primary-color, #00c853);
}
/* =========================================================================
   LIGHTBOX MODAL STYLES (Memperbesar Gambar)
   ========================================================================= */
.lightbox-modal {
    display: none;
    position: fixed;
    z-index: 9999;
    padding-top: 60px;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(10, 20, 15, 0.95);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
}
.lightbox-content {
    margin: auto;
    display: block;
    max-width: 85%;
    max-height: 75vh;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 24px 50px rgba(0,0,0,0.5);
    animation: zoomIn 0.3s ease;
    object-fit: contain;
}
@keyframes zoomIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
.lightbox-close {
    position: absolute;
    top: 20px;
    right: 35px;
    color: #fff;
    font-size: 40px;
    font-weight: bold;
    cursor: pointer;
    transition: 0.3s;
}
.lightbox-close:hover {
    color: var(--primary-color, #00c853);
}
.lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: white;
    font-size: 2rem;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.3s;
    z-index: 10000;
}
.lightbox-nav:hover {
    background: var(--primary-color, #00c853);
    color: white;
}
.lightbox-prev { left: 40px; }
.lightbox-next { right: 40px; }
.lightbox-caption {
    margin: auto;
    display: block;
    width: 80%;
    max-width: 700px;
    text-align: center;
    color: #ccc;
    padding: 15px 0;
    font-size: 1rem;
    font-weight: 500;
}
@media (max-width: 768px) {
    .lightbox-content { max-width: 95%; }
    .lightbox-nav { padding: 0.5rem 1rem; font-size: 1.5rem; }
    .lightbox-prev { left: 10px; }
    .lightbox-next { right: 10px; }
}
'''
css += new_css

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(css)
print("CSS updated")
