# Security Guide

*Panduan keamanan, mitigasi serangan, dan monitoring untuk SMP Annida.*

## Table of Contents
1. [Otentikasi & Manajemen Sesi](#otentikasi--manajemen-sesi)
2. [Row Level Security (RLS)](#row-level-security-rls)
3. [Mitigasi Cross-Site Scripting (XSS)](#mitigasi-cross-site-scripting-xss)
4. [Content-Security-Policy (CSP)](#content-security-policy-csp)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Enkripsi NIK (PPDB)](#enkripsi-nik-ppdb)
7. [Security Checklist untuk Reviewer](#security-checklist-untuk-reviewer)

---

## Otentikasi & Manajemen Sesi
Aplikasi ini memanfaatkan **Supabase Auth** sebagai provider identitas utama (IdP). Saat pengguna *login*, Supabase mengeluarkan token **JWT (JSON Web Token)** yang disimpan dengan aman di dalam penyimpanan perangkat klien (`localStorage`).

Klien Vite membaca token tersebut untuk membuktikan identitas pengguna di setiap *request* `fetch()` maupun ketika melakukan komunikasi *real-time* ke server Supabase. Tidak ada sesi berbasis *Cookie* yang rentan terhadap metode penyadapan lawas (CSRF) karena kita sepenuhnya bergantung pada arsitektur API JWT.

---

## Row Level Security (RLS)
Fitur terpenting di proyek ini adalah **Row Level Security (RLS)** PostgreSQL. RLS dihidupkan untuk **seluruh** tabel publik.
Aturan dasarnya adalah: **Semua *endpoint* akan memblokir 100% pembacaan atau penulisan data jika `auth.uid()` tidak sama dengan kolom pemilik *record*.** Pengecualian hanya diberikan secara selektif kepada entitas administrator.

**Referensi Kebijakan:**
- File definisi RLS lengkap dapat dilihat pada: `sql/rls_policies.sql`.
- Saat mendeploy *environment* baru, **selalu** pastikan mengeksekusi file SQL ini.

---

## Mitigasi Cross-Site Scripting (XSS)
Sebagai *Single Page Application* (SPA) yang merender string HTML statis melalui Javascript DOM, terdapat risiko **Cross-Site Scripting (XSS)** apabila pengguna meng-*input* payload perusak `<script>`.
Untuk mengatasi hal ini, modul internal `js/core/utils.js` telah memiliki fungsi bawaan:
- **`escapeHTML(str)`**: Menghilangkan karakter-karakter spesial HTML (`<`, `>`, `&`, `"`, `'`) dengan entity yang aman.
- **`escapeAttr(str)`**: Mengubah *input* menjadi atribut HTML yang aman.

Segala data dinamis yang ditarik dari *database* (misalnya: *Nama Siswa*, *Catatan Jurnal*) yang diinjeksi melalui *template literals* selalu dilewatkan ke fungsi sanitasi ini terlebih dahulu sebelum dirender oleh `innerHTML`.

---

## Content-Security-Policy (CSP)
Direkomendasikan agar platform hosting (misal: Netlify/Vercel) menambahkan *HTTP Header* **Content-Security-Policy (CSP)** untuk perlindungan tambahan dari eksekusi *script* jarak jauh (RCE).
Contoh implementasi Header yang aman:
```text
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co;
```

---

## Monitoring & Analytics
Jika ada anomali atau intrusi yang tertangkap sebagai *Error* JavaScript, kita wajib mencatatnya. Aplikasi ini siap dihubungkan dengan layanan Sentry atau LogRocket.
- Cukup isi nilai `VITE_ANALYTICS_PROVIDER` di dalam berkas `.env` dengan kata `sentry` atau `logrocket`.
- Konfigurasi `VITE_SENTRY_DSN` atau `VITE_LOGROCKET_ID`.
- Semua *error* yang ditangkap oleh `logError()` secara cerdas akan diteruskan ke panel analitik secara *real-time*.

---

## Enkripsi NIK (PPDB)
NIK dienkripsi AES di browser (`js/ppdb/db.js`, fungsi `getEncryptionKey()`) sebelum disimpan ke `biodata_siswa.nik`.

> **Batasan:** semua variabel `VITE_*` ditanam ke bundle JavaScript. Siapa pun yang membuka `dist/assets/*.js` di browser bisa membaca kuncinya. Enkripsi client-side **tidak** melindungi NIK dari pembaca bundle; ia hanya mencegah NIK tersimpan sebagai teks polos di tabel.

**Sumber kunci:**
- Produksi (CI): GitHub Secret `VITE_ENCRYPTION_KEY`, diteruskan ke step `Build` di `.github/workflows/deploy.yml`. Jika kosong, build tetap jalan dengan peringatan dan aplikasi memakai kunci fallback yang tidak aman.
- Lokal: `.env.development.local` (hanya dimuat `npm run dev`, diabaikan git). Jangan menaruh kunci di `.env`, karena Vite memuat `.env` di semua mode termasuk `vite build`.

**Rotasi kunci:** isi kunci lama ke Secret `VITE_ENCRYPTION_KEY_LEGACY` dan kunci baru ke `VITE_ENCRYPTION_KEY`. Saat dekripsi, aplikasi mencoba kunci utama, lalu kunci legacy, lalu fallback. Data baru selalu dienkripsi dengan kunci utama.

**Langkah lanjutan yang direkomendasikan:** pindahkan enkripsi/dekripsi ke server (RPC Postgres dengan `pgcrypto`/Supabase Vault, atau Edge Function) supaya kunci tidak pernah dikirim ke browser, dan batasi dekripsi hanya untuk role yang berwenang.

---

## Security Checklist untuk Reviewer
Setiap ada *Pull Request* atau penambahan fitur baru, *Reviewer* (Pemeriksa) wajib mengecek:
- [ ] **Auth**: Apakah modul ini mengecek hak akses (role) pengguna secara implisit menggunakan `checkAuth()`?
- [ ] **RLS**: Jika modul ini membuat tabel baru, apakah skrip pembuatan RLS-nya sudah disertakan dan di-*enable*?
- [ ] **Sanitasi**: Apakah pengolahan DOM *innerHTML* menyaring seluruh input *user* memakai `escapeHTML()`?
- [ ] **CSP**: Apakah *assets* (CSS/JS/Fonts) eksternal ditarik dari domain yang disetujui CSP?
