# Troubleshooting (Masalah Berulang & Solusinya)

> Kumpulan bug yang SUDAH terjadi dan diperbaiki. Baca sebelum mengira
> menemukan bug baru — kemungkinan besar polanya ada di bawah.

## 1. Drawer HP nyangkut / tidak bisa diklik

**Gejala:** hamburger diketik tidak membuka, atau backdrop gelap tertinggal.
**Penyebab riil (3x terulang):** controller drawer ganda (modul pasang
listener sendiri selain `setSidebar()`), breakpoint `1023` vs `1024`,
`z-index: 101` mentah di bawah backdrop.
**Solusi:** satu controller `js/core/layout.js`; breakpoint `1024`; token
`var(--z-drawer)`; hapus listener lokal; test `npm run test:drawer`.

## 2. Konten menembus drawer yang terbuka

**Gejala:** teks/kartu terlihat di atas drawer hijau (foto bug Okt 2026).
**Penyebab:** `.app-container/.main-content/.content-area` dipaksa
`z-index: 1200` (= drawer). **Solusi:** wajib `var(--z-content, 1)`.
Urutan: konten (1) < backdrop (1150) < drawer (1200). Lihat `layout.md` §4.

## 3. Pola bunga menembus drawer

**Gejala:** motif geometri Islami tampil di atas drawer hijau.
**Penyebab:** `body::before` dipaksa `z-index: 1200`.
**Solusi:** wajib `z-index: 0` (`css/theme/layout.css`).

## 4. Layar kosong / blank screen setelah deploy

**Penyebab umum:** `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` kosong saat
build (workflow menimpa `.env.production` dengan env kosong), atau rute tidak
tersambung. **Solusi:** pastikan `.env.production` utuh; workflow JANGAN
export env kosong; cek console browser; lihat `deployment.md`.

## 5. HP menampilkan versi lama (cache nyangkut)

**Solusi:** semua halaman penuh wajib kill-switch SW di `<head>`; semua link
CSS inti wajib `?v=`; `public/sw.js` unregister + hapus cache. Jangan
`serviceWorker.register` baru.

## 6. NIK terenkripsi kunci fallback (tidak aman)

**Gejala:** console `[PPDB] VITE_ENCRYPTION_KEY kosong`, build warning
vite `warn-missing-nik-key`. **Solusi:** produksi → isi GitHub Secret
`VITE_ENCRYPTION_KEY` (+ `_LEGACY` bila rotasi); lokal → `.env.development.local`.
JANGAN taruh di `.env`/`.env.production`. Lihat `security.md` §6.

## 7. Test gagal setelah ubah CSS/JS drawer

Jalankan berurutan dan baca pesan guard-nya (ia menunjuk file & baris):
`npm test` → `npm run test:drawer` → `npm run test:integrity`.
