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

def build_data(title, headers, raw_data, merge_cols, status_idx):
    data = []
    data.append([title] + [""]*(len(headers)-1))
    data.append([""]*len(headers))
    data.append(headers)
    
    current_row = 3
    merges = []
    
    for block in raw_data:
        group_vals = block[:-1]
        items = block[-1]
        
        start_row = current_row
        for i, item in enumerate(items):
            row = []
            for c in range(len(headers)):
                if c in merge_cols:
                    # Ambil dari group_vals jika baris pertama blok ini
                    idx = merge_cols.index(c)
                    row.append(group_vals[idx] if i == 0 else "")
                elif c == status_idx:
                    row.append("FALSE")
                else:
                    # Ambil dari items
                    # Kita harus tahu offsetnya.
                    # Semua non-merge dan non-status adalah items
                    # Item elements are placed in order of non-merge columns
                    pass
                    
            # Better way: explicitly construct the row
            row = [""] * len(headers)
            # 1. Fill group vals (merge columns) ONLY for first row (i=0)
            if i == 0:
                for idx, c in enumerate(merge_cols):
                    row[c] = group_vals[idx]
            
            # 2. Fill item vals
            item_cols = [x for x in range(len(headers)) if x not in merge_cols and x != status_idx]
            # Handle if there are extra columns not covered by item (like empty notes)
            for idx, val in enumerate(item):
                if idx < len(item_cols):
                    row[item_cols[idx]] = val
            
            # 3. Fill status
            row[status_idx] = "FALSE"
            
            data.append(row)
            current_row += 1
            
        end_row = current_row
        if end_row - start_row > 1:
            for c in merge_cols:
                merges.append({
                    "startRowIndex": start_row,
                    "endRowIndex": end_row,
                    "startColumnIndex": c,
                    "endColumnIndex": c+1
                })
                
    return data, merges

# --- DEFINISI DATA ---

summary_raw = [
    ("Week 1", "29-30 Aug 2026", "Sheet W1", [
        ("1. Penetapan Target Demografis & Master Timeline",),
        ("2. Konsep Promosi, Copywriting, & RAB",)
    ]),
    ("Week 2", "5-6 Sep 2026", "Sheet W2", [
        ("1. Penetapan Struktur Pembiayaan PPDB (SPP)",),
        ("2. Standardisasi SOP Pendaftaran & Syarat Berkas",)
    ]),
    ("Week 3", "12-13 Sep 2026", "Sheet W3", [
        ("1. Validasi Soal Akademik & Rubrik Tahfidz",),
        ("2. Form Wawancara & SK Tim Penguji",)
    ]),
    ("Week 4", "19-20 Sep 2026", "Sheet W4", [
        ("1. Penentuan Passing Grade & SOP Daftar Ulang",),
        ("2. Sinkronisasi Fitur Pengumuman di Web & UAT",)
    ]),
    ("Week 5", "26-27 Sep 2026", "Sheet W5", [
        ("1. Evaluasi Kesiapan & Pleno Final Simulasi",),
        ("2. Rapat Mitigasi Risiko & Isu Tambahan",)
    ]),
    ("Eksekusi", "28 Okt - 4 Nov", "Sheet Eksekusi", [
        ("1. Kunjungan Langsung (Visit) ke 28 SD/MI",),
        ("2. Distribusi Brosur & Sosialisasi Website Go-Live",)
    ])
]

# Summary: Fase(0), Periode(1), Detail(2), Status(3), Navigasi(4)
# Merge cols: Fase(0), Periode(1), Navigasi(4)
summary_data, summary_merges = build_data(
    "MASTER SUMMARY PERSIAPAN & EKSEKUSI PPDB ANNIDA",
    ["Fase / Minggu", "Periode", "Detail Fokus / Agenda Utama", "Status", "Navigasi Sheet"],
    summary_raw, merge_cols=[0, 1, 4], status_idx=3
)

w1_raw = [
    ("29-Aug-2026", "Sabtu", [
        ("Penetapan Target Demografis & Geografis (SD/MI Sasaran)", "Daftar SD/MI Sasaran", "Kepsek & Wakasek"),
        ("Penyusunan Master Timeline Sosialisasi", "Dokumen Timeline", "Tim Humas")
    ]),
    ("30-Aug-2026", "Minggu", [
        ("Finalisasi Konsep & Copywriting Materi Promosi", "Desain Siap Cetak", "Tim Promosi"),
        ("Pengesahan Rencana Anggaran Biaya (RAB) Promosi", "RAB Disahkan", "Bendahara")
    ])
]

w2_raw = [
    ("5-Sep-2026", "Sabtu", [
        ("Penetapan Struktur Pembiayaan PPDB (SPP, Uang Pangkal)", "SK Rincian Biaya", "Kepsek & Bendahara"),
        ("Finalisasi Persyaratan Administratif & Dokumen", "Daftar Syarat Berkas", "Tata Usaha")
    ]),
    ("6-Sep-2026", "Minggu", [
        ("Standardisasi SOP Pendaftaran (Online/Offline)", "Dokumen SOP Final", "Panitia Inti"),
        ("Penetapan & Penugasan Tim Verifikator Berkas", "SK Verifikator", "Tata Usaha")
    ])
]

w3_raw = [
    ("12-Sep-2026", "Sabtu", [
        ("Penyusunan & Validasi Kisi-kisi Soal Akademik", "Bank Soal Ujian", "Wakasek Kurikulum"),
        ("Penetapan Rubrik Penilaian Tahfidz & Tilawah", "Rubrik Tahfidz", "Guru Agama")
    ]),
    ("13-Sep-2026", "Minggu", [
        ("Penyusunan Instrumen Wawancara (Orang Tua & Siswa)", "Form Wawancara", "Tim Kesiswaan"),
        ("Penerbitan SK Kepanitiaan Tim Penguji Kelulusan", "SK Tim Penguji", "Kepsek")
    ])
]

w4_raw = [
    ("19-Sep-2026", "Sabtu", [
        ("Penentuan Formula Pembobotan Nilai (Passing Grade)", "Standar Kelulusan", "Kepsek & Wakasek"),
        ("Finalisasi SOP Daftar Ulang", "SOP Daftar Ulang", "Bendahara & TU")
    ]),
    ("20-Sep-2026", "Minggu", [
        ("Sinkronisasi Fitur Pengumuman Kelulusan di Web", "Sistem Pengumuman", "Tim IT"),
        ("User Acceptance Testing (UAT) Sistem Internal", "Laporan UAT", "Tim IT & Panitia")
    ])
]

w5_raw = [
    ("26-Sep-2026", "Sabtu", [
        ("Evaluasi Menyeluruh Kesiapan Panitia & Bug-fixing Sistem", "Sistem Readiness 100%", "Tim IT"),
        ("Pleno Final Simulasi Pendaftaran (End-to-End)", "Laporan Simulasi", "Seluruh Panitia")
    ]),
    ("27-Sep-2026", "Minggu", [
        ("Rapat Mitigasi Risiko Operasional", "Dokumen Mitigasi", "Kepsek"),
        ("Pembahasan Isu Tambahan (Addendum)", "Notulensi Akhir", "Panitia Inti")
    ])
]

# Wx: Tanggal(0), Hari(1), Agenda(2), Output(3), PIC(4), Status(5)
# Merge cols: Tanggal(0), Hari(1)
w1_d, w1_m = build_data("JADWAL RAPAT & PERENCANAAN (WEEK 1)", ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"], w1_raw, [0, 1], 5)
w2_d, w2_m = build_data("JADWAL RAPAT & PERENCANAAN (WEEK 2)", ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"], w2_raw, [0, 1], 5)
w3_d, w3_m = build_data("JADWAL RAPAT & PERENCANAAN (WEEK 3)", ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"], w3_raw, [0, 1], 5)
w4_d, w4_m = build_data("JADWAL RAPAT & PERENCANAAN (WEEK 4)", ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"], w4_raw, [0, 1], 5)
w5_d, w5_m = build_data("JADWAL RAPAT & PERENCANAAN (WEEK 5)", ["Tanggal", "Hari", "Agenda Pembahasan", "Output / Key Deliverables", "PIC", "Status"], w5_raw, [0, 1], 5)

kunjungan_raw = [
    ("28-Oct-2026", "Rabu", "Setu Pusat (Madrasah)", [
        ("MIS An Nur", "Tim Humas"),
        ("MIS Darul Hikmah 2", "Tim Humas"),
        ("MIS Miftahul Falah", "Tim Humas"),
        ("MIS Nurul Azhar", "Tim Humas"),
        ("MIS Nurul Huda", "Tim Humas")
    ]),
    ("29-Oct-2026", "Kamis", "Taman Sari & Muktijaya", [
        ("SDN Taman Sari 01", "Tim Humas"),
        ("SDN Taman Rahayu 01", "Tim Humas"),
        ("SDN Muktijaya 01", "Tim Humas")
    ]),
    ("30-Oct-2026", "Jumat", "Burangkeng", [
        ("SDN Burangkeng 01", "Tim Humas"),
        ("SDN Burangkeng 02", "Tim Humas"),
        ("SDN Burangkeng 03", "Tim Humas"),
        ("SDN Burangkeng 04", "Tim Humas"),
        ("SDN Burangkeng 05", "Tim Humas"),
        ("SD Berkarakter Al Biruni", "Tim Humas")
    ]),
    ("2-Nov-2026", "Senin", "Cibening & Cijengkol", [
        ("SDN Cibening 01", "Tim Humas"),
        ("SDN Cibening 02", "Tim Humas"),
        ("SDN Cibening 03", "Tim Humas"),
        ("SD Insan Muttaqin", "Tim Humas"),
        ("SDN Cijengkol 01", "Tim Humas"),
        ("SDN Cijengkol 02", "Tim Humas"),
        ("SD Alam Pertiwi", "Tim Humas")
    ]),
    ("3-Nov-2026", "Selasa", "Setu Pusat & Ciledug", [
        ("SD Al Burhaniyah", "Tim Humas"),
        ("SD Islam Al-Adzkiya", "Tim Humas"),
        ("SD Muh 01 Setu", "Tim Humas"),
        ("SDN Ciledug 02", "Tim Humas"),
        ("SDN Ciledug 03", "Tim Humas")
    ]),
    ("4-Nov-2026", "Rabu", "Ragemanunggal", [
        ("SDN Ragemanunggal 01", "Tim Humas"),
        ("SDN Ragemanunggal 02", "Tim Humas"),
        ("Evaluasi Akhir Kunjungan", "Tim Lapangan")
    ])
]

# Eksekusi: Tanggal(0), Hari(1), Area(2), Target(3), PIC(4), Status(5), Catatan(6)
# Merge cols: 0, 1, 2
kunjungan_d, kunjungan_m = build_data(
    "JADWAL EKSEKUSI KUNJUNGAN SEKOLAH (MULAI 28 OKT)",
    ["Tanggal", "Hari", "Area Kunjungan", "Target Sekolah", "PIC Lapangan", "Status", "Catatan"],
    kunjungan_raw, [0, 1, 2], 5
)

sheets_config = {
    "00. Summary": (summary_data, summary_merges),
    "W1 (29-30 Aug)": (w1_d, w1_m),
    "W2 (5-6 Sep)": (w2_d, w2_m),
    "W3 (12-13 Sep)": (w3_d, w3_m),
    "W4 (19-20 Sep)": (w4_d, w4_m),
    "W5 (26-27 Sep)": (w5_d, w5_m),
    "Eksekusi Lapangan": (kunjungan_d, kunjungan_m)
}

print("Membersihkan Kanvas (Foolproof Renaming)...")
temp_ws = sh.add_worksheet(title="TEMP_HOLD_FINAL", rows=1, cols=1)
old_worksheets = sh.worksheets()

for i, ws in enumerate(old_worksheets):
    if ws.id != temp_ws.id:
        try:
            ws.update_title(f"OLD_DEL_{i}_{int(time.time())}")
            time.sleep(0.5)
        except:
            pass

new_worksheets = {}
for title in sheets_config.keys():
    ws = sh.add_worksheet(title=title, rows=50, cols=8)
    new_worksheets[title] = ws
    time.sleep(0.5)

for ws in old_worksheets:
    try:
        sh.del_worksheet(ws)
        time.sleep(0.5)
    except:
        pass

color_main_header = {"red": 0.18, "green": 0.49, "blue": 0.20} 
color_sub_header = {"red": 0.85, "green": 0.93, "blue": 0.85}
color_black = {"red": 0.0, "green": 0.0, "blue": 0.0}

print("Mendesain Ulang...")
for title, ws in new_worksheets.items():
    data, merges = sheets_config[title]
    ws.update(values=data, range_name='A1')
    
    ws_id = ws.id
    row_count = len(data)
    is_summary = ("Summary" in title)
    is_kunj = ("Eksekusi" in title)
    cols = 7 if is_kunj else (5 if is_summary else 6)
    status_col_idx = 3 if is_summary else 5
    
    batch_requests = []
    
    # Merge Main Header A1:F2 (0:2)
    batch_requests.append({
        "mergeCells": {
            "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": 2, "startColumnIndex": 0, "endColumnIndex": cols},
            "mergeType": "MERGE_ALL"
        }
    })
    
    # VERTICAL MERGES FOR DATA (Tanggal & Hari)
    for m in merges:
        batch_requests.append({
            "mergeCells": {
                "range": {"sheetId": ws_id, "startRowIndex": m["startRowIndex"], "endRowIndex": m["endRowIndex"], 
                          "startColumnIndex": m["startColumnIndex"], "endColumnIndex": m["endColumnIndex"]},
                "mergeType": "MERGE_ALL"
            }
        })
    
    # Formatting
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
    
    # Body
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": 0, "endColumnIndex": cols},
            "cell": {
                "userEnteredFormat": {
                    "wrapStrategy": "WRAP",
                    "verticalAlignment": "MIDDLE",
                    "horizontalAlignment": "LEFT"
                }
            },
            "fields": "userEnteredFormat(wrapStrategy,verticalAlignment,horizontalAlignment)"
        }
    })
    
    # Align Center for specific cols (Tanggal, Hari, Status)
    for c_idx in [0, 1, status_col_idx]:
        batch_requests.append({
            "repeatCell": {
                "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": c_idx, "endColumnIndex": c_idx+1},
                "cell": {
                    "userEnteredFormat": {
                        "horizontalAlignment": "CENTER"
                    }
                },
                "fields": "userEnteredFormat(horizontalAlignment)"
            }
        })
    
    # Borders
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
    
    # Native Checkboxes
    batch_requests.append({
        "setDataValidation": {
            "range": {"sheetId": ws_id, "startRowIndex": 3, "endRowIndex": row_count, "startColumnIndex": status_col_idx, "endColumnIndex": status_col_idx+1},
            "rule": {
                "condition": {"type": "BOOLEAN"},
                "showCustomUi": True
            }
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
    time.sleep(1.0)

print("\nSELESAI! Merge Cells (Vertical) untuk hari/tanggal dan list per-sekolah telah diterapkan.")
