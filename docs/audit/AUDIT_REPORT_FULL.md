# LAPORAN AUDIT SISTEM INFORMASI TERPADU SMP ANNIDA
**Standar Evaluasi:** CISA (Certified Information Systems Auditor) Framework & ISACA Guidelines  
**Sifat Audit:** READ-ONLY Assessment (No Code Mutation, Zero Production Interruption)  
**Tanggal Audit:** 6 September 2026  
**Auditor Status:** Certified Information Systems Auditor (CISA)  

---

## 1. Executive Summary & Ringkasan Temuan Risiko

Audit komprehensif telah dilakukan terhadap seluruh repositori proyek **SMP Annida**, mencakup 5 domain utama:
1. **Keamanan (Security)**
2. **Kualitas Kode (Code Quality)**
3. **Kebersihan Repositori Git (Repo Hygiene)**
4. **Aset & Performa (Assets & Performance)**
5. **Konsistensi Desain & UI (Design Consistency)**

Berdasarkan hasil audit independen, ditemukan satu celah keamanan berbobot **CRITICAL** terkait kebocoran kredensial koneksi database langsung di dalam file skrip root yang terlacak di Git, di samping sejumlah temuan risiko *High* dan *Medium* terkait otorisasi backend Google Apps Script, kebijakan iframe sandbox, serta duplikasi aset berukuran besar.

### Tabel Matriks Ringkasan Temuan

| ID | Domain | Temuan Audit | Tingkat Risiko | Status Tindakan |
|---|---|---|:---:|---|
| **SEC-01** | Keamanan | Hardcoded Database Direct Connection String & Password di File Root | **CRITICAL** | Wajib Rotasi & Hapus Segera |
| **SEC-02** | Keamanan | Endpoint `doPost` Google Apps Script Tidak Memiliki Autentikasi / Shared Secret | **HIGH** | Perlu Otentikasi Token |
| **SEC-03** | Keamanan | Iframe Smart Viewer & Maps Kurang Atribut `sandbox` Ketat | **MEDIUM** | Perlu Restriksi Sandbox |
| **SEC-04** | Keamanan | Potensi Policy RLS Terlalu Terbuka pada Tabel Publik / Jurnal | **MEDIUM** | Audit Granularitas Role |
| **SEC-05** | Keamanan | Proteksi Anti DevTools Client-Side yang Memberi *False Sense of Security* | **LOW** | Catatan Keamanan |
| **COD-01** | Kualitas Kode | Keberadaan "God Files" (>40 KB) pada JavaScript Frontend | **MEDIUM** | Perlu Modularisasi Refactoring |
| **COD-02** | Kualitas Kode | Sisa `console.log` Debugging di Kode Produksi | **LOW** | Pembersihan via Linter/Build Hook |
| **HYG-01** | Git Hygiene | Skrip Perbaikan Sementara (`*.cjs`, `fix-*.js`, `patch*.cjs`) Terlacak di Git | **HIGH** | Wajib Hapus & Tambahkan ke .gitignore |
| **HYG-02** | Git Hygiene | Duplikasi File Antara Folder Root, `assets/`, `public/`, dan `docs/` | **MEDIUM** | Konsolidasi Struktur Direktori |
| **HYG-03** | Git Hygiene | Konfigurasi `.gitignore` Sangat Minim | **MEDIUM** | Pembaruan Template Standard Git |
| **AST-01** | Aset & Performa | Aset Gambar Ukuran Besar (>300 KB hingga >1.4 MB) Tanpa Picture WebP Tag | **MEDIUM** | Kompresi & Tag `<picture>` |
| **AST-02** | Aset & Performa | Dependensi `package.json` yang Tumpang Tindih (`pg`, dual xlsx) | **LOW** | Pembersihan Paket Dev/Prod |
| **DES-01** | Desain & UI | Fragmentasi Desain Sistem & Dualitas Framework CSS | **MEDIUM** | Standardisasi Token & Shell |

---

## 2. Domain 1 — Keamanan (Security)

### [CRITICAL] SEC-01: Kebocoran Hardcoded Database Direct Connection String & Password di Root
* **File Terdampak:**
  * `check_kelas.cjs` (Baris 2)
  * `check_size.cjs` (Baris 2)
  * `check.cjs` (Baris 1)
  * `fix.cjs` (Baris 2)
  * `fix.js` (Baris 2)
  * `fix-db-materi.cjs` (Baris 4)
* **Kondisi Saat Ini:**
  File-file skrip node/CommonJS sementara di atas berisi string koneksi PostgreSQL Supabase langsung dalam bentuk plain-text:
  `postgresql://postgres:Annida12409.@db.vxrgezyfxzynpucuomci.supabase.co:5432/postgres`
  File-file ini tercatat di repositori Git (`git ls-files`) dan berpotensi terdorong ke remote repository GitHub publik/organisasi. Password database master (`postgres`) terekspos secara transparan.
* **Tingkat Risiko:** **CRITICAL** (Dapat menyebabkan pengambilalihan kendali penuh basis data, bypass RLS secara total melalui bypass port 5432).
* **Rekomendasi Remediasi:**
  1. Lakukan **Reset/Rotate Database Password** sesegera mungkin di dashboard konsol Supabase (Project Settings > Database > Database Password).
  2. Hapus file-file temporary tersebut dari repositori Git menggunakan `git rm --cached` dan hapus file fisiknya.
  3. Jika repositori pernah di-push ke remote publik, lakukan pembersihan riwayat Git menggunakan `git-filter-repo` atau BFG Repo-Cleaner.

---

### [HIGH] SEC-02: Endpoint `doPost` Google Apps Script Tidak Memiliki Autentikasi / Shared Secret
* **File Terdampak:** `backend-gas/Code.js` (Baris 52–173)
* **Kondisi Saat Ini:**
  Fungsi `doPost(e)` menangani aksi `upload` materi dan `delete` berkas Google Drive tanpa memvalidasi token otentikasi atau rahasia API bersama (shared HMAC / header API key / Supabase JWT). Siapa saja yang mengetahui atau menginspeksi URL endpoint Apps Script (`https://script.google.com/macros/s/.../exec`) dari tab Network browser dapat mengirimkan request `POST` sembarangan untuk mengunggah file ke Google Drive sekolah atau menghapus berkas materi yang diketahui ID-nya (`action: "delete"`).
* **Tingkat Risiko:** **HIGH** (Penyalahgunaan kuota Google Drive, potensi defacement / pengunggahan file berbahaya, dan unauthorized deletion berkas materi).
* **Rekomendasi Remediasi:**
  1. Terapkan validasi `token` atau `api_key` rahasia pada payload `doPost`.
  2. Frontend menyertakan signature/token yang valid, atau integrasikan verifikasi bearer token JWT Supabase user role (`admin` / `teacher`).

---

### [MEDIUM] SEC-03: Iframe Viewer Materi & Map Kurang Atribut `sandbox` Ketat
* **File Terdampak:**
  * `pages/student/dashboard.html` (Baris 778)
  * `pages/academic/dashboard.html` (Baris 1950)
  * `index.html` (Baris 504)
* **Kondisi Saat Ini:**
  Iframe untuk memuat file materi HTML/simulasi dan Google Maps disematkan tanpa atribut `sandbox` (atau hanya mengandalkan CSP). Pada modul materi interaktif, HTML materi dirender via `srcdoc` atau link Drive. Jika ada berkas HTML bermuatan JavaScript jahat diunggah, iframe tanpa restriksi `sandbox` berisiko mengeksekusi skrip dalam konteks domain utama.
* **Tingkat Risiko:** **MEDIUM** (Risiko Stored XSS / clickjacking di lingkungan browser siswa/guru).
* **Rekomendasi Remediasi:**
  Tambahkan atribut `sandbox="allow-scripts allow-same-origin allow-popups"` pada iframe materi interaktif.

---

### [MEDIUM] SEC-04: Analisis Granularitas Policy Row Level Security (RLS)
* **File Terdampak:**
  * `database/migrations/create_materials_table.sql` (Baris 27–33)
  * `database/migrations/remediate_all_rls.sql`
  * `database/migrations/student_portal_security_and_storage.sql`
