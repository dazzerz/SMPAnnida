from duckduckgo_search import DDGS
import pandas as pd

print("Mencari daftar Sekolah Dasar (SD/MI) di sekitar Setu, Bekasi...")

results = []
try:
    with DDGS() as ddgs:
        # DDGS Maps akan mencari tempat mirip dengan fungsi Google Maps
        places = ddgs.maps("Sekolah Dasar Setu Bekasi", place="Setu, Bekasi, West Java, Indonesia")
        
        for p in places:
            title = p.get("title", "")
            # Filter hanya SD / MI
            if "SD" in title.upper() or "MI" in title.upper() or "SEKOLAH DASAR" in title.upper():
                results.append({
                    "Nama Sekolah": title,
                    "Alamat Lengkap": p.get("address", ""),
                    "Latitude": p.get("latitude", ""),
                    "Longitude": p.get("longitude", ""),
                    "Nomor Telepon": p.get("phone", "-"),
                    "Kategori": p.get("category", ""),
                    "Link Google Maps": f"https://www.google.com/maps/search/?api=1&query={p.get('latitude', '')},{p.get('longitude', '')}"
                })
                
    df = pd.DataFrame(results)
    
    # Hapus duplikat jika ada
    df = df.drop_duplicates(subset=['Nama Sekolah'])
    
    if not df.empty:
        file_name = "Target_Sekolah_PPDB_Setu.csv"
        df.to_csv(file_name, index=False, sep=";")
        print(f"Berhasil menemukan {len(df)} sekolah!")
        print(f"Data tersimpan di file: {file_name}")
    else:
        print("Tidak ada hasil yang ditemukan.")
        
except Exception as e:
    print(f"Terjadi kesalahan: {e}")
