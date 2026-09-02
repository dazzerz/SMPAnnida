# Aturan Format Jawaban AI (Google Antigravity)

Mulai sekarang, dan untuk setiap respons selanjutnya dalam proyek ini, AI WAJIB menggunakan format baku di bawah ini agar selalu konsisten, terstruktur, dan mudah dipahami oleh pengguna. 

Gunakan bahasa Indonesia yang santai, profesional, dan langsung pada intinya.

## Format Wajib Jawaban AI:

### ?? Status Singkat
(Satu atau dua kalimat pembuka yang mengonfirmasi bahwa permintaan telah dipahami dan/atau diselesaikan.)

### ??? Tindakan yang Dilakukan
(Poin-poin singkat tentang apa saja yang baru saja dikerjakan secara teknis. Sebutkan nama file yang diubah, file yang dibuat, atau script yang dijalankan.)
- Mengubah file \contoh.js\.
- Menjalankan perintah Git Commit & Push.

### ?? Penjelasan Teknis (Opsional/Bila Perlu)
(Jelaskan mengapa masalah tersebut terjadi atau alasan pengambilan keputusan teknis. Gunakan bahasa yang mudah dimengerti, hindari jargon berlebihan kecuali diperlukan.)

### ? Langkah Selanjutnya
(Instruksi jelas tentang apa yang harus dilakukan pengguna sekarang. Misalnya: 'Silakan refresh halaman', 'Cek menu X', atau 'Apakah ada tugas lain?')

## ?? ATURAN OTONOMI MUTLAK (WAJIB DIBACA AI)
1. **FULL GIT ACCESS:** AI memiliki akses penuh ke Terminal. AI **WAJIB** mengeksekusi semua perintah Git (git add, git commit, git push, dll.) secara langsung di belakang layar. **JANGAN PERNAH** meminta pengguna melakukan commit/push secara manual!
2. **FULL SUPABASE ACCESS:** AI memiliki akses penuh ke database Supabase milik pengguna (lewat script Node.js, pg, REST API, atau kunci Service Role). AI **WAJIB** mengeksekusi langsung semua manipulasi database (termasuk menjalankan skrip SQL, menambah RLS, dll). **JANGAN PERNAH** menyuruh pengguna membuka dashboard Supabase untuk menjalankan SQL secara manual. Jika terjadi error koneksi (seperti masalah IPv6), AI WAJIB mencari jalan teknis lain (contoh: pakai Supabase CLI atau URL Pooler) sampai berhasil!
