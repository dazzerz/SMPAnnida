import pandas as pd

data = [
    # Hari 1: Kamis, 1 Okt 2026
    {"Tanggal": "Kamis, 1 Okt 2026", "Area": "Setu Pusat (Fokus Madrasah)", "Nama Sekolah": "MIS An Nur", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Kamis, 1 Okt 2026", "Area": "Setu Pusat (Fokus Madrasah)", "Nama Sekolah": "MIS Darul Hikmah 2 Sadang", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Kamis, 1 Okt 2026", "Area": "Setu Pusat (Fokus Madrasah)", "Nama Sekolah": "MIS Miftahul Falah", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Kamis, 1 Okt 2026", "Area": "Setu Pusat (Fokus Madrasah)", "Nama Sekolah": "MIS Nurul Azhar", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Kamis, 1 Okt 2026", "Area": "Setu Pusat (Fokus Madrasah)", "Nama Sekolah": "MIS Nurul Huda", "Status Kunjungan": "Belum", "Catatan/Respon": ""},

    # Hari 2: Jumat, 2 Okt 2026
    {"Tanggal": "Jumat, 2 Okt 2026", "Area": "Taman Sari & Muktijaya", "Nama Sekolah": "SD Negeri Taman Sari 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Jumat, 2 Okt 2026", "Area": "Taman Sari & Muktijaya", "Nama Sekolah": "SD Negeri Taman Rahayu 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Jumat, 2 Okt 2026", "Area": "Taman Sari & Muktijaya", "Nama Sekolah": "SD Negeri Muktijaya 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},

    # Hari 3: Senin, 5 Okt 2026
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Negeri Burangkeng 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Negeri Burangkeng 02", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Negeri Burangkeng 03", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Negeri Burangkeng 04", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Negeri Burangkeng 05", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Senin, 5 Okt 2026", "Area": "Burangkeng", "Nama Sekolah": "SD Berkarakter Al Biruni", "Status Kunjungan": "Belum", "Catatan/Respon": ""},

    # Hari 4: Selasa, 6 Okt 2026
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Negeri Cibening 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Negeri Cibening 02", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Negeri Cibening 03", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Insan Muttaqin Islamic School", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Negeri Cijengkol 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Negeri Cijengkol 02", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Selasa, 6 Okt 2026", "Area": "Cibening & Cijengkol", "Nama Sekolah": "SD Alam Pertiwi", "Status Kunjungan": "Belum", "Catatan/Respon": ""},

    # Hari 5: Rabu, 7 Okt 2026
    {"Tanggal": "Rabu, 7 Okt 2026", "Area": "Setu Pusat (Swasta) & Ciledug", "Nama Sekolah": "SD Al Burhaniyah", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Rabu, 7 Okt 2026", "Area": "Setu Pusat (Swasta) & Ciledug", "Nama Sekolah": "SD Islam Al-Adzkiya", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Rabu, 7 Okt 2026", "Area": "Setu Pusat (Swasta) & Ciledug", "Nama Sekolah": "SD Muhammadiyah 01 Setu", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Rabu, 7 Okt 2026", "Area": "Setu Pusat (Swasta) & Ciledug", "Nama Sekolah": "SD Negeri Ciledug 02", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Rabu, 7 Okt 2026", "Area": "Setu Pusat (Swasta) & Ciledug", "Nama Sekolah": "SD Negeri Ciledug 03", "Status Kunjungan": "Belum", "Catatan/Respon": ""},

    # Hari 6: Kamis, 8 Okt 2026
    {"Tanggal": "Kamis, 8 Okt 2026", "Area": "Ragemanunggal", "Nama Sekolah": "SD Negeri Ragemanunggal 01", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
    {"Tanggal": "Kamis, 8 Okt 2026", "Area": "Ragemanunggal", "Nama Sekolah": "SD Negeri Ragemanunggal 02", "Status Kunjungan": "Belum", "Catatan/Respon": ""},
]

df = pd.DataFrame(data)
file_name = "Jadwal_Kunjungan_PPDB_Oktober.xlsx"
df.to_excel(file_name, index=False)
print(f"File {file_name} berhasil dibuat.")
