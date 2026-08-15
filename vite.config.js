import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/SMPAnnida/',
  resolve: {
    alias: {
      '@': resolve(__dirname, './js'),
      '@css': resolve(__dirname, './css')
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        superDashboard: resolve(__dirname, 'dashboard.html'),
        academicDashboard: resolve(__dirname, 'pages/academic/dashboard.html'),
        financeBudget: resolve(__dirname, 'pages/finance/budget.html'),
        financeRab: resolve(__dirname, 'pages/finance/rab.html'),
        financeReports: resolve(__dirname, 'pages/finance/reports.html'),
        financeSettings: resolve(__dirname, 'pages/finance/settings.html'),
        financeTransactions: resolve(__dirname, 'pages/finance/transactions.html'),
        ppdbAbout: resolve(__dirname, 'pages/ppdb/about.html'),
        ppdbDashboardAdmin: resolve(__dirname, 'pages/ppdb/dashboard-admin.html'),
        ppdbDashboardSiswa: resolve(__dirname, 'pages/ppdb/dashboard-siswa.html'),
        ppdbIndex: resolve(__dirname, 'pages/ppdb/index.html'),
        ppdbLogin: resolve(__dirname, 'pages/ppdb/login.html'),
        ppdbRegister: resolve(__dirname, 'pages/ppdb/register.html')
      }
    }
  }
});
