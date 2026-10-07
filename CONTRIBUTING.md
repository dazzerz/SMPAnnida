# Contributing — Alur Kerja Kontributor SMP Annida

> Baca `MUST_READ_FIRST.md` dulu. Dokumen ini mengatur cara berkontribusi
> agar perubahan aman, teraudit, dan tidak mengulangi bug lama.

## 1. Branch & Pull Request

- Branch `main` = produksi (deploy otomatis ke GitHub Pages).
- Buat branch fitur: `feat/<topik>`, fix: `fix/<topik>`, docs: `docs/<topik>`.
- Satu PR = satu tujuan. Sertakan: ringkasan, file diubah, hasil 3 test,
  tangkapan layar bila menyentuh UI/mobile.

## 2. Checklist wajib sebelum PR (reviewer menolak bila gagal)

- [ ] Baca dokumen urutan `MUST_READ_FIRST.md` yang relevan dengan perubahan.
- [ ] Cari pola existing via search; tidak membuat sistem paralel (drawer,
      auth, sanitasi, query).
- [ ] Auth: entry baru memanggil `requireAuth()`; tabel baru + RLS enabled.
- [ ] Sanitasi: `innerHTML` dinamis via `escapeHTML()`/`escapeAttr()`.
- [ ] Drawer: tanpa controller baru, tanpa inline style, token z-index resmi,
      breakpoint 1024, `?v=` bila link CSS inti.
- [ ] Env: kunci rahasia tidak di-commit; `.env.example` + workflow + docs
      diperbarui bila tambah variabel.
- [ ] Hijau: `npm test` + `npm run test:drawer` + `npm run test:integrity`.

## 3. Conventional Commits (wajib)

`<type>(<scope>): <deskripsi singkat>`

- Type: `feat`, `fix`, `refactor`, `perf`, `chore`, `docs`, `test`.
- Scope populer: `(sidebar)`, `(drawer)`, `(mobile)`, `(security)`, `(cache)`,
  `(pwa)`, `(academic)`, `(finance)`, `(ppdb)`, `(analytics)`.
- Contoh: `fix(sidebar): drawer mobile nyangkut di semua halaman`,
  `docs: tambah pintu wajib baca MUST_READ_FIRST`.

## 4. Reviewer

Gunakan `security.md` §7 + checklist di atas. Perubahan drawer/layout wajib
diuji di viewport HP (≤1024px): buka → klik menu → backdrop hilang bersih.
