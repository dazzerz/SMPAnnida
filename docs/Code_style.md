# Panduan Gaya Penulisan Kode (Code Style Guide) - SMP Annida

Dokumen ini merupakan panduan standar resmi penulisan kode (*coding standard & conventions*) untuk proyek aplikasi web **SMPAnnida**. Seluruh aturan, pola, dan contoh yang tercantum di sini diekstraksi langsung dari implementasi nyata pada *codebase* proyek (`js/core/`, `js/ppdb/`, `js/academic/`, `js/finance/`, `js/student/`, `css/`, dan `scripts/`).

Setiap pengembang maupun kontributor wajib mematuhi panduan ini guna menjaga konsistensi, kebersihan arsitektur, dan keamanan sistem.

---

## Daftar Isi
1. [Konvensi Penamaan (Naming Conventions)](#1-konvensi-penamaan-naming-conventions)
2. [Struktur Berkas JavaScript (File Structure & Module Pattern)](#2-struktur-berkas-javascript-file-structure--module-pattern)
3. [Pola Async/Await & Penanganan Error (Error Handling)](#3-pola-asyncawait--penanganan-error-error-handling)
4. [Konvensi HTML (ID & Data Attributes)](#4-konvensi-html-id--data-attributes)
5. [Konvensi CSS (Class Naming & Specificity Rules)](#5-konvensi-css-class-naming--specificity-rules)
6. [Keamanan Kode (XSS Sanitization & Data Protection)](#6-keamanan-kode-xss-sanitization--data-protection)
7. [Komentar & Dokumentasi (Header Comments & Section Dividers)](#7-komentar--dokumentasi-header-comments--section-dividers)
8. [Import & Export (ES Modules Pattern)](#8-import--export-es-modules-pattern)
9. [Pola Kueri Supabase (Database Query Patterns)](#9-pola-kueri-supabase-database-query-patterns)
10. [Konvensi Commit Git (Git Commit Convention)](#10-konvensi-commit-git-git-commit-convention)

---

## 1. Konvensi Penamaan (Naming Conventions)

### 1.1 Variabel dan Properti Objek (`camelCase`)
Variabel biasa, parameter fungsi, dan properti objek ditulis menggunakan format `camelCase`. Hindari singkatan yang ambigu.
```javascript
// Contoh dari js/student/dashboard.js & js/finance/entry.js
let currentStudent = null;
let currentUser = null;
let activeCategory = 'academic';
let currentSection = 'transactions';
const studentClass = student.classes?.nama_kelas || student.kelas || '7A';
```

### 1.2 Konstanta Global & Token Arsitektur (`UPPER_SNAKE_CASE`)
Konstanta tingkat modul yang nilainya tetap (statis) atau menjadi acuan konfigurasi sistem ditulis menggunakan huruf kapital penuh dengan garis bawah (`UPPER_SNAKE_CASE`).
```javascript
// Contoh dari js/core/layout.js & js/finance/entry.js
export const DRAWER_BREAKPOINT = 1024;
const DRAWER_OVERLAY_ID = 'sidebar-overlay';
const PAGE_SIZE = 10;
const TOPBAR_CONFIG = {
  transactions: { greeting: 'Kelola', title: 'Transaksi' },
  budget: { greeting: 'Kelola', title: 'Budget Bulanan' }
};
```

### 1.3 Penamaan Fungsi Berdasarkan Kegunaan
Nama fungsi ditulis menggunakan format `camelCase` dengan kata kerja pembuka yang deskriptif:

| Pola | Kategori | Contoh Riil di Proyek |
| :--- | :--- | :--- |
| `handle*` | *Event listener / form submit* | `handleLogin(e)`, `handleLogout()`, `handleFileSelected(file)`, `handleAcademicHashChange()` |
| `init*` | Inisialisasi modul / siklus hidup (*lifecycle*) | `initAuthPage()`, `initStudentSession()`, `initTabNavigation()`, `initSection(sectionId)` |
| `fetch*` / `load*` | Pengambilan data dari Supabase/API | `fetchTransactions()`, `fetchMyRegistrationStatus()`, `loadTodaySchedules()`, `loadAttendanceHistory()` |
| `render*` | Manipulasi DOM & pemetaan template HTML | `renderAdminTable(data)`, `renderStudentProfile()`, `renderBudgetCards()`, `renderPagination()` |
| `update*` | Pembaruan status UI parsial | `updateTimelineUI(status)`, `updateAdminKPIs()`, `updateActiveSidebar()`, `updateThemeIcon()` |
| `show*` | Presentasi pesan/toast ke pengguna | `showToast(message, type)`, `showAuthMessage(msg, type)` |
| `is*` / `get*` | Fungsi penentu kondisi (*boolean*) / pengambil objek | `isMobileDrawerViewport()`, `getDrawerOverlay()`, `getOptionalUser()` |

### 1.4 Penamaan Berkas (File Naming)
- **JavaScript**: Menggunakan format `kebab-case.js` atau kata tunggal deskriptif.
  - Core: `auth.js`, `supabase.js`, `utils.js`, `layout.js`, `analytics.js`
  - Academic: `teacher-attendance.js`, `authState.js`, `main.js`, `siswa.js`, `jurnal.js`
  - Finance: `entry.js`, `transactions.js`, `budget.js`, `syahriah.js`, `import.js`
  - PPDB: `auth.js`, `db.js`
- **CSS**: Menggunakan format `kebab-case.css` atau nama komponen.
  - `style.css`, `theme.css`, `mobile.css`, `absensi.css`, `dashboard.css`, `drawer.css`
- **HTML**: Menggunakan format `kebab-case.html`.
  - `index.html`, `login.html`, `dashboard.html`, `dashboard-admin.html`, `dashboard-wali.html`

### 1.5 Penamaan Kelas CSS (`kebab-case`)
Semua *class* CSS menggunakan format `kebab-case` semantik yang mencerminkan komponen atau modifikatornya.
```css
/* Contoh dari css/theme/layout.css & css/style.css */
.split-rail-container
.split-rail-bar
.split-rail-panel
.rail-btn
.glass-panel
.bento-grid
.bento-card
.sidebar-overlay
```

---

## 2. Struktur Berkas JavaScript (File Structure & Module Pattern)

Setiap berkas JavaScript diatur dengan urutan blok yang konsisten agar mudah dibaca dan dipelihara.

### 2.1 Urutan Penulisan (*Structure Order*)
1. **Pemberitahuan Lisensi / Catatan Arsitektur** (jika ada catatan RLS atau audit).
2. **Komentar Header Modul** (`// =====================================================`).
3. **Pernyataan Import (ES Modules)**, dikelompokkan secara logis:
   - Modul pemantauan / analitik inti (`analytics.js`)
   - Supabase Client (`supabase.js`)
   - Modul utilitas & otentikasi inti (`utils.js`, `auth.js`)
   - Komponen tata letak (`layout.js`)
   - Modul fitur/rekanan (*sibling modules*)
   - Pustaka eksternal (*third-party*)
4. **State / Variabel Tingkat Modul** (*Module-scoped state variables*).
5. **Fungsi Utama / Inisialisasi Siklus Hidup** (`main()` atau listener `DOMContentLoaded`).
6. **Fungsi Internal / Pembantu (*Helper & Render Functions*)**.
7. **Pernyataan Export** (untuk fungsi publik).
8. **Pengikatan Global (*Window Global Bindings*)** (jika dibutuhkan handler inline DOM).

### 2.2 Contoh Anatomi Berkas Nyata
Diadaptasi dari `js/finance/entry.js`:
```javascript
// =====================================================
// ANNIDA2FINANCE - SPA Entry Point
// Unified controller for all finance sub-pages
// =====================================================

// 1. Core & Architecture Imports
import { logError } from '../core/analytics.js';
import supabaseClient from '../core/supabase.js';
import { requireAuth, handleLogout } from '../core/auth.js';
import { injectSidebar, injectTopbar } from '../core/layout.js';
import { showToast, escapeHTML, escapeAttr, formatCurrency } from '../core/utils.js';

// 2. Feature Sibling Imports
import { fetchTransactions, renderTransactionsTable } from './transactions.js';
import { fetchBudgets, renderBudgetCards } from './budget.js';

// 3. Module State
let userId = null;
let currentSection = 'transactions';
const sectionInited = {};

// 4. Configuration Constants
const TOPBAR_CONFIG = {
  transactions: {
    greeting: 'Kelola',
    title: 'Transaksi',
    rightHtml: '<button class="btn btn-primary btn-sm" id="add-transaction-btn">＋ Tambah Transaksi</button>'
  }
};

// 5. Lifecycle Entry Point
async function main() {
  const user = await requireAuth();
  if (!user) return;

  userId = user.id;
  injectSidebar('sidebar');
  injectTopbar('topbar', TOPBAR_CONFIG.transactions);

  // Setup awal event & section
  initTransactions();
}

// 6. Component Initializers & Event Delegation
function initTransactions() {
  document.getElementById('transactions-tbody')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      // logic edit...
    }
  });
}

// 7. Execute main
main();
```

---

## 3. Pola Async/Await & Penanganan Error (Error Handling)

Aplikasi SMPAnnida menggunakan arsitektur *serverless* berbasis Supabase, sehingga hampir seluruh operasi I/O bersifat *asynchronous*.

### 3.1 Selalu Gunakan `async`/`await` daripada Chaining `.then()`
Hindari *callback hell* atau deretan `.then()`. Gunakan *destructuring* langsung dari respons Supabase `{ data, error, count }`.

### 3.2 Penanganan Error Standar
Setiap pemanggilan async wajib berada dalam blok `try...catch`, memeriksa `error` dari Supabase, mencatat anomali melalui `logError()`, dan memberikan umpan balik manusiawi kepada pengguna via `showToast()` atau `showAuthMessage()`.

```javascript
// Contoh dari js/ppdb/auth.js & js/finance/transactions.js
try {
  const { data, error } = await supabaseClient
    .from('transactions')
    .insert([payload]);

  if (error) throw error;

  showToast('Transaksi berhasil ditambahkan!', 'success');
  loadTransactions();
} catch (err) {
  console.error('Gagal menambah transaksi:', err);
  logError(err);
  showToast('Gagal menyimpan: ' + err.message, 'error');
}
```

### 3.3 Indikator Status Loading Pada Tombol Aksi
Ketika form disubmit, tombol aksi wajib dimatikan (`disabled = true`) dan teksnya diubah untuk mencegah *double submit*. Gunakan blok `finally` untuk mengembalikan status tombol.

```javascript
// Contoh pola tombol dari js/ppdb/db.js (saveSiswaForm)
const saveBtn = document.getElementById('btn-save-form');
saveBtn.disabled = true;
saveBtn.textContent = '⏳ Menyimpan...';

try {
  const { error } = await db.from('pendaftaran').update({ status_pendaftaran: 'Verifikasi' }).eq('id', pId);
  if (error) throw error;
  showToast('Data berhasil disimpan.', 'success');
} catch (err) {
  showToast('Terjadi kesalahan: ' + err.message, 'error');
} finally {
  saveBtn.disabled = false;
  saveBtn.textContent = '💾 Simpan & Update Data';
}
```

### 3.4 Pemuatan Paralel dengan `Promise.allSettled`
Untuk dashboard yang memuat banyak modul sekaligus (seperti portal siswa), gunakan `Promise.allSettled` agar kegagalan kueri pada satu widget tidak menghentikan widget lainnya:

```javascript
// Contoh dari js/student/dashboard.js
await Promise.allSettled([
  loadTodaySchedules(student),
  loadAssignments(student),
  loadAttendanceHistory(student),
  loadTahfidzRecords(student),
  loadGrades(student)
]);
```

---

## 4. Konvensi HTML (ID & Data Attributes)

Struktur markup HTML dirancang untuk bekerja secara mulus dengan manipulasi JavaScript dan delegasi event.

### 4.1 Penamaan ID Elemen (`kebab-case`)
Gunakan format `kebab-case` yang semantik dan menunjukkan peran elemen:
- Elemen Input Form: `id="login-email"`, `id="login-password"`, `id="modal-amount"`
- Kontainer Target Render: `id="table-pendaftar-body"`, `id="today-schedules-list"`, `id="toast-container"`
- Tombol Utama: `id="btn-save-form"`, `id="sidebar-panel-toggle"`, `id="mobile-menu-btn"`
- Indikator Statistik (Bento Grid): `id="stat-kelas-total"`, `id="stat-siswa-hadir"`

### 4.2 Penggunaan Atribut `data-*`
Atribut `data-*` digunakan secara ekstensif untuk menghubungkan DOM ke logika aplikasi tanpa mengotori class CSS:

| Atribut | Tujuan Penggunaan | Contoh Kode Riil |
| :--- | :--- | :--- |
| `data-target` | Target navigasi tab / SPA routing | `<a class="nav-item" data-target="transactions">` |
| `data-category` | Pengelompokan rail bar multi-modul | `<button class="rail-btn" data-category="academic">` |
| `data-action` | Delegasi aksi tombol (edit, delete, dll) | `<button data-action="delete" data-id="123">Hapus</button>` |
| `data-toggle-password` | Toggle visibilitas password | `<button data-toggle-password="login-password">👁️</button>` |
| `data-page` / `data-idx` | Penanda indeks baris / halaman paginasi | `<button data-action="goto-page" data-page="2">` |
| `data-label` | Label kolom responsif pada sel tabel seluler | `<td data-label="Nama Siswa">Ahmad</td>` |
| `data-tooltip` | Konten tooltip saat sidebar menciut | `<a class="nav-item" data-tooltip="Data Siswa">` |

### 4.3 Contoh Delegasi Event Berbasis `data-action`
Hindari memasang event listener individual di dalam perulangan (`forEach`). Gunakan delegasi event pada elemen induk (*parent element*):

```javascript
// Contoh dari js/finance/entry.js
document.getElementById('transactions-tbody')?.addEventListener('click', async (e) => {
  const editBtn = e.target.closest('[data-action="edit"]');
  const deleteBtn = e.target.closest('[data-action="delete"]');

  if (editBtn) {
    const transactionId = editBtn.getAttribute('data-id');
    openEditModal(transactionId);
  }
  if (deleteBtn) {
    const transactionId = deleteBtn.getAttribute('data-id');
    confirmDelete(transactionId);
  }
});
```

---

## 5. Konvensi CSS (Class Naming & Specificity Rules)

Gaya visual SMP Annida menggabungkan prinsip *Warm Light Theme (Islamic, Modern, Nature)* berbasis WCAG AAA/AA, tata letak Bento Grid, dan Glassmorphism terkontrol.

### 5.1 Skala Token Z-Index Resmi
Untuk mencegah terulangnya bug *backdrop/drawer nyangkut*, **dilarang keras** menuliskan angka z-index sembarangan di berkas CSS komponen. Gunakan variabel token arsitektur yang didefinisikan di `css/theme/layout.css`:

```css
/* Skala z-index resmi SMPAnnida */
:root {
  --z-content: 1;              /* Konten utama halaman */
  --z-topbar: 1000;            /* Bilah navigasi atas (sticky) */
  --z-drawer-backdrop: 1150;   /* Layar gelap penutup mobile */
  --z-drawer: 1200;            /* Panel drawer sidebar mobile */
  --z-modal: 9999;             /* Dialog modal & overlay popup */
  --z-toast: 10000;            /* Notifikasi mengambang (toast) */
}
```

> [!WARNING]
> Jangan pernah menggunakan nilai warisan seperti `z-index: 9998` atau menetapkan `z-index` acak pada elemen tata letak. Pagar otomatis `scripts/test-drawer-guards.js` akan menggagalkan build jika menemukan pelanggaran ini.

### 5.2 Aturan Single Drawer Controller & Penempatan Backdrop
- **Backdrop Tunggal**: Definisi `.sidebar-overlay` hanya boleh berada di `css/theme.css` / `css/theme/layout.css`.
- **Penempatan DOM**: Elemen backdrop `.sidebar-overlay` **wajib** diletakkan sebagai saudara kandung (*sibling*) dari drawer (`drawer.parentElement`), bukan langsung di dalam `<body>`. Ini menjaga drawer dan backdrop berada pada satu *stacking context*.
- **State Murni via Class**: Tampilkan atau sembunyikan drawer HANYA dengan menambah/menghapus class `.open`, `.active`, `.show`. **Dilarang keras mengubah `.style.display`, `.style.opacity`, atau `.style.pointerEvents` melalui JavaScript.**

```javascript
// Cara membuka/menutup drawer yang BENAR (dari js/core/layout.js)
export function setSidebar(open) {
  const drawer = getDrawerElement();
  const shouldOpen = Boolean(open) && isMobileDrawerViewport();

  drawer.classList.toggle('open', shouldOpen);
  drawer.classList.toggle('active', shouldOpen);

  const overlay = getDrawerOverlay();
  if (overlay) {
    overlay.classList.toggle('show', shouldOpen);
    overlay.classList.toggle('active', shouldOpen);
  }
}
```

### 5.3 Breakpoint Responsif
Standar batas perangkat di seluruh aplikasi disinkronkan pada `1024px`:
```javascript
export const DRAWER_BREAKPOINT = 1024;
```
Di CSS:
```css
/* Tablet & Ponsel (Drawer aktif) */
@media (max-width: 1024px) {
  .sidebar.split-rail-container {
    position: fixed !important;
    transform: translateX(-100%) !important;
    z-index: var(--z-drawer) !important;
  }
}

/* Desktop (Drawer statis, overlay non-aktif) */
@media (min-width: 1025px) {
  .sidebar-overlay {
    display: none !important;
    pointer-events: none !important;
  }
}
```

### 5.4 Cache-Buster pada Tautan CSS
Setiap pemanggilan berkas CSS inti di berkas HTML wajib menyertakan parameter versi query string (`?v=...`) untuk mencegah cache browser mobile lama:
```html
<link rel="stylesheet" href="../../css/style.css?v=20260927" />
<link rel="stylesheet" href="../../css/mobile.css?v=20260927" />
<link rel="stylesheet" href="../../css/theme.css?v=20260927" />
```

---

## 6. Keamanan Kode (XSS Sanitization & Data Protection)

### 6.1 Sanitasi Ketat: Tanpa Raw User Data di `innerHTML`
Setiap string yang bersumber dari input pengguna atau kueri database (seperti nama siswa, nomor registrasi, catatan jurnal, deskripsi transaksi) **wajib disaring** sebelum disisipkan ke dalam *template literal* DOM:

- **`escapeHTML(str)`**: Untuk teks isi di dalam elemen HTML (`<td>`, `<div>`, `<p>`).
- **`escapeAttr(str)`**: Untuk nilai atribut HTML (`value="..."`, `title="..."`, `placeholder="..."`).

```javascript
// Contoh dari js/core/utils.js
export function escapeHTML(str) {
  if (!str) return '-';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

**Pola Penggunaan Riil:**
```javascript
// Dari js/finance/entry.js
tbody.innerHTML = parsedRows.map((r, i) => `
  <tr id="import-row-${i}">
    <td>${escapeHTML(r.date)}</td>
    <td>${escapeHTML(r.description)}</td>
    <td title="${escapeAttr(r.categoryName)}">${escapeHTML(r.categoryName)}</td>
    <td>
      <input type="text" value="${escapeAttr(r.description)}" />
    </td>
  </tr>
`).join('');
```

### 6.2 Enkripsi Data Sensitif (PII - Personally Identifiable Information)
Nomor Induk Kependudukan (NIK) siswa disimpan dalam database dalam keadaan terenkripsi menggunakan algoritma AES-256 (`CryptoJS.AES`):

```javascript
// Enkripsi sebelum disimpan ke DB (js/ppdb/db.js)
const secretKey = import.meta.env.VITE_ENCRYPTION_KEY || 'AnnidaPDP2026Rahasia!';
const encryptedNik = nik ? CryptoJS.AES.encrypt(nik, secretKey).toString() : null;

// Dekripsi saat dibaca
function decryptNik(encryptedText) {
  if (!encryptedText) return '-';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedText;
  } catch (e) {
    return encryptedText;
  }
}
```

### 6.3 Otorisasi Peran (RBAC) Terpusat
Jangan mengasumsikan hak akses (role) hanya berdasarkan alamat email atau metadata klien. Selalu gunakan helper `resolveUserRole()` yang memvalidasi ke tabel `user_roles` atau RPC server `get_user_role`:

```javascript
// Contoh dari js/core/auth.js & js/student/dashboard.js
const { data: { user } } = await db.auth.getUser();
if (!user) {
  window.location.href = '../../login.html';
  return;
}

const role = await resolveUserRole(user);
if (role !== 'admin' && role !== 'teacher') {
  showToast('Akses ditolak: Anda tidak memiliki wewenang.', 'error');
  window.location.href = '../../index.html';
  return;
}
```

> [!IMPORTANT]
> Mode tamu (*Guest Mode*) telah dihapus total dari arsitektur aplikasi sejak audit 2026-09-27. Seluruh dashboard privat mewajibkan sesi login Supabase Auth yang sah.

---

## 7. Komentar & Dokumentasi (Header Comments & Section Dividers)

### 7.1 Komentar Header Modul
Setiap berkas JavaScript diawali dengan blok komentar berisi informasi modul, tanggung jawab, dan riwayat audit:
```javascript
// =====================================================
// ANNIDA2FINANCE - Authentication Module
// Mode guest dihapus total (audit 2026-09-27): seluruh dashboard privat
// wajib sesi login Supabase. Halaman publik (PPDB landing/register,
// index, login) tidak memakai modul ini untuk akses data.
// =====================================================
```

### 7.2 Pembatas Seksi Logis (*Section Dividers*)
Gunakan garis pembatas tebal (*unicode line*) untuk memisahkan domain atau fitur di dalam satu berkas:
```javascript
// ── 1. INISIALISASI SESI SISWA & STRICT ROUTE GUARD ───────────────────────

// ── USER ROLE RESOLVER ────────────────────────────

// ══════════════════════════════════════════════════════
// SECTION: TRANSACTIONS
// ══════════════════════════════════════════════════════
```

### 7.3 Dokumentasi Fungsi Publik (JSDoc)
Fungsi pustaka inti (seperti di `js/core/layout.js` atau `js/core/utils.js`) wajib memiliki dokumentasi JSDoc yang mencantumkan parameter dan deskripsi fungsi:
```javascript
/**
 * Automatically populates data-label attributes on table cells from thead th,
 * enabling full-width card-view rendering on mobile without horizontal scroll.
 * @param {HTMLElement|Document} root - Elemen induk tempat tabel dicari
 */
export function enhanceTablesForMobile(root = document) { ... }
```

---

## 8. Import & Export (ES Modules Pattern)

Proyek ini menggunakan standar modul JavaScript modern ES Modules murni (`type: "module"` pada `package.json`).

### 8.1 Ekstensi Berkas Eksplisit
Saat mengimpor berkas lokal, selalu sertakan ekstensi `.js` secara eksplisit agar kompatibel dengan lingkungan Vite dan browser native:
```javascript
// BENAR
import supabaseClient from '../core/supabase.js';
import { showToast } from '../core/utils.js';

// SALAH (Menimbulkan kegagalan resolusi pada Vite native build)
import supabaseClient from '../core/supabase';
```

### 8.2 Default Export vs Named Export
- **Default Export**: Digunakan untuk *singleton instance* atau client tunggal, seperti `supabaseClient`:
  ```javascript
  // js/core/supabase.js
  export default supabaseClient;
  ```
- **Named Export**: Digunakan untuk fungsi utilitas, konstanta, atau fungsi spesifik komponen:
  ```javascript
  // js/core/utils.js
  export function formatCurrency(amount) { ... }
  export function formatDate(dateStr) { ... }
  ```

### 8.3 Dynamic Lazy Imports
Untuk modul yang berukuran besar atau hanya dimuat saat tab tertentu dibuka (misalnya modul ekspor PDF, grafik Chart.js, atau parsing Excel), gunakan *dynamic import*:
```javascript
// Contoh dari js/finance/entry.js & js/academic/main.js
const { exportToPDF } = await import('./reports.js');
const { renderReportBarChart } = await import('./charts.js');

if (hash === 'data-siswa') {
  import('./siswa.js').then(m => m.initStudentSection?.());
}
```

### 8.4 Pengikatan Global Window (`window.*`)
Karena modul ES berjalan di *module scope* terisolasi, fungsi yang dipanggil langsung oleh atribut HTML inline (`onclick="..."`) harus didaftarkan secara eksplisit ke objek `window`:
```javascript
// Contoh dari js/core/layout.js & js/ppdb/db.js
if (typeof window !== 'undefined') {
  window._closeSidebar = closeMobileSidebar;
  window._openSidebar = openMobileSidebar;
  window._setSidebar = setSidebar;
  window.viewRegistrationDetails = viewRegistrationDetails;
}
```

---

## 9. Pola Kueri Supabase (Database Query Patterns)

### 9.1 Seleksi Data Tunggal dengan `.maybeSingle()`
Gunakan `.maybeSingle()` bukan `.single()` jika record berpotensi belum dibuat. `.single()` melempar error PostgreSQL jika data berjumlah 0 baris, sedangkan `.maybeSingle()` mengembalikan nilai `null` dengan aman.

```javascript
// BENAR
const { data: student, error } = await db
  .from('students')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();

if (student) {
  // data ditemukan
}
```

### 9.2 Kueri Berelasi (*Relational Joins*)
Gunakan sintaks nested foreign-key Supabase untuk mengambil relasi tabel dalam satu kali kueri (*single trip query*):

```javascript
// Contoh dari js/student/dashboard.js
const { data: scheds, error } = await db
  .from('class_schedules')
  .select(`
    id, start_time, end_time, room, active,
    subjects ( id, nama_mapel ),
    teachers ( id, nama )
  `)
  .eq('day_of_week', 'Senin')
  .eq('active', 'Aktif');
```

```javascript
// Relasi bertingkat di js/ppdb/db.js
const { data: list, error } = await db
  .from('pendaftaran')
  .select(`
    *,
    biodata_siswa (*),
    data_orangtua (*),
    sekolah_asal (*)
  `)
  .order('created_at', { ascending: false });
```

### 9.3 Operasi Upsert dengan Klausa Konflik
Saat memperbarui data yang mungkin belum ada baris sebelumnya, gunakan `.upsert()` dengan menyertakan indeks `onConflict`:

```javascript
// Contoh dari js/ppdb/db.js
const { error } = await db
  .from('biodata_siswa')
  .upsert(biodataPayload, { onConflict: 'pendaftaran_id' });
```

### 9.4 Perhitungan Jumlah Record Eksak Tanpa Mengambil Baris
Untuk memeriksa kuota atau jumlah record, gunakan opsi `{ count: 'exact', head: true }`:
```javascript
// Contoh dari js/core/auth.js
const { count, error } = await supabaseClient
  .from('profiles')
  .select('*', { count: 'exact', head: true });

if (count >= 5) {
  showAuthMessage('Kuota pendaftaran sudah penuh.', 'error');
}
```

---

## 10. Konvensi Commit Git (Git Commit Convention)

Repositori SMPAnnida mengikuti standar **Conventional Commits**:
```
<type>(<scope>): <deskripsi singkat dalam bahasa indonesia/inggris>
```

### 10.1 Daftar Type yang Digunakan
- **`feat`**: Penambahan fitur baru ke dalam aplikasi.
- **`fix`**: Perbaikan bug atau penanganan kesalahan logika.
- **`refactor`**: Rekayasa ulang kode tanpa mengubah perilaku fitur (misal: modularisasi CSS/JS).
- **`perf`**: Optimalisasi performa (misal: lazy loading, preload aset).
- **`chore`**: Pembaruan dependensi, konfigurasi build, atau pembersihan skrip.
- **`docs`**: Penambahan atau pembaruan dokumentasi Markdown.
- **`test`**: Penambahan atau pembaruan berkas pengujian otomatis (*guards*).

### 10.2 Daftar Scope Populer di Proyek
- `(security)`: Terkait RLS, sanitasi XSS, otentikasi, atau enkripsi.
- `(mobile)`: Perbaikan tampilan perangkat seluler atau interaksi sentuh.
- `(sidebar)` / `(drawer)`: Perbaikan navigasi split-rail, toolbar, atau backdrop.
- `(cache)` / `(pwa)`: Penanganan Service Worker, cache-buster, atau kill-switch.
- `(analytics)`: Integrasi pelacak error seperti Sentry atau LogRocket.
- `(academic)` / `(finance)` / `(ppdb)`: Modul bisnis terkait.

### 10.3 Contoh Riil Riwayat Commit Repositori
```text
feat(analytics): integrate Sentry and LogRocket error tracking
fix(security): correct table names in RLS script
refactor(css): split theme & mobile files and add variables
perf: audit, lazy load js, and preload css
test(drawer): unit tests for setSidebar and document layout API
chore(ci): drawer regression guards + npm test wiring
fix(mobile): single drawer controller, sibling backdrop placement & z-index tokens
fix(cache): SW kill-switch, inline cache cleanup & CSS cache-busters
docs: add deployment, database, and security documentation
```

---

## Ringkasan Checklist untuk Pengembang

Sebelum melakukan *commit* atau mengajukan *Pull Request*, pastikan Anda telah memeriksa poin berikut:
- [ ] **Sanitasi DOM**: Semua variabel dinamis yang dimasukkan ke `innerHTML` menggunakan `escapeHTML()`, dan atribut menggunakan `escapeAttr()`.
- [ ] **Pola Supabase**: Kueri data tunggal yang bersifat opsional menggunakan `.maybeSingle()`.
- [ ] **Z-Index**: Tidak ada hardcoded z-index pada lapisan layout; menggunakan token `--z-drawer`, `--z-drawer-backdrop`, dll.
- [ ] **Drawer & Backdrop**: Tidak memodifikasi inline style `.style.display/opacity` pada sidebar atau backdrop.
- [ ] **Pencegahan Error**: Pemanggilan async dibungkus dalam `try/catch` dan mencatat kegagalan melalui `logError()`.
- [ ] **Format Commit**: Pesan commit mengikuti pola Conventional Commits `<type>(<scope>): <subject>`.
- [ ] **Integritas Guard**: Menjalankan pengujian regresi lokal melalui `npm test` dan memastikan seluruh pengujian lolos (PASS).
