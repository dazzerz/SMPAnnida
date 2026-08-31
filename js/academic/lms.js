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
    initCbtTeacherModule();
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


// ── 2. CBT QUIZ MANAGER & SMART TEXT PARSER ────────────────────────────
let allCbtQuizzes = [];

export function initCbtTeacherModule() {
    loadCbtDropdowns();
    loadCbtQuizzes();
    initCbtEventListeners();
}

async function loadCbtDropdowns() {
    try {
        const [clsRes, mapelRes] = await Promise.all([
            db.from('classes').select('id, nama_kelas').order('nama_kelas'),
            db.from('subjects').select('id, nama_mapel').order('nama_mapel')
        ]);

        const selClass = document.getElementById('quiz-class-select');
        const filterClass = document.getElementById('filter-cbt-class');
        const selSubject = document.getElementById('quiz-subject-select');
        const filterSubject = document.getElementById('filter-cbt-subject');

        const classes = clsRes.data || [];
        const subjects = mapelRes.data || [];

        if (selClass) {
            selClass.innerHTML = '<option value="">-- Pilih Kelas --</option><option value="Semua">Semua Kelas</option>' + 
                classes.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        }
        if (filterClass) {
            filterClass.innerHTML = '<option value="">Semua Kelas</option>' + 
                classes.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        }
        if (selSubject) {
            selSubject.innerHTML = '<option value="">-- Pilih Mapel --</option>' + 
                subjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');
        }
        if (filterSubject) {
            filterSubject.innerHTML = '<option value="">Semua Mata Pelajaran</option>' + 
                subjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');
        }
    } catch (err) {
        console.error('Gagal memuat dropdown CBT:', err);
    }
}

