# DESIGN.md — Panduan Identitas Visual SMP Annida
> File ini adalah sumber kebenaran tunggal untuk semua keputusan UI/UX.
> Agent Eksekutor WAJIB membaca file ini sebelum mengubah tampilan apapun.
> Perubahan pada file ini harus disetujui User terlebih dahulu.

---

## Identitas Karakter
- **Kata kunci:** Islami, Modern, Alam
- **Mood:** Hangat dan ramah, bukan korporat dingin. Terasa seperti lingkungan belajar yang nyaman dan dipercaya, bukan sistem pemerintahan yang kaku.
- **Pengguna:** Guru (harian), Siswa (harian), Wali Murid (sesekali), Yayasan (jarang). Desain harus bisa dipakai semua kalangan tanpa kebingungan.

---

## Palet Warna

### Sistem Warna dari Logo
Logo resmi menggunakan hijau lime cerah. Warna ini diturunkan bertahap:

| Peran | Nama | Hex | Dipakai di |
|---|---|---|---|
| Logo (sumber) | Lime Brand | #6EF23A | Logo saja, JANGAN di UI lain |
| Aksen Utama | Green 400 | #4ADE80 | Angka penting, badge aktif, highlight |
| Interaktif | Green 500 | #22C55E | Tombol utama, menu aktif sidebar |
| Surface Gelap | Green 900 | #166534 | Background sidebar, header gelap |
| Latar Terang | Green 50 | #F0FDF4 | Background mode terang |

### Netral Gelap
| Peran | Hex |
|---|---|
| Background Utama | #0b1320 |
| Surface Kartu | #111a28 |
| Border | #1e293b |
| Teks Utama | #f1f5f9 |
| Teks Sekunder | #94a3b8 |

### Netral Terang
| Peran | Hex |
|---|---|
| Background Utama | #f8fafc |
| Surface Kartu | #ffffff |
| Border | #e2e8f0 |
| Teks Utama | #0f172a |
| Teks Sekunder | #475569 |

### Status (tidak boleh diganti)
| Status | Hex |
|---|---|
| Hadir / Sukses | #22C55E |
| Sakit | #F59E0B |
| Izin | #3B82F6 |
| Alpha / Error | #EF4444 |

---

## Tema
- **Satu tema: Mode Terang (Light Mode) saja.**
- Alasan: karakter sekolah (Islami, Modern, Alam) dan mood hangat-ramah lebih cocok dengan latar terang. Wali murid dan yayasan yang mengakses sesekali lebih familiar dengan tampilan dokumen berbasis putih.
- Tidak ada toggle tema. Tidak ada dark mode. Satu konsistensi.
- Background utama: #f8fafc (putih keabuan hangat).

---

## Tipografi
- Font: Inter atau system-ui sans-serif. Terbaca tajam, hangat, tidak dekoratif.
- Ukuran minimum tabel: 13px isi, 12px header kolom.
- Padding baris tabel: minimal 13px atas-bawah.

---

## Motif Identitas
1. Geometri Islami: pola bintang/arabesque tipis (opacity 8-12%) di background halaman. BUKAN di belakang kartu data.
2. Aksen Daun: siluet daun sebagai ornamen sudut sidebar bawah dan pojok header section. Opacity 15-20%, hanya di area tanpa teks.
3. Border radius: 12px kartu, 8px tombol, 6px input. Hangat tapi tidak berlebihan.

---

## Dials Antislop
- ENERGY: 2 (Balanced)
- RHYTHM: 2 (Consistent with breaks)
- MOTION: 1 (Hover states only)

---

## Aturan Tidak Boleh Dilanggar
1. #6EF23A hanya untuk logo. Tidak boleh muncul di teks, tombol, atau background UI.
2. Glassmorphism maksimal 1-2 elemen. Tidak boleh navbar + sidebar + kartu sekaligus.
3. Glow hanya pada 1 elemen aksen paling penting per halaman.
4. Semua teks wajib lolos WCAG AA di kedua mode.
5. Motif dekoratif tidak boleh di belakang teks atau tabel data.
6. Kedua mode tema wajib diverifikasi sebelum commit.

