# Deployment Guide

Aplikasi tergolong murni *Frontend Statis* tanpa skrip sisi server (Node.js/PHP). 

## Checklist Deployment Produksi
- [ ] **RLS Enabled**: Seluruh tabel di Supabase wajib mengaktifkan Row Level Security.
- [ ] **Backup Database**: Penjadwalan *backup* harian dari panel Supabase (opsional).
- [ ] **Restore Procedure**: Prosedur restorasi teruji.
- [ ] **Environment Configured**: URL *Supabase* dan *Anon Key* siap (atau diletakkan di bundler rahasia jika dimigrasikan).
- [ ] **HTTPS**: Penggunaan SSL/TLS wajib untuk operasional *web app*.
- [ ] **Domain**: Pemetaan domain khusus (*Custom Domain*) untuk instans frontend.
- [ ] **Error Logging**: Belum ada alat APM (Sentry/Datadog) terhubung.
- [ ] **Monitoring**: Uptime monitoring direkomendasikan.
- [ ] **Version Tag**: Kode menggunakan *Git Tags* `v1.0.0-rc1`.

## Opsi Hosting
Dapat ditempatkan di Host penyedia statis seperti Vercel, Netlify, Cloudflare Pages, atau VPS tradisional (Nginx/Apache).
