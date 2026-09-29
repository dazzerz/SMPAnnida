import re

with open("js/finance/app.js", "r", encoding="utf-8") as f:
    content = f.read()

# Replace all guest-related code
content = re.sub(r'const isLockedGuest = .*?;', 'const isLockedGuest = false;', content)
content = re.sub(r'isLockedGuest \? Promise\.resolve\(\[.*?\]\) :', '', content)
content = re.sub(r'isLockedGuest \? Promise\.resolve\(\{.*?\}\) :', '', content)
content = re.sub(r'if \(isLockedGuest\) \{.*?\}\n', '', content, flags=re.DOTALL)
content = content.replace("set('nav-user-name', 'Guest');", "set('nav-user-name', 'User');")
content = re.sub(r'// Show Guest Unlock Button if not already unlocked.*?\}\s*\}', '', content, flags=re.DOTALL)
content = re.sub(r'// Hide Transaksi, Budget, and RAB Kelas in sidebar for guests.*?\}\n\s*', '', content, flags=re.DOTALL)
content = re.sub(r'// Guest Unlock Button.*?\}\);', '', content, flags=re.DOTALL)
content = re.sub(r'// Auto-prompt password for locked guests after a short delay.*?\}\s*\}', '', content, flags=re.DOTALL)
content = re.sub(r'// Clear guest unlock state on page refresh', '', content)
content = re.sub(r'guest_statistics', 'finance_stats', content)
content = re.sub(r'guest_get_totals', 'finance_get_totals', content)
content = re.sub(r'guest', 'user', content, flags=re.IGNORECASE)

with open("js/finance/app.js", "w", encoding="utf-8") as f:
    f.write(content)
