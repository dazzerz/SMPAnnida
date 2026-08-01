import os
import re

base_dir = r'C:\Users\daffaakhdaan\Annida2\SMPAnnida'

files_to_extract = [
    'css/finance/global.css',
    'css/academic/main.css',
    'css/ppdb/style.css'
]

extracted_blocks = []

for rel_path in files_to_extract:
    filepath = os.path.join(base_dir, rel_path)
    if not os.path.exists(filepath): continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # We want to extract :root { ... } or [data-theme="dark"] { ... }
    # Using regex to find blocks carefully
    # This simple regex assumes the blocks don't have nested curly braces, which variables don't.
    pattern = r'(:root|\[data-theme="dark"\]|\[data-theme="light"\])\s*\{([^}]*)\}'
    
    def replacer(match):
        block_full = match.group(0)
        selector = match.group(1)
        inner = match.group(2)
        
        extracted_blocks.append(f"/* Extracted from {rel_path} */\n{selector} {{\n{inner}\n}}\n")
        
        return f"/* [LEGACY] - Siap dihapus pada Sprint Cleanup.\n{block_full}\n*/"
        
    new_content = re.sub(pattern, replacer, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Extracted variables from {rel_path}")

if extracted_blocks:
    style_css_path = os.path.join(base_dir, 'css', 'style.css')
    with open(style_css_path, 'r', encoding='utf-8') as f:
        style_content = f.read()
        
    # Append the extracted variables right after the existing theme definitions to ensure core style overrides them if there are conflicts (preserving current behavior where style.css is loaded last)
    
    # Wait, actually it's better to append them to the end of style.css, but we have to make sure they don't override the unified ones if names collide.
    # If they were in global.css and style.css loaded LAST, style.css won.
    # So if we put them at the TOP of style.css, the unified ones in style.css will still win!
    
    injection = "/* ==========================================\n   CONSOLIDATED MODULE VARIABLES\n========================================== */\n" + "\n".join(extracted_blocks) + "\n\n"
    
    # Let's just put it at the very top (after imports)
    import_match = re.search(r'@import url\([^)]+\);\n', style_content)
    if import_match:
        idx = import_match.end()
        new_style_content = style_content[:idx] + "\n" + injection + style_content[idx:]
    else:
        new_style_content = injection + style_content
        
    with open(style_css_path, 'w', encoding='utf-8') as f:
        f.write(new_style_content)
    print("Injected variables into css/style.css")
