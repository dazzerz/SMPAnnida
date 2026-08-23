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

summary_data = [
    ["MASTER SUMMARY PERSIAPAN & EKSEKUSI PPDB ANNIDA", "", "", "", ""],
    ["", "", "", "", ""],
    ["Fase / Minggu", "Periode", "Detail Fokus / Agenda Utama", "Status", "Navigasi Sheet"],
    ["Week 1", "29 - 30 Aug 2026", "1. Penetapan Target Demografis & Master Timeline", "FALSE", "Sheet W1"],
    ["", "", "2. Konsep Promosi, Copywriting, & RAB", "FALSE", ""],
    ["Week 2", "5 - 6 Sep 2026", "1. Penetapan Struktur Pembiayaan PPDB (SPP)", "FALSE", "Sheet W2"],
    ["", "", "2. Standardisasi SOP Pendaftaran & Syarat Berkas", "FALSE", ""],
    ["Week 3", "12 - 13 Sep 2026", "1. Validasi Soal Akademik & Rubrik Tahfidz", "FALSE", "Sheet W3"],
    ["", "", "2. Form Wawancara & SK Tim Penguji", "FALSE", ""],
    ["Week 4", "19 - 20 Sep 2026", "1. Penentuan Passing Grade & SOP Daftar Ulang", "FALSE", "Sheet W4"],
    ["", "", "2. Sinkronisasi Fitur Pengumuman di Web & UAT", "FALSE", ""],
    ["Week 5", "26 - 27 Sep 2026", "1. Evaluasi Kesiapan & Pleno Final Simulasi", "FALSE", "Sheet W5"],
    ["", "", "2. Rapat Mitigasi Risiko & Isu Tambahan", "FALSE", ""],
    ["Eksekusi Lapangan", "28 Okt - 4 Nov 2026", "1. Kunjungan Langsung (Visit) ke 28 SD/MI", "FALSE", "Sheet Eksekusi"],
    ["", "", "2. Distribusi Brosur & Sosialisasi Website Go-Live", "FALSE", ""]
]

w1_data = [
    ["JADWAL RAPAT & PERENCANAAN (WEEK 1)", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["29-Aug-2026", "Sabtu", "Penetapan Target Demografis & Geografis (SD/MI Sasaran)", "Daftar SD/MI Sasaran", "Kepsek & Wakasek", "FALSE"],
    ["", "", "Penyusunan Master Timeline Sosialisasi", "Dokumen Timeline", "Tim Humas", "FALSE"],
    ["30-Aug-2026", "Minggu", "Finalisasi Konsep & Copywriting Materi Promosi", "Desain Siap Cetak", "Tim Promosi", "FALSE"],
    ["", "", "Pengesahan Rencana Anggaran Biaya (RAB) Promosi", "RAB Disahkan", "Bendahara", "FALSE"]
]

w2_data = [
    ["JADWAL RAPAT & PERENCANAAN (WEEK 2)", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["5-Sep-2026", "Sabtu", "Penetapan Struktur Pembiayaan PPDB (SPP, Uang Pangkal)", "SK Rincian Biaya", "Kepsek & Bendahara", "FALSE"],
    ["", "", "Finalisasi Persyaratan Administratif & Dokumen", "Daftar Syarat Berkas", "Tata Usaha", "FALSE"],
    ["6-Sep-2026", "Minggu", "Standardisasi SOP Pendaftaran (Online/Offline)", "Dokumen SOP Final", "Panitia Inti", "FALSE"],
    ["", "", "Penetapan & Penugasan Tim Verifikator Berkas", "SK Verifikator", "Tata Usaha", "FALSE"]
]

w3_data = [
    ["JADWAL RAPAT & PERENCANAAN (WEEK 3)", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["12-Sep-2026", "Sabtu", "Penyusunan & Validasi Kisi-kisi Soal Akademik", "Bank Soal Ujian", "Wakasek Kurikulum", "FALSE"],
    ["", "", "Penetapan Rubrik Penilaian Tahfidz & Tilawah", "Rubrik Tahfidz", "Guru Agama", "FALSE"],
    ["13-Sep-2026", "Minggu", "Penyusunan Instrumen Wawancara (Orang Tua & Siswa)", "Form Wawancara", "Tim Kesiswaan", "FALSE"],
    ["", "", "Penerbitan SK Kepanitiaan Tim Penguji Kelulusan", "SK Tim Penguji", "Kepsek", "FALSE"]
]

w4_data = [
    ["JADWAL RAPAT & PERENCANAAN (WEEK 4)", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["19-Sep-2026", "Sabtu", "Penentuan Formula Pembobotan Nilai (Passing Grade)", "Standar Kelulusan", "Kepsek & Wakasek", "FALSE"],
    ["", "", "Finalisasi SOP Daftar Ulang", "SOP Daftar Ulang", "Bendahara & TU", "FALSE"],
    ["20-Sep-2026", "Minggu", "Sinkronisasi Fitur Pengumuman Kelulusan di Web", "Sistem Pengumuman", "Tim IT", "FALSE"],
    ["", "", "User Acceptance Testing (UAT) Sistem Internal", "Laporan UAT", "Tim IT & Panitia", "FALSE"]
]

w5_data = [
    ["JADWAL RAPAT & PERENCANAAN (WEEK 5)", "", "", "", "", ""],
    ["", "", "", "", "", ""],
    ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"],
    ["26-Sep-2026", "Sabtu", "Evaluasi Menyeluruh Kesiapan Panitia & Bug-fixing Sistem", "Sistem Readiness 100%", "Tim IT", "FALSE"],
    ["", "", "Pleno Final Simulasi Pendaftaran (End-to-End)", "Laporan Simulasi", "Seluruh Panitia", "FALSE"],
    ["27-Sep-2026", "Minggu", "Rapat Mitigasi Risiko Operasional", "Dokumen Mitigasi", "Kepsek", "FALSE"],
    ["", "", "Pembahasan Isu Tambahan (Addendum)", "Notulensi Akhir", "Panitia Inti", "FALSE"]
]

kunjungan_data = [
    ["JADWAL EKSEKUSI KUNJUNGAN SEKOLAH (MULAI 28 OKT)", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["Tanggal", "Hari", "Area Kunjungan", "Target Sekolah", "PIC Lapangan", "Status", "Catatan"],
    ["28-Oct-2026", "Rabu", "Setu Pusat (Madrasah)", "MIS An Nur, MIS Darul Hikmah 2, MIS Miftahul Falah, MIS Nurul Azhar, MIS Nurul Huda", "Tim Humas", "FALSE", ""],
    ["29-Oct-2026", "Kamis", "Taman Sari & Muktijaya", "SDN Taman Sari 01, SDN Taman Rahayu 01, SDN Muktijaya 01", "Tim Humas", "FALSE", ""],
    ["30-Oct-2026", "Jumat", "Burangkeng", "SDN Burangkeng 01-05, SD Al Biruni", "Tim Humas", "FALSE", ""],
    ["2-Nov-2026", "Senin", "Cibening & Cijengkol", "SDN Cibening 01-03, SD Insan Muttaqin, SDN Cijengkol 01-02, SD Alam Pertiwi", "Tim Humas", "FALSE", ""],
    ["3-Nov-2026", "Selasa", "Setu Pusat & Ciledug", "SD Al Burhaniyah, SD Islam Al-Adzkiya, SD Muh 01 Setu, SDN Ciledug 02-03", "Tim Humas", "FALSE", ""],
    ["4-Nov-2026", "Rabu", "Ragemanunggal", "SDN Ragemanunggal 01-02 & Evaluasi Akhir", "Tim Humas", "FALSE", ""]
]

sheets_config = {
    "00. Summary": summary_data,
    "W1 (29-30 Aug)": w1_data,
    "W2 (5-6 Sep)": w2_data,
    "W3 (12-13 Sep)": w3_data,
    "W4 (19-20 Sep)": w4_data,
    "W5 (26-27 Sep)": w5_data,
    "Eksekusi Lapangan": kunjungan_data
}

print("Membersihkan Kanvas (Foolproof Renaming)...")
old_worksheets = sh.worksheets()
# Rename existing to OLD_1, OLD_2 etc to avoid collision
for i, ws in enumerate(old_worksheets):
    try:
        ws.update_title(f"OLD_DELETE_ME_{i}")
        time.sleep(1)
    except:
        pass

new_worksheets = {}
for title in sheets_config.keys():
    ws = sh.add_worksheet(title=title, rows=30, cols=8)
    new_worksheets[title] = ws
    time.sleep(1)

# Delete old sheets
for ws in old_worksheets:
    try:
        sh.del_worksheet(ws)
        time.sleep(1)
    except:
        pass

# WARNA ALAM ANNIDA
color_main_header = {"red": 0.18, "green": 0.49, "blue": 0.20} # Dark Green #2E7D32
color_sub_header = {"red": 0.85, "green": 0.93, "blue": 0.85}  # Light Green
color_black = {"red": 0.0, "green": 0.0, "blue": 0.0}

print("Mendesain Ulang...")
for title, ws in new_worksheets.items():
    data = sheets_config[title]
    ws.update(values=data, range_name='A1')
    
    ws_id = ws.id
    row_count = len(data)
    is_summary = ("Summary" in title)
    is_kunj = ("Eksekusi" in title)
    cols = 7 if is_kunj else (5 if is_summary else 6)
    
    status_col_idx = 3 if is_summary else (5 if is_kunj else 5)
    
    batch_requests = []
    
    # Merge Header
    batch_requests.append({
        "mergeCells": {
            "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": 2, "startColumnIndex": 0, "endColumnIndex": cols},
            "mergeType": "MERGE_ALL"
        }
    })
    
    # Header Styling
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": 2, "startColumnIndex": 0, "endColumnIndex": cols},
            "cell": {
                "userEnteredFormat": {
                    "backgroundColor": color_main_header,
                    "textFormat": {"foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}, "fontSize": 14, "bold": True},
                    "horizontalAlignment": "CENTER",
                    "verticalAlignment": "MIDDLE"
                }
            },
            "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
        }
    })
    
    # Sub Header Styling
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 2, "endRowIndex": 3, "startColumnIndex": 0, "endColumnIndex": cols},
            "cell": {
                "userEnteredFormat": {
                    "backgroundColor": color_sub_header,
                    "textFormat": {"bold": True, "fontSize": 11, "foregroundColor": {"red": 0.1, "green": 0.3, "blue": 0.1}},
                    "horizontalAlignment": "CENTER",
                    "verticalAlignment": "MIDDLE"
                }
            },
            "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)"
        }
    })
    
    # Body Wrap Text
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": 0, "endColumnIndex": cols},
            "cell": {
                "userEnteredFormat": {
                    "wrapStrategy": "WRAP",
                    "verticalAlignment": "MIDDLE"
                }
            },
            "fields": "userEnteredFormat(wrapStrategy,verticalAlignment)"
        }
    })
    
    # BORDERS UNTUK SEMUA TABLE (KOTAK-KOTAK RAPI)
    batch_requests.append({
        "updateBorders": {
            "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": row_count, "startColumnIndex": 0, "endColumnIndex": cols},
            "top": {"style": "SOLID", "color": color_black},
            "bottom": {"style": "SOLID", "color": color_black},
            "left": {"style": "SOLID", "color": color_black},
            "right": {"style": "SOLID", "color": color_black},
            "innerHorizontal": {"style": "SOLID", "color": color_black},
            "innerVertical": {"style": "SOLID", "color": color_black}
        }
    })
    
    # CHECKBOXES (Native Google Sheets Boolean)
    batch_requests.append({
        "setDataValidation": {
            "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": status_col_idx, "endColumnIndex": status_col_idx+1},
            "rule": {
                "condition": {"type": "BOOLEAN"},
                "showCustomUi": True
            }
        }
    })
    
    # Center Khusus Kolom Checkbox
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": status_col_idx, "endColumnIndex": status_col_idx+1},
            "cell": {
                "userEnteredFormat": {
                    "horizontalAlignment": "CENTER",
                    "verticalAlignment": "MIDDLE"
                }
            },
            "fields": "userEnteredFormat(horizontalAlignment,verticalAlignment)"
        }
    })
    
    # Column Widths
    if is_summary:
        widths = [130, 150, 450, 80, 180]
    elif is_kunj:
        widths = [100, 80, 180, 300, 120, 80, 200]
    else:
        widths = [110, 80, 400, 250, 150, 80]
        
    for col_idx, w in enumerate(widths):
        batch_requests.append({
            "updateDimensionProperties": {
                "range": {"sheetId": ws_id, "dimension": "COLUMNS", "startIndex": col_idx, "endIndex": col_idx+1},
                "properties": {"pixelSize": w},
                "fields": "pixelSize"
            }
        })

    sh.batch_update({"requests": batch_requests})
    time.sleep(1.5)

print("\nSELESAI! Tabel bersih, checkbox rapi, border hitam legam, dan nuansa Alam (Hijau) berhasil diterapkan.")
