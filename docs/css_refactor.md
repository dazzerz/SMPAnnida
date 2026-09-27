# CSS Refactor

The CSS has been modularised into:
- \css/theme/layout.css\: Core layout styles
- \css/theme/sidebar.css\: Sidebar specific styles
- \css/theme/overlay.css\: Overlay styles

And mobile:
- \css/mobile/drawer.css\: Mobile drawer
- \css/mobile/toolbar.css\: Mobile toolbar

Variables like \--z-sidebar\ and \--z-overlay\ are now used to manage z-indices cleanly.
