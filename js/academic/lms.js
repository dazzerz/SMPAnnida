// =========================================================================
// LMS (LEARNING MANAGEMENT SYSTEM) TEACHER CONTROLLER (SMP ANNIDA)
// Modul: Pembuatan Tugas, Pembagian Materi, & Koreksi Berkas Siswa
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, formatDate } from '../core/utils.js';
import { authState } from './authState.js';

const db = supabaseClient;

let allAssignments = [];
let masterClasses = [];
let masterSubjects = [];
let activeReviewAssignmentId = null;

export function initLmsTeacherModule() {
    loadLmsDropdowns();
    loadAssignments();
    initLmsEventListeners();
}

async function loadLmsDropdowns() {
    try {
        const [clsRes, mapelRes] = await Promise.all([
            db.from('classes').select('id, nama_kelas').order('nama_kelas'),
            db.from('subjects').select('id, nama_mapel').order('nama_mapel')
        ]);

        masterClasses = clsRes.data || [];
        masterSubjects = mapelRes.data || [];

        const selClass = document.getElementById('assignment-class');
        const filterClass = document.getElementById('filter-lms-class');
        const selSubject = document.getElementById('assignment-subject');
        const filterSubject = document.getElementById('filter-lms-subject');

        if (selClass) {
            selClass.innerHTML = '<option value="">-- Pilih Kelas --</option><option value="Semua">Semua Kelas</option>' + 
                masterClasses.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        }

        if (filterClass) {
            filterClass.innerHTML = '<option value="">Semua Kelas</option>' + 
                masterClasses.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        }

        if (selSubject) {
            selSubject.innerHTML = '<option value="">-- Pilih Mapel --</option>' + 
                masterSubjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');
        }

        if (filterSubject) {
            filterSubject.innerHTML = '<option value="">Semua Mata Pelajaran</option>' + 
                masterSubjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');
        }
    } catch (err) {
        console.error('Gagal memuat dropdown LMS:', err);
    }
}

export async function loadAssignments() {
    const tbody = document.getElementById('tbody-lms-assignments');
    if (!tbody) return;

    try {
        const { data: assignments, error: assErr } = await db
            .from('assignments')
            .select(`
                *,
                assignment_submissions ( id, status, score )
            `)
            .order('created_at', { ascending: false });

        if (assErr) throw assErr;

        allAssignments = assignments || [];
        renderAssignmentsTable(allAssignments);
    } catch (err) {
        console.error('Gagal memuat daftar tugas LMS:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="aca-inline-22 text-rose-400">Gagal memuat data: ${escapeHTML(err.message)}</td></tr>`;
        }
    }
}

