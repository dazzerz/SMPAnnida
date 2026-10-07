# Layout API — Sidebar, Topbar & Mobile Drawer

> Baca `MUST_READ_FIRST.md` dulu. Dokumen ini adalah referensi teknis pola
> layout. Melanggar pola di sini = drawer HP nyangkut (bug yang sudah
> diperbaiki 3x).

## 1. Struktur shell halaman (wajib sama di semua dashboard)

```html
<body>
  <div class="app-container">
    <aside class="sidebar" id="sidebar"></aside>
    <div class="main-content">
      <header class="topbar" id="topbar"></header>
      <!-- konten halaman -->
    </div>
  </div>
</body>
```

## 2. Functions

### `injectSidebar(containerId)`
Menginjeksi navigasi split-rail (Rail 52px + Panel 200px) ke `<aside>`.
Otomatis: render kategori, search `Ctrl+K`, toggle collapse (persist
`localStorage smpannida-panel-collapsed`), tombol tutup mobile, pembuatan
backdrop via `getDrawerOverlay()`.

```js
import { injectSidebar, injectTopbar } from '../core/layout.js';
injectSidebar('sidebar');
```

### `injectTopbar(containerId, config)`
Menginjeksi topbar (hamburger mobile + judul + aksi kanan).

```js
injectTopbar('topbar', { greeting: 'Kelola', title: 'Transaksi', rightHtml: '…' });
```

### `setSidebar(open)` — SATU-SATUNYA controller drawer
Membuka/menutup drawer mobile. Dilarang membuat controller tandingan di
modul lain (penyebab toggle ganda → backdrop nyangkut).

```js
import { setSidebar } from '../core/layout.js';
setSidebar(true);   // buka (hanya bila viewport <= 1024px)
setSidebar(false);  // tutup
```

## 3. Global Helpers
- `window._openSidebar()`, `window._closeSidebar()`, `window._setSidebar(open)`
- Delegasi klik global (sudah terpasang sekali di `layout.js`): `#mobile-menu-btn`,
  `.mobile-menu-btn`, `.menu-toggle`, `#menu-toggle`, overlay, tombol tutup,
  semua link di dalam drawer.

## 4. Breakpoint & token (tunggal, jangan diubah sepihak)

- `DRAWER_BREAKPOINT = 1024` (`js/core/layout.js`). CSS: drawer aktif di
  `@media (max-width: 1024px)`, overlay mati di `@media (min-width: 1025px)`.
- Token z-index (`css/theme/layout.css`): `--z-content: 1` < `--z-topbar: 1000` <
  `--z-drawer-backdrop: 1150` < `--z-drawer: 1200` (`--z-sidebar` alias) <
  `--z-modal: 9999` < `--z-toast: 10000`.
- `body::before` (pola botanical) wajib `z-index: 0`; `.app-container` dkk
  wajib `z-index: var(--z-content)`. Pernah keduanya `1200` → konten & pola
  menembus drawer.

## 5. Penempatan backdrop (stacking context)

`getDrawerOverlay()` membuat `.sidebar-overlay` sebagai **sibling drawer**
(`drawer.parentElement`), BUKAN di `<body>` — supaya satu stacking context.
Definisi CSS hanya di `css/theme/layout.css`. State murni via class
`.open/.active/.show`; dilarang inline style dari JS.

## 6. Event Listeners (Auto-Close)
Drawer otomatis ditutup saat: klik link di dalam drawer, `resize`/
`orientationchange` ke desktop, `visibilitychange: hidden`, tombol `Escape`.

## 7. Pengecualian per modul (jangan diseragamkan paksa)

- **Portal Siswa** (`pages/student/dashboard.html`, `#student-sidebar`):
  tidak memakai `layout.js`; navigasi HP via bottom-nav + sheet "Lainnya";
  hamburger topbar membuka sheet yang sama.
- **PPDB landing** (`pages/ppdb/index.html`, `#mobile-menu-drawer`): dropdown
  sederhana terpisah dari `setSidebar`; jangan dicampur.

## 8. Contoh per modul

```js
// Finance SPA (js/finance/entry.js): JANGAN listener hamburger sendiri,
// cukup panggil window._closeSidebar() setelah navigasi section.
document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

// Academic hash router (js/academic/main.js): tutup drawer setelah ganti hash.
if (window.innerWidth <= 1024 && typeof window._closeSidebar === 'function')
  setTimeout(() => window._closeSidebar(), 50);
```

