import os

with open(".github/workflows/deploy.yml", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("${{ secrets.VITE_SUPABASE_URL || 'https://vxrgezyfxzynpucuomci.supabase.co' }}", "${{ secrets.VITE_SUPABASE_URL }}")
content = content.replace("${{ secrets.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgxNDEsImV4cCI6MjA5OTM1NDE0MX0.3Y9Mal4M76D8fJfcVXQLbPSpLL_m8H7zQ-oVQG6e5IA' }}", "${{ secrets.VITE_SUPABASE_ANON_KEY }}")

with open(".github/workflows/deploy.yml", "w", encoding="utf-8") as f:
    f.write(content)
