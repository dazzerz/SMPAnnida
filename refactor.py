import re

def fix_css():
    # --- 1. Fix css/mobile.css ---
    with open('css/mobile.css', 'r', encoding='utf-8') as f:
        mcss = f.read()
    
    # Remove !important from desktop widths in mobile.css
    mcss = mcss.replace('width: 260px !important;', 'width: 260px;')
    mcss = mcss.replace('min-width: 260px !important;', 'min-width: 260px;')
    mcss = mcss.replace('max-width: 260px !important;', 'max-width: 260px;')
    
    mcss = mcss.replace('width: 220px !important;', 'width: 220px;')
    mcss = mcss.replace('min-width: 220px !important;', 'min-width: 220px;')
    
    # Add collapsed rule to the end of @media (min-width: 769px)
    collapsed_rule = '''
  .sidebar.collapsed {
    width: 70px;
    min-width: 70px;
    max-width: 70px;
  }
'''
    # We find the closing brace of @media (min-width: 769px)
    # The structure has .sidebar-overlay { display: none !important; } right before it closes.
    mcss = mcss.replace(
        '.sidebar-overlay {\n    display: none !important;\n  }\n}',
        '.sidebar-overlay {\n    display: none !important;\n  }' + collapsed_rule + '}'
    )

    with open('css/mobile.css', 'w', encoding='utf-8') as f:
        f.write(mcss)


    # --- 2. Fix css/style.css ---
    with open('css/style.css', 'r', encoding='utf-8') as f:
        scss = f.read()

    # Find the second .sidebar definition and extract it
    # Around line 1088, we appended:
    # .sidebar {
    #   background: rgba(25, 30, 25, 0.45) !important;
    # ...
    # Wait, the user said .sidebar appeared twice in style.css.
    
    # Let's remove the first .sidebar-logo-icon width/height
    scss = re.sub(r'\.sidebar-logo-icon\s*\{([^\}]+)\}', lambda m: m.group(0).replace('width: 40px;', '').replace('height: 40px;', ''), scss, count=1)
    
    # Let's remove the first .sidebar block entirely or merge it.
    # We will just write a simpler approach: use python script to read all lines.
    pass

fix_css()