export async function loadCbtQuizzes() {
    const tbody = document.getElementById('tbody-cbt-quizzes');
    const parserSelect = document.getElementById('parser-target-quiz');
    if (!tbody) return;

    try {
        const { data: quizzes, error } = await db
            .from('quizzes')
            .select(`
                *,
                quiz_questions ( id ),
                quiz_attempts ( id, total_score )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        allCbtQuizzes = quizzes || [];
        renderCbtTable(allCbtQuizzes);

        if (parserSelect) {
            parserSelect.innerHTML = '<option value="">-- Pilih Ujian CBT --</option>' + 
                allCbtQuizzes.map(q => `<option value="${q.id}">${q.title} (${q.class_name} • ${q.subject})</option>`).join('');
        }
    } catch (err) {
        console.error('Gagal memuat kuis CBT admin:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="aca-inline-22 text-rose-400">Gagal: ${escapeHTML(err.message)}</td></tr>`;
    }
}

function renderCbtTable(list) {
    const tbody = document.getElementById('tbody-cbt-quizzes');
    if (!tbody) return;

    const filterCls = document.getElementById('filter-cbt-class')?.value || '';
    const filterSub = document.getElementById('filter-cbt-subject')?.value || '';
    const query = document.getElementById('search-cbt-quiz')?.value.toLowerCase().trim() || '';

    let filtered = list;
    if (filterCls) filtered = filtered.filter(q => q.class_name === filterCls || q.class_name === 'Semua');
    if (filterSub) filtered = filtered.filter(q => q.subject === filterSub);
    if (query) filtered = filtered.filter(q => q.title.toLowerCase().includes(query));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="aca-inline-22">Belum ada ujian CBT. Klik "+ Buat Ujian CBT Baru" untuk membuat.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((q, idx) => {
        const qCount = (q.quiz_questions || []).length;
        const attCount = (q.quiz_attempts || []).length;

        return `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <div class="font-bold text-white">${escapeHTML(q.title)}</div>
                    <div class="text-xs text-emerald-400">${qCount} Butir Soal</div>
                </td>
                <td><span class="badge badge-primary">${escapeHTML(q.class_name)}</span></td>
                <td>${escapeHTML(q.subject)}</td>
                <td><span class="text-xs text-amber-300">${q.duration_minutes} Menit</span></td>
                <td>
                    <span class="text-xs font-semibold px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                        ${attCount} Siswa Mengerjakan
                    </span>
                </td>
                <td>
                    <div class="flex items-center gap-1.5">
                        <button class="btn-open-parser-for-quiz btn-sm btn-primary" data-id="${q.id}" title="Tambah Soal via Text Parser">+ Soal</button>
                        <button class="btn-del-quiz btn-sm btn-danger" data-id="${q.id}" title="Hapus Ujian">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.btn-open-parser-for-quiz').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const modal = document.getElementById('modal-text-parser');
            const sel = document.getElementById('parser-target-quiz');
            if (sel) sel.value = id;
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.remove('hidden');
            }
        };
    });

    tbody.querySelectorAll('.btn-del-quiz').forEach(btn => {
        btn.onclick = async () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            const id = btn.getAttribute('data-id');
            if (!confirm('Hapus ujian CBT ini beserta seluruh butir soal dan jawaban siswa?')) return;

            try {
                const { error } = await db.from('quizzes').delete().eq('id', id);
                if (error) throw error;
                showToast('Ujian CBT berhasil dihapus.', 'success');
                await loadCbtQuizzes();
            } catch (err) {
                showToast('Gagal menghapus kuis: ' + err.message, 'error');
            }
        };
    });
}

function initCbtEventListeners() {
    const btnCreate = document.getElementById('btn-create-quiz-cbt');
    const modalQuiz = document.getElementById('modal-quiz-cbt');
    const btnCloseQuiz = document.getElementById('btn-close-quiz-modal');
    const formQuiz = document.getElementById('form-quiz-cbt');

    const btnOpenParser = document.getElementById('btn-open-text-parser');
    const modalParser = document.getElementById('modal-text-parser');
    const btnCloseParser = document.getElementById('btn-close-parser-modal');
    const btnCancelParser = document.getElementById('btn-cancel-parser');
    const btnExecParser = document.getElementById('btn-execute-parser');

    const filterCls = document.getElementById('filter-cbt-class');
    const filterSub = document.getElementById('filter-cbt-subject');
    const searchInput = document.getElementById('search-cbt-quiz');

    if (btnCreate) btnCreate.onclick = () => {
        if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        formQuiz.reset();
        modalQuiz.style.display = 'flex';
        modalQuiz.classList.remove('hidden');
    };

    if (btnCloseQuiz) btnCloseQuiz.onclick = () => {
        modalQuiz.style.display = 'none';
        modalQuiz.classList.add('hidden');
    };

    if (btnOpenParser) btnOpenParser.onclick = () => {
        if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        modalParser.style.display = 'flex';
        modalParser.classList.remove('hidden');
    };

    if (btnCloseParser) btnCloseParser.onclick = () => {
        modalParser.style.display = 'none';
        modalParser.classList.add('hidden');
    };

    if (btnCancelParser) btnCancelParser.onclick = () => {
        modalParser.style.display = 'none';
        modalParser.classList.add('hidden');
    };

    if (filterCls) filterCls.onchange = () => renderCbtTable(allCbtQuizzes);
    if (filterSub) filterSub.onchange = () => renderCbtTable(allCbtQuizzes);
    if (searchInput) searchInput.oninput = () => renderCbtTable(allCbtQuizzes);

    if (formQuiz) {
        formQuiz.onsubmit = async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');

            const title = document.getElementById('quiz-title-input').value.trim();
            const cls = document.getElementById('quiz-class-select').value;
            const sub = document.getElementById('quiz-subject-select').value;
            const duration = parseInt(document.getElementById('quiz-duration-input').value) || 60;
            const antiCheat = document.getElementById('quiz-anticheat-select').value === 'true';

            const { data: { user } } = await db.auth.getUser();
            const teacherName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guru Annida';

            try {
                const { data: newQuiz, error } = await db.from('quizzes').insert({
                    teacher_id: user?.id,
                    teacher_name: teacherName,
                    class_name: cls,
                    subject: sub,
                    title: title,
                    duration_minutes: duration,
                    anti_cheat_enabled: antiCheat,
                    status: 'published'
                }).select().single();

                if (error) throw error;

                showToast('Ujian CBT berhasil dibuat! Silakan input butir soal.', 'success');
                modalQuiz.style.display = 'none';
                modalQuiz.classList.add('hidden');

                // Buka parser otomatis untuk kuis baru ini
                const targetSel = document.getElementById('parser-target-quiz');
                if (targetSel) targetSel.value = newQuiz.id;
                modalParser.style.display = 'flex';
                modalParser.classList.remove('hidden');

                await loadCbtQuizzes();
            } catch (err) {
                showToast('Gagal membuat kuis CBT: ' + err.message, 'error');
            }
        };
    }

    if (btnExecParser) {
        btnExecParser.onclick = async () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            const targetQuizId = document.getElementById('parser-target-quiz').value;
            const rawText = document.getElementById('parser-raw-text').value.trim();

            if (!targetQuizId) return showToast('Pilih ujian tujuan terlebih dahulu!', 'warning');
            if (!rawText) return showToast('Tempelkan teks kumpulan soal!', 'warning');

            const parsedQuestions = parseRawQuestions(rawText, targetQuizId);
            if (parsedQuestions.length === 0) {
                return showToast('Format teks tidak dikenali. Pastikan ada penomoran soal (1. 2. dst)', 'warning');
            }

            btnExecParser.textContent = 'Menyimpan...';
            try {
                const { error } = await db.from('quiz_questions').insert(parsedQuestions);
                if (error) throw error;

                showToast(`Berhasil mem-parsing dan menyimpan ${parsedQuestions.length} butir soal!`, 'success');
                modalParser.style.display = 'none';
                modalParser.classList.add('hidden');
                document.getElementById('parser-raw-text').value = '';
                await loadCbtQuizzes();
            } catch (err) {
                showToast('Gagal menyimpan butir soal: ' + err.message, 'error');
            } finally {
                btnExecParser.textContent = 'Proses & Simpan Butir Soal';
            }
        };
    }
}

function parseRawQuestions(text, quizId) {
    // Split by numbered question pattern: e.g. "1.", "2.", "3."
    const blocks = text.split(/\n(?=\d+[.)]\s+)/g);
    const questions = [];

    blocks.forEach((block, idx) => {
        const trimmed = block.trim();
        if (!trimmed) return;

        const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        let qText = lines[0].replace(/^\d+[.)]\s+/, '');
        const options = [];
        let correctKey = null;
        let explanation = '';
        let type = 'multiple_choice';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            // Option match: A. B. C. D. E.
            const optMatch = line.match(/^([A-Ea-e])[.)]\s+(.+)/);
            // Key match: Kunci: A / Kunci Jawaban: B
            const keyMatch = line.match(/^(?:kunci|jawaban|key)(?:\s*jawaban)?:?\s*([A-Ea-e]|essay)/i);
            // Explanation match: Pembahasan: ... / Ket: ...
            const expMatch = line.match(/^(?:pembahasan|penjelasan|alasan):?\s*(.+)/i);

            if (optMatch) {
                options.push({
                    key: optMatch[1].toUpperCase(),
                    text: optMatch[2]
                });
            } else if (keyMatch) {
                const val = keyMatch[1].toUpperCase();
                if (val === 'ESSAY' || val === 'URAIAN') {
                    type = 'essay';
                } else {
                    correctKey = val;
                }
            } else if (expMatch) {
                explanation = expMatch[1];
            } else if (!optMatch && !keyMatch && !expMatch && options.length === 0) {
                // Continuation of question text
                qText += ' ' + line;
            }
        }

        if (options.length === 0) {
            type = 'essay';
        }

        questions.push({
            quiz_id: quizId,
            question_order: idx + 1,
            type: type,
            question_text: qText,
            options: options.length > 0 ? options : null,
            correct_key: correctKey || (options.length > 0 ? options[0].key : null),
            points: 10,
            explanation: explanation || null
        });
    });

    return questions;
}
