import pandas as pd

data = [
    # Fase 1: Perencanaan (September 2026)
    ["Fase 1: Sept (W1)", "Selasa, 1 Sept", "Rapat Pemetaan daftar SD/MI target promosi", "Draft SD/MI sasaran", "Kepsek & Wakasek"],
    ["Fase 1: Sept (W1)", "Rabu, 2 Sept", "Penyusunan timeline sosialisasi ke sekolah", "Jadwal kunjungan pasti", "Tim Humas"],
    ["Fase 1: Sept (W1)", "Kamis, 3 Sept", "Briefing desain materi promosi (brosur, spanduk)", "Konsep & copy-writing", "Tim Promosi"],
    ["Fase 1: Sept (W1)", "Jumat, 4 Sept", "Pengesahan anggaran biaya promosi", "RAB Promosi di-ACC", "Bendahara"],
    ["Fase 1: Sept (W1)", "Sabtu, 5 Sept", "Desain materi promosi (termasuk brosur.html)", "File siap cetak", "Tim IT / Desain"],
    ["Fase 1: Sept (W1)", "Senin, 7 Sept", "Cetak materi fisik & SK Tim Lapangan", "Brosur fisik jadi", "Tim Humas"],
    
    ["Fase 1: Sept (W2)", "Selasa, 8 Sept", "Rapat penetapan biaya riil PPDB", "Nominal biaya pasti", "Kepsek & Bendahara"],
    ["Fase 1: Sept (W2)", "Rabu, 9 Sept", "Finalisasi dokumen persyaratan pendaftaran", "Daftar syarat berkas", "Tata Usaha"],
    ["Fase 1: Sept (W2)", "Kamis, 10 Sept", "Rapat SOP alur pendaftaran (online & offline)", "Draf SOP selesai", "Panitia Inti"],
    ["Fase 1: Sept (W2)", "Jumat, 11 Sept", "Pembagian tugas admin verifikator berkas", "SK Verifikator", "Tata Usaha"],
    ["Fase 1: Sept (W2)", "Sabtu, 12 Sept", "Update biaya, syarat, SOP ke aplikasi web", "Sistem PPDB terupdate", "Tim IT"],
    ["Fase 1: Sept (W2)", "Senin, 14 Sept", "Tanda tangan SK Biaya, Syarat, dan SOP", "SK Resmi & Panduan", "Kepsek"],

    ["Fase 1: Sept (W3)", "Selasa, 15 Sept", "Pembuatan kisi-kisi soal tes akademik", "Bank soal draf", "Wakasek Kurik."],
    ["Fase 1: Sept (W3)", "Rabu, 16 Sept", "Penentuan rubrik tes tilawah/tahfidz", "Standar hafalan", "Guru Agama"],
    ["Fase 1: Sept (W3)", "Kamis, 17 Sept", "Menyusun daftar pertanyaan wawancara", "Draf form wawancara", "BK / Kesiswaan"],
    ["Fase 1: Sept (W3)", "Jumat, 18 Sept", "Pembuatan SK guru penguji kelulusan", "SK Tim Penguji", "Kepsek"],
    ["Fase 1: Sept (W3)", "Sabtu, 19 Sept", "Finalisasi & cetak soal serta form penilaian", "Dokumen tes siap", "Tim IT & TU"],
    ["Fase 1: Sept (W3)", "Senin, 21 Sept", "Briefing teknis tim penguji hari H", "Pemahaman teknis", "Wakasek Kurik."],

    ["Fase 1: Sept (W4)", "Selasa, 22 Sept", "Rapat formula bobot (passing grade) kelulusan", "Standar kelulusan disahkan", "Kepsek & Wakasek"],
    ["Fase 1: Sept (W4)", "Rabu, 23 Sept", "Finalisasi metode pengumuman (Web & WA)", "Skema pengumuman", "Tim IT"],
    ["Fase 1: Sept (W4)", "Kamis, 24 Sept", "Menentukan batas waktu & SOP daftar ulang", "SOP Daftar Ulang", "Bendahara & TU"],
    ["Fase 1: Sept (W4)", "Jumat, 25 Sept", "Sinkronisasi fitur daftar ulang & WA ke sistem", "Aplikasi versi final", "Tim IT"],
    ["Fase 1: Sept (W4)", "Sabtu, 26 Sept", "Pleno Final & Simulasi daftar (Uji Coba)", "Sistem tanpa error", "Seluruh Panitia"],
    ["Fase 1: Sept (W4)", "Senin, 28 Sept", "Revisi web / perbaikan dari hasil simulasi", "Bug-fixing selesai", "Tim IT"],
    ["Fase 1: Sept (W4)", "Selasa, 29 Sept", "Pembersihan data testing (Database wipe out)", "Database 0 Pendaftar", "Tim IT"],
    ["Fase 1: Sept (W4)", "Rabu, 30 Sept", "Final Checklist sebelum peluncuran sistem", "100% siap tempur", "Ketua Panitia"],

    # Fase 2: Eksekusi Pemasaran (Oktober 2026)
    ["Fase 2: Okt (W1)", "Kamis, 1 Okt", "WEB GO-LIVE & Visit Setu Pusat (5 Madrasah)", "Brosur tersalurkan", "Tim Lapangan"],
    ["Fase 2: Okt (W1)", "Jumat, 2 Okt", "Visit Taman Sari, Tmn Rahayu, Muktijaya", "Brosur tersalurkan", "Tim Lapangan"],
    ["Fase 2: Okt (W2)", "Senin, 5 Okt", "Visit Burangkeng (5 SDN & 1 SD Swasta)", "Brosur tersalurkan", "Tim Lapangan"],
    ["Fase 2: Okt (W2)", "Selasa, 6 Okt", "Visit Cibening (4 SD) & Cijengkol (3 SD)", "Brosur tersalurkan", "Tim Lapangan"],
    ["Fase 2: Okt (W2)", "Rabu, 7 Okt", "Visit 3 SD Swasta Setu & 2 SDN Ciledug", "Brosur tersalurkan", "Tim Lapangan"],
    ["Fase 2: Okt (W2)", "Kamis, 8 Okt", "Visit SDN Ragemanunggal 01-02 + Evaluasi", "Brosur tersalurkan & Laporan", "Tim Lapangan"],
]

df = pd.DataFrame(data, columns=["Fase / Minggu", "Tanggal (2026)", "Agenda Utama / Target Sekolah", "Output Target", "Penanggung Jawab"])
df["Status"] = "Belum"

file_name = "Master_Timeline_PPDB_Sept_Okt.xlsx"
df.to_excel(file_name, index=False)
