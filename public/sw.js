/**
 * sw.js - Kill-switch Service Worker (bukan lagi PWA).
 *
 * Tujuan satu-satunya: membebaskan perangkat pengguna dari Service Worker lama
 * (era PWA) yang masih menyajikan HTML/CSS/JS versi usang. Tanpa file ini,
 * SW lama tetap terdaftar karena browser gagal memeriksa update (404).
 *
 * Alur: install -> skipWaiting -> activate -> hapus semua cache -> unregister.
 * Tidak memakai precache, tidak intercept fetch, tidak menyimpan apa pun.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    } catch (_) {
      // Cache Storage bisa diblokir (mode privat); abaikan.
    }

    try {
      await self.registration.unregister();
    } catch (_) {
      // Abaikan; percobaan berikutnya terjadi pada kunjungan berikutnya.
    }

    // Tanpa cache aktif dan tanpa registrasi, setiap navigasi berikutnya
    // diambil langsung dari jaringan.
  })());
});
