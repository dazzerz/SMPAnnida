import gspread
from google.oauth2.service_account import Credentials
import pandas as pd

SERVICE_ACCOUNT_FILE = r'C:\Users\daffaakhdaan\Downloads\the-blueprint-ppdb-annida-2728-5696b4506553.json'

scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

try:
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
    client = gspread.authorize(creds)
    
    # Buka spreadsheet yang sudah dibuat user
    sheet_id = '1XwABJaavbZ4lJmudEgPi9wGx7Yy6PolkQ_lxMh_MmQM'
    print("Membuka Google Spreadsheet...")
    sh = client.open_by_key(sheet_id)
    
    # Ambil sheet pertama
    worksheet = sh.get_worksheet(0)
    
    try:
        worksheet.update_title("Master Timeline PPDB")
    except:
        pass # Ignore jika tidak bisa rename
        
    # Bersihkan sheet jika ada isinya
    worksheet.clear()

    # Siapkan data dari master timeline
    data = [
        ["Fase / Minggu", "Tanggal (2026)", "Hari", "Agenda Utama / Target Sekolah", "Output Target", "Penanggung Jawab", "Status"],
        
        # Fase 1: Perencanaan (September 2026)
        ["Fase 1: Sept (W1)", "1-Sep-2026", "Selasa", "Rapat Pemetaan daftar SD/MI target promosi", "Draft SD/MI sasaran", "Kepsek & Wakasek", "Belum"],
        ["Fase 1: Sept (W1)", "2-Sep-2026", "Rabu", "Penyusunan timeline sosialisasi ke sekolah", "Jadwal kunjungan pasti", "Tim Humas", "Belum"],
        ["Fase 1: Sept (W1)", "3-Sep-2026", "Kamis", "Briefing desain materi promosi (brosur, spanduk)", "Konsep & copy-writing", "Tim Promosi", "Belum"],
        ["Fase 1: Sept (W1)", "4-Sep-2026", "Jumat", "Pengesahan anggaran biaya promosi", "RAB Promosi di-ACC", "Bendahara", "Belum"],
        ["Fase 1: Sept (W1)", "5-Sep-2026", "Sabtu", "Desain materi promosi (termasuk brosur.html)", "File siap cetak", "Tim IT / Desain", "Belum"],
        ["Fase 1: Sept (W1)", "7-Sep-2026", "Senin", "Cetak materi fisik & SK Tim Lapangan", "Brosur fisik jadi", "Tim Humas", "Belum"],
        
        ["Fase 1: Sept (W2)", "8-Sep-2026", "Selasa", "Rapat penetapan biaya riil PPDB", "Nominal biaya pasti", "Kepsek & Bendahara", "Belum"],
        ["Fase 1: Sept (W2)", "9-Sep-2026", "Rabu", "Finalisasi dokumen persyaratan pendaftaran", "Daftar syarat berkas", "Tata Usaha", "Belum"],
        ["Fase 1: Sept (W2)", "10-Sep-2026", "Kamis", "Rapat SOP alur pendaftaran (online & offline)", "Draf SOP selesai", "Panitia Inti", "Belum"],
        ["Fase 1: Sept (W2)", "11-Sep-2026", "Jumat", "Pembagian tugas admin verifikator berkas", "SK Verifikator", "Tata Usaha", "Belum"],
        ["Fase 1: Sept (W2)", "12-Sep-2026", "Sabtu", "Update biaya, syarat, SOP ke aplikasi web", "Sistem PPDB terupdate", "Tim IT", "Belum"],
        ["Fase 1: Sept (W2)", "14-Sep-2026", "Senin", "Tanda tangan SK Biaya, Syarat, dan SOP", "SK Resmi & Panduan", "Kepsek", "Belum"],

        ["Fase 1: Sept (W3)", "15-Sep-2026", "Selasa", "Pembuatan kisi-kisi soal tes akademik", "Bank soal draf", "Wakasek Kurik.", "Belum"],
        ["Fase 1: Sept (W3)", "16-Sep-2026", "Rabu", "Penentuan rubrik tes tilawah/tahfidz", "Standar hafalan", "Guru Agama", "Belum"],
        ["Fase 1: Sept (W3)", "17-Sep-2026", "Kamis", "Menyusun daftar pertanyaan wawancara", "Draf form wawancara", "BK / Kesiswaan", "Belum"],
        ["Fase 1: Sept (W3)", "18-Sep-2026", "Jumat", "Pembuatan SK guru penguji kelulusan", "SK Tim Penguji", "Kepsek", "Belum"],
        ["Fase 1: Sept (W3)", "19-Sep-2026", "Sabtu", "Finalisasi & cetak soal serta form penilaian", "Dokumen tes siap", "Tim IT & TU", "Belum"],
        ["Fase 1: Sept (W3)", "21-Sep-2026", "Senin", "Briefing teknis tim penguji hari H", "Pemahaman teknis", "Wakasek Kurik.", "Belum"],

        ["Fase 1: Sept (W4)", "22-Sep-2026", "Selasa", "Rapat formula bobot (passing grade) kelulusan", "Standar kelulusan disahkan", "Kepsek & Wakasek", "Belum"],
        ["Fase 1: Sept (W4)", "23-Sep-2026", "Rabu", "Finalisasi metode pengumuman (Web & WA)", "Skema pengumuman", "Tim IT", "Belum"],
        ["Fase 1: Sept (W4)", "24-Sep-2026", "Kamis", "Menentukan batas waktu & SOP daftar ulang", "SOP Daftar Ulang", "Bendahara & TU", "Belum"],
        ["Fase 1: Sept (W4)", "25-Sep-2026", "Jumat", "Sinkronisasi fitur daftar ulang & WA ke sistem", "Aplikasi versi final", "Tim IT", "Belum"],
        ["Fase 1: Sept (W4)", "26-Sep-2026", "Sabtu", "Pleno Final & Simulasi daftar (Uji Coba)", "Sistem tanpa error", "Seluruh Panitia", "Belum"],
        ["Fase 1: Sept (W4)", "28-Sep-2026", "Senin", "Revisi web / perbaikan dari hasil simulasi", "Bug-fixing selesai", "Tim IT", "Belum"],
        ["Fase 1: Sept (W4)", "29-Sep-2026", "Selasa", "Pembersihan data testing (Database wipe out)", "Database 0 Pendaftar", "Tim IT", "Belum"],
        ["Fase 1: Sept (W4)", "30-Sep-2026", "Rabu", "Final Checklist sebelum peluncuran sistem", "100% siap tempur", "Ketua Panitia", "Belum"],

        # Fase 2: Eksekusi Pemasaran (Oktober 2026)
        ["Fase 2: Okt (W1)", "1-Okt-2026", "Kamis", "WEB GO-LIVE & Visit Setu Pusat (5 Madrasah)", "Brosur tersalurkan", "Tim Lapangan", "Belum"],
        ["Fase 2: Okt (W1)", "2-Okt-2026", "Jumat", "Visit Taman Sari, Tmn Rahayu, Muktijaya", "Brosur tersalurkan", "Tim Lapangan", "Belum"],
        ["Fase 2: Okt (W2)", "5-Okt-2026", "Senin", "Visit Burangkeng (5 SDN & 1 SD Swasta)", "Brosur tersalurkan", "Tim Lapangan", "Belum"],
        ["Fase 2: Okt (W2)", "6-Okt-2026", "Selasa", "Visit Cibening (4 SD) & Cijengkol (3 SD)", "Brosur tersalurkan", "Tim Lapangan", "Belum"],
        ["Fase 2: Okt (W2)", "7-Okt-2026", "Rabu", "Visit 3 SD Swasta Setu & 2 SDN Ciledug", "Brosur tersalurkan", "Tim Lapangan", "Belum"],
        ["Fase 2: Okt (W2)", "8-Okt-2026", "Kamis", "Visit SDN Ragemanunggal 01-02 + Evaluasi Akhir", "Brosur tersalurkan & Laporan", "Tim Lapangan", "Belum"],
    ]

    print("Mengunggah data jadwal ke Google Sheets...")
    worksheet.update(values=data, range_name='A1:G' + str(len(data)))

    # Formatting Header & Resize
    worksheet.format("A1:G1", {
        "backgroundColor": {"red": 0.0, "green": 0.5, "blue": 0.2},
        "textFormat": {"foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}, "bold": True}
    })
    
    # Optional: adjust column widths if supported or just let auto
    
    print("\nSUKSES! Tabel jadwal berhasil diinjeksikan ke Google Sheets Anda.")

except Exception as e:
    print(f"Gagal mengupdate spreadsheet: {e}")
