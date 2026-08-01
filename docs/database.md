# Database Schema Overview

Sistem menggunakan Supabase PostgreSQL dengan skema tabel utama:

- `users` / `auth.users`: Data inti dan profil otentikasi.
- `transactions`: Menyimpan riwayat pemasukan dan pengeluaran finansial.
- `categories`: Metadata kategori transaksi dan pengaturan UI (*Icon, Color*).
- `budgets`: Pencatatan batas anggaran bulanan per kategori.
- `pendaftaran`: Berisi formulir data calon siswa PPDB (identitas, sekolah asal, wali).
- `grades`: Rekapitulasi nilai mata pelajaran siswa.
- `schedules`: Pemetaan jadwal kelas, jam, hari, dan guru mata pelajaran.

*Catatan: Semua kueri DML dieksekusi secara langsung dari aplikasi klien ke REST API Supabase. Integritas data dijaga murni oleh Policy RLS.*
