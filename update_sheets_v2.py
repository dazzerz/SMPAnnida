import gspread
from google.oauth2.service_account import Credentials
import time

SERVICE_ACCOUNT_FILE = r'C:\Users\daffaakhdaan\Downloads\the-blueprint-ppdb-annida-2728-5696b4506553.json'
scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=scopes)
client = gspread.authorize(creds)

sheet_id = '1XwABJaavbZ4lJmudEgPi9wGx7Yy6PolkQ_lxMh_MmQM'
print("Menyambungkan ke Google Spreadsheet...")
sh = client.open_by_key(sheet_id)

# Data Definition
w1_data = [
    ["Tanggal", "Hari", "Agenda / Fokus Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["29-Aug-2026", "Sabtu", "Penetapan Target Demografis & Geografis (SD/MI Sasaran) serta Penyusunan Master Timeline Sosialisasi", "Daftar SD/MI Sasaran & Dokumen Timeline", "Kepsek & Wakasek", "Belum"],
    ["30-Aug-2026", "Minggu", "Finalisasi Konsep & Copywriting Materi Promosi (Brosur, Spanduk) serta Pengesahan RAB Promosi", "Desain Siap Cetak & RAB Disahkan", "Tim Humas & Bendahara", "Belum"]
]

w2_data = [
    ["Tanggal", "Hari", "Agenda / Fokus Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["5-Sep-2026", "Sabtu", "Penetapan Struktur Pembiayaan PPDB (SPP, Uang Pangkal) & Finalisasi Persyaratan Administratif", "SK Rincian Biaya & Daftar Syarat Berkas", "Kepsek & Bendahara", "Belum"],
    ["6-Sep-2026", "Minggu", "Standardisasi SOP Pendaftaran (Online/Offline) & Penetapan Tim Verifikator Berkas", "Dokumen SOP Final & SK Verifikator", "Panitia Inti & Tata Usaha", "Belum"]
]

w3_data = [
    ["Tanggal", "Hari", "Agenda / Fokus Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["12-Sep-2026", "Sabtu", "Penyusunan & Validasi Kisi-kisi Soal Akademik serta Penetapan Rubrik Penilaian Tahfidz", "Bank Soal & Rubrik Tahfidz Tervalidasi", "Wakasek Kurikulum & Guru Agama", "Belum"],
    ["13-Sep-2026", "Minggu", "Penyusunan Instrumen Wawancara (Orang Tua & Siswa) serta Penerbitan SK Tim Penguji", "Form Wawancara & SK Tim Penguji", "Tim Kesiswaan & Kepsek", "Belum"]
]

w4_data = [
    ["Tanggal", "Hari", "Agenda / Fokus Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["19-Sep-2026", "Sabtu", "Penentuan Formula Pembobotan Nilai (Passing Grade) & Finalisasi SOP Daftar Ulang", "Dokumen Standar Kelulusan & SOP Daftar Ulang", "Kepsek & Wakasek", "Belum"],
    ["20-Sep-2026", "Minggu", "Sinkronisasi Fitur Pengumuman di Sistem Web & User Acceptance Testing (UAT) Internal", "Sistem Terintegrasi Tanpa Error", "Tim IT", "Belum"]
]

w5_data = [
    ["Tanggal", "Hari", "Agenda / Fokus Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["26-Sep-2026", "Sabtu", "Evaluasi Menyeluruh Kesiapan Panitia, Bug-fixing Sistem, & Pleno Final Simulasi Pendaftaran", "Laporan Hasil Simulasi & Readiness 100%", "Seluruh Panitia", "Belum"],
    ["27-Sep-2026", "Minggu", "Rapat Mitigasi Risiko Operasional & Pembahasan Isu Tambahan (Addendum)", "Dokumen Mitigasi Risiko", "Kepsek & Panitia Inti", "Belum"]
]

kunjungan_data = [
    ["Tanggal", "Hari", "Area Kunjungan", "Target Sekolah", "PIC Lapangan", "Status", "Catatan Observasi"],
    ["28-Oct-2026", "Rabu", "Setu Pusat (Madrasah)", "MIS An Nur, MIS Darul Hikmah 2, MIS Miftahul Falah, MIS Nurul Azhar, MIS Nurul Huda", "Tim Lapangan", "Belum", ""],
    ["29-Oct-2026", "Kamis", "Taman Sari & Muktijaya", "SDN Taman Sari 01, SDN Taman Rahayu 01, SDN Muktijaya 01", "Tim Lapangan", "Belum", ""],
    ["30-Oct-2026", "Jumat", "Burangkeng", "SDN Burangkeng 01 - 05, SD Al Biruni", "Tim Lapangan", "Belum", ""],
    ["2-Nov-2026", "Senin", "Cibening & Cijengkol", "SDN Cibening 01 - 03, SD Insan Muttaqin, SDN Cijengkol 01 - 02, SD Alam Pertiwi", "Tim Lapangan", "Belum", ""],
    ["3-Nov-2026", "Selasa", "Setu Pusat & Ciledug", "SD Al Burhaniyah, SD Islam Al-Adzkiya, SD Muh 01 Setu, SDN Ciledug 02 - 03", "Tim Lapangan", "Belum", ""],
    ["4-Nov-2026", "Rabu", "Ragemanunggal", "SDN Ragemanunggal 01 - 02 & Evaluasi Akhir Kunjungan", "Tim Lapangan", "Belum", ""]
]

sheets_to_create = {
    "Week 1 (29-30 Aug)": w1_data,
    "Week 2 (5-6 Sep)": w2_data,
    "Week 3 (12-13 Sep)": w3_data,
    "Week 4 (19-20 Sep)": w4_data,
    "Week 5 (26-27 Sep)": w5_data,
    "Eksekusi Lapangan (Mulai 28 Okt)": kunjungan_data
}

# Helper to format and update
def format_and_update(ws, data, is_kunjungan=False):
    ws.clear()
    ws.update(values=data, range_name='A1')
    
    end_col = 'G' if is_kunjungan else 'F'
    ws.format(f"A1:{end_col}1", {
        "backgroundColor": {"red": 0.1, "green": 0.2, "blue": 0.4}, # Professional Navy Blue
        "textFormat": {"foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}, "bold": True}
    })

# Main execution
print("Mengupdate format sheet...")
existing_worksheets = {ws.title: ws for ws in sh.worksheets()}

for i, (title, data) in enumerate(sheets_to_create.items()):
    if title in existing_worksheets:
        ws = existing_worksheets[title]
    else:
        # If it's the very first iteration and we have old sheets to recycle
        if i == 0 and "Master Timeline PPDB" in existing_worksheets:
            ws = existing_worksheets["Master Timeline PPDB"]
            ws.update_title(title)
        elif i == 0 and "Sheet1" in existing_worksheets:
            ws = existing_worksheets["Sheet1"]
            ws.update_title(title)
        else:
            ws = sh.add_worksheet(title=title, rows=50, cols=10)
    
    is_kunjungan = "Eksekusi" in title
    format_and_update(ws, data, is_kunjungan)
    time.sleep(1) # Prevent rate limiting

# Hapus sheet lama yang tidak terpakai (cleanup)
existing_titles_after = [ws.title for ws in sh.worksheets()]
for title in existing_titles_after:
    if title not in sheets_to_create.keys() and len(existing_titles_after) > 1:
        try:
            sh.del_worksheet(sh.worksheet(title))
            existing_titles_after.remove(title)
        except:
            pass

print("\nSELESAI! Semua perubahan telah diatur ke dalam Google Sheets secara profesional.")
