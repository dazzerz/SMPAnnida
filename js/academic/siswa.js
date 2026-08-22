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
import { authState } from './authState.js';
import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';
const db = supabaseClient;
document.addEventListener('DOMContentLoaded', () => {
const tbodySiswa = document.getElementById('tbody-siswa');
const btnAddSiswa = document.getElementById('btn-add-siswa');
const modalSiswa = document.getElementById('modal-siswa');
const btnCloseModal = document.getElementById('btn-close-modal-siswa');
const formSiswa = document.getElementById('form-siswa');
const modalTitle = document.getElementById('modal-siswa-title');
const filterStatus = document.getElementById('filter-status-siswa');
const filterKelas = document.getElementById('filter-kelas-siswa');
const filterSearch = document.getElementById('filter-search-siswa');
const infoSiswa = document.getElementById('siswa-info');
const paginationSiswa = document.getElementById('siswa-pagination');
let currentData = [];
let classesData = [];
let currentPage = 1;
const itemsPerPage = 20;
if (authState.isGuest && btnAddSiswa) {
btnAddSiswa.style.display = 'none';
}
async function loadData() {
if (!tbodySiswa) return;
tbodySiswa.innerHTML = '<tr><td colspan="7" style="text-align: center;">Memuat data siswa...</td></tr>';
try {
const { data: cData } = await db.from('classes').select('id, nama_kelas').order('nama_kelas');
classesData = cData || [];
updateKelasDropdowns();
const { data, error } = await db.from('students').select('*').order('nama_lengkap', { ascending: true });
if (error) throw error;
currentData = data || [];
currentPage = 1;
renderTable();
} catch (err) {
console.error("Error loading students:", err);
tbodySiswa.innerHTML = '<tr><td colspan="7" style="color:var(--danger); text-align:center;">Gagal memuat data.</td></tr>';
}
}
function updateKelasDropdowns() {
const options = '<option value="">Semua Kelas</option>' +
classesData.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
if(filterKelas) filterKelas.innerHTML = options;
const formOptions = '<option value="">-- Belum ada kelas --</option>' +
classesData.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
const formKelasSelect = document.getElementById('siswa-kelas');
if(formKelasSelect) formKelasSelect.innerHTML = formOptions;
}
function renderTable() {
if (!tbodySiswa) return;
const sStat = filterStatus.value.toLowerCase();
const sKelas = filterKelas.value.toLowerCase();
const sSearch = filterSearch.value.toLowerCase();
const filtered = currentData.filter(s => {
const mStat = !sStat ||
(sStat === 'aktif' && s.aktif) ||
(sStat === 'nonaktif' && !s.aktif);
const mKelas = !sKelas || (s.kelas && s.kelas.toLowerCase().includes(sKelas));
const mSearch = !sSearch ||
(s.nama_lengkap && s.nama_lengkap.toLowerCase().includes(sSearch)) ||
(s.nis && String(s.nis).toLowerCase().includes(sSearch));
return mStat && mKelas && mSearch;
});
const totalItems = filtered.length;
const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
if (currentPage > totalPages) currentPage = totalPages;
const startIdx = (currentPage - 1) * itemsPerPage;
const endIdx = startIdx + itemsPerPage;
const paginatedData = filtered.slice(startIdx, endIdx);
tbodySiswa.innerHTML = '';
if (paginatedData.length === 0) {
tbodySiswa.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data ditemukan.</td></tr>';
infoSiswa.textContent = 'Menampilkan 0 dari 0 data';
paginationSiswa.innerHTML = '';
return;
}
paginatedData.forEach((s, index) => {
const isAktif = s.aktif !== false;
const statusBadge = isAktif ?
'<span style="padding: 4px 8px; background: rgba(40,167,69,0.1); color: var(--success); border-radius: 4px; font-size: 12px;">Aktif</span>' :
'<span style="padding: 4px 8px; background: rgba(220,53,69,0.1); color: var(--danger); border-radius: 4px; font-size: 12px;">Nonaktif</span>';
const jk = s.jenis_kelamin === 'L' ? 'L' : (s.jenis_kelamin === 'P' ? 'P' : '-');
const tr = document.createElement('tr');
tr.innerHTML = `
<td>${startIdx + index + 1}</td>
<td>${escapeHTML(s.nis || '-')}</td>
<td><strong>${escapeHTML(s.nama_lengkap || '-')}</strong></td>
<td>${jk}</td>
<td>${escapeHTML(s.kelas || '-')}</td>
<td>${statusBadge}</td>
<td style="text-align: right; white-space: nowrap;">
<button class="btn-edit-siswa btn btn-outline" data-id="${s.id}" style="padding: 4px 10px; font-size: 12px;">Edit</button>
<button class="btn-del-siswa btn btn-outline" data-id="${s.id}" style="padding: 4px 10px; font-size: 12px; color: var(--danger); border-color: var(--danger);">Hapus</button>
</td>
`;
tbodySiswa.appendChild(tr);
});
infoSiswa.textContent = `Menampilkan ${startIdx + 1} - ${Math.min(endIdx, totalItems)} dari ${totalItems} data`;
renderPaginationControls(totalPages);
document.querySelectorAll('.btn-edit-siswa').forEach(btn => {
btn.addEventListener('click', (e) => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
const id = e.target.getAttribute('data-id');
const student = currentData.find(st => st.id == id);
if (student) openModal(student);
});
});
document.querySelectorAll('.btn-del-siswa').forEach(btn => {
btn.addEventListener('click', async (e) => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
const id = e.target.getAttribute('data-id');
if (confirm('Yakin ingin menghapus siswa ini?')) {
try {
const { error } = await db.from('students').delete().eq('id', id);
if (error) throw error;
showToast('Siswa berhasil dihapus', 'success');
loadData();
} catch (err) {
console.error(err);
showToast('Gagal menghapus siswa', 'error');
}
}
});
});
}
function renderPaginationControls(totalPages) {
paginationSiswa.innerHTML = '';
if (totalPages <= 1) return;
const btnPrev = document.createElement('button');
btnPrev.className = 'btn btn-outline';
btnPrev.style.padding = '2px 8px';
btnPrev.textContent = '«';
btnPrev.disabled = currentPage === 1;
btnPrev.onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); } };
paginationSiswa.appendChild(btnPrev);
for(let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
const btn = document.createElement('button');
btn.className = i === currentPage ? 'btn btn-primary' : 'btn btn-outline';
btn.style.padding = '2px 8px';
btn.textContent = i;
btn.onclick = () => { currentPage = i; renderTable(); };
paginationSiswa.appendChild(btn);
}
const btnNext = document.createElement('button');
btnNext.className = 'btn btn-outline';
btnNext.style.padding = '2px 8px';
btnNext.textContent = '»';
btnNext.disabled = currentPage === totalPages;
btnNext.onclick = () => { if(currentPage < totalPages) { currentPage++; renderTable(); } };
paginationSiswa.appendChild(btnNext);
}
function openModal(student = null) {
formSiswa.reset();
modalSiswa.style.display = 'flex';
if (student) {
modalTitle.textContent = 'Edit Siswa';
document.getElementById('siswa-id').value = student.id;
document.getElementById('siswa-nis').value = student.nis || '';
document.getElementById('siswa-nisn').value = student.nisn || '';
document.getElementById('siswa-nama').value = student.nama_lengkap || '';
document.getElementById('siswa-jk').value = student.jenis_kelamin || '';
document.getElementById('siswa-kelas').value = student.kelas || '';
document.getElementById('siswa-ortu').value = student.nama_orang_tua || '';
document.getElementById('siswa-hp').value = student.no_hp_orang_tua || '';
document.getElementById('siswa-alamat').value = student.alamat || '';
document.getElementById('siswa-aktif').checked = student.aktif !== false;
} else {
modalTitle.textContent = 'Tambah Siswa';
document.getElementById('siswa-id').value = '';
document.getElementById('siswa-aktif').checked = true;
}
}
if (btnAddSiswa) {
btnAddSiswa.addEventListener('click', () => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
openModal();
});
}
if (btnCloseModal) {
btnCloseModal.addEventListener('click', () => {
modalSiswa.style.display = 'none';
});
}
if (formSiswa) {
formSiswa.addEventListener('submit', async (e) => {
e.preventDefault();
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
const btnSave = document.getElementById('btn-save-siswa');
const originalText = btnSave.textContent;
btnSave.disabled = true;
btnSave.textContent = 'Menyimpan...';
const kelasVal = document.getElementById('siswa-kelas').value;
const cObj = classesData.find(c => c.nama_kelas === kelasVal);
let nisnVal = document.getElementById('siswa-nisn').value.trim();
if (nisnVal === '') nisnVal = null;
let nisVal = document.getElementById('siswa-nis').value.trim();
if (nisVal === '') nisVal = null;
let jkVal = document.getElementById('siswa-jk').value;
if (jkVal !== 'L' && jkVal !== 'P') jkVal = null;
const payload = {
nis: nisVal,
nisn: nisnVal,
nama_lengkap: document.getElementById('siswa-nama').value.trim(),
jenis_kelamin: jkVal,
kelas: kelasVal || null,
kelas_id: cObj ? cObj.id : null,
nama_orang_tua: document.getElementById('siswa-ortu').value.trim() || null,
no_hp_orang_tua: document.getElementById('siswa-hp').value.trim() || null,
alamat: document.getElementById('siswa-alamat').value.trim() || null,
aktif: document.getElementById('siswa-aktif').checked
};
const id = document.getElementById('siswa-id').value;
try {
if (id) {
const { error } = await db.from('students').update(payload).eq('id', id);
if (error) throw error;
showToast('Data siswa berhasil diperbarui', 'success');
} else {
const { error } = await db.from('students').insert([payload]);
if (error) throw error;
showToast('Siswa berhasil ditambahkan', 'success');
}
modalSiswa.style.display = 'none';
loadData();
} catch (err) {
console.error("Error saving student:", err);
if (err.message && err.message.includes('unique')) {
showToast('Gagal: NIS atau NISN sudah terdaftar.', 'error');
} else {
showToast('Gagal menyimpan data siswa', 'error');
}
} finally {
btnSave.disabled = false;
btnSave.textContent = originalText;
}
});
}
[filterStatus, filterKelas].forEach(el => {
if (el) el.addEventListener('change', () => { currentPage = 1; renderTable(); });
});
if (filterSearch) {
filterSearch.addEventListener('input', () => { currentPage = 1; renderTable(); });
}
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
if (mutation.target.id === 'data-siswa' && mutation.target.style.display !== 'none') {
if (currentData.length === 0) loadData();
}
});
});
const siswaSection = document.getElementById('data-siswa');
if (siswaSection) {
observer.observe(siswaSection, { attributes: true, attributeFilter: ['style'] });
if (siswaSection.style.display !== 'none') loadData();
}
});