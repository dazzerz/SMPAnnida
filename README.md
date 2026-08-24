# SMP Annida Integrated System

## Project Overview
Sistem Informasi Manajemen Terpadu SMP Annida yang mencakup tiga modul utama: Keuangan (Finance), Akademik, dan Penerimaan Peserta Didik Baru (PPDB). Dibangun untuk mengotomatisasi pencatatan dan pengelolaan operasional sekolah dengan arsitektur Serverless.

## Features
- **Finance Module**: Manajemen RAB, Budgeting, pencatatan transaksi (Pemasukan/Pengeluaran), dan laporan keuangan.
- **Academic Module**: Manajemen absensi siswa, penjadwalan kelas, dan rekapitulasi nilai.
- **PPDB Module**: Registrasi online siswa baru, manajemen status pendaftaran, verifikasi dokumen, dan penilaian admin.
- **Centralized Layout**: Desain Glassmorphism responsif dengan navigasi Sidebar dan Topbar modular.

## Folder Structure
```text
/
├── css/             # Global and Modular CSS Tokens
├── js/              # Vanilla JS ES Modules
│   ├── core/        # Shared Utilities, Auth, DB, Layout
│   ├── finance/     # Finance Logic
│   ├── academic/    # Academic Logic
│   └── ppdb/        # PPDB Logic
├── pages/           # HTML Pages categorized by modules
├── docs/            # Project Documentation
└── index.html       # Entry Point / Auth Gateway
```

## Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES Modules).
- **Backend/DB**: Supabase (PostgreSQL, GoTrue Auth, PostgREST).
- **Design System**: Custom Glassmorphism UI (No external CSS framework).

## Installation
1. Clone the repository.
2. Initialize environment variables (see Configuration).
3. Use any static file server (e.g., Live Server, Nginx, Apache) to serve the root directory.

## Configuration
Salin file `.env.example` ke `.env` dan isi kredensial Supabase Anda (hanya jika Anda mengonversi proyek ini dengan bundler di masa depan). Untuk arsitektur saat ini (Vanilla JS), kredensial dimasukkan pada `js/core/supabase.js`.

## Deployment
Lihat `docs/deployment.md` untuk panduan lengkap. Aplikasi ini dapat di-deploy ke Vercel, Netlify, atau GitHub Pages secara langsung karena sifatnya statis.

## Environment Variables
- `SUPABASE_URL`: Endpoint REST API Supabase.
- `SUPABASE_ANON_KEY`: Kunci anonim publik untuk akses aman.

## Database Overview
Menggunakan relasi PostgreSQL. Tabel utama: `users`, `transactions`, `categories`, `budgets`, `pendaftaran`, `grades`, `schedules`. (Lihat `docs/database.md`).

## Security Notes
Aplikasi mengandalkan JWT berbasis *Local Storage* dan *Auth Guard* di sisi *client*. Wajib mengaktifkan **Row Level Security (RLS)** pada *dashboard* Supabase (Lihat `docs/security.md`).

## Contributing
Hanya untuk penggunaan internal SMP Annida.

## License
MIT License.
