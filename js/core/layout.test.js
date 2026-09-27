import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setSidebar, closeMobileSidebar, openMobileSidebar } from './layout.js';

describe('Sidebar Drawer API', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="sidebar" class="sidebar"></div>
            <div id="sidebar-overlay" class="sidebar-overlay"></div>
        `;
        window._closeSidebar = closeMobileSidebar;
        window._openSidebar = openMobileSidebar;
        window._setSidebar = setSidebar;
        
        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: true,
                media: query,
                onchange: null,
                addListener: vi.fn(), // deprecated
                removeListener: vi.fn(), // deprecated
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('setSidebar(true) opens the drawer and disables scrolling', () => {
        setSidebar(true);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        expect(sidebar?.classList.contains('open')).toBe(true);
        expect(overlay?.classList.contains('show')).toBe(true);
        expect(document.body.style.overflow).toBe('hidden');
    });

    it('setSidebar(false) closes the drawer and restores scrolling', () => {
        setSidebar(true);
        setSidebar(false);
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        
        expect(sidebar?.classList.contains('open')).toBe(false);
        expect(overlay?.classList.contains('show')).toBe(false);
        expect(document.body.style.overflow).toBe('');
    });
});