* **Kondisi Saat Ini:**
  * Pada migrasi `materials`: Policy `materials_read_policy` mengizinkan `FOR SELECT TO authenticated USING (true)`. Hal ini membuat seluruh materi bisa dibaca oleh semua akun yang terotentikasi (termasuk antar jenjang/tingkat).
  * Pada `materials_write_policy`: Menggunakan `FOR ALL` untuk role `('admin', 'teacher', 'pembina')`, namun tidak memeriksa apakah guru yang bersangkutan adalah pemilik baris (`teacher_id = auth.uid()`). Akibatnya, seorang guru berpotensi mengedit atau menghapus materi milik guru lain via direct REST query.
* **Tingkat Risiko:** **MEDIUM** (Integritas data antar guru).
* **Rekomendasi Remediasi:**
  Pisahkan policy `UPDATE` dan `DELETE` pada tabel `materials` agar hanya mengizinkan `teacher_id = auth.uid()` atau role `admin`.

---

### [LOW] SEC-05: Proteksi DevTools Client-Side Memberi False Sense of Security
* **File Terdampak:** `js/core/supabase.js` (Baris 8–16)
* **Kondisi Saat Ini:**
  Terdapat skrip IIFE yang menonaktifkan klik kanan (`contextmenu`) dan tombol shortcut F12 / Ctrl+Shift+I / Ctrl+U.
* **Tingkat Risiko:** **LOW** (Kerapihan implementasi & usability).
* **Rekomendasi Remediasi:**
  Mekanisme ini sangat mudah dilewati dengan menonaktifkan JS browser atau menggunakan curl. Keamanan aplikasi web harus 100% bergantung pada RLS Supabase dan CSP header, bukan pembatasan keyboard client-side.

---

## 3. Domain 2 — Kualitas Kode (Code Quality)

### [MEDIUM] COD-01: Keberadaan "God Files" (>40 KB) pada JavaScript & HTML Frontend
* **File Terdampak:**
  * `js/ppdb/db.js` (68.13 KB, >1600 baris)
  * `js/student/dashboard.js` (63.70 KB, >1400 baris)
  * `js/academic/attendance.js` (41.75 KB)
  * `pages/academic/dashboard.html` (127.96 KB, 2185 baris)
  * `pages/ppdb/index.html` (63.57 KB)
  * `pages/student/dashboard.html` (51.11 KB)
* **Kondisi Saat Ini:**
  File-file tersebut menampung terlalu banyak tanggung jawab (*Multiple Responsibilities Anti-Pattern*). Misalnya, `js/ppdb/db.js` mencampur manipulasi DOM registrasi, kalkulasi biaya, koneksi storage Supabase, validasi formulir, dan ekspor data.
* **Tingkat Risiko:** **MEDIUM** (Technical debt, biaya pemeliharaan tinggi, risiko regresi tinggi).
* **Rekomendasi Remediasi:**
  Pecah modul JavaScript menjadi modul spesifik (misal: `ppdb-service.js`, `ppdb-validation.js`, `ppdb-ui.js`). Modal di HTML dapat dimuat secara dinamis saat diperlukan.

---

### [LOW] COD-02: Statement `console.log` Debugging Tertinggal di Kode Produksi
* **File Terdampak:**
  * `js/academic/materi.js` (Baris 206, 341)
  * `js/ppdb/db.js` (Baris 1473)
  * `js/core/pwa.js` (Baris 18, 32, 39, 47, 57, 132)
* **Kondisi Saat Ini:**
  Terdapat minimal 9 baris `console.log` aktif yang mencetak status internal upload, response Google Apps Script, dan lifecycle PWA ke konsol browser publik.
* **Tingkat Risiko:** **LOW** (Information leakage minor & konsol browser tidak bersih).
* **Rekomendasi Remediasi:**
  Gunakan opsi Vite build `esbuild: { drop: ['console', 'debugger'] }` agar log otomatis dibuang pada hasil build produksi.

