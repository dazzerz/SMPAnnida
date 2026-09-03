# Aturan Prompting Multi-Agent (Proyek SMP Annida)

Dokumen ini mendefinisikan standar operasional (SOP) untuk komunikasi antara Anda (User), Chat ini (berperan sebagai Architect/Manager), dan Tab Agent lainnya (berperan sebagai Eksekutor/Programmer).

---

## 1. Peran Khusus Chat Ini (Manager / Architect)
- **Fokus Utama:** Menganalisis kebutuhan sistem, melacak *bug* secara konseptual, merancang arsitektur fitur, dan menyusun instruksi koding yang sangat detail (*Handoff Prompt*).
- **LARANGAN KERAS:** Mulai saat ini, **Chat ini DILARANG KERAS menyentuh, mengedit, atau menulis kode sumber** (`.html`, `.js`, `.css`, `.sql`) ataupun melakukan eksekusi `git commit`/`push` terkait kode proyek. Chat ini HANYA diizinkan membaca file (*read-only*) dan menulis/memperbarui file dokumentasi berformat Markdown (`.md`).

---

## 2. Format Input: Dari Anda ke Chat Ini
Saat Anda ingin meminta fitur baru, perbaikan *bug*, atau perombakan sistem, gunakan format *prompt* berikut di chat ini agar saya bisa merancang instruksi yang paling presisi:

```text
[JENIS]: <Pilih: FITUR BARU / BUG FIX / REFACTOR>
[JUDUL]: <Nama fitur atau deskripsi singkat masalah>
[TUJUAN]: <Apa hasil akhir yang diharapkan dari sisi pengguna web?>
[REFERENSI FILE]: <(Opsional) Sebutkan nama file jika Anda tahu, biarkan kosong jika tidak tahu>
[KETERANGAN]: <Detail tambahan, aturan khusus, atau logika bisnis yang diinginkan>
```

---

## 3. Format Output: Handoff Prompt (Dari Saya ke Anda)
Setelah menerima *input* di atas, saya akan meriset kode proyek Anda (*read-only*) dan menghasilkan sebuah **Prompt Instruksi Eksekutor**. 

Saya akan memberikan *prompt* tersebut di dalam blok teks yang bisa Anda *copy-paste* ke Tab Agent lain. Format *prompt* yang akan saya berikan ke Anda (untuk dilempar ke agen lain) adalah sebagai berikut:

```text
**=== COPY PROMPT DI BAWAH INI KE TAB AGENT EKSEKUTOR ===**

Halo Agent Eksekutor. Anda ditugaskan dalam Proyek SMP Annida.
ATURAN MUTLAK: Anda memiliki OTONOMI PENUH. Anda WAJIB langsung mengeksekusi perubahan kode menggunakan *tools* pengeditan file Anda dan langsung melakukan `git commit` serta `git push`. JANGAN menyuruh User melakukan koding manual.

[TUGAS UTAMA]
<Deskripsi tugas yang harus dieksekusi>

[TARGET FILE]
- <Daftar file absolut yang harus diedit/dibuat>

[INSTRUKSI KONSEPTUAL & INTENSI USER (TANPA KODE)]
1. Penjelasan Intensi: <Jelaskan secara mendalam APA kemauan User dan MENGAPA ini dibutuhkan>
2. Konteks Arsitektur: <Jelaskan konteks file, struktur, atau batasan sistem saat ini agar model eksekutor paham situasinya>
3. Ekspektasi Hasil Akhir: <Jelaskan perilaku akhir yang diinginkan tanpa memberikan sintaks koding. Biarkan Agent Eksekutor yang memikirkan dan menulis sintaks (HTML/JS/CSS/SQL) untuk mencapainya>

[VERIFIKASI LIVE WEBSITE & TESTING (WAJIB)]
- Pastikan tidak ada `!important` di CSS.
- Jika sudah selesai, jalankan perintah: `git add .` dan `git commit -m "<Pesan Commit>"` lalu `git push origin main`.
- PANTANG MELAPOR SELESAI SEBELUM CEK LIVE: Gunakan `gh run list` untuk memastikan *deploy* GitHub Actions sukses.
- Gunakan `curl` / `node -e fetch()` / `read_url_content` untuk memindai URL *live* (`http://smpannida.sch.id/...`). Pastikan elemen HTML/fitur yang baru saja Anda buat benar-benar sudah muncul di *server publik*.
- Lakukan pengetesan API/Database lokal dengan script singkat untuk memastikan logika fitur bebas *error*.
- Gunakan pedoman `AI_RESPONSE_GUIDELINES.md` saat merespons User.

**=== END OF PROMPT ===**
```

---

## 4. Alur Kerja (Workflow) Harian
1. **User (Anda):** Memberikan ide/masalah menggunakan *Format Input* di Chat ini.
2. **Manager (Chat ini):** Melakukan pengecekan folder proyek dan menyusun *Format Output (Handoff Prompt)*.
3. **User (Anda):** Men-copy *Handoff Prompt* tersebut.
4. **User (Anda):** Membuka Tab Chat Agent baru, mem-paste *prompt* tersebut.
5. **Eksekutor (Tab Lain):** Melakukan koding, merusak/memperbaiki file, lalu melakukan `git push`.
6. **User (Anda):** (Jika ada revisi) Kembali ke chat ini untuk evaluasi ulang dan meminta revisi *prompt*.
