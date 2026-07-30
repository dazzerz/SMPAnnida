import re

css_path = r"C:\Users\daffaakhdaan\Annida2\SMPAnnida\css\style.css"

with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove all old lock fixes to start fresh
content = content.split("/* Responsive Sidebar */")[0]
content = content.split("/* Truly Fluid Sidebar")[0]

# 2. Append the ULTIMATE Fluid and Glassmorphism block
ultimate_css = """
/* =========================================================================
   ULTIMATE FLUID LAYOUT & TRUE GLASSMORPHISM (REFERENCE MATCH)
========================================================================= */

/* 1. True Glassmorphism Background (Nature / Leaves) */
body {
  background-color: #121212 !important;
  background-image: url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop') !important;
  background-size: cover !important;
  background-position: center !important;
  background-attachment: fixed !important;
  color: #ffffff !important;
}

/* Force text to be white/readable everywhere because of the dark glass */
:root, [data-theme="light"], [data-theme="dark"] {
  --text-primary: #ffffff !important;
  --text-secondary: rgba(255, 255, 255, 0.7) !important;
  --text-muted: rgba(255, 255, 255, 0.5) !important;
}
h1, h2, h3, h4, h5, h6, p, span, div {
  color: var(--text-primary);
}

/* The exact glass effect from the reference */
.card, .auth-card, .metric-card, .dashboard-card, .glass-panel, .table-container, .modal, .modal-content, .rab-card, .transactions-table-wrapper, .sidebar, .budget-card, .topbar {
  background: rgba(25, 30, 25, 0.45) !important; /* Dark greenish tint */
  backdrop-filter: blur(24px) !important;
  -webkit-backdrop-filter: blur(24px) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
  border-radius: 20px !important;
}

/* Ensure no inner elements have solid backgrounds */
table, thead, tbody, tr, th, td {
  background: transparent !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}
th {
  background: rgba(255, 255, 255, 0.05) !important;
}
input, select, textarea, .filter-select {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}
input::placeholder {
  color: rgba(255, 255, 255, 0.5) !important;
}
option {
  background: #1e293b !important;
  color: white !important;
}

/* 2. ULTIMATE Fluid Layout (No Locks) */
/* Reset any min/max width on app layout */
.app-layout, .app-container {
  display: flex !important;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  flex-direction: row !important; /* side by side */
}

/* Sidebar flows with percentage */
.sidebar {
  position: static !important; /* Remove fixed/sticky locks */
  flex: 0 0 20% !important;
  width: 20% !important;
  max-width: none !important;
  min-width: 0 !important;
  height: 100vh !important;
  overflow-y: auto !important;
  border-radius: 0 20px 20px 0 !important; /* Make it look like a glass pane */
}

/* Main content takes exactly the rest */
.main-content {
  flex: 1 !important;
  width: 80% !important;
  max-width: 80% !important;
  min-width: 0 !important;
  margin-left: 0 !important; /* Destroy dashboard.css margin lock */
  padding: 2rem !important;
  overflow-x: hidden !important; /* Stop horizontal expansion */
  box-sizing: border-box !important;
}

/* Ensure tables wrap inside */
.transactions-table-wrapper, .table-responsive {
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: auto !important;
  display: block !important;
  box-sizing: border-box !important;
}

/* Make grids completely auto-fit with small minimums so they zoom perfectly */
.budget-grid, .stats-grid, .grid {
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
  gap: 1.5rem !important;
  width: 100% !important;
}

/* Mobile flex stacking if extremely zoomed */
@media (max-width: 768px) {
  .app-layout, .app-container {
    flex-direction: column !important;
  }
  .sidebar {
    width: 100% !important;
    height: auto !important;
    flex: none !important;
    border-radius: 0 0 20px 20px !important;
  }
  .main-content {
    width: 100% !important;
    max-width: 100% !important;
  }
}
"""

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content.strip() + "\n\n" + ultimate_css)
print("Ultimate fluid and glassmorphism applied!")
