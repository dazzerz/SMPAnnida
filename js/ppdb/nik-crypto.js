// Enkripsi NIK PPDB (AES, client-side). Satu-satunya tempat kunci diambil.
// Catatan keamanan: kunci tertanam di bundle (lihat docs/security.md).
import CryptoJS from 'crypto-js';

// Kunci NIK hanya dari env build. Fallback dipertahankan agar halaman tidak crash,
// tetapi data yang dienkripsi dengan fallback TIDAK aman (lihat docs/security.md).
const NIK_FALLBACK_KEY = 'dev-fallback-key-do-not-use-in-prod';
let nikKeyWarned = false;

export function getEncryptionKey() {
  const key = import.meta.env.VITE_ENCRYPTION_KEY;
  if (key) return key;
  if (!nikKeyWarned) {
    nikKeyWarned = true;
    console.error('[PPDB] VITE_ENCRYPTION_KEY kosong: NIK dienkripsi dengan kunci fallback yang tidak aman.');
  }
  return NIK_FALLBACK_KEY;
}

export function encryptNik(nik) {
  return nik ? CryptoJS.AES.encrypt(nik, getEncryptionKey()).toString() : null;
}

// Rotasi kunci: coba kunci utama, lalu VITE_ENCRYPTION_KEY_LEGACY (kunci lama),
// lalu fallback (data yang ditulis build tanpa kunci). Hasil kosong = kunci salah.
export function decryptNik(encryptedText) {
  if (!encryptedText) return '-';
  const keys = [getEncryptionKey(), import.meta.env.VITE_ENCRYPTION_KEY_LEGACY, NIK_FALLBACK_KEY];
  for (const key of new Set(keys.filter(Boolean))) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key).toString(CryptoJS.enc.Utf8);
      if (decrypted) return decrypted;
    } catch (e) {
      // Kunci salah sering memicu "Malformed UTF-8"; lanjut ke kunci berikutnya.
    }
  }
  return encryptedText; // Kembalikan plaintext lama bila tidak ada kunci yang cocok
}
