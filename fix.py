with open('js/finance/syahriah.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace("document.addEventListener('DOMContentLoaded', async () => {", "export async function initSyahriah() {")
text = text.replace("injectSidebar('sidebar', 'syahriah');", "")
text = text.replace("window.location.href = '../../index.html';", "")

# We don't remove logout handling since it will just silently fail to attach if btn doesn't exist, which is fine, 
# or we can remove it explicitly. We'll leave it to be safe.

if text.strip().endswith('});'):
    last_idx = text.rfind('});')
    text = text[:last_idx] + '}' + text[last_idx+3:]

with open('js/finance/syahriah.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('syahriah.js carefully updated')
