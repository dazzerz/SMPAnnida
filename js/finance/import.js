(function(){
const allowed = ["dazzerz.github.io", "localhost", "127.0.0.1"];
const host = window.location.hostname;
if (!allowed.includes(host) && host !== "") {
document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;background-color:#0b1320;color:#ef4444;font-family:sans-serif;font-size:2rem;font-weight:bold;'>Unauthorized Domain Access Restricted</div>";
throw new Error("Access restricted");
}
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
if (e.key === 'F12' ||
(e.ctrlKey && e.shiftKey && e.key === 'I') ||
(e.ctrlKey && e.shiftKey && e.key === 'J') ||
(e.ctrlKey && e.key === 'U')) {
e.preventDefault();
}
});
})();
import supabaseClient from '../core/supabase.js';
export async function downloadTemplate(categories) {
const XLSX = await import('xlsx');
if (!XLSX) { showToast('Library Excel belum siap, coba refresh halaman.', 'error'); return; }
const headers = ['tanggal', 'keterangan', 'tipe', 'kategori', 'jumlah', 'sumber_dana'];
const instructions = [
['FORMAT: YYYY-MM-DD', 'Keterangan transaksi', 'pemasukan / pengeluaran', 'Nama kategori (lihat sheet Kategori)', 'Angka tanpa titik/koma (contoh: 50000)', 'kas / bank'],
];
const samples = [
['2026-07-01', 'Gaji bulan Juli', 'pemasukan', 'Gaji', 3500000, 'bank'],
['2026-07-02', 'Makan siang', 'pengeluaran', 'Makanan', 35000, 'kas'],
['2026-07-03', 'Bensin motor', 'pengeluaran', 'Transport', 50000, 'kas'],
['2026-07-05', 'Freelance project', 'pemasukan', 'Freelance', 1500000, 'bank'],
['2026-07-10', 'Belanja bulanan', 'pengeluaran', 'Belanja', 450000, 'kas'],
];
const txSheet = XLSX.utils.aoa_to_sheet([headers, ...instructions, ...samples]);
txSheet['!cols'] = [
{ wch: 14 },
{ wch: 30 },
{ wch: 14 },
{ wch: 18 },
{ wch: 16 },
{ wch: 14 },
];
const catHeaders = ['Nama Kategori', 'Tipe'];
const catRows = categories.map(c => [c.name, c.type === 'income' ? 'pemasukan' : 'pengeluaran']);
const catSheet = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows]);
catSheet['!cols'] = [{ wch: 20 }, { wch: 14 }];
const guideSheet = XLSX.utils.aoa_to_sheet([
['PETUNJUK PENGISIAN TEMPLATE'],
[''],
['1. Isi data mulai dari baris ke-3 (baris kuning adalah contoh, boleh dihapus)'],
['2. Kolom TANGGAL: format YYYY-MM-DD (contoh: 2026-07-15)'],
['3. Kolom TIPE: isi "pemasukan" atau "pengeluaran" (huruf kecil)'],
['4. Kolom KATEGORI: isi nama kategori sesuai daftar di sheet "Kategori"'],
['5. Kolom JUMLAH: angka saja, tanpa Rp, titik, atau koma (contoh: 50000)'],
['6. Kolom SUMBER_DANA: isi "kas" (Kas Tunai) atau "bank" (Rekening Bank)'],
['7. Jangan mengubah nama kolom di baris pertama'],
['8. Simpan file dalam format .xlsx atau .xls sebelum diupload'],
[''],
['TIPS: Gunakan sheet "Kategori" sebagai referensi kategori yang tersedia'],
]);
guideSheet['!cols'] = [{ wch: 65 }];
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');
XLSX.utils.book_append_sheet(wb, catSheet, 'Kategori');
XLSX.utils.book_append_sheet(wb, guideSheet, 'Petunjuk');
XLSX.writeFile(wb, 'template-annida2finance.xlsx');
}
export async function parseExcelFile(file) {
const XLSX = await import('xlsx');
return new Promise((resolve, reject) => {
if (!XLSX) { reject(new Error('Library XLSX belum dimuat')); return; }
const reader = new FileReader();
reader.onload = (e) => {
try {
const data = new Uint8Array(e.target.result);
let aoa = [];
try {
const wb = XLSX.read(data, { type: 'array', cellDates: true });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
} catch (readErr) {
if (readErr.message && String(readErr.message).toLowerCase().includes('html')) {
const text = new TextDecoder('utf-8').decode(data);
const parser = new DOMParser();
const doc = parser.parseFromString(text, 'text/html');
const rows = doc.querySelectorAll('tr');
if (rows.length === 0) throw new Error('Tabel tidak ditemukan di dalam file XLS/HTML ini.');
aoa = Array.from(rows).map(tr =>
Array.from(tr.querySelectorAll('td, th')).map(td => td.innerText.trim())
);
} else {
throw readErr;
}
}
let headerRowIdx = -1;
let templateType = 'standard';
for (let i = 0; i < aoa.length; i++) {
const rowStr = aoa[i].map(c => String(c).toLowerCase()).join('|');
if (rowStr.includes('waktu transaksi') && rowStr.includes('deskripsi')) {
headerRowIdx = i;
templateType = 'bsi';
break;
} else if (rowStr.includes('date') && rowStr.includes('description') && rowStr.includes('amount')) {
headerRowIdx = i;
templateType = 'english_bank';
break;
} else if (rowStr.includes('tanggal') && rowStr.includes('keterangan')) {
headerRowIdx = i;
templateType = 'standard';
break;
}
}
if (headerRowIdx === -1) {
headerRowIdx = 0;
}
const headers = aoa[headerRowIdx].map(c => String(c).trim());
const dataRows = aoa.slice(headerRowIdx + 1);
const mappedRows = [];
if (templateType === 'bsi') {
const wTIdx = headers.findIndex(h => h.toLowerCase() === 'waktu transaksi');
const descIdx = headers.findIndex(h => h.toLowerCase() === 'deskripsi');
const debetIdx = headers.findIndex(h => h.toLowerCase() === 'debet');
const kreditIdx = headers.findIndex(h => h.toLowerCase() === 'kredit');
const simplifyBSIDescription = (desc) => {
if (!desc) return '';
let s = String(desc).trim();
if (s.startsWith('BIFAST - TRF Ke -')) {
const parts = s.split('-');
return parts[parts.length - 1].trim();
}
if (s.includes('- TRF Ke -')) {
return s.split('- TRF Ke -')[0].trim();
}
if (s.includes('- Transfer Dari -') || s.includes('TRF Dari')) {
const parts = s.split('-');
if (parts.length > 2) return parts[parts.length - 1].trim();
}
return s;
};
dataRows.forEach(row => {
if (!row[wTIdx] && !row[descIdx]) return;
let tanggal = row[wTIdx];
if (typeof tanggal === 'string' && tanggal.includes('-')) {
const cleanTanggal = tanggal.split(/[\s\r\n]+/)[0];
const parts = cleanTanggal.split('-');
if (parts.length === 3) tanggal = `${parts[2]}-${parts[1]}-${parts[0]}`;
} else if (tanggal instanceof Date) {
tanggal = new Date(tanggal.getTime() - (tanggal.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}
const debetStr = String(row[debetIdx] || '').replace(/[^0-9.]/g, '');
const kreditStr = String(row[kreditIdx] || '').replace(/[^0-9.]/g, '');
const debet = parseFloat(debetStr);
const kredit = parseFloat(kreditStr);
let tipe = '';
let jumlah = 0;
if (debet > 0) { tipe = 'pengeluaran'; jumlah = debet; }
else if (kredit > 0) { tipe = 'pemasukan'; jumlah = kredit; }
if (jumlah > 0) {
mappedRows.push({
tanggal: tanggal,
keterangan: simplifyBSIDescription(row[descIdx]),
tipe: tipe,
kategori: '',
jumlah: jumlah,
sumber_dana: 'bank'
});
}
});
} else if (templateType === 'english_bank') {
const dateIdx = headers.findIndex(h => h.toLowerCase() === 'date');
const descIdx = headers.findIndex(h => h.toLowerCase() === 'description');
const amountIdx = headers.findIndex(h => h.toLowerCase() === 'amount');
const dbIdx = headers.findIndex(h => h.toLowerCase() === 'db');
const crIdx = headers.findIndex(h => h.toLowerCase() === 'cr');
const simplifyEnglishDescription = (desc) => {
if (!desc) return '';
let s = String(desc).trim();
if (s.includes('Trf Ke -')) {
return s.split('Trf Ke -')[1].trim();
}
if (s.includes('Trf Dari -')) {
return s.split('Trf Dari -')[1].trim();
}
return s;
};
dataRows.forEach(row => {
if (!row[dateIdx] && !row[descIdx]) return;
let tanggal = row[dateIdx];
if (typeof tanggal === 'string') {
tanggal = tanggal.split(' ')[0];
} else if (tanggal instanceof Date) {
tanggal = new Date(tanggal.getTime() - (tanggal.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
}
const amountStr = String(row[amountIdx] || '').replace(/[^0-9.]/g, '');
const jumlah = parseFloat(amountStr) || 0;
const isDb = String(row[dbIdx] || '').toUpperCase() === 'DB';
const isCr = String(row[crIdx] || '').toUpperCase() === 'CR';
let tipe = '';
if (isDb) { tipe = 'pengeluaran'; }
else if (isCr) { tipe = 'pemasukan'; }
if (jumlah > 0 && tipe !== '') {
mappedRows.push({
tanggal: tanggal,
keterangan: simplifyEnglishDescription(row[descIdx]),
tipe: tipe,
kategori: '',
jumlah: jumlah,
sumber_dana: 'bank'
});
}
});
} else {
const tglIdx = headers.findIndex(h => h.toLowerCase() === 'tanggal') > -1 ? headers.findIndex(h => h.toLowerCase() === 'tanggal') : 0;
const ketIdx = headers.findIndex(h => h.toLowerCase() === 'keterangan') > -1 ? headers.findIndex(h => h.toLowerCase() === 'keterangan') : 1;
const tipeIdx = headers.findIndex(h => h.toLowerCase() === 'tipe') > -1 ? headers.findIndex(h => h.toLowerCase() === 'tipe') : 2;
const katIdx = headers.findIndex(h => h.toLowerCase() === 'kategori') > -1 ? headers.findIndex(h => h.toLowerCase() === 'kategori') : 3;
const jmlIdx = headers.findIndex(h => h.toLowerCase() === 'jumlah') > -1 ? headers.findIndex(h => h.toLowerCase() === 'jumlah') : 4;
const sumIdx = headers.findIndex(h => h.toLowerCase() === 'sumber_dana') > -1 ? headers.findIndex(h => h.toLowerCase() === 'sumber_dana') : 5;
dataRows.forEach(row => {
const tipe = String(row[tipeIdx] || '').toLowerCase().trim();
const jumlah = row[jmlIdx];
if (jumlah && (tipe === 'pemasukan' || tipe === 'pengeluaran')) {
mappedRows.push({
tanggal: row[tglIdx],
keterangan: row[ketIdx],
tipe: row[tipeIdx],
kategori: row[katIdx],
jumlah: row[jmlIdx],
sumber_dana: row[sumIdx]
});
}
});
}
resolve(mappedRows);
} catch (err) {
reject(new Error('Gagal membaca file: ' + err.message));
}
};
reader.onerror = () => reject(new Error('Gagal membaca file'));
reader.readAsArrayBuffer(file);
});
}
export async function validateAndMapRows(rows, categories) {
const results = [];
const unmatchedRows = [];
rows.forEach((row, idx) => {
const errors = [];
const rowNum = idx + 2;
let date = '';
if (row.tanggal instanceof Date) {
date = row.tanggal.toISOString().split('T')[0];
} else {
const str = String(row.tanggal || '').trim();
if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
date = str;
} else if (str) {
const parsed = new Date(str);
if (!isNaN(parsed)) {
date = parsed.toISOString().split('T')[0];
} else {
errors.push('Format tanggal tidak valid (gunakan YYYY-MM-DD)');
}
} else {
errors.push('Tanggal kosong');
}
}
const tipeRaw = String(row.tipe || '').toLowerCase().trim();
let type = '';
if (tipeRaw === 'pemasukan' || tipeRaw === 'income') type = 'income';
else if (tipeRaw === 'pengeluaran' || tipeRaw === 'expense') type = 'expense';
else errors.push(`Tipe tidak valid: "${row.tipe}" (harus: pemasukan/pengeluaran)`);
const jumlahRaw = String(row.jumlah || '').replace(/[^0-9.]/g, '');
const amount = parseFloat(jumlahRaw);
if (!amount || amount <= 0) errors.push('Jumlah harus lebih dari 0');
const description = String(row.keterangan || '').trim();
const katNama = String(row.kategori || '').trim().toLowerCase();
let matchedCat = categories.find(c =>
c.name.toLowerCase() === katNama &&
((type === 'income' && c.type === 'income') || (type === 'expense' && c.type === 'expense'))
);
if (!katNama && !matchedCat && description) {
unmatchedRows.push({
idx: idx,
description: description,
type: type
});
}
const categoryId = matchedCat?.id || null;
if (katNama && !matchedCat) {
errors.push(`Kategori "${row.kategori}" tidak ditemukan (akan diisi "Lainnya")`);
}
const sumberRaw = String(row.sumber_dana || '').toLowerCase().trim();
const sumberDana = (sumberRaw === 'kas') ? 'kas' : 'bank';
results.push({
rowNum,
date,
type,
amount,
description,
sumber_dana: sumberDana,
category_id: categoryId,
categoryName: matchedCat?.name || row.kategori || '-',
categoryIcon: matchedCat?.icon || '💰',
errors,
valid: errors.length === 0 || errors.every(e => e.includes('tidak ditemukan')),
_raw: row,
});
});
if (unmatchedRows.length > 0) {
const incomeRows = unmatchedRows.filter(r => r.type === 'income');
const expenseRows = unmatchedRows.filter(r => r.type === 'expense');
const incomeCategories = categories.filter(c => c.type === 'income').map(c => c.name);
const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.name);
async function fetchAI(unmatchedBatch, catList) {
if (unmatchedBatch.length === 0) return;
const apiKey = localStorage.getItem('gemini_api_key') || '';
if (!apiKey) {
showToast("Kunci API Google Gemini belum diisi! Silakan isi di menu Pengaturan.", 'error');
return;
}
const catNames = catList.join(', ');
const descList = unmatchedBatch.map((r, i) => `${i+1}. ${r.description}`).join('\n');
const prompt = `Kamu adalah pakar keuangan pribadi cerdas dari Indonesia. Kategorikan daftar transaksi bank mutasi ini berdasarkan deskripsinya.
Pilih HANYA dari kategori berikut: [${catNames}, Lainnya].
Pahami konteks lokal: "Bet/Seragam/SPP" = Pendidikan, "Biaya Adm/Admin" = Belanja/Tagihan, "Gopay/Dana/Shopeepay" = Belanja, "Makan/Snack" = Makanan, "Bonus/Bagi Hasil" = Pemasukan/Bonus.
Kembalikan hasil HANYA dalam bentuk array JSON string, di mana urutannya persis sama dengan urutan transaksi. Contoh jawaban valid: ["Pendidikan", "Tagihan", "Lainnya"]
Daftar Transaksi:
${descList}`;
const modelsToTry = [
"gemini-3.5-flash",
"gemini-2.5-flash",
"gemini-2.5-flash-lite",
"gemini-3-flash",
"gemini-3.1-flash-lite",
"gemini-3.5-flash-lite"
];
let answer = null;
let lastErrData = null;
let lastErrMsg = null;
for (const model of modelsToTry) {
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000);
try {
const response = await fetch(
`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
{
method: "POST",
headers: { "Content-Type": "application/json" },
signal: controller.signal,
body: JSON.stringify({
contents: [{ parts: [{ text: prompt }] }],
generationConfig: {
temperature: 0.1,
maxOutputTokens: 8192,
responseMimeType: "application/json"
}
}),
}
);
clearTimeout(timeoutId);
if (response.ok) {
const data = await response.json();
answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
if (answer) {
break;
}
} else {
lastErrData = await response.json().catch(() => null);
}
} catch (err) {
lastErrMsg = err.message;
}
}
if (!answer) {
console.error("Semua model Gemini gagal dihubungi.");
showToast("Gagal memanggil Gemini AI (Semua model dicoba). Error terakhir: " +
(lastErrData?.error?.message || lastErrMsg || "Unknown error"), 'error');
return;
}
let parsedArray = [];
try {
let cleanAnswer = answer.trim();
if (cleanAnswer.startsWith('```json')) cleanAnswer = cleanAnswer.substring(7);
else if (cleanAnswer.startsWith('```')) cleanAnswer = cleanAnswer.substring(3);
if (cleanAnswer.endsWith('```')) cleanAnswer = cleanAnswer.slice(0, -3);
cleanAnswer = cleanAnswer.trim();
if (!cleanAnswer.endsWith(']')) cleanAnswer += ']';
parsedArray = JSON.parse(cleanAnswer);
} catch (parseErr) {
const matches = answer.match(/"([^"]+)"/g);
if (matches) {
parsedArray = matches.map(m => m.slice(1, -1));
} else {
console.error("Gagal parse JSON Gemini:", answer);
showToast("Gemini mengembalikan format yang salah, tapi koneksi berhasil. Silakan cek console.", 'error');
return;
}
}
unmatchedBatch.forEach((r, index) => {
const label = parsedArray[index];
if (label && label.toLowerCase() !== 'lainnya') {
const matchedCategory = categories.find(c => c.name.toLowerCase() === label.toLowerCase());
if (matchedCategory) {
results[r.idx].categoryName = matchedCategory.name;
results[r.idx].category_id = matchedCategory.id;
results[r.idx].categoryIcon = matchedCategory.icon;
}
}
});
}
await Promise.all([
fetchAI(incomeRows, incomeCategories),
fetchAI(expenseRows, expenseCategories)
]);
}
return results;
}
export async function bulkInsertTransactions(userId, validRows) {
const payload = validRows.map(r => ({
user_id: userId,
date: r.date,
type: r.type,
amount: r.amount,
description: r.description || null,
category_id: r.category_id || null,
}));
const { data, error } = await supabaseClient
.from('transactions')
.insert(payload)
.select();
if (error) throw error;
return data;
}