# WAJIB BACA DULU — SMP Annida Integrated System

> **Instruksi untuk AI assistant / model / kontributor baru (khusus yang suka
> langsung coding, termasuk Gemini): BERHENTI. Baca file ini sampai selesai
> SEBELUM menyentuh kode apa pun. Kalau kamu melewati file ini, kemungkinan
> besar kamu akan mengulangi bug yang sudah diperbaiki berkali-kali
> (drawer HP nyangkut, backdrop menembus konten, RLS bocor, XSS tersimpan).**

## 1. Project ini apa (30 detik)

Sistem Informasi Manajemen Terpadu SMP Annida: **Vanilla JS ES Modules +
Supabase serverless + Vite MPA**. Empat modul utama:

| Modul | Halaman utama | Controller JS |
|---|---|---|
| Super Dashboard | `dashboard.html` | inline + `js/core/*` |
| Akademik | `pages/academic/dashboard.html` | `js/academic/main.js` |
| Keuangan | `pages/finance/dashboard.html` | `js/finance/entry.js`, `app.js` |
| PPDB | `pages/ppdb/*.html` | `js/ppdb/script.js`, `db.js` |
| Portal Siswa | `pages/student/dashboard.html` | `js/student/dashboard.js` |

Kode bersama: `js/core/` (`supabase.js`, `auth.js`, `layout.js`, `utils.js`,
`theme.js`). Jangan duplikasi helper — import dari sana.

## 2. Larangan keras (pelanggaran = bug berulang, test gagal)

### 2.1 Drawer / sidebar mobile (penyebab bug #1)
- **Satu controller:** `setSidebar()` di `js/core/layout.js`. Dilarang menambah
  listener hamburger/overlay/tombol-tutup di modul lain. Delegasi global di
  `layout.js` sudah menangani `#mobile-menu-btn`, `.menu-toggle`, overlay,
  tombol tutup, link menu, resize, `Escape`, `visibilitychange`.
- **Token z-index resmi** (`css/theme/layout.css`): `--z-content: 1`,
  `--z-topbar: 1000`, `--z-drawer-backdrop: 1150`, `--z-drawer: 1200`,
  `--z-sidebar: 1200` (alias), `--z-modal: 9999`, `--z-toast: 10000`.
  Urutan mutlak: konten < backdrop < drawer. Dilarang angka mentah
  (`z-index: 101`, `9998`, dsb) untuk lapisan ini.
- **Breakpoint tunggal:** `1024px` (`DRAWER_BREAKPOINT`). Dilarang `1023px`.
- **Backdrop tunggal:** definisi `.sidebar-overlay` hanya di
  `css/theme/layout.css`, diletakkan sebagai sibling drawer
  (`drawer.parentElement`), state murni via class (`.open/.show/.active`).
  Dilarang inline style dari JS.
- **Pola botanical `body::before` wajib `z-index: 0`** — pernah menembus drawer
  karena dipaksa `1200`.
- **Student portal tidak memakai `layout.js`** — navigasi HP via bottom-nav +
  sheet "Lainnya". Hamburger topbar-nya membuka sheet yang sama. Jangan
  pasang drawer split-rail di sana tanpa diskusi.
- **PPDB landing (`pages/ppdb/index.html`) punya dropdown sendiri**
  (`#mobile-menu-drawer`) — terpisah dari sistem `setSidebar`, jangan dicampur.

### 2.2 Keamanan (penyebab bug #2)
- **RLS 100% tabel publik + `requireAuth()` di semua entry.** Dilarang guest
  mode, bypass auth, atau query tanpa scoping pemilik.
- **Semua render dinamis via `innerHTML` wajib `escapeHTML()`/`escapeAttr()`**
  dari `js/core/utils.js`. Ini anti Stored XSS.
- **NIK dienkripsi AES di `js/ppdb/nik-crypto.js`** (satu-satunya sumber kunci).
  `VITE_ENCRYPTION_KEY` HANYA dari GitHub Secret produksi / lokal
  `.env.development.local`. Dilarang menaruh di `.env`/`.env.production`
  karena Vite menanamnya ke bundle.

### 2.3 Build, env, cache HP
- **Supabase URL/key produksi** dari `.env.production` (di-commit) — JANGAN
  timpa dengan env kosong di workflow (pernah bikin blank screen).
- **Semua link CSS inti wajib `?v=`** agar HP tidak terjebak cache lama.
- **Kill-switch Service Worker** wajib ada di `<head>` semua halaman penuh;
  dilarang `serviceWorker.register` baru.

## 3. Alur kerja aman (wajib)

1. Baca berurutan: `Architecture.md` → `Code_style.md` (§5) → `security.md` →
   `Testing.md` → `Design_system.md` → `layout.md`.
2. Search pola existing sebelum menambah kode (`injectSidebar`, `setSidebar`,
   `escapeHTML`, `requireAuth`).
3. Ubah minimal, ikuti token/helper yang ada. Jangan buat sistem paralel.
4. Wajib hijau sebelum commit/push:
   `npm test` (14 test) + `npm run test:drawer` (19 guard) +
   `npm run test:integrity` (7 cek).

## 4. Kalau mau menambah fitur/modul baru

- Tabel baru → sertakan RLS + `requireAuth` + sanitasi render.
- Halaman bersidebar baru → pakai `injectSidebar('sidebar')` +
  `injectTopbar('topbar', …)`, `id="sidebar"`, struktur `.app-container` +
  `.main-content`, JANGAN controller drawer sendiri.
- CSS baru → pakai token z-index & breakpoint 1024, tambah `?v=` bila link inti.
- Env baru `VITE_*` → update `.env.example` + workflow + `docs/deployment.md`.
- Tulis/rapikan test bila menyentuh drawer, auth, atau kalkulasi PPDB.

## 5. Peta dokumen lanjutan

- Arsitektur & modul: `Architecture.md`
- Gaya kode + z-index + drawer: `Code_style.md`
- Keamanan + checklist reviewer: `security.md`
- Cara menjalankan test: `Testing.md`
- Tema, sidebar hijau, botanical: `Design_system.md`
- API layout & event: `layout.md`
- Skema DB & deploy: `database.md`, `deployment.md`
