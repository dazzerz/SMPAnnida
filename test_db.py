import urllib.request, json; req = urllib.request.Request('https://vxrgezyfxzynpucuomci.supabase.co/rest/v1/user_roles', data=json.dumps({'user_id': '00000000-0000-0000-0000-000000000000', 'role': 'wali_murid'}).encode('utf-8'), headers={'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc3ODE0MSwiZXhwIjoyMDk5MzU0MTQxfQ.bBth5MNrEufMNaXmqYeHdfkpJHUDB9GXeVAFqx9jvQA', 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4cmdlenlmeHp5bnB1Y3VvbWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc3ODE0MSwiZXhwIjoyMDk5MzU0MTQxfQ.bBth5MNrEufMNaXmqYeHdfkpJHUDB9GXeVAFqx9jvQA', 'Content-Type': 'application/json', 'Prefer': 'return=representation'}); 
try:
    with urllib.request.urlopen(req) as response: print(response.read().decode())
except Exception as e:
    print(e.read().decode())

