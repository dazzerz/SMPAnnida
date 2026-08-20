import { defineConfig } from 'vite';
import { resolve } from 'path';

const root = import.meta.dirname;

export default defineConfig({
  base: '/SMPAnnida/',
  resolve: {
    alias: {
      '@': resolve(root, './js'),
      '@css': resolve(root, './css')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        superDashboard: resolve(root, 'dashboard.html'),
        academicDashboard: resolve(root, 'pages/academic/dashboard.html'),
        financeDashboard: resolve(root, 'pages/finance/dashboard.html'),
        ppdbAbout: resolve(root, 'pages/ppdb/about.html'),
        ppdbDashboardAdmin: resolve(root, 'pages/ppdb/dashboard-admin.html'),
        ppdbDashboardWali: resolve(root, 'pages/ppdb/dashboard-wali.html'),
        ppdbIndex: resolve(root, 'pages/ppdb/index.html'),
        ppdbLogin: resolve(root, 'pages/ppdb/login.html'),
        ppdbRegister: resolve(root, 'pages/ppdb/register.html'),
        ppdbSuccess: resolve(root, 'pages/ppdb/success.html')
      }
    }
  }
});
