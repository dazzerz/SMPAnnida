import os

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

glass_overrides = """
/* =========================================================================
   MASSIVE GLASSMORPHISM & NEUMORPHISM OVERRIDES FOR ALL MODULES (PPDB, FINANCE, ACADEMIC)
========================================================================= */

/* Variable Mapping (Force all old variables to use Glassmorphism) */
:root, [data-theme="light"], [data-theme="dark"] {
  --bg-card: var(--glass-bg) !important;
  --bg-main: transparent !important;
  --bg-primary: transparent !important;
  --bg-secondary: transparent !important;
  --text-main: var(--text-primary) !important;
  --primary-color: var(--primary) !important;
  --accent-primary: var(--primary) !important;
  --background-color: var(--body-color) !important;
  --bg-elevated: var(--glass-bg-hover) !important;
}

/* Force Glassmorphism on all generic card and panel elements */
.card, .auth-card, .metric-card, .dashboard-card, .glass-panel, .table-container, .modal, .modal-content, .rab-card {
  background: var(--glass-bg) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow) !important;
  border-radius: 16px !important;
}

/* Force Table Backgrounds to be transparent */
table, thead, tbody, tr, th, td {
  background: transparent !important;
  background-color: transparent !important;
  color: var(--text-primary) !important;
  border-bottom-color: var(--glass-border) !important;
}
th {
  background: var(--glass-bg-hover) !important; /* Slightly darker/frosted for header */
}

/* Force Input Fields to be Neumorphic/Glassmorphic */
input, select, textarea, .form-control, .form-select, .form-input {
  background: rgba(17, 24, 39, 0.05) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--glass-border) !important;
  border-radius: 8px !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05) !important; /* Neumorphic inner shadow */
}
[data-theme="dark"] input, [data-theme="dark"] select, [data-theme="dark"] textarea,
[data-theme="dark"] .form-control, [data-theme="dark"] .form-select, [data-theme="dark"] .form-input {
  background: rgba(17, 24, 39, 0.4) !important;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}
input:focus, select:focus, textarea:focus, .form-control:focus {
  outline: none !important;
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 3px var(--primary-light), inset 0 2px 4px rgba(0,0,0,0.05) !important;
}

/* Buttons Neumorphism/Glassmorphism */
.btn-primary, .btn-secondary, button[type="submit"] {
  background: var(--primary) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 15px var(--primary-light), inset 0 1px 0 rgba(255,255,255,0.2) !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
}
.btn-primary:hover, .btn-secondary:hover, button[type="submit"]:hover {
  background: var(--primary-hover) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 20px var(--primary-light), inset 0 1px 0 rgba(255,255,255,0.3) !important;
}
.btn-outline {
  background: transparent !important;
  border: 1px solid var(--primary) !important;
  color: var(--primary) !important;
}
.btn-outline:hover {
  background: var(--primary-light) !important;
  color: var(--primary) !important;
}

/* Fix specific colors in RAB headers etc */
.rab-card-header {
  background: var(--glass-bg-hover) !important;
  color: var(--text-primary) !important;
}

/* Ensure background color doesn't peek through the corners of the table container */
.table-responsive {
  border-radius: 16px !important;
  overflow: hidden !important;
  background: transparent !important;
}
"""

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

if "MASSIVE GLASSMORPHISM" not in content:
    with open(css_path, 'a', encoding='utf-8') as f:
        f.write("\n" + glass_overrides)
    print("Glassmorphism overrides appended to style.css!")
else:
    print("Overrides already exist.")
