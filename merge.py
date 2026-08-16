import re

with open('pages/finance/syahriah.html', 'r', encoding='utf-8') as f:
    text = f.read()

section_match = re.search(r'(<section id="sec-syahriah"[\s\S]*?</section>)', text)
section_html = section_match.group(1) if section_match else ''

after_section = text.split('</section>')[1] if '</section>' in text else ''
modals_html = after_section.split('<script')[0]

combined_html = '\n\n' + section_html + '\n\n' + modals_html

with open('pages/finance/dashboard.html', 'r', encoding='utf-8') as f:
    dashboard_html = f.read()

combined_html = combined_html.replace('<section id="sec-syahriah" class="page-section active">', '<section id="sec-syahriah" class="page-section" style="display:none;">')

dashboard_html = dashboard_html.replace('</main>', combined_html + '\n</main>')

with open('pages/finance/dashboard.html', 'w', encoding='utf-8') as f:
    f.write(dashboard_html)

print('Merged HTML successfully!')
