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
import db from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';
document.addEventListener('DOMContentLoaded', () => {
const section = document.getElementById('jurnal-guru');
if (!section) return;
const elDate = document.getElementById('jurnal-date');
const elClass = document.getElementById('jurnal-class');
const elSubject = document.getElementById('jurnal-subject');
const elTime = document.getElementById('jurnal-time');
const elMaterial = document.getElementById('jurnal-material');
const elNotes = document.getElementById('jurnal-notes');
const btnSave = document.getElementById('btn-jurnal-save');
const tbodyHistory = document.getElementById('jurnal-history-tbody');
const elFilterMonth = document.getElementById('jurnal-filter-month');
const elFilterTeacher = document.getElementById('jurnal-filter-teacher');
const btnExport = document.getElementById('btn-jurnal-export');
let isInit = false;
let classesMap = {};
let subjectsMap = {};
let authUserId = null;
const today = new Date();
const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
if (elFilterMonth) elFilterMonth.value = currentMonthStr;
if (elDate) {
elDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
const tryInitJurnal = () => {
if (isInit) return;
if (authState.currentUser !== undefined) {
if (authState.isAdmin || authState.currentTeacher) {
initJurnal();
}
} else {
window.addEventListener('authLoaded', () => {
if (!isInit && (authState.isAdmin || authState.currentTeacher)) {
initJurnal();
}
}, { once: true });
}
};
const observer = new MutationObserver((mutations) => {
mutations.forEach((mutation) => {
if (mutation.target.id === 'jurnal-guru' && mutation.target.style.display !== 'none') {
tryInitJurnal();
}
});
});
observer.observe(section, { attributes: true, attributeFilter: ['style'] });
if (section.style.display !== 'none') {
tryInitJurnal();
}
let currentDaySchedules = [];
let currentPage = 1;
const PAGE_SIZE = 50;
async function initJurnal() {
if (isInit) return;
isInit = true;
try {
const { data: { session } } = await db.auth.getSession();
authUserId = session?.user?.id;
if (authState.isAdmin) {
if (elFilterTeacher) {
elFilterTeacher.style.display = 'block';
elFilterTeacher.addEventListener('change', () => { currentPage = 1; loadHistory(); });
await loadAdminTeachers();
}
const thColTeacher = document.getElementById('jurnal-col-teacher');
if (thColTeacher) thColTeacher.style.display = '';
}
await loadHistory();
await loadSchedulesForDate();
btnSave.addEventListener('click', saveJurnal);
if (elFilterMonth) elFilterMonth.addEventListener('change', () => { currentPage = 1; loadHistory(); });
if (btnExport) btnExport.addEventListener('click', exportToExcel);
const btnPrev = document.getElementById('btn-jurnal-prev');
const btnNext = document.getElementById('btn-jurnal-next');
if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadHistory(); } });
if (btnNext) btnNext.addEventListener('click', () => { currentPage++; loadHistory(); });
const validate = () => {
const isValid = elDate.value && elClass.value && elSubject.value && elTime.value.trim() && elMaterial.value.trim();
btnSave.disabled = !isValid;
};
elDate.addEventListener('change', async () => {
await loadSchedulesForDate();
validate();
});
elClass.addEventListener('change', () => {
populateSubjects();
validate();
});
elSubject.addEventListener('change', () => {
populateTime();
validate();
});
[elTime, elMaterial].forEach(el => el.addEventListener('input', validate));
} catch (e) {
console.error("Init Jurnal Error:", e);
}
}
async function loadAdminTeachers() {
try {
const { data } = await db.from('profiles').select('id, full_name, role').order('full_name');
if (data && elFilterTeacher) {
data.filter(p => p.role !== 'admin' && p.role !== 'siswa').forEach(t => {
const opt = document.createElement('option');
opt.value = t.id;
opt.textContent = t.full_name;
elFilterTeacher.appendChild(opt);
});
}
} catch (e) {
console.error("Failed to load teachers for filter:", e);
}
}
async function loadSchedulesForDate() {
if (!elDate.value) return;
const dayName = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'][new Date(elDate.value + 'T00:00:00').getDay()];
try {
let query = db.from('class_schedules')
.select('start_time, end_time, teacher_id, classes(id, nama_kelas), subjects(id, nama_mapel), teachers(nama)')
.eq('day_of_week', dayName)
.eq('active', 'Aktif')
.order('start_time', { ascending: true });
const { data, error } = await query;
if (error) throw error;
currentDaySchedules = data || [];
let classMap = new Map();
currentDaySchedules.forEach(d => {
if (authState.isAdmin) {
if (d.classes) classMap.set(d.classes.id, d.classes);
} else if (authState.currentTeacher) {
const isMySubject = d.teacher_id === authState.currentTeacher.id;
const isDewanGuru = d.teachers && d.teachers.nama && d.teachers.nama.toLowerCase().includes('dewan guru');
if (d.classes && (isMySubject || isDewanGuru)) {
classMap.set(d.classes.id, d.classes);
}
}
});
const clsData = Array.from(classMap.values()).sort((a,b) => a.nama_kelas.localeCompare(b.nama_kelas));
elClass.innerHTML = '<option value="">-- Pilih Kelas --</option>' +
clsData.map(c => `<option value="${c.id}">${escapeHTML(c.nama_kelas)}</option>`).join('');
elSubject.innerHTML = '<option value="">-- Pilih Mapel --</option>';
elTime.value = '';
} catch (e) {
console.error("Failed to load schedules for date:", e);
}
}
function populateSubjects() {
elSubject.innerHTML = '<option value="">-- Pilih Mapel --</option>';
elTime.value = '';
if (!elClass.value) return;
let subjMap = new Map();
currentDaySchedules.forEach(d => {
if (d.classes && d.classes.id === elClass.value) {
if (authState.isAdmin) {
if (d.subjects) subjMap.set(d.subjects.id, d.subjects);
} else if (authState.currentTeacher) {
const isMySubject = d.teacher_id === authState.currentTeacher.id;
const isDewanGuru = d.teachers && d.teachers.nama && d.teachers.nama.toLowerCase().includes('dewan guru');
if (d.subjects && (isMySubject || isDewanGuru)) {
subjMap.set(d.subjects.id, d.subjects);
}
}
}
});
const subjData = Array.from(subjMap.values()).sort((a,b) => a.nama_mapel.localeCompare(b.nama_mapel));
elSubject.innerHTML += subjData.map(s => `<option value="${s.id}">${escapeHTML(s.nama_mapel)}</option>`).join('');
}
function populateTime() {
elTime.value = '';
if (!elClass.value || !elSubject.value) return;
const schedule = currentDaySchedules.find(d =>
d.classes && d.classes.id === elClass.value &&
d.subjects && d.subjects.id === elSubject.value
);
if (schedule && schedule.start_time && schedule.end_time) {
const startStr = schedule.start_time.substring(0, 5);
const endStr = schedule.end_time.substring(0, 5);
elTime.value = `${startStr} - ${endStr}`;
}
}
async function loadHistory() {
if (!tbodyHistory) return;
tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Memuat riwayat jurnal...</td></tr>';
try {
let monthStr = elFilterMonth.value || currentMonthStr;
const startDate = `${monthStr}-01`;
const [yyyy, mm] = monthStr.split('-');
const endDate = new Date(parseInt(yyyy), parseInt(mm), 0).toISOString().split('T')[0];
let query = db.from('teacher_journals')
.select(`
id, date, jam_pelajaran, materi, catatan, teacher_id,
classes(nama_kelas),
subjects(nama_mapel),
profiles(full_name)
`, { count: 'exact' })
.gte('date', startDate)
.lte('date', endDate)
.order('date', { ascending: false });
if (authState.isAdmin && elFilterTeacher && elFilterTeacher.value) {
query = query.eq('teacher_id', elFilterTeacher.value);
} else if (!authState.isAdmin && authUserId) {
query = query.eq('teacher_id', authUserId);
}
const from = (currentPage - 1) * PAGE_SIZE;
const to = from + PAGE_SIZE - 1;
query = query.range(from, to);
const { data, error, count } = await query;
if (error) throw error;
const btnPrev = document.getElementById('btn-jurnal-prev');
const btnNext = document.getElementById('btn-jurnal-next');
const pageInfo = document.getElementById('jurnal-pagination-info');
if (pageInfo) {
const totalPages = Math.ceil(count / PAGE_SIZE) || 1;
pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages} (Total: ${count} jurnal)`;
if (btnPrev) btnPrev.disabled = currentPage <= 1;
if (btnNext) btnNext.disabled = currentPage >= totalPages;
}
if (!data || data.length === 0) {
tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Belum ada jurnal yang terisi pada bulan ini.</td></tr>';
return;
}
tbodyHistory.innerHTML = data.map(j => {
const pName = j.profiles ? j.profiles.full_name : 'Guru';
const cName = j.classes ? j.classes.nama_kelas : '-';
const sName = j.subjects ? j.subjects.nama_mapel : '-';
const parts = j.date.split('-');
const dFormatted = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : j.date;
const isOwner = !authState.isAdmin && j.teacher_id === authUserId;
const canDelete = authState.isAdmin || isOwner;
let actionHtml = '';
if (canDelete) {
actionHtml = `
<button class="btn btn-outline btn-sm btn-jurnal-del" data-id="${j.id}" style="color: var(--danger); border-color: var(--danger); padding: 4px 8px;" title="Hapus Jurnal">🗑️</button>
`;
}
return `
<tr style="background: rgba(255,255,255,0.02);">
<td>${escapeHTML(dFormatted)}</td>
<td><strong>${escapeHTML(pName)}</strong></td>
<td>${escapeHTML(cName)}</td>
<td>${escapeHTML(sName)}</td>
<td>${escapeHTML(j.jam_pelajaran)}</td>
<td>
<div style="font-weight: 500;">${escapeHTML(j.materi)}</div>
<div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(j.catatan || '')}</div>
</td>
<td style="text-align: center;">${actionHtml}</td>
</tr>
`;
}).join('');
document.querySelectorAll('.btn-jurnal-del').forEach(btn => {
btn.addEventListener('click', async (e) => {
const id = e.currentTarget.dataset.id;
if (confirm('Yakin ingin menghapus jurnal ini?')) {
try {
const { error: delErr } = await db.from('teacher_journals').delete().eq('id', id);
if (delErr) throw delErr;
showToast('Jurnal berhasil dihapus', 'success');
loadHistory();
if(window.updateDashboardStats) window.updateDashboardStats();
} catch (err) {
showToast('Gagal menghapus jurnal', 'error');
console.error(err);
}
}
});
});
} catch (e) {
console.error("Load history error:", e);
tbodyHistory.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Gagal memuat data.</td></tr>';
}
}
async function saveJurnal() {
if (!elDate.value || !elClass.value || !elSubject.value || !elTime.value.trim() || !elMaterial.value.trim()) {
showToast('Mohon lengkapi semua field yang wajib', 'warning');
return;
}
const payload = {
teacher_id: authUserId,
date: elDate.value,
class_id: elClass.value,
subject_id: elSubject.value,
jam_pelajaran: elTime.value.trim(),
materi: elMaterial.value.trim(),
catatan: elNotes.value.trim() || null
};
btnSave.disabled = true;
btnSave.textContent = 'Menyimpan...';
try {
const { data: existing, error: errExist } = await db.from('teacher_journals')
.select('id, profiles(full_name)')
.eq('date', payload.date)
.eq('class_id', payload.class_id)
.eq('jam_pelajaran', payload.jam_pelajaran)
.eq('subject_id', payload.subject_id)
.maybeSingle();
if (existing) {
const existingTeacherName = existing.profiles?.full_name || 'Guru lain';
showToast(`Gagal: Jurnal untuk jam ini sudah diisi oleh ${existingTeacherName}`, 'error');
btnSave.disabled = false;
btnSave.textContent = 'Simpan Jurnal';
return;
}
const { error } = await db.from('teacher_journals').insert(payload);
if (error) throw error;
showToast('Jurnal berhasil disimpan', 'success');
elTime.value = '';
elMaterial.value = '';
elNotes.value = '';
btnSave.disabled = true;
loadHistory();
if(window.updateDashboardStats) window.updateDashboardStats();
} catch (e) {
console.error("Save jurnal error:", e);
showToast('Gagal menyimpan jurnal', 'error');
} finally {
btnSave.textContent = 'Simpan Jurnal';
btnSave.disabled = !(elDate.value && elClass.value && elSubject.value && elTime.value.trim() && elMaterial.value.trim());
}
}
async function exportToExcel() {
const XLSX = await import('xlsx'); if (false) {
showToast('Library Excel belum siap', 'error');
return;
}
try {
const btnOrig = btnExport.innerHTML;
btnExport.innerHTML = '⏱️ Exporting...';
btnExport.disabled = true;
let monthStr = elFilterMonth.value || currentMonthStr;
const startDate = `${monthStr}-01`;
const [yyyy, mm] = monthStr.split('-');
const endDate = new Date(parseInt(yyyy), parseInt(mm), 0).toISOString().split('T')[0];
let query = db.from('teacher_journals')
.select(`
date, jam_pelajaran, materi, catatan,
classes(nama_kelas),
subjects(nama_mapel),
profiles(full_name)
`)
.gte('date', startDate)
.lte('date', endDate)
.order('date', { ascending: true });
if (!authState.isAdmin && authUserId) {
query = query.eq('teacher_id', authUserId);
}
const { data, error } = await query;
if (error) throw error;
if (!data || data.length === 0) {
showToast('Tidak ada data untuk diexport bulan ini', 'warning');
btnExport.innerHTML = btnOrig;
btnExport.disabled = false;
return;
}
const excelData = data.map((j, i) => ({
'No': i + 1,
'Tanggal': j.date,
'Nama Guru': j.profiles ? j.profiles.full_name : 'Guru',
'Kelas': j.classes ? j.classes.nama_kelas : '',
'Mata Pelajaran': j.subjects ? j.subjects.nama_mapel : '',
'Jam Pelajaran': j.jam_pelajaran,
'Materi Pokok': j.materi,
'Catatan / Hambatan': j.catatan || ''
}));
const ws = XLSX.utils.json_to_sheet(excelData);
const colWidths = [
{ wch: 5 }, { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 20 },
{ wch: 15 }, { wch: 40 }, { wch: 40 }
];
ws['!cols'] = colWidths;
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Jurnal_Guru");
XLSX.writeFile(wb, `Jurnal_Guru_${monthStr}.xlsx`);
btnExport.innerHTML = btnOrig;
btnExport.disabled = false;
showToast('Export berhasil!', 'success');
} catch (e) {
console.error("Export error:", e);
showToast('Gagal export excel', 'error');
btnExport.innerHTML = '📊 Export Excel';
btnExport.disabled = false;
}
}
});