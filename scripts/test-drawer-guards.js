/**
 * test-drawer-guards.js
 * Pagar regresi untuk drawer mobile + backdrop + distribusi aset.
 *
 * Tujuan: mencegah terulangnya bug "sidebar/backdrop nyangkut di HP" yang
 * sebelumnya muncul karena (1) definisi .sidebar-overlay tersebar di banyak file
 * dengan z-index berbeda, (2) state drawer ditulis di 5-6 jalur berbeda, dan
 * (3) perbaikan tidak sampai ke HP karena Service Worker lama / cache.
 *
 * Jalankan: npm test
 */
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function check(condition, name, hint = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${name}${hint ? ` → ${hint}` : ''}`);
    failed++;
  }
}

const readText = (p) => fs.readFileSync(p, 'utf8');
const readCss = (p) => readText(p).replace(/\/\*[\s\S]*?\*\//g, ''); // tanpa komentar
const walk = (dir, ext, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, out);
    else if (entry.name.endsWith(ext)) out.push(full.replace(/\\/g, '/'));
  }
  return out;
};

const cssFiles = [...walk('css', '.css'), ...walk('src', '.css')];
const htmlFiles = [
  ...['index.html', 'login.html', 'dashboard.html'],
  // partials/*.html adalah fragmen (bukan halaman mandiri), jadi dikecualikan
  ...walk('pages', '.html').filter((f) => !f.includes('/partials/'))
];

console.log('--- DRAWER & CACHE REGRESSION GUARDS ---');

// ── 1. Backdrop hanya boleh punya SATU definisi ────────────────────────────
console.log('\n[GUARD 1] Definisi backdrop tunggal:');
const overlayOwners = cssFiles.filter((f) => /\.sidebar-overlay\s*[,{]/.test(readCss(f)));
check(
  overlayOwners.length === 1 && overlayOwners[0] === 'css/theme.css',
  'Hanya css/theme.css yang mendefinisikan .sidebar-overlay',
  `ditemukan di: ${overlayOwners.join(', ') || '(tidak ada)'}`
);
check(
  !cssFiles.some((f) => /z-index:\s*9998/.test(readCss(f))),
  'Tidak ada lagi z-index 9998 (nilai warisan yang menabrak skala z-index)'
);

// ── 2. Skala z-index memakai token ────────────────────────────────────────
console.log('\n[GUARD 2] Skala z-index drawer memakai token:');
const themeCss = readCss('css/theme.css');
check(themeCss.includes('--z-drawer-backdrop'), 'theme.css mendefinisikan token --z-drawer-backdrop');
check(themeCss.includes('--z-drawer:'), 'theme.css mendefinisikan token --z-drawer');
check(
  /\.sidebar-overlay\s*\{[^}]*z-index:\s*var\(--z-drawer-backdrop/.test(themeCss),
  'z-index backdrop memakai var(--z-drawer-backdrop)'
);
check(
  /\.sidebar\.split-rail-container\s*\{[^}]*z-index:\s*var\(--z-drawer/.test(themeCss),
  'z-index drawer mobile memakai var(--z-drawer)'
);

// ── 3. Satu pengendali state drawer ───────────────────────────────────────
console.log('\n[GUARD 3] Satu pengendali drawer (js/core/layout.js):');
const layoutJs = readText('js/core/layout.js');
check(/export function setSidebar\s*\(/.test(layoutJs), 'layout.js mengekspor setSidebar()');
check(/window\._setSidebar\s*=\s*setSidebar/.test(layoutJs), 'setSidebar() di-bind ke window._setSidebar');
check(
  !/document\.body\.appendChild\(overlay\)/.test(layoutJs),
  'Backdrop tidak di-append ke <body> (harus di konteks stacking yang sama dengan drawer)'
);
check(
  /drawer\.parentElement/.test(layoutJs),
  'Backdrop ditempatkan sebagai saudara drawer (drawer.parentElement)'
);
check(
  !/document\.addEventListener\('click',[\s\S]{0,700}?,\s*true\s*\)/.test(layoutJs),
  'Tidak ada handler klik fase-capture global yang menelan semua klik'
);
check(
  !/document\.addEventListener\('touchend'/.test(layoutJs),
  'Tidak ada handler touchend global untuk drawer'
);

// ── 4. Tidak ada lagi penulisan state drawer lewat inline style ───────────
console.log('\n[GUARD 4] State drawer murni lewat class:');
const jsFiles = walk('js', '.js');
const shimFiles = walk('src', '.js');
const inlineStyleOffenders = [...jsFiles, ...shimFiles].filter((f) =>
  readText(f).split(/\r?\n/).some((line) => line.includes('sidebar-overlay') && /\.style\./.test(line))
);
check(
  inlineStyleOffenders.length === 0,
  'Tidak ada JS yang menulis inline style pada backdrop drawer (display/opacity/pointerEvents)',
  `pelanggar: ${inlineStyleOffenders.join(', ')}`
);

// ── 5. Kill-switch Service Worker & cache ─────────────────────────────────
console.log('\n[GUARD 5] Kill-switch Service Worker & cache:');
check(fs.existsSync('public/sw.js'), 'public/sw.js (kill-switch) ada');
if (fs.existsSync('public/sw.js')) {
  const swJs = readText('public/sw.js');
  check(/registration\.unregister\(\)/.test(swJs), 'sw.js meng-unregister dirinya sendiri');
  check(/caches\.delete\(/.test(swJs), 'sw.js menghapus seluruh cache lama');
}
check(
  !htmlFiles.some((f) => /serviceWorker\.register|navigator\.serviceWorker\.register/.test(readText(f))),
  'Tidak ada halaman yang mendaftarkan Service Worker baru'
);
const pagesWithKillSwitch = htmlFiles.filter((f) => /serviceWorker' in navigator[\s\S]{0,120}getRegistrations/.test(readText(f)));
check(
  pagesWithKillSwitch.length === htmlFiles.length,
  'Semua halaman memasang kill-switch SW + pembersih cache di <head>',
  `${pagesWithKillSwitch.length}/${htmlFiles.length} halaman`
);

// ── 6. Cache-buster pada CSS inti (theme/mobile/style) ───────────────────
console.log('\n[GUARD 6] Cache-buster CSS inti:');
const missingBuster = [];
for (const file of htmlFiles) {
  const html = readText(file);
  const links = html.match(/href="[^"]*css\/(theme|mobile|style)\.css[^"]*"/g) || [];
  for (const link of links) {
    if (!link.includes('?v=')) missingBuster.push(`${file}: ${link}`);
  }
}
check(
  missingBuster.length === 0,
  'Semua link css/theme.css, css/mobile.css, css/style.css memakai ?v=',
  missingBuster.slice(0, 5).join(' | ')
);

console.log('\n--- SUMMARY ---');
console.log(`Total Passed: ${passed}, Total Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
}
console.log('DRAWER GUARDS PASSED ✅\n');
