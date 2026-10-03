import os
import glob

html_files = glob.glob('**/*.html', recursive=True)
for file in html_files:
    if 'node_modules' in file or 'dist' in file:
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace specific supabase URL with wildcard for flexibility or add placeholder
    content = content.replace("https://vxrgezyfxzynpucuomci.supabase.co wss://vxrgezyfxzynpucuomci.supabase.co", "https://*.supabase.co wss://*.supabase.co")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
