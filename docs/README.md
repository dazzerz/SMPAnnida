# SMP Annida Documentation Hub

Selamat datang di pusat dokumentasi teknis Sistem Informasi Manajemen SMP Annida. Folder `docs` ini berisi semua panduan operasional, arsitektur, dan keamanan untuk memastikan bahwa aplikasi berjalan secara handal, aman, dan dapat dimodifikasi oleh tim *engineer*.

Semua file ditulis dalam bentuk *Markdown* dan ditujukan untuk dibuka melalui *Code Editor* / IDE (seperti VSCode) atau langsung dibaca di repositori Github Anda.

## Daftar Dokumen

Berikut adalah berkas-berkas teknis yang tersedia di folder ini. Anda dapat menahan tombol **CTRL** lalu mengklik tautan di bawah ini (pada IDE yang kompatibel) untuk langsung melompat ke berkas tersebut:
- [MUST_READ_FIRST.md](MUST_READ_FIRST.md) — **WAJIB DIBACA DULU** oleh AI/model/kontributor sebelum mengubah kode (peta modul, larangan keras, alur aman).


- [deployment.md](deployment.md) � Panduan lengkap tata cara melakukan *hosting* aplikasi dan pengaturan *environment variables* (Vercel, Netlify, Github Pages).
- [database.md](database.md) � Penjabaran arsitektur Skema Database Supabase, tabel-tabel utama, relasi antar tabel (ERD), dan *query* dasar.
- [security.md](security.md) � Mitigasi keamanan mendasar seperti RLS (Row Level Security), *escaping* Anti-XSS, header CSP, dan pedoman pengecekan kode baru.
- [layout.md](layout.md) � Referensi pustaka (API) UI untuk komponen antarmuka, *mobile sidebar drawer*, navigasi, dan pendengar event (*event listeners*).
- [css_refactor.md](css_refactor.md) � Panduan tata letak struktural baru paska-pemecahan (*splitting*) file CSS monolitik dan cara menggunakan variabel-variabel desain global.

## Instruksi Tambahan (Untuk IDE)
Jika Anda menggunakan *Visual Studio Code*, Anda bisa menginstal ekstensi seperti **Markdown Preview Enhanced** atau menggunakan fitur bawaan (tekan `Ctrl+Shift+V` pada Windows atau `Cmd+Shift+V` pada Mac) untuk merender tabel dan diagram `mermaid` (*flowchart*) dengan sempurna!
