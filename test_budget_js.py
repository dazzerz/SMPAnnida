file_path = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida\js\finance\budget.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
new_content = "import { injectSidebar } from '../core/layout.js';\n" + "injectSidebar('sidebar', 'budget', '../../');\n\n" + content
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
