import urllib.request; req = urllib.request.Request('https://smpannida.sch.id/pages/ppdb/dashboard-wali.html'); print('delete-data' in urllib.request.urlopen(req).read().decode('utf-8'))
