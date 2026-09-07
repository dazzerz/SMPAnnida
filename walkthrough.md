# Role-Based Access Control & Database RLS Implemented

## Frontend Auth Guards (js/core/auth.js)
* **Role Fetching**: Sistem sekarang menarik profil *role* (user_roles) di Supabase setiap kali fungsi equireAuth() dipanggil, dan menyimpannya ke sessionStorage untuk sinkronisasi rendering sidebar.
* **URL Protection**: 
  * Jika Guru mencoba memaksa masuk ke /pages/finance/... lewat URL bar, mereka akan langsung terpental ke /pages/academic/dashboard.html.
  * Begitu pun Bendahara (finance) tidak dapat masuk ke modul /academic/.
  * Calon Siswa dikunci permanen di portal pendaftarannya.

## Dynamic Sidebar & Pembina Constraints (js/core/layout.js)
* Sidebar merender daftar menu sesuai role (contoh: menu Keuangan akan di-remove dari DOM jika role pengguna adalah Guru).
* Khusus untuk pembina, saya telah membuat injeksi CSS dinamis (.role-pembina) yang secara otomatis menyembunyikan semua tombol mutasi data (Simpan, Edit, Hapus, Tambah) dan mem-blok interaksi pada form (input, textarea, select), menciptakan **Global Read-Only Mode**.

## Supabase RLS (supabase/migrations/20260819_rbac_rls.sql)
Saya telah membuatkan SQL *Migration Script* yang menargetkan persis dengan penamaan tabel pada kode JavaScript:
* **Academic Tables** (	eachers, grades, ttendance_students, dll)
* **Finance Tables** (	ransactions, udgets, salary_slips, dll)
* **PPDB Tables** (pendaftaran, iodata_siswa, dll)

Kebijakan yang diterapkan:
1. Admin memiliki wewenang *Full Access* (Select & Write) di mana-mana.
2. Pembina memiliki wewenang *Select-Only* di semua tabel, dan tidak diberikan akses *Write*.
3. Tabel tersegmentasi dengan ketat: Guru tidak bisa Select atau Write ke tabel Finance, dan Finance tidak dapat menyentuh tabel Akademik.
