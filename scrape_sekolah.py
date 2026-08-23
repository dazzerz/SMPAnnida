import requests
import pandas as pd

print("Mengambil data sekolah dari OpenStreetMap (Area Setu Bekasi)...")
overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = """
[out:json];
(
  node["amenity"="school"](-6.45, 106.95, -6.25, 107.15);
  way["amenity"="school"](-6.45, 106.95, -6.25, 107.15);
);
out center;
"""

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

response = requests.get(overpass_url, params={'data': overpass_query}, headers=headers)
data = response.json()

schools = []
for element in data['elements']:
    tags = element.get('tags', {})
    name = tags.get('name', 'Tanpa Nama')
    
    if 'SD' in name.upper() or 'MI ' in name.upper() or 'SEKOLAH DASAR' in name.upper() or 'IBTIDAIYAH' in name.upper():
        lat = element.get('lat') or element.get('center', {}).get('lat')
        lon = element.get('lon') or element.get('center', {}).get('lon')
        
        schools.append({
            'Nama Sekolah': name,
            'Latitude': lat,
            'Longitude': lon,
            'Link Google Maps': f"https://www.google.com/maps/search/?api=1&query={lat},{lon}"
        })

df = pd.DataFrame(schools)
df = df.drop_duplicates(subset=['Nama Sekolah'])

file_name = "Target_SD_MI_Setu.csv"
df.to_csv(file_name, index=False, sep=';')

print(f"Berhasil menemukan {len(df)} SD/MI di sekitar Setu, Bekasi.")
print(f"Data disimpan ke {file_name}")
