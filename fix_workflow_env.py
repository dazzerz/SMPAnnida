import os

with open(".github/workflows/deploy.yml", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """      - name: Run tests
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL || 'https://vxrgezyfxzynpucuomci.supabase.co' }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY || 'dummy' }}
        run: npm test"""

content = content.replace("""      - name: Run tests
        run: npm test""", replacement)

with open(".github/workflows/deploy.yml", "w", encoding="utf-8") as f:
    f.write(content)
