# Architecture Overview

## Frontend Architecture
Sistem dibangun menggunakan **Vanilla JavaScript dengan ES Modules**.
Tidak ada *framework* reaktif atau *bundler* yang digunakan, memungkinkan deployment langsung dan ukuran file statis yang ringan.

- **Component Injection**: UI yang dibagikan antarhalaman (seperti *Sidebar* dan *Topbar*) diinjeksi ke dalam DOM secara asinkron lewat `js/core/layout.js`.
- **Global State**: Absen. Aplikasi mengandalkan penyegaran DOM dari respons API, memastikan status sinkron setiap transisi halaman.

## Backend Architecture
- **BaaS (Backend-as-a-Service)**: Menggunakan **Supabase**.
- **Autentikasi**: *GoTrue Auth* mengembalikan *JSON Web Token* (JWT) yang tersimpan otomatis di *localStorage*.
- **Database**: Akses dilakukan via Supabase-JS SDK (REST API ke PostgreSQL). Skema basis data harus dilindungi oleh konfigurasi RLS *(Row Level Security)*.
