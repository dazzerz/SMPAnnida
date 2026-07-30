import re

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

hide_scrollbar_css = """
/* =========================================================================
   HIDDEN SCROLLBARS (Scrollable but invisible)
========================================================================= */
/* For Webkit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 0px;
  height: 0px;
  background: transparent;
  display: none;
}

/* For Firefox and IE/Edge legacy */
* {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content.strip() + "\n\n" + hide_scrollbar_css)
print("Scrollbars hidden!")
