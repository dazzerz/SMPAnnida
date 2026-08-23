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
import { escapeHTML, showToast } from '../core/utils.js';
const db = supabaseClient;
window.db = supabaseClient;
document.addEventListener('DOMContentLoaded', () => {
const btnTambahJadwal = document.getElementById('btn-tambah-jadwal');
const modalJadwal = document.getElementById('modal-jadwal');
const btnCloseModalJadwal = document.getElementById('btn-close-modal-jadwal');
const formJadwal = document.getElementById('form-jadwal');
const tbodyJadwal = document.getElementById('tbody-jadwal');
const jadwalId = document.getElementById('jadwal-id');
const modalJadwalTitle = document.getElementById('modal-jadwal-title');
const inputTahun = document.getElementById('jadwal-academic-year');
const inputKelas = document.getElementById('jadwal-class');
const inputGuru = document.getElementById('jadwal-teacher');
const inputMapel = document.getElementById('jadwal-subject');
const inputHari = document.getElementById('jadwal-day');
const inputRuangan = document.getElementById('jadwal-room');
const inputMulai = document.getElementById('jadwal-start-time');
const inputSelesai = document.getElementById('jadwal-end-time');
const inputStatus = document.getElementById('jadwal-status');
const inputNotes = document.getElementById('jadwal-notes');
const filterGuru = document.getElementById('filter-jadwal-guru');
const filterKelas = document.getElementById('filter-jadwal-kelas');
const filterMapel = document.getElementById('filter-jadwal-mapel');
const filterRuangan = document.getElementById('filter-jadwal-ruangan');
const filterHari = document.getElementById('filter-jadwal-hari');
const filterSemester = document.getElementById('filter-jadwal-semester');
const filterStatus = document.getElementById('filter-jadwal-status');
let allSchedules = [];
function initJadwalDropdowns() {
if (!inputTahun || !inputKelas || !inputGuru || !inputMapel) return;
if (window.masterTahunAjaran) {
let html = '<option value="">-- Pilih Tahun Ajaran --</option>';
window.masterTahunAjaran.forEach(t => {
html += `<option value="${t.id}">${escapeHTML(t.tahun_ajaran)} - ${escapeHTML(t.semester)}</option>`;
});
inputTahun.innerHTML = html;
}
if (window.masterClasses) {
let html = '<option value="">-- Pilih Kelas --</option>';
window.masterClasses.forEach(c => {
html += `<option value="${c.id}">${escapeHTML(c.nama_kelas)}</option>`;
});
inputKelas.innerHTML = html;
}
if (window.masterTeachers) {
let html = '<option value="">-- Pilih Guru --</option>';
window.masterTeachers.forEach(g => {
html += `<option value="${g.id}">${escapeHTML(g.nama)}</option>`;
});
inputGuru.innerHTML = html;
}
if (window.masterSubjects) {
let html = '<option value="">-- Pilih Mata Pelajaran --</option>';
window.masterSubjects.forEach(m => {
html += `<option value="${m.id}">${escapeHTML(m.nama_mapel)}</option>`;
});
inputMapel.innerHTML = html;
}
}
async function loadJadwal() {
if (!tbodyJadwal) return;
tbodyJadwal.innerHTML = '<tr><td colspan="9" style="text-align: center;">Memuat jadwal dari database...</td></tr>';
try {
initJadwalDropdowns();
const { data, error } = await db.from('class_schedules')
.select(`
*,
classes(nama_kelas),
subjects(nama_mapel),
teachers(nama),
academic_years(tahun_ajaran, semester)
`)
.order('day_of_week', { ascending: true })
.order('start_time', { ascending: true });
if (error) throw error;
allSchedules = data || [];
renderJadwal();
} catch (err) {
console.error("Gagal memuat jadwal:", err);
tbodyJadwal.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--danger);">Gagal memuat jadwal.</td></tr>';
}
}
function renderJadwal() {
if (!tbodyJadwal) return;
const qGuru = (filterGuru.value || '').toLowerCase();
const qKelas = (filterKelas.value || '').toLowerCase();
const qMapel = (filterMapel.value || '').toLowerCase();
const qRuangan = (filterRuangan.value || '').toLowerCase();
const qHari = filterHari.value;
const qSemester = filterSemester.value;
const qStatus = filterStatus.value;
let filtered = allSchedules.filter(j => {
const tName = j.teachers ? j.teachers.nama.toLowerCase() : '';
const cName = j.classes ? j.classes.nama_kelas.toLowerCase() : '';
const mName = j.subjects ? j.subjects.nama_mapel.toLowerCase() : '';
const rName = (j.room || '').toLowerCase();
const semester = j.academic_years ? j.academic_years.semester : '';
if (qGuru && !tName.includes(qGuru)) return false;
if (qKelas && !cName.includes(qKelas)) return false;
if (qMapel && !mName.includes(qMapel)) return false;
if (qRuangan && !rName.includes(qRuangan)) return false;
if (qHari && j.day_of_week !== qHari) return false;
if (qSemester && semester !== qSemester) return false;
if (qStatus && j.active !== qStatus) return false;
return true;
});
const hariOrder = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6, "Minggu": 7 };
filtered.sort((a, b) => {
if (hariOrder[a.day_of_week] !== hariOrder[b.day_of_week]) {
return hariOrder[a.day_of_week] - hariOrder[b.day_of_week];
}
const aTime = a.start_time || '00:00';
const bTime = b.start_time || '00:00';
return aTime.localeCompare(bTime);
});
if (filtered.length === 0) {
tbodyJadwal.innerHTML = '<tr><td colspan="9" style="text-align: center;">Tidak ada jadwal ditemukan.</td></tr>';
return;
}
tbodyJadwal.innerHTML = '';
filtered.forEach(j => {
const hari = escapeHTML(j.day_of_week || '-');
const jamMulai = j.start_time ? j.start_time.substring(0, 5) : '-';
const jamSelesai = j.end_time ? j.end_time.substring(0, 5) : '-';
const kelas = j.classes ? escapeHTML(j.classes.nama_kelas) : '-';
const mapel = j.subjects ? escapeHTML(j.subjects.nama_mapel) : '-';
const guru = j.teachers ? escapeHTML(j.teachers.nama) : '-';
const ruangan = escapeHTML(j.room || '-');
const semester = j.academic_years ? escapeHTML(`${j.academic_years.tahun_ajaran} - ${j.academic_years.semester}`) : '-';
const status = j.active || 'Aktif';
let badgeColor = 'var(--primary)';
if (status === 'Draft') badgeColor = 'var(--warning)';
if (status === 'Arsip') badgeColor = 'var(--text-muted)';
const statusBadge = `<span style="padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; background-color: ${badgeColor}; color: white; font-weight: 500;">${escapeHTML(status)}</span>`;
const tr = document.createElement('tr');
tr.innerHTML = `
<td><strong>${hari}</strong></td>
<td><span style="color:var(--primary);font-weight:500;">${jamMulai} - ${jamSelesai}</span></td>
<td>${kelas}</td>
<td>${mapel}</td>
<td>${guru}</td>
<td>${ruangan}</td>
<td style="font-size: 0.9em; color: var(--text-muted);">${semester}</td>
<td>${statusBadge}</td>
<td>
<button class="btn btn-outline btn-edit-jadwal" data-id="${j.id}" style="padding: 4px 8px; font-size: 0.85rem; margin-right: 5px;">Edit</button>
<button class="btn btn-danger btn-delete-jadwal" data-id="${j.id}" style="padding: 4px 8px; font-size: 0.85rem;">Hapus</button>
</td>
`;
tbodyJadwal.appendChild(tr);
});
attachActionEvents();
}
function attachActionEvents() {
document.querySelectorAll('.btn-edit-jadwal').forEach(btn => {
btn.addEventListener('click', (e) => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
const id = e.target.getAttribute('data-id');
const j = allSchedules.find(x => x.id === id);
if (j) openModal(j);
});
});
document.querySelectorAll('.btn-delete-jadwal').forEach(btn => {
btn.addEventListener('click', async (e) => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
const id = e.target.getAttribute('data-id');
const btnEl = e.target;
btnEl.disabled = true;
btnEl.textContent = 'Menghapus...';
try {
const { error } = await db.from('class_schedules').delete().eq('id', id);
if (error) throw error;
showToast('Jadwal berhasil dihapus', 'success');
await loadJadwal();
if (window.refreshDashboardStats) window.refreshDashboardStats();
} catch (err) {
console.error("Gagal menghapus:", err);
showToast('Gagal menghapus jadwal', 'error');
btnEl.disabled = false;
btnEl.textContent = 'Hapus';
}
});
});
}
function openModal(data = null) {
initJadwalDropdowns();
formJadwal.reset();
if (data) {
modalJadwalTitle.textContent = 'Edit Jadwal Pelajaran';
jadwalId.value = data.id;
inputTahun.value = data.academic_year_id || '';
inputKelas.value = data.class_id || '';
inputGuru.value = data.teacher_id || '';
inputMapel.value = data.subject_id || '';
inputHari.value = data.day_of_week || '';
inputRuangan.value = data.room || '';
inputMulai.value = data.start_time ? data.start_time.substring(0, 5) : '';
inputSelesai.value = data.end_time ? data.end_time.substring(0, 5) : '';
inputStatus.value = data.active || 'Aktif';
inputNotes.value = data.notes || '';
} else {
modalJadwalTitle.textContent = 'Tambah Jadwal Pelajaran';
jadwalId.value = '';
inputStatus.value = 'Aktif';
}
modalJadwal.style.display = 'flex';
}
if (btnTambahJadwal) {
btnTambahJadwal.addEventListener('click', () => {
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
openModal();
});
}
if (btnCloseModalJadwal) {
btnCloseModalJadwal.addEventListener('click', () => {
modalJadwal.style.display = 'none';
});
}
[filterGuru, filterKelas, filterMapel, filterRuangan, filterHari, filterSemester, filterStatus].forEach(el => {
if (el) el.addEventListener('input', renderJadwal);
});
function isTimeOverlap(start1, end1, start2, end2) {
const s1 = parseInt(start1.replace(':', ''), 10);
const e1 = parseInt(end1.replace(':', ''), 10);
const s2 = parseInt(start2.replace(':', ''), 10);
const e2 = parseInt(end2.replace(':', ''), 10);
return (s1 < e2) && (e1 > s2);
}
if (formJadwal) {
formJadwal.addEventListener('submit', async (e) => {
e.preventDefault();
if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
const id = jadwalId.value;
const tYear = inputTahun.value;
const tClass = inputKelas.value;
const tTeacher = inputGuru.value;
const tSubject = inputMapel.value;
const day = inputHari.value;
const sTime = inputMulai.value;
const eTime = inputSelesai.value;
const room = inputRuangan.value.trim();
const status = inputStatus.value;
const notes = inputNotes.value.trim();
const sTimeInt = parseInt(sTime.replace(':', ''), 10);
const eTimeInt = parseInt(eTime.replace(':', ''), 10);
if (sTimeInt >= eTimeInt) {
return showToast('Jam selesai harus lebih besar daripada jam mulai', 'warning');
}
const sameDaySchedules = allSchedules.filter(j => j.day_of_week === day && j.id !== id);
for (let j of sameDaySchedules) {
const isOverlap = isTimeOverlap(sTime, eTime, j.start_time, j.end_time);
if (isOverlap) {
if (j.teacher_id === tTeacher && j.class_id === tClass && j.subject_id === tSubject && j.start_time.startsWith(sTime) && j.end_time.startsWith(eTime)) {
return showToast('Jadwal ini sudah ada (Identik)!', 'error');
}
if (j.teacher_id === tTeacher) {
return showToast(`Bentrok! Guru ini sudah mengajar di kelas ${j.classes?.nama_kelas || '?'} pada jam tersebut.`, 'error');
}
if (j.class_id === tClass) {
return showToast(`Bentrok! Kelas ini sudah ada jadwal ${j.subjects?.nama_mapel || '?'} pada jam tersebut.`, 'error');
}
if (room && j.room && j.room.toLowerCase() === room.toLowerCase()) {
return showToast(`Bentrok! Ruangan ${room} sudah dipakai oleh kelas ${j.classes?.nama_kelas || '?'} pada jam tersebut.`, 'error');
}
}
}
const btnSave = document.getElementById('btn-save-jadwal');
const originalText = btnSave.textContent;
btnSave.disabled = true;
btnSave.textContent = 'Menyimpan...';
const payload = {
academic_year_id: tYear,
class_id: tClass,
teacher_id: tTeacher,
subject_id: tSubject,
day_of_week: day,
start_time: sTime,
end_time: eTime,
room: room || null,
active: status,
notes: notes || null
};
try {
if (id) {
payload.updated_at = new Date().toISOString();
const { error } = await db.from('class_schedules').update(payload).eq('id', id);
if (error) throw error;
showToast('Jadwal berhasil diperbarui', 'success');
} else {
payload.created_at = new Date().toISOString();
const { error } = await db.from('class_schedules').insert([payload]);
if (error) throw error;
showToast('Jadwal berhasil ditambahkan', 'success');
}
modalJadwal.style.display = 'none';
await loadJadwal();
if (window.refreshDashboardStats) window.refreshDashboardStats();
} catch (err) {
console.error("Gagal menyimpan jadwal:", err);
showToast('Terjadi kesalahan saat menyimpan', 'error');
} finally {
btnSave.disabled = false;
btnSave.textContent = originalText;
}
});
}
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
if (mutation.target.id === 'jadwal' && mutation.target.style.display !== 'none') {
if (allSchedules.length === 0) loadJadwal();
}
});
});
const jadwalSection = document.getElementById('jadwal');
if (jadwalSection) {
observer.observe(jadwalSection, { attributes: true, attributeFilter: ['style'] });
if (jadwalSection.style.display !== 'none') loadJadwal();
}
window.loadDataJadwal = loadJadwal;
});