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

sheet_title = "Buku Agenda Surat"

# Hapus jika sudah ada untuk menghindari duplikat
try:
    existing_ws = sh.worksheet(sheet_title)
    sh.del_worksheet(existing_ws)
    time.sleep(1)
except:
    pass

# Buat Sheet Baru di index 1 (setelah Summary)
ws = sh.add_worksheet(title=sheet_title, rows=100, cols=6)
time.sleep(1)
# Pindahkan urutannya ke nomor 2 (index 1)
# gspread doesn't have a direct reorder without API call, we'll leave it as is or use batch_update.

# Siapkan data header
header = ["No. Urut", "Tanggal Surat\n(DD/MM/YYYY)", "Kode Klasifikasi", "Tujuan Surat", "Perihal / Keterangan", "Nomor Surat Otomatis (AUTO)"]

# Kita masukkan baris contoh 1
row_1 = [
    1, 
    "28/10/2026", 
    "PPDB", 
    "Kepala SDN Burangkeng 01", 
    "Permohonan Izin Sosialisasi", 
    '=IF(B2="", "", TEXT(A2, "000") & "/" & C2 & "/SMP-ANNIDA/" & ROMAN(MONTH(B2)) & "/" & YEAR(B2))'
]

# Siapkan baris 2 s.d 50 (hanya rumus dan nomor urut)
rows = [header, row_1]
for i in range(2, 51):
    row_num = i + 1
    # Auto increment No. Urut (Kolom A) -> bisa manual tapi kita buatkan angka urut saja
    rows.append([
        i, 
        "", 
        "UMUM", 
        "", 
        "", 
        f'=IF(B{row_num}="", "", TEXT(A{row_num}, "000") & "/" & C{row_num} & "/SMP-ANNIDA/" & ROMAN(MONTH(B{row_num})) & "/" & YEAR(B{row_num}))'
    ])

print("Mengupdate data dan rumus ke sheet...")
# value_input_option='USER_ENTERED' sangat penting agar rumus (=IF...) dikenali sebagai rumus, bukan teks biasa.
ws.update(values=rows, range_name='A1', value_input_option='USER_ENTERED')

print("Mengaplikasikan Desain & Dropdown...")
ws_id = ws.id

batch_requests = []

# 1. Header Formatting (Hijau Alam)
color_main_header = {"red": 0.18, "green": 0.49, "blue": 0.20} 
batch_requests.append({
    "repeatCell": {
        "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": 1, "startColumnIndex": 0, "endColumnIndex": 6},
        "cell": {
            "userEnteredFormat": {
                "backgroundColor": color_main_header,
                "textFormat": {"foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0}, "bold": True},
                "horizontalAlignment": "CENTER",
                "verticalAlignment": "MIDDLE",
                "wrapStrategy": "WRAP"
            }
        },
        "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,wrapStrategy)"
    }
})

# 2. Body Cell Formatting
batch_requests.append({
    "repeatCell": {
        "range": {"sheetId": ws_id, "startRowIndex": 1, "endRowIndex": 51, "startColumnIndex": 0, "endColumnIndex": 6},
        "cell": {
            "userEnteredFormat": {
                "verticalAlignment": "MIDDLE",
                "wrapStrategy": "WRAP"
            }
        },
        "fields": "userEnteredFormat(verticalAlignment,wrapStrategy)"
    }
})

# Center khusus kolom A, B, C, dan F
for c_idx in [0, 1, 2, 5]:
    batch_requests.append({
        "repeatCell": {
            "range": {"sheetId": ws_id, "startRowIndex": 1, "endRowIndex": 51, "startColumnIndex": c_idx, "endColumnIndex": c_idx+1},
            "cell": {
                "userEnteredFormat": {
                    "horizontalAlignment": "CENTER"
                }
            },
            "fields": "userEnteredFormat(horizontalAlignment)"
        }
    })

# Format Kolom Nomor Surat Otomatis (F) agar beda warna (karena rumus)
batch_requests.append({
    "repeatCell": {
        "range": {"sheetId": ws_id, "startRowIndex": 1, "endRowIndex": 51, "startColumnIndex": 5, "endColumnIndex": 6},
        "cell": {
            "userEnteredFormat": {
                "backgroundColor": {"red": 0.9, "green": 0.95, "blue": 0.9}, # Light green
                "textFormat": {"bold": True, "foregroundColor": {"red": 0.1, "green": 0.3, "blue": 0.1}},
                "horizontalAlignment": "CENTER"
            }
        },
        "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)"
    }
})

# 3. Dropdown untuk Kode Klasifikasi (Kolom C)
batch_requests.append({
    "setDataValidation": {
        "range": {"sheetId": ws_id, "startRowIndex": 1, "endRowIndex": 51, "startColumnIndex": 2, "endColumnIndex": 3},
        "rule": {
            "condition": {
                "type": "ONE_OF_LIST",
                "values": [
                    {"userEnteredValue": "PPDB"},
                    {"userEnteredValue": "UND"},
                    {"userEnteredValue": "PENG"},
                    {"userEnteredValue": "SK"},
                    {"userEnteredValue": "TUGAS"},
                    {"userEnteredValue": "UMUM"}
                ]
            },
            "showCustomUi": True,
            "strict": False
        }
    }
})

# 4. Borders (Kotak-kotak)
color_black = {"red": 0.0, "green": 0.0, "blue": 0.0}
batch_requests.append({
    "updateBorders": {
        "range": {"sheetId": ws_id, "startRowIndex": 0, "endRowIndex": 51, "startColumnIndex": 0, "endColumnIndex": 6},
        "top": {"style": "SOLID", "color": color_black},
        "bottom": {"style": "SOLID", "color": color_black},
        "left": {"style": "SOLID", "color": color_black},
        "right": {"style": "SOLID", "color": color_black},
        "innerHorizontal": {"style": "SOLID", "color": color_black},
        "innerVertical": {"style": "SOLID", "color": color_black}
    }
})

# 5. Column Widths
widths = [60, 100, 120, 250, 300, 250]
for col_idx, w in enumerate(widths):
    batch_requests.append({
        "updateDimensionProperties": {
            "range": {"sheetId": ws_id, "dimension": "COLUMNS", "startIndex": col_idx, "endIndex": col_idx+1},
            "properties": {"pixelSize": w},
            "fields": "pixelSize"
        }
    })

sh.batch_update({"requests": batch_requests})
print("\nSELESAI! Sheet Buku Agenda Surat telah dibuat dengan rumus otomatis.")