---

## 4. Domain 3 — Kebersihan Repositori Git (Repo Hygiene)

### [HIGH] HYG-01: File Skrip Debug & Patch Sementara Masih Terlacak di Repositori Git
* **File Terdampak:**
  * Root scripts: `check.cjs`, `check_kelas.cjs`, `check_size.cjs`, `fix.cjs`, `fix.js`, `fix-rest.cjs`, `fix-db-materi.cjs`, `patch3.cjs`, `patch_js.js`
* **Kondisi Saat Ini:**
  File-file tersebut merupakan skrip adhoc untuk pengecekan skema database lokal dan patching yang tidak termasuk dalam alur build aplikasi (`vite build`), namun ikut terlacak di Git.
* **Tingkat Risiko:** **HIGH** (Mengotori repositori dan membocorkan kredensial basis data langsung).
* **Rekomendasi Remediasi:**
  Hapus semua file skrip adhoc dari Git (`git rm`) dan simpan skrip migrasi resmi hanya di folder `database/migrations/` atau `scripts/`.

---

### [MEDIUM] HYG-02: Duplikasi File Aset Logo dan Template di Beberapa Direktori
* **File Terdampak:**
  * Logo `1.png` (367.78 KB) & `1.webp` terduplikasi di **7 lokasi berbeda** (`assets/logo/1.png`, `public/1.png`, `public/assets/images/1.png`, `public/assets/images/logo.png`, dll).
  * Logo `logo_1x1.png` (412.43 KB) terduplikasi di root `./logo_1x1.png`, `assets/logo/`, dan `public/`.
  * `Format_Import_Siswa.csv` & `Template_Rekap_Siswa.xlsx` ganda di `docs/` dan `public/docs/`.
  * Foto aktivitas: `aktivitas-1.jpg` dan `aktivitas-5.jpg` memiliki isi identik (MD5 hash sama).
* **Kondisi Saat Ini:**
  Duplikasi fisik berkas menyebabkan ukuran repositori Git membengkak tanpa manfaat fungsional.
* **Tingkat Risiko:** **MEDIUM** (Inefisiensi penyimpanan, bloat size bundle & cache).
* **Rekomendasi Remediasi:**
  Tentukan satu direktori kanonikal untuk static assets publik (folder `public/assets/`), lalu hapus duplikat di root dan direktori lainnya.

---

### [MEDIUM] HYG-03: Kelengkapan File `.gitignore` Masih Sangat Minim
* **File Terdampak:** `.gitignore`
* **Kondisi Saat Ini:**
  File `.gitignore` saat ini hanya berisi 6 baris aturan dan tidak mencakup pola umum ekosistem Node.js seperti `*.log`, `.vscode/`, `.idea/`, `*.local`, `*.cjs` (skrip debug), serta `.clasp.json`.
* **Tingkat Risiko:** **MEDIUM** (Potensi kebocoran file lokal lainnya di masa mendatang).
* **Rekomendasi Remediasi:**
  Perbarui `.gitignore` dengan template standar Node/Vite dan sertakan pola untuk skrip adhoc.

---

### [LOW] HYG-04: Evaluasi Pola Pesan Git Commit
* **Kondisi Saat Ini:**
  Pemeriksaan terhadap riwayat commit (`git log -30 --oneline`) menunjukkan bahwa pengembang telah menerapkan konvensi **Conventional Commits** secara sangat konsisten (`feat(...)`, `fix(...)`, `style(...)`, `refactor(...)`).
* **Tingkat Risiko:** **INFORMATIONAL / LOW** (Memenuhi standar tata kelola perangkat lunak yang baik).

---

## 5. Domain 4 — Aset & Performa (Assets & Performance)

### [MEDIUM] AST-01: Aset Gambar Ukuran Besar Tanpa Tag `<picture>` Fallback Modern
* **File Terdampak:**
  * `assets/images/hero-building.png` — **1,425.89 KB (1.42 MB)**
  * `assets/images/gedung_3d.png` — **499.35 KB**
  * `assets/logo/logo_1x1.png` — **412.43 KB**
  * `assets/logo/1.png` — **367.78 KB**
