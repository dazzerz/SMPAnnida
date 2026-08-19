with open('pages/finance/dashboard.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('  <link rel="stylesheet" href="../../css/finance/dashboard.css">
  <link rel="stylesheet" href="../../css/finance/syahriah.css">', '  <link rel="stylesheet" href="../../css/finance/dashboard.css">\n  <link rel="stylesheet" href="../../css/finance/syahriah.css">')

with open('pages/finance/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Fixed HTML')
