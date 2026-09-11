# AUDIT REPORT SMP ANNIDA V2.0
**Senior Security, Architecture, & Database Auditor**  
*Tanggal: 9 September 2026 | Target: SMP Annida Integrated Management System*

---

## EXECUTIVE SUMMARY

Audit menyeluruh dilakukan terhadap kode sumber di repositori `SMPAnnida-Dev` mencakup arsitektur Vanilla SPA, integrasi database Supabase REST API, aset statis, kebijakan keamanan RLS, performa DOM, dan maintainability styling.

Meskipun sistem telah mengimplementasikan autentikasi role-based dan antarmuka light-mode yang rapi, ditemukan beberapa **kelemahan struktural fundamental** yang berpotensi menyebabkan **DOM freeze di mobile, lonjakan kuota egress database, dan potensi manipulasi data jika RLS di server tidak tersinkronisasi dengan kode client**.

---

## DAFTAR TEMUAN AUDIT BERDASARKAN TINGKAT KEPARAHAN

### [CRITICAL] TEMUAN TINGKAT KRITIS

#### 1. Over-fetching Data Tanpa Pagination pada Tabel Siswa & Absensi (Egress & Memory Hazard)
- **Domain:** Data Payload & Efisiensi Query
- **Lokasi File:** 
  - `js/academic/siswa.js:46`
  - `js/academic/attendance.js:597-600`
- **Bukti Kode:**
  - `const { data, error } = await db.from('students').select('*').order('nama_lengkap', { ascending: true });` (Paginasi di memori browser JS, bukan database!)
  - `let query = db.from('attendance_students').select('student_id, status, attendance_date').in('student_id', students.map(s => s.id));` (Menarik seluruh log riwayat absensi sepanjang masa, baru difilter di JS!)
- **Root Cause:**
  Penerapan Client-side Pagination dan In-Memory Filtering. Seluruh baris tabel `students` dan ribuan baris log `attendance_students` ditarik utuh via REST API ke memori peramban. Hanya tabel `teacher_journals` dan `transactions` yang telah menerapkan `.range()` di level SQL database.
- **Dampak:**
  Saat data siswa mencapai ratusan dan data absensi mencapai puluhan ribu record, browser HP (terutama low-end Android) akan mengalami Out of Memory (OOM) atau tab crash. Kuota Egress Supabase membengkak drastis.
- **Rekomendasi Eksekusi:**
  - Terapkan Server-side Pagination menggunakan `.range(from, to)` dan `{ count: 'exact' }` langsung pada query `db.from('students')`.
  - Pada rekap absensi bulanan, wajib masukkan filter rentang tanggal langsung ke database query: `.gte('attendance_date', startOfMonth).lte('attendance_date', endOfMonth)`.

---

#### 2. Ketiadaan Relational Foreign Key Safety Guard pada Penghapusan Data (Data Integrity Trap)
- **Domain:** Relasi & Sinkronisasi Database
- **Lokasi File:** 
  - `js/academic/kelas.js:283`
  - `js/academic/mapel.js:123`
- **Bukti Kode:**
  - `const { error } = await db.from('classes').delete().eq('id', id);`
- **Root Cause:**
  Tidak ada pengecekan sebelum menghapus entitas master (pre-deletion dependency check). Di frontend, client langsung mengeksekusi DELETE ke tabel `classes` tanpa memverifikasi apakah ada siswa (`students.kelas`), jadwal (`class_schedules.class_id`), atau nilai (`grades`) yang masih merujuk ke kelas tersebut.
- **Dampak:**
  Jika relasi PostgreSQL menggunakan `ON DELETE RESTRICT`, delete melempar error mentah. Jika relasi loose tanpa constraint, menghapus kelas akan menghasilkan data orphan (siswa tanpa kelas, jadwal kelas hantu).
- **Rekomendasi Eksekusi:**
  Sebelum eksekusi DELETE, lakukan hitung relasi aktif:
  `const { count } = await db.from('students').select('id', { count: 'exact', head: true }).eq('kelas', kelasNama);`
  Jika `count > 0`, batalkan dan tampilkan pesan larangan.

---

### [HIGH] TEMUAN TINGKAT TINGGI

#### 3. Client-Side Authorization Gate Bypass Risiko Guest (Insecure Client State Assumption)
- **Domain:** Keamanan (Supabase RLS & Auth)
- **Lokasi File:** 
  - `js/academic/main.js:83-87`
  - `js/academic/siswa.js:174`
  - `database/migrations/remediate_all_rls.sql`
- **Root Cause:**
  Aplikasi mengandalkan variabel JavaScript `authState.isGuest` di memori klien untuk memblokir aksi hapus/edit. Meskipun file migrasi `remediate_all_rls.sql` disiapkan dengan policy `FOR ALL TO authenticated`, keamanan bergantung pada apakah script SQL tersebut telah dieksekusi di database production. Jika seorang Guest menjalankan `window.db.from('students').delete().eq('id', ...)` via console, pengecekan `if (authState.isGuest)` terlewati total.
- **Dampak:**
  Jika ada tabel dengan policy write `TO anon`, pengguna luar dapat memanipulasi data sekolah via DevTools.
