# Security Specifications

Aplikasi SMP Annida mengimplementasikan *security posture* sebagai berikut:

- **Authentication Guard**: Modul khusus `requireAuth()` (`js/core/auth.js`) dipanggil pertama kali sebelum elemen DOM dirakit. Segala rute tanpa sesi akan dialihkan ke halaman utama.
- **Authorization**: Pemeriksaan *Role* diberlakukan secara manual berdasarkan parameter profil (contoh: string `admin` di dalam email).
- **Output Sanitization**: Seluruh nilai dinamis dari basis data dibungkus oleh perlindungan `escapeHTML()` (lihat `js/core/utils.js`) untuk memitigasi serangan Stored XSS / Reflected XSS.
- **Data Protection**: Wajib menggunakan RLS *(Row Level Security)*. Kunci `SUPABASE_ANON_KEY` terpapar di publik sebagai desain bawaan BaaS, namun manipulasi tabel akan langsung ditolak jika RLS dikunci secara ketat.

*PERINGATAN: Modifikasi langsung pada antarmuka basis data (Dashboard Supabase) tanpa RLS akan mengakibatkan IDOR dan kebocoran fatal di sisi frontend.*
