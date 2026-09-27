# Deployment Guide

*Panduan lengkap untuk melakukan deployment aplikasi SMP Annida ke berbagai platform hosting.*

## Table of Contents
1. [Prasyarat Deployment](#prasyarat-deployment)
2. [Environment Variables](#environment-variables)
3. [Vercel Deployment](#vercel-deployment)
4. [Netlify Deployment](#netlify-deployment)
5. [GitHub Pages Deployment](#github-pages-deployment)
6. [Catatan Tambahan](#catatan-tambahan)

---

## Prasyarat Deployment
Sebelum melakukan deployment ke server atau platform hosting apapun, pastikan Anda telah menyiapkan:
- Repositori Git yang sudah berisi seluruh kode sumber (Github/Gitlab).
- Akun platform hosting (Vercel, Netlify, dll).
- Akses ke Supabase dashboard untuk mendapatkan URL dan API Key.
- (Opsional) Akun Sentry atau LogRocket untuk memantau error di *production*.

Proyek ini telah dikonfigurasi dengan **Vite** sebagai *bundler*. Proses kompilasi kode dan aset diatur melalui perintah bawaan:
- **Build command**: `npm run build`
- **Output directory**: `dist`

Jika Anda ingin menjalankan server statis secara lokal untuk mengetes hasil *build*, gunakan perintah `npm run preview`.

---

## Environment Variables
Sebagian besar layanan hosting membutuhkan penyetelan *environment variables* yang merepresentasikan `.env`. Anda wajib menyetel nilai-nilai ini di pengaturan proyek platform hosting Anda:

- `VITE_SUPABASE_URL` = URL proyek Supabase (contoh: `https://xyz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = Kunci publik *anon* Supabase
- `VITE_ANALYTICS_PROVIDER` = (Opsional) `sentry` atau `logrocket`
- `VITE_SENTRY_DSN` = (Opsional) DSN Endpoint Sentry
- `VITE_LOGROCKET_ID` = (Opsional) ID App LogRocket

> [!WARNING]
> Jangan pernah memasukkan Supabase *Service Role Key* ke dalam variabel lingkungan klien Vite. Selalu gunakan *Anon Key*.

---

## Vercel Deployment
Vercel adalah cara termudah dan tercepat untuk me-*hosting* aplikasi berbasis frontend Vite. 
1. Buat akun di [Vercel](https://vercel.com) dan hubungkan dengan akun GitHub Anda.
2. Klik **Add New Project** dan impor repositori `SMPAnnida`.
3. Vercel akan secara otomatis mendeteksi bahwa ini adalah proyek *Vite*.
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Buka tab **Environment Variables** lalu tambahkan semua variabel seperti `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
5. Klik **Deploy**.

**(Opsional) `vercel.json`**
Jika perlu mengonfigurasi rute ulang (SPA routing), Anda dapat menambahkan `vercel.json` di *root*:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Netlify Deployment
Bagi pengguna Netlify, alur *deployment* sangat mirip dengan Vercel.
1. Masuk ke [Netlify](https://www.netlify.com).
2. Klik **Add new site** > **Import an existing project**.
3. Pilih repositori `SMPAnnida`.
4. Atur konfigurasinya:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Masukkan pengaturan rahasia ke **Advanced > Environment Variables**.
6. Klik **Deploy site**.

**(Opsional) `netlify.toml`**
Konfigurasi Netlify untuk membelokkan lalu lintas (agar hash routing tetap aman):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## GitHub Pages Deployment
Meskipun bisa digunakan, GitHub Pages memiliki beberapa batasan terkait *routing*. Namun, karena kita menggunakan hash routing, ini sangat cocok!
1. Di GitHub, pergi ke repositori Anda.
2. Karena kita menggunakan Vite, lebih baik mengatur GitHub Actions untuk nge-*build* proyek.
3. Buat file `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```
4. Pastikan Anda telah mengatur `base` di `vite.config.js` sesuai dengan nama repositori jika tidak di-host di domain *root*.
5. GitHub Actions akan membangun proyek secara otomatis setiap ada pembaruan di *branch main*.

---

## Catatan Tambahan
Selalu periksa konsol web pada browser jika Anda mendapati layar kosong (blank screen). Jika proyek di *deploy* dan layar kosong, kemungkinan besar variabel lingkungan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` gagal dibaca, atau rute belum tersambung ke `index.html`.
