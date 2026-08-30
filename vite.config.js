import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = import.meta.dirname;

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      '@': resolve(root, './js'),
      '@css': resolve(root, './css')
    }
  },
  build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        login: resolve(root, 'login.html'),
        superDashboard: resolve(root, 'dashboard.html'),
        academicDashboard: resolve(root, 'pages/academic/dashboard.html'),
        financeDashboard: resolve(root, 'pages/finance/dashboard.html'),
        ppdbAbout: resolve(root, 'pages/ppdb/about.html'),
        ppdbDashboardAdmin: resolve(root, 'pages/ppdb/dashboard-admin.html'),
        ppdbDashboardWali: resolve(root, 'pages/ppdb/dashboard-wali.html'),
        ppdbIndex: resolve(root, 'pages/ppdb/index.html'),
        ppdbRegister: resolve(root, 'pages/ppdb/register.html'),
        ppdbSuccess: resolve(root, 'pages/ppdb/success.html'),
        ppdbPrivacyPolicy: resolve(root, 'pages/ppdb/privacy-policy.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('chart.js')) {
              return 'vendor-charts';
            }
            if (id.includes('xlsx')) {
              return 'vendor-xlsx';
            }
            if (id.includes('jspdf')) {
              return 'vendor-jspdf';
            }
            if (id.includes('html2canvas')) {
              return 'vendor-html2canvas';
            }
            if (id.includes('papaparse') || id.includes('dompurify')) {
              return 'vendor-utils';
            }
            if (id.includes('crypto-js')) {
              return 'vendor-crypto';
            }
          }
        }
      }
    }
  }
});
