# WAJIB BACA SEBELUM MENGUBAH PROJECT INI

> **Untuk semua AI assistant / model / kontributor (termasuk Gemini, Muse, dsb):**
> JANGAN menulis atau mengubah kode apa pun sebelum membaca dan memahami
> dokumen di bawah. Pelanggaran pola arsitektur di bawah adalah penyebab
> utama bug berulang di project ini (drawer nyangkut, backdrop menembus,
> RLS bocor, XSS).

## Urutan baca wajib (berurutan)

1. `docs/MUST_READ_FIRST.md` — pintu masuk: peta modul, larangan keras, alur kerja aman.
2. `docs/Architecture.md` — arsitektur Vanilla ES Modules, Supabase serverless, Vite MPA.
3. `docs/Code_style.md` — konvensi kode, token z-index, single drawer controller, breakpoint 1024.
4. `docs/security.md` — RLS 100%, sanitasi `escapeHTML`, enkripsi NIK, checklist reviewer.
5. `docs/Testing.md` — `npm test`, `npm run test:drawer`, `npm run test:integrity` wajib hijau.
6. `docs/Design_system.md` — tema terang, sidebar hijau, pola botanical, bottom-nav siswa.
7. `docs/layout.md` — API `injectSidebar`/`injectTopbar`, `setSidebar`, lifecycle drawer.
8. `docs/database.md` + `docs/deployment.md` — skema & deploy (bila menyentuh data/infra).

## Larangan keras (ringkas — detail di MUST_READ_FIRST)

- Dilarang menambah `z-index` angka mentah untuk drawer/backdrop/topbar.
- Dilarang menambah controller drawer baru selain `setSidebar()` di `js/core/layout.js`.
- Dilarang menulis inline style pada drawer/backdrop dari JS.
- Dilarang mematikan/membypass RLS atau `requireAuth()`.
- Dilarang merender data dinamis via `innerHTML` tanpa `escapeHTML()`/`escapeAttr()`.
- Dilarang menaruh `VITE_ENCRYPTION_KEY` di `.env` (produksi via GitHub Secret).
- Dilarang menambah CSS tanpa cache-buster `?v=` pada link CSS inti.
- Setiap perubahan WAJIB lolos `npm test`, `npm run test:drawer`, `npm run test:integrity`.

## Cara kerja yang benar

1. Baca dokumen urutan 1–5 di atas.
2. Cari pola existing via search sebelum menambah kode baru.
3. Buat perubahan minimal, ikuti token & helper yang sudah ada.
4. Jalankan ketiga test sampai hijau sebelum commit/push.

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `antislop.md` (core) and then the skill for the task:
- UI / visual: `skills/antislop-ui/SKILL.md`
- Copy & text: `skills/antislop-copywriting/SKILL.md`
- People: `skills/antislop-human/SKILL.md`
- Mobile / responsive: `skills/antislop-layoutmobile/SKILL.md`
- Code comments: `skills/antislop-code/SKILL.md`
Before starting, ask the user when antislop applies: during the work, or after it is done.
<!-- antislop:end -->