* **Kondisi Saat Ini:**
  * Meskipun file `.webp` sudah tersedia, template HTML memuat gambar secara langsung via tag `<img>` atau CSS `background-image` tanpa memanfaatkan kontainer `<picture>`.
  * File `hero-building.png` sebesar 1.42 MB memperberat waktu muat (LCP) pada koneksi seluler.
* **Tingkat Risiko:** **MEDIUM** (Mempengaruhi skor Core Web Vitals dan kecepatan akses mobile).
* **Rekomendasi Remediasi:**
  1. Kompresi gambar resolusi tinggi menggunakan tool lossless/near-lossless (target WebP <100 KB).
  2. Implementasikan tag `<picture><source srcset="...webp" type="image/webp"><img src="...png"></picture>` pada halaman depan (`index.html`).

---

### [LOW] AST-02: Paket Dependensi di `package.json` yang Perlu Divalidasi
* **File Terdampak:** `package.json`
* **Kondisi Saat Ini:**
  * Dependensi `devDependencies` memuat driver PostgreSQL server-side: `"pg": "^8.23.0"` yang tidak diperlukan untuk build SPA client-side.
  * Terdapat dua paket pengolah spreadsheet: `"xlsx": "^0.18.5"` dan `"xlsx-js-style": "^1.2.0"`.
* **Tingkat Risiko:** **LOW** (Pembengkakan ukuran `node_modules`).
* **Rekomendasi Remediasi:**
  Hapus paket `pg` jika skrip adhoc telah dibersihkan, dan evaluasi konsolidasi paket Excel.

---

## 6. Domain 5 — Konsistensi Desain (Design Consistency)

### [MEDIUM] DES-01: Fragmentasi Desain Sistem & Dualitas Framework CSS
* **File Terdampak:**
  * `index.html`
  * `pages/academic/dashboard.html`
  * `pages/finance/dashboard.html`
  * `pages/student/dashboard.html`
* **Kondisi Saat Ini:**
  1. **Dualitas CSS:** `pages/academic` dan `pages/student` memuat CDN runtime Tailwind (`cdn.tailwindcss.com`) dan stylesheet compile, sementara `pages/finance` murni vanilla CSS tanpa class utility Tailwind.
  2. **Inkonsistensi Shell Navigasi:** Halaman Akademik dan Keuangan menggunakan unified layout injector JavaScript (`layout.js`), sedangkan Halaman Siswa menggunakan sidebar HTML statis hardcoded bertema glassy gelap.
  3. **Tipografi:** Halaman index dan finance menggunakan font **Inter**, sedangkan student dashboard menggunakan **Literata** & **Nunito Sans**.
* **Tingkat Risiko:** **MEDIUM** (Pengalaman pengguna terfragmentasi, redundansi beban CSS).
* **Rekomendasi Remediasi:**
  Standarisasi satu Design System berbasis Tailwind CSS yang di-bundle penuh oleh Vite tanpa CDN runtime pada lingkungan produksi.

---

## 7. Rencana Tindak Lanjut (Action Plan Prioritas)

```mermaid
graph TD
    A[Prioritas 1: SEGERA] --> B[Ganti Database Password di Supabase]
    A --> C[Hapus Script Adhoc *.cjs & fix.js dari Git]
    A --> D[Perbarui .gitignore]
    
    E[Prioritas 2: JANGKA PENDEK] --> F[Beri Otentikasi Shared-Key pada Apps Script doPost]
    E --> G[Pembersihan Duplikat Aset Gambar & Logo]
    E --> H[Kompresi hero-building.png 1.4MB]
    
    I[Prioritas 3: JANGKA MENENGAH] --> J[Refactoring God Files js/ppdb/db.js]
    I --> K[Penyelarasan Framework CSS & Desain Antar Portal]
    I --> L[Hapus dependensi 'pg' dari package.json]
```

---
*Laporan audit ini disusun sebagai dokumen evaluasi teknis independen dan disimpan secara lokal tanpa merubah berkas kode sumber aplikasi.*