- **Rekomendasi Eksekusi:**
  Pastikan database policy di Supabase hanya mengizinkan role `authenticated`. Di frontend, hapus ekspos `window.db = supabaseClient` di `main.js:17`.

---

#### 4. Monolithic Single-Page HTML & DOM Overload (Browser Freeze Hazard)
- **Domain:** Performa & Arsitektur DOM
- **Lokasi File:** `pages/academic/dashboard.html`
- **Temuan Teknis:**
  File berukuran 140 KB dengan 2.297 baris HTML mentah memuat 15 `<section>` masif yang semuanya dirender sejak detik pertama ke Document Tree. Sistem SPA hanya mengganti `style.display = 'none'` dan `'block'`.
- **Root Cause:**
  Arsitektur All-in-One DOM Injection tanpa lazy-loading.
- **Dampak:**
  Browser mobile harus menghitung layout tree dan style recalculation untuk ribuan node tak terlihat, menyebabkan stutter saat drawer dibuka dan konsumsi memori tinggi.
- **Rekomendasi Eksekusi:**
  Pisahkan modul besar (seperti CBT Admin, Data Migration, Rapor) ke file template parsial di folder `partials/`, lalu muat secara dinamis hanya saat hash URL modul tersebut pertama kali dikunjungi.

---

### [MEDIUM] TEMUAN TINGKAT MENENGAH

#### 5. Zombie Assets: 7 File Poster Krakatau & Hero Terbengkalai di Repo Publik
- **Domain:** Dead Code & Orphaned Assets
- **Lokasi File:**
  - `public/poster_annida_ceria.jpg`
  - `public/poster_annida_islami_hijau.jpg`
  - `public/poster_annida_original.jpg`
  - `public/poster_annida_super_ceria.jpg`
  - `public/poster_keselamatan_sekolah.jpg`
  - `public/poster_krakatau_bahaya_solusi.jpg`
  - `public/poster_krakatau_lengkap.jpg`
  - `assets/images/hero-building.png` / `.webp`
- **Temuan:** File-file poster lama di atas tidak pernah direferensikan di file HTML/JS/CSS manapun, namun terus di-copy oleh `build.py` ke GitHub Pages.
- **Rekomendasi:** Hapus dari direktori `public/` dan `assets/` untuk menghemat bandwidth build dan cache visitor.

---

#### 6. CSS Specificity Inflation: 300 Deklarasi !important di theme.css
- **Domain:** Maintainability CSS & UI
- **Lokasi File:** `css/theme.css`
- **Temuan:** Ditemukan 300 kemunculan `!important` di `theme.css` akibat perang spesifisitas dengan `style.css` dan inline styling.
- **Rekomendasi:** Gunakan CSS Cascade Layers (`@layer`) dan bersihkan inline style pada HTML.

---

#### 7. Sisa Deklarasi Dark Theme yang Bertentangan dengan DESIGN.md
- **Domain:** Maintainability CSS & Kepatuhan Desain
- **Lokasi File:**
  - `css/style.css:621-645`
  - `js/academic/main.js:220-228`
- **Temuan:** Blok rule `[data-theme="dark"]` dan event listener toggle dark mode masih aktif di codebase, bertentangan dengan mandat Single Light Mode di `DESIGN.md`.
- **Rekomendasi:** Bersihkan rule `.dark-theme` di `style.css` dan nonaktifkan tombol toggle.

---

### [LOW / CLEANUP] TEMUAN TINGKAT RENDAH

#### 8. Dead Code: Function Export telemetry.js
- **Domain:** Dead Code
- **Lokasi File:** `js/core/telemetry.js:19`
- **Temuan:** Fungsi `export function trackEvent` tidak pernah di-import atau digunakan di manapun.
- **Rekomendasi:** Hapus atau sambungkan ke global error tracker.

#### 9. Ekspos Global Object window.db
- **Domain:** Code Hygiene
- **Lokasi File:** `js/academic/main.js:17`
- **Temuan:** Objek database di-assign langsung ke `window.db`, mempermudah manipulasi client-side di console.
- **Rekomendasi:** Hapus baris penugasan global tersebut.

---

## RINGKASAN MATRIKS AUDIT

| No | Kode Temuan | Domain | Severity | Area Terkena | Estimasi Usaha |
|---|---|---|---|---|---|
| 1 | AUD-01 | Data Payload | [CRITICAL] | Siswa & Absensi Query | Sedang |
| 2 | AUD-02 | Database Integrity | [CRITICAL] | Master Kelas & Mapel | Rendah |
| 3 | AUD-03 | Security / Auth | [HIGH] | RLS vs Client Guard | Rendah |
| 4 | AUD-04 | Performance / DOM | [HIGH] | Academic Dashboard SPA | Tinggi |
| 5 | AUD-05 | Dead Code Assets | [MEDIUM] | Public & Assets Folder | Rendah |
| 6 | AUD-06 | CSS Maintainability | [MEDIUM] | theme.css (!important) | Sedang |
| 7 | AUD-07 | Design Compliance | [MEDIUM] | Sisa Dark Mode | Rendah |
| 8 | AUD-08 | Code Hygiene | [LOW] | telemetry.js | Sangat Rendah |
| 9 | AUD-09 | Information Leak | [LOW] | window.db exposed | Sangat Rendah |