function renderAssignmentsTable(list) {
    const tbody = document.getElementById('tbody-lms-assignments');
    if (!tbody) return;

    const filterCls = document.getElementById('filter-lms-class')?.value || '';
    const filterSub = document.getElementById('filter-lms-subject')?.value || '';
    const query = document.getElementById('search-lms-assignment')?.value.toLowerCase().trim() || '';

    let filtered = list;
    if (filterCls) filtered = filtered.filter(a => a.class_name === filterCls || a.class_name === 'Semua');
    if (filterSub) filtered = filtered.filter(a => a.subject === filterSub);
    if (query) filtered = filtered.filter(a => a.title.toLowerCase().includes(query) || (a.description || '').toLowerCase().includes(query));

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="aca-inline-22">Belum ada tugas atau materi yang dibuat. Klik "+ Buat Tugas Baru" untuk memulai.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map((a, idx) => {
        const subCount = (a.assignment_submissions || []).length;
        const gradedCount = (a.assignment_submissions || []).filter(s => s.status === 'graded').length;

        let deadlineStr = '-';
        if (a.deadline) {
            deadlineStr = new Date(a.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }

        return `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <div class="font-bold text-white">${escapeHTML(a.title)}</div>
                    <div class="text-xs text-gray-400 truncate max-w-xs">${escapeHTML(a.description || '-')}</div>
                </td>
                <td><span class="badge badge-primary">${escapeHTML(a.class_name)}</span></td>
                <td>${escapeHTML(a.subject)}</td>
                <td><span class="text-xs text-amber-300">${deadlineStr}</span></td>
                <td>
                    <span class="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">
                        ${subCount} Terkumpul (${gradedCount} Dinilai)
                    </span>
                </td>
                <td>
                    <div class="flex items-center gap-1.5">
                        <button class="btn-review-lms btn-sm btn-primary" data-id="${a.id}" data-title="${escapeHTML(a.title)}" data-subtitle="Kelas ${a.class_name} • ${a.subject}" title="Review & Beri Nilai Siswa">
                            Review (${subCount})
                        </button>
                        <button class="btn-edit-assignment btn-sm btn-secondary" data-id="${a.id}" title="Edit Tugas">✏️</button>
                        <button class="btn-del-assignment btn-sm btn-danger" data-id="${a.id}" title="Hapus Tugas">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Bind event listeners for actions
    tbody.querySelectorAll('.btn-review-lms').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const title = btn.getAttribute('data-title');
            const subtitle = btn.getAttribute('data-subtitle');
            openReviewSubmissionsModal(id, title, subtitle);
        });
    });

    tbody.querySelectorAll('.btn-edit-assignment').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const item = allAssignments.find(a => a.id === id);
            if (item) openAssignmentModal(item);
        });
    });

    tbody.querySelectorAll('.btn-del-assignment').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            const id = btn.getAttribute('data-id');
            if (!confirm('Apakah Anda yakin ingin menghapus tugas ini? Seluruh file jawaban siswa yang terkait juga akan dihapus.')) return;

            try {
                const { error } = await db.from('assignments').delete().eq('id', id);
                if (error) throw error;
                showToast('Tugas berhasil dihapus.', 'success');
                await loadAssignments();
            } catch (err) {
                showToast('Gagal menghapus tugas: ' + err.message, 'error');
            }
        });
    });
}

function openAssignmentModal(item = null) {
    const modal = document.getElementById('modal-assignment');
    if (!modal) return;

    const titleEl = document.getElementById('modal-assignment-title');
    const form = document.getElementById('form-assignment');
    form.reset();

    if (item) {
        titleEl.textContent = 'Edit Tugas / Materi';
        document.getElementById('assignment-id').value = item.id;
        document.getElementById('assignment-title').value = item.title;
        document.getElementById('assignment-class').value = item.class_name;
        document.getElementById('assignment-subject').value = item.subject;
        document.getElementById('assignment-attachment').value = item.attachment_url || '';
        document.getElementById('assignment-description').value = item.description || '';
        if (item.deadline) {
            document.getElementById('assignment-deadline').value = new Date(item.deadline).toISOString().slice(0, 16);
        }
    } else {
        titleEl.textContent = 'Buat Tugas Baru';
        document.getElementById('assignment-id').value = '';
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function initLmsEventListeners() {
    const btnAdd = document.getElementById('btn-add-assignment');
    const modalAssignment = document.getElementById('modal-assignment');
    const btnCloseAss = document.getElementById('btn-close-assignment-modal');
    const formAss = document.getElementById('form-assignment');

    const modalReview = document.getElementById('modal-review-submissions');
    const btnCloseReview = document.getElementById('btn-close-review-modal');

    const filterCls = document.getElementById('filter-lms-class');
    const filterSub = document.getElementById('filter-lms-subject');
    const searchInput = document.getElementById('search-lms-assignment');

    if (btnAdd) btnAdd.onclick = () => {
        if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        openAssignmentModal();
    };

    if (btnCloseAss) btnCloseAss.onclick = () => {
        modalAssignment.style.display = 'none';
        modalAssignment.classList.add('hidden');
    };

    if (btnCloseReview) btnCloseReview.onclick = () => {
        modalReview.style.display = 'none';
        modalReview.classList.add('hidden');
    };

    if (filterCls) filterCls.onchange = () => renderAssignmentsTable(allAssignments);
    if (filterSub) filterSub.onchange = () => renderAssignmentsTable(allAssignments);
    if (searchInput) searchInput.oninput = () => renderAssignmentsTable(allAssignments);

    if (formAss) {
        formAss.onsubmit = async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');

            const id = document.getElementById('assignment-id').value;
            const title = document.getElementById('assignment-title').value.trim();
            const className = document.getElementById('assignment-class').value;
            const subject = document.getElementById('assignment-subject').value;
            const deadlineVal = document.getElementById('assignment-deadline').value;
            const attachment = document.getElementById('assignment-attachment').value.trim();
            const description = document.getElementById('assignment-description').value.trim();

            const { data: { user } } = await db.auth.getUser();
            const teacherName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guru Annida';

            const payload = {
                teacher_id: user?.id,
                teacher_name: teacherName,
                class_name: className,
                subject: subject,
                title: title,
                description: description || null,
                attachment_url: attachment || null,
                deadline: deadlineVal ? new Date(deadlineVal).toISOString() : null,
                updated_at: new Date().toISOString()
            };

            try {
                if (id) {
                    const { error } = await db.from('assignments').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Tugas berhasil diperbarui!', 'success');
                } else {
                    const { error } = await db.from('assignments').insert(payload);
                    if (error) throw error;
                    showToast('Tugas baru berhasil dibuat dan diterbitkan!', 'success');
                }

                modalAssignment.style.display = 'none';
                modalAssignment.classList.add('hidden');
                await loadAssignments();
            } catch (err) {
                console.error('Gagal menyimpan tugas:', err);
                showToast('Gagal menyimpan tugas: ' + err.message, 'error');
            }
        };
    }
}

async function openReviewSubmissionsModal(assignmentId, title, subtitle) {
    const modal = document.getElementById('modal-review-submissions');
    const titleEl = document.getElementById('review-assignment-title');
    const subtitleEl = document.getElementById('review-assignment-subtitle');
    const tbody = document.getElementById('tbody-review-submissions');

    if (!modal) return;

    activeReviewAssignmentId = assignmentId;
    titleEl.textContent = `Review: ${title}`;
    subtitleEl.textContent = subtitle;
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-gray-400">Memuat berkas siswa...</td></tr>';

    modal.style.display = 'flex';
    modal.classList.remove('hidden');

    try {
        const { data: submissions, error } = await db
            .from('assignment_submissions')
            .select('*')
            .eq('assignment_id', assignmentId)
            .order('submitted_at', { ascending: true });

        if (error) throw error;

        if (!submissions || submissions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-gray-400">Belum ada siswa yang mengumpulkan tugas ini.</td></tr>';
            return;
        }

        tbody.innerHTML = submissions.map((s, idx) => {
            const timeStr = new Date(s.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            return `
                <tr id="sub-row-${s.id}">
                    <td>${idx + 1}</td>
                    <td>
                        <div class="font-semibold text-white">${escapeHTML(s.student_name)}</div>
                        <div class="text-xs text-gray-400">${escapeHTML(s.class_name)}</div>
                    </td>
                    <td><span class="text-xs text-gray-300">${timeStr}</span></td>
                    <td>
                        <a href="${s.file_url}" target="_blank" class="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-semibold hover:underline inline-flex items-center gap-1">
                            <span>📥 Unduh Berkas</span>
                        </a>
                    </td>
                    <td style="width: 110px;">
                        <input type="number" min="0" max="100" class="input-control score-input text-center font-bold" value="${s.score != null ? s.score : ''}" placeholder="0-100" id="score-${s.id}">
                    </td>
                    <td>
                        <input type="text" class="input-control feedback-input text-xs" value="${escapeHTML(s.feedback || '')}" placeholder="Catatan koreksi..." id="feedback-${s.id}">
                    </td>
                    <td>
                        <button class="btn-save-grade btn-sm btn-primary" data-id="${s.id}" data-studentid="${s.student_id}">
                            Simpan
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Bind save grade click
        tbody.querySelectorAll('.btn-save-grade').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
                const subId = btn.getAttribute('data-id');
                const studentId = btn.getAttribute('data-studentid');
                const scoreVal = document.getElementById(`score-${subId}`).value;
                const feedbackVal = document.getElementById(`feedback-${subId}`).value.trim();

                if (scoreVal === '' || isNaN(scoreVal) || Number(scoreVal) < 0 || Number(scoreVal) > 100) {
                    return showToast('Masukkan nilai valid antara 0 dan 100!', 'warning');
                }

                btn.textContent = 'Menyimpan...';
                try {
                    const { error } = await db
                        .from('assignment_submissions')
                        .update({
                            score: Number(scoreVal),
                            feedback: feedbackVal || null,
                            status: 'graded',
                            graded_at: new Date().toISOString()
                        })
                        .eq('id', subId);

                    if (error) throw error;

                    showToast('Nilai dan feedback berhasil disimpan!', 'success');
                    btn.textContent = 'Tersimpan ✓';
                    setTimeout(() => { btn.textContent = 'Simpan'; }, 2000);
                    await loadAssignments();
                } catch (err) {
                    showToast('Gagal menyimpan nilai: ' + err.message, 'error');
                    btn.textContent = 'Simpan';
                }
            });
        });
    } catch (err) {
        console.error('Gagal mengambil submissions:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-6 text-rose-400">Gagal: ${escapeHTML(err.message)}</td></tr>`;
    }
}

// Inisialisasi Lifecycle
if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') {
        initLmsTeacherModule();
    } else {
        document.addEventListener('DOMContentLoaded', initLmsTeacherModule);
    }
}
