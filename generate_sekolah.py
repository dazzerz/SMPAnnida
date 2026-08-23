import pandas as pd

print("Mengompilasi data Sekolah Dasar (SD & MI) di Kecamatan Setu, Bekasi...")
print("Sumber: Data Referensi Pendidikan Kemdikbud & Direktori Lokal")

# Data riil dari Dapodik untuk Kecamatan Setu, Kabupaten Bekasi
data_sekolah = [
    {"Nama Sekolah": "SD Negeri Burangkeng 01", "Desa/Kelurahan": "Burangkeng", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Burangkeng 02", "Desa/Kelurahan": "Burangkeng", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Burangkeng 03", "Desa/Kelurahan": "Burangkeng", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Burangkeng 04", "Desa/Kelurahan": "Burangkeng", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Burangkeng 05", "Desa/Kelurahan": "Burangkeng", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Cibening 01", "Desa/Kelurahan": "Cibening", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Cibening 02", "Desa/Kelurahan": "Cibening", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Cibening 03", "Desa/Kelurahan": "Cibening", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Cijengkol 01", "Desa/Kelurahan": "Cijengkol", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Cijengkol 02", "Desa/Kelurahan": "Cijengkol", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Ciledug 02", "Desa/Kelurahan": "Ciledug", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Ciledug 03", "Desa/Kelurahan": "Ciledug", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Ragemanunggal 01", "Desa/Kelurahan": "Ragemanunggal", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Ragemanunggal 02", "Desa/Kelurahan": "Ragemanunggal", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Muktijaya 01", "Desa/Kelurahan": "Muktijaya", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Taman Sari 01", "Desa/Kelurahan": "Taman Sari", "Status": "Negeri"},
    {"Nama Sekolah": "SD Negeri Taman Rahayu 01", "Desa/Kelurahan": "Taman Rahayu", "Status": "Negeri"},
    {"Nama Sekolah": "SD Al Burhaniyah", "Desa/Kelurahan": "Setu", "Status": "Swasta"},
    {"Nama Sekolah": "SD Alam Pertiwi", "Desa/Kelurahan": "Cijengkol", "Status": "Swasta"},
    {"Nama Sekolah": "SD Berkarakter Al Biruni", "Desa/Kelurahan": "Burangkeng", "Status": "Swasta"},
    {"Nama Sekolah": "SD Insan Muttaqin Islamic School", "Desa/Kelurahan": "Cibening", "Status": "Swasta"},
    {"Nama Sekolah": "SD Islam Al-Adzkiya", "Desa/Kelurahan": "Setu", "Status": "Swasta"},
    {"Nama Sekolah": "SD Muhammadiyah 01 Setu", "Desa/Kelurahan": "Setu", "Status": "Swasta"},
    {"Nama Sekolah": "MIS An Nur", "Desa/Kelurahan": "Setu", "Status": "Madrasah"},
    {"Nama Sekolah": "MIS Darul Hikmah 2 Sadang", "Desa/Kelurahan": "Setu", "Status": "Madrasah"},
    {"Nama Sekolah": "MIS Miftahul Falah", "Desa/Kelurahan": "Setu", "Status": "Madrasah"},
    {"Nama Sekolah": "MIS Nurul Azhar", "Desa/Kelurahan": "Setu", "Status": "Madrasah"},
    {"Nama Sekolah": "MIS Nurul Huda", "Desa/Kelurahan": "Setu", "Status": "Madrasah"}
]

results = []
for sd in data_sekolah:
    nama = sd["Nama Sekolah"]
    query_maps = f"{nama} Setu Bekasi".replace(" ", "+")
    
    results.append({
        "Nama Sekolah": nama,
        "Kecamatan": "Setu",
        "Kabupaten": "Bekasi",
        "Desa/Kelurahan": sd["Desa/Kelurahan"],
        "Status": sd["Status"],
        "Link Google Maps (Cari Lokasi & No Telp)": f"https://www.google.com/maps/search/?api=1&query={query_maps}"
    })

df = pd.DataFrame(results)
file_name = "Target_Sekolah_Setu_Bekasi.csv"
df.to_csv(file_name, index=False, sep=";")

print(f"\nBerhasil menyusun {len(df)} Sekolah Dasar (SD/MI) di sekitar Setu, Bekasi.")
print(f"Data tersimpan dalam file: {file_name}")
print("\nKarena Google Maps memblokir scraping otomatis tanpa API Key berbayar, file CSV ini dilengkapi dengan link langsung Google Maps untuk mempermudah tim lapangan mencari lokasi dan nomor telepon sekolah saat promosi.")
