// =========================================================================
// LMS (LEARNING MANAGEMENT SYSTEM) TEACHER CONTROLLER (SMP ANNIDA)
// Modul: Pembuatan Tugas, Pembagian Materi Interaktif, & Koreksi Berkas Siswa
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, formatDate } from '../core/utils.js';
import { authState } from './authState.js';

const db = supabaseClient;

let allAssignments = [];
let masterClasses = [];
let masterSubjects = [];
let activeReviewAssignmentId = null;

// State Live Infocus Presenter Mode
let currentInfocusIndex = 0;
let infocusTimer = null;
let soalInfocus = [];
let activeInfocusItem = null;
let infocusSecondsRemaining = 0;

export function initLmsTeacherModule() {
    initCbtTeacherModule();
    loadLmsDropdowns();
    loadAssignments();
    initLmsEventListeners();
    initMaterialViewer();
    initInfocusPresenterListeners();
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
        const isMateri = a.type === 'materi' || a.type === 'material';
        const subCount = (a.assignment_submissions || []).length;
        const gradedCount = (a.assignment_submissions || []).filter(s => s.status === 'graded').length;

        let typeBadge = isMateri 
            ? '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">menu_book</span> Materi</span>'
            : '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">assignment</span> Tugas</span>';

        let deadlineStr = isMateri ? '<span class="text-xs text-gray-500">Materi Bacaan</span>' : '-';
        if (!isMateri && a.deadline) {
            deadlineStr = new Date(a.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }

        let progressCell = isMateri 
            ? '<span class="text-xs text-slate-500">Hanya Dibaca</span>'
            : `<span class="text-xs font-semibold px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">${subCount} Terkumpul (${gradedCount} Dinilai)</span>`;

        return `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <div class="flex items-center gap-2 mb-1">
                        ${typeBadge}
                        <span class="font-bold text-slate-900">${escapeHTML(a.title)}</span>
                    </div>
                    <div class="text-xs text-slate-500 truncate max-w-xs">${escapeHTML(a.description || '-')}</div>
                </td>
                <td><span class="badge badge-primary">${escapeHTML(a.class_name)}</span></td>
                <td>${escapeHTML(a.subject)}</td>
                <td><span class="text-xs text-amber-300">${deadlineStr}</span></td>
                <td>${progressCell}</td>
                <td>
                    <div class="flex items-center gap-1.5">
                        ${a.attachment_url ? `
                            <button class="btn-view-material-lms btn-sm btn-secondary flex items-center gap-1 text-emerald-300 hover:text-emerald-200" data-url="${escapeHTML(a.attachment_url)}" data-title="${escapeHTML(a.title)}" data-subtitle="Kelas ${a.class_name} • ${a.subject}" title="Lihat Materi di Web">
                                <span class="material-symbols-outlined text-xs">visibility</span>
                                <span>Lihat</span>
                            </button>
                        ` : ''}

                        ${!isMateri ? `
                            <button class="btn-tayang-row btn-sm btn-primary flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white" data-id="${a.id}" title="Tayangkan ke Infocus">
                                <span>📺</span>
                                <span class="hidden xl:inline">Tayang</span>
                            </button>
                            <button class="btn-review-lms btn-sm btn-primary" data-id="${a.id}" data-title="${escapeHTML(a.title)}" data-subtitle="Kelas ${a.class_name} • ${a.subject}" title="Review & Beri Nilai Siswa">
                                Review (${subCount})
                            </button>
                        ` : ''}
                        
                        <button class="btn-edit-assignment btn-sm btn-secondary" data-id="${a.id}" title="Edit Data">✏️</button>
                        <button class="btn-del-assignment btn-sm btn-danger" data-id="${a.id}" title="Hapus Data">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Bind event listeners for actions
    tbody.querySelectorAll('.btn-view-material-lms').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            const title = btn.getAttribute('data-title');
            const subtitle = btn.getAttribute('data-subtitle');
            openMaterialViewer(url, title, subtitle);
        });
    });

    tbody.querySelectorAll('.btn-tayang-row').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (id) startInfocusMode(id);
        });
    });

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
            if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;

            try {
                const { error } = await db.from('assignments').delete().eq('id', id);
                if (error) throw error;
                showToast('Data berhasil dihapus.', 'success');
                await loadAssignments();
            } catch (err) {
                showToast('Gagal menghapus data: ' + err.message, 'error');
            }
        });
    });
}

function openAssignmentModal(item = null) {
    const modal = document.getElementById('modal-assignment');
    if (!modal) return;

    const titleEl = document.getElementById('modal-assignment-title');
    const form = document.getElementById('form-assignment');
    const typeTugas = document.getElementById('type-tugas');
    const typeMateri = document.getElementById('type-materi');
    const deadlineContainer = document.getElementById('container-assignment-deadline');
    const saveBtnText = document.getElementById('btn-save-assignment-text');
    const fileInput = document.getElementById('assignment-file-upload');
    if (fileInput) fileInput.value = '';

    form.reset();

    if (item) {
        const isMateri = item.type === 'materi' || item.type === 'material';
        titleEl.textContent = isMateri ? 'Edit Materi Ajar' : 'Edit Tugas / PR';
        document.getElementById('assignment-id').value = item.id;
        document.getElementById('assignment-title').value = item.title;
        document.getElementById('assignment-class').value = item.class_name;
        document.getElementById('assignment-subject').value = item.subject;
        document.getElementById('assignment-attachment').value = item.attachment_url || '';
        document.getElementById('assignment-description').value = item.description || '';

        if (isMateri) {
            typeMateri.checked = true;
            if (deadlineContainer) deadlineContainer.style.display = 'none';
            if (saveBtnText) saveBtnText.textContent = 'Simpan Materi Ajar';
        } else {
            typeTugas.checked = true;
            if (deadlineContainer) deadlineContainer.style.display = 'block';
            if (saveBtnText) saveBtnText.textContent = 'Simpan Tugas';
            if (item.deadline) {
                document.getElementById('assignment-deadline').value = new Date(item.deadline).toISOString().slice(0, 16);
            }
        }
    } else {
        titleEl.textContent = 'Buat Tugas / Materi Baru';
        document.getElementById('assignment-id').value = '';
        typeTugas.checked = true;
        if (deadlineContainer) deadlineContainer.style.display = 'block';
        if (saveBtnText) saveBtnText.textContent = 'Simpan Tugas';
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

    const typeTugas = document.getElementById('type-tugas');
    const typeMateri = document.getElementById('type-materi');
    const deadlineContainer = document.getElementById('container-assignment-deadline');
    const saveBtnText = document.getElementById('btn-save-assignment-text');

    if (typeTugas && typeMateri && deadlineContainer) {
        typeTugas.addEventListener('change', () => {
            if (typeTugas.checked) {
                deadlineContainer.style.display = 'block';
                if (saveBtnText) saveBtnText.textContent = 'Simpan Tugas';
            }
        });
        typeMateri.addEventListener('change', () => {
            if (typeMateri.checked) {
                deadlineContainer.style.display = 'none';
                if (saveBtnText) saveBtnText.textContent = 'Simpan Materi Ajar';
            }
        });
    }

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
            const isMateriSelected = document.getElementById('type-materi')?.checked;
            const selectedType = isMateriSelected ? 'materi' : 'tugas';
            const deadlineVal = isMateriSelected ? null : document.getElementById('assignment-deadline').value;
            let attachment = document.getElementById('assignment-attachment').value.trim();
            const description = document.getElementById('assignment-description').value.trim();
            const fileUpload = document.getElementById('assignment-file-upload')?.files?.[0];

            const { data: { user } } = await db.auth.getUser();
            const teacherName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guru Annida';

            if (saveBtnText) saveBtnText.textContent = 'Menyimpan...';

            try {
                // Upload file jika guru mengunggah berkas (PDF, DOCX, HTML, Video, Foto)
                if (fileUpload) {
                    const ext = fileUpload.name.split('.').pop().toLowerCase();
                    const safeName = fileUpload.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const storagePath = `materials/${Date.now()}_${safeName}`;

                    let contentType = fileUpload.type || 'application/octet-stream';
                    let uploadBody = fileUpload;

                    if (ext === 'html' || ext === 'htm') {
                        contentType = 'text/html; charset=utf-8';
                        uploadBody = new Blob([fileUpload], { type: contentType });
                    } else if (ext === 'pdf') {
                        contentType = 'application/pdf';
                        uploadBody = new Blob([fileUpload], { type: contentType });
                    } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                        contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
                        uploadBody = new Blob([fileUpload], { type: contentType });
                    }

                    const { data: uploadData, error: uploadErr } = await db.storage
                        .from('smpannida_storage')
                        .upload(storagePath, uploadBody, { 
                            contentType: contentType, 
                            cacheControl: '3600',
                            upsert: true 
                        });

                    if (uploadErr) throw uploadErr;

                    const { data: publicUrlData } = db.storage
                        .from('smpannida_storage')
                        .getPublicUrl(storagePath);

                    attachment = publicUrlData?.publicUrl || storagePath;
                }

                const payload = {
                    teacher_id: user?.id,
                    teacher_name: teacherName,
                    class_name: className,
                    subject: subject,
                    title: title,
                    type: selectedType,
                    description: description || null,
                    attachment_url: attachment || null,
                    deadline: deadlineVal ? new Date(deadlineVal).toISOString() : null,
                    updated_at: new Date().toISOString()
                };

                if (id) {
                    const { error } = await db.from('assignments').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast(isMateriSelected ? 'Materi ajar berhasil diperbarui!' : 'Tugas berhasil diperbarui!', 'success');
                } else {
                    const { error } = await db.from('assignments').insert(payload);
                    if (error) throw error;
                    showToast(isMateriSelected ? 'Materi ajar baru berhasil diterbitkan!' : 'Tugas baru berhasil dibuat!', 'success');
                }

                modalAssignment.style.display = 'none';
                modalAssignment.classList.add('hidden');
                await loadAssignments();
            } catch (err) {
                console.error('Gagal menyimpan:', err);
                showToast('Gagal menyimpan: ' + err.message, 'error');
            } finally {
                if (saveBtnText) saveBtnText.textContent = isMateriSelected ? 'Simpan Materi Ajar' : 'Simpan Tugas';
            }
        };
    }
}

// ── 3. MATERIAL VIEWER CONTROLLER (SMART IFRAME MODAL) ────────────────
export function formatEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();

    // YouTube URL detection (Standard watch, youtu.be, embed, shorts)
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    // Google Drive Preview link
    if (trimmed.includes('drive.google.com/file/d/')) {
        return trimmed.replace(/\/view.*$/, '/preview');
    }

    return trimmed;
}

export function openMaterialViewer(url, title, subtitle) {
    const modal = document.getElementById('modal-material-viewer');
    const titleEl = document.getElementById('viewer-title');
    const subtitleEl = document.getElementById('viewer-subtitle');
    const iframe = document.getElementById('material-viewer-iframe');
    const openExternal = document.getElementById('viewer-open-external');
    const fallbackImg = document.getElementById('viewer-fallback-img');
    const imgEl = document.getElementById('viewer-img-el');
    const iconEl = document.getElementById('viewer-icon');

    if (!modal || !iframe) return;

    titleEl.textContent = title || 'Materi Pembelajaran';
    subtitleEl.textContent = subtitle || 'SMP Annida E-Learning';
    if (openExternal) openExternal.href = url;

    const formattedUrl = formatEmbedUrl(url);
    const isImage = /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(url);

    if (isImage) {
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
        if (fallbackImg && imgEl) {
            fallbackImg.classList.remove('hidden');
            imgEl.src = url;
        }
        if (iconEl) iconEl.textContent = 'image';
    } else {
        if (fallbackImg) fallbackImg.classList.add('hidden');
        iframe.style.display = 'block';
        iframe.src = formattedUrl;
        if (iconEl) {
            if (formattedUrl.includes('youtube.com')) iconEl.textContent = 'play_circle';
            else if (formattedUrl.includes('.pdf')) iconEl.textContent = 'picture_as_pdf';
            else iconEl.textContent = 'preview';
        }
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function initMaterialViewer() {
    const modal = document.getElementById('modal-material-viewer');
    const closeBtn = document.getElementById('btn-close-material-viewer');
    const iframe = document.getElementById('material-viewer-iframe');

    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            if (iframe) iframe.src = 'about:blank';
        };
    }
}

// ── 2. CBT QUIZ MANAGER & SMART TEXT PARSER ────────────────────────────
let allCbtQuizzes = [];

export function initCbtTeacherModule() {
    loadCbtRelations();
    loadCbtQuizzes();
    loadKuisForParser();
    initCbtEventListeners();
}

export async function loadCbtRelations() {
    try {
        const [clsRes, mapelRes] = await Promise.all([
            db.from('classes').select('id, nama_kelas').order('nama_kelas'),
            db.from('subjects').select('id, nama_mapel').order('nama_mapel')
        ]);

        const classes = clsRes.data || [];
        const subjects = mapelRes.data || [];

        const selClass = document.getElementById('cbt-select-kelas') || document.getElementById('quiz-class-select');
        const selSubject = document.getElementById('cbt-select-mapel') || document.getElementById('quiz-subject-select');
        const filterClass = document.getElementById('filter-cbt-class');
        const filterSubject = document.getElementById('filter-cbt-subject');

        const classOptions = '<option value="">-- Pilih Kelas --</option><option value="Semua">Semua Kelas</option>' + 
            classes.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        const subjectOptions = '<option value="">-- Pilih Mapel --</option>' + 
            subjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');

        if (selClass) selClass.innerHTML = classOptions;
        if (selSubject) selSubject.innerHTML = subjectOptions;

        if (filterClass) {
            filterClass.innerHTML = '<option value="">Semua Kelas</option>' + 
                classes.map(c => `<option value="${c.nama_kelas}">${c.nama_kelas}</option>`).join('');
        }
        if (filterSubject) {
            filterSubject.innerHTML = '<option value="">Semua Mata Pelajaran</option>' + 
                subjects.map(s => `<option value="${s.nama_mapel}">${s.nama_mapel}</option>`).join('');
        }
    } catch (err) {
        console.error('Gagal memuat relasi CBT (kelas & mapel):', err);
    }
}

// Backward compatibility alias
export const loadCbtDropdowns = loadCbtRelations;

export async function loadKuisForParser() {
    const parserSelect = document.getElementById('parser-target-quiz');
    if (!parserSelect) return;

    try {
        const { data: quizzes, error } = await db
            .from('quizzes')
            .select('id, title, class_name, subject')
            .order('created_at', { ascending: false });

        if (error) throw error;

        let html = '<option value="">-- Pilih Ujian CBT --</option>';
        (quizzes || []).forEach(q => {
            html += `<option value="${q.id}">${escapeHTML(q.title)} - ${escapeHTML(q.subject || '-')} (${escapeHTML(q.class_name || 'Semua')})</option>`;
        });
        parserSelect.innerHTML = html;
    } catch (err) {
        console.error('Gagal memuat kuis untuk parser:', err);
    }
}

export async function loadCbtQuizzes() {
    const tbody = document.getElementById('tbody-cbt-quizzes');
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
        await loadKuisForParser();
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
                    <div class="font-bold text-slate-900">${escapeHTML(q.title)}</div>
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
        loadCbtRelations();
        formQuiz.reset();
        modalQuiz.style.display = 'flex';
        modalQuiz.classList.remove('hidden');
    };

    if (btnCloseQuiz) btnCloseQuiz.onclick = () => {
        modalQuiz.style.display = 'none';
        modalQuiz.classList.add('hidden');
    };

    if (btnOpenParser) btnOpenParser.onclick = async () => {
        if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        await loadKuisForParser();
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
            const cls = (document.getElementById('cbt-select-kelas') || document.getElementById('quiz-class-select'))?.value || '';
            const sub = (document.getElementById('cbt-select-mapel') || document.getElementById('quiz-subject-select'))?.value || '';
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

// =========================================================================
// ── 4. LIVE PRESENTER MODE (INFOCUS PROYECTOR CONTROLLER) ─────────────────
// =========================================================================

export async function startInfocusMode(tugasOrQuizId) {
    if (!tugasOrQuizId) {
        showToast('Pilih tugas atau kuis terlebih dahulu!', 'warning');
        return;
    }

    try {
        showToast('Menyiapkan Live Presenter Mode...', 'info');

        let title = 'Ujian / Tugas Siswa';
        let subtitle = 'SMP Annida Live Exam';
        soalInfocus = [];
        currentInfocusIndex = 0;

        // 1. Cek apakah ini Quiz CBT
        let targetQuiz = (allCbtQuizzes || []).find(q => q.id === tugasOrQuizId);
        if (!targetQuiz) {
            // Coba fetch dari tabel quizzes
            const { data: qData } = await db.from('quizzes').select('*').eq('id', tugasOrQuizId).maybeSingle();
            if (qData) targetQuiz = qData;
        }

        if (targetQuiz) {
            title = targetQuiz.title || 'Ujian CBT Online';
            subtitle = `${targetQuiz.subject || ''} • Kelas ${targetQuiz.class_name || 'Semua'}`;

            // Ambil questions dari quiz_questions
            const { data: questions, error: qErr } = await db
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', targetQuiz.id)
                .order('question_order', { ascending: true });

            if (qErr) throw qErr;
            if (questions && questions.length > 0) {
                soalInfocus = questions;
            }
        }

        // 2. Jika bukan quiz CBT atau soal belum ditemukan di CBT, cek tabel assignments (Tugas)
        if (soalInfocus.length === 0) {
            let targetAssignment = (allAssignments || []).find(a => a.id === tugasOrQuizId);
            if (!targetAssignment) {
                const { data: aData } = await db.from('assignments').select('*').eq('id', tugasOrQuizId).maybeSingle();
                if (aData) targetAssignment = aData;
            }

            if (targetAssignment) {
                title = targetAssignment.title || 'Tugas Siswa';
                subtitle = `${targetAssignment.subject || ''} • Kelas ${targetAssignment.class_name || 'Semua'}`;

                // Jika ada description berformat soal, parse menggunakan text parser
                const rawDesc = targetAssignment.description || '';
                const parsed = parseRawQuestions(rawDesc, targetAssignment.id);
                if (parsed.length > 0) {
                    soalInfocus = parsed;
                } else if (rawDesc.trim()) {
                    // Jika satu instruksi/soal tunggal
                    soalInfocus = [{
                        type: 'essay',
                        question_text: rawDesc,
                        options: null
                    }];
                }
            }
        }

        if (soalInfocus.length === 0) {
            showToast('Tidak ada butir soal yang dapat ditayangkan untuk tugas/ujian ini.', 'warning');
            return;
        }

        activeInfocusItem = { 
            title, 
            subtitle,
            subject: targetQuiz?.subject || targetAssignment?.subject || 'Bahasa Indonesia',
            className: targetQuiz?.class_name || targetAssignment?.class_name || '7',
            teacherName: targetQuiz?.teacher_name || targetAssignment?.teacher_name || 'Awfa Dikhrish, S.S.'
        };

        // Buka modal fullscreen
        const modalPresenter = document.getElementById('modal-infocus-presenter');
        const kopExamTitle = document.getElementById('infocus-kop-exam-title');
        const kopSubject = document.getElementById('infocus-kop-subject');
        const kopClass = document.getElementById('infocus-kop-class');
        const kopTeacher = document.getElementById('infocus-kop-teacher');

        if (kopExamTitle) kopExamTitle.textContent = activeInfocusItem.title.toUpperCase();
        if (kopSubject) kopSubject.textContent = activeInfocusItem.subject;
        if (kopClass) kopClass.textContent = activeInfocusItem.className;
        if (kopTeacher) kopTeacher.textContent = activeInfocusItem.teacherName;

        if (modalPresenter) {
            modalPresenter.style.display = 'flex';
            modalPresenter.classList.remove('hidden');
            // Coba request fullscreen browser untuk tampilan infocus maksimal
            if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        }

        // Tutup modal pemilih jika sedang terbuka
        const modalSelect = document.getElementById('modal-select-infocus');
        if (modalSelect) {
            modalSelect.style.display = 'none';
            modalSelect.classList.add('hidden');
        }

        // Mulai soal pertama
        playNextInfocusQuestion();

    } catch (err) {
        console.error('Gagal memulai infocus mode:', err);
        showToast('Gagal memulai Presenter Mode: ' + err.message, 'error');
    }
}

export function playNextInfocusQuestion() {
    if (infocusTimer) {
        clearInterval(infocusTimer);
        infocusTimer = null;
    }

    const modalPresenter = document.getElementById('modal-infocus-presenter');

    // Jika soal sudah habis, tutup modal fullscreen dan tampilkan pesan selesai
    if (!soalInfocus || currentInfocusIndex >= soalInfocus.length) {
        if (modalPresenter) {
            modalPresenter.style.display = 'none';
            modalPresenter.classList.add('hidden');
        }
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
        showToast('🎉 Ujian Selesai! Seluruh butir soal telah selesai ditayangkan.', 'success');
        return;
    }

    const currentQ = soalInfocus[currentInfocusIndex];
    const isPG = currentQ.type === 'multiple_choice' && Array.isArray(currentQ.options) && currentQ.options.length > 0;

    // Batas waktu: PG = 4 menit (240 detik), Essay = 10 menit (600 detik)
    infocusSecondsRemaining = isPG ? 240 : 600;

    // Elemen UI Presenter
    const badgeTypeEl = document.getElementById('infocus-question-type-badge');
    const badgeNumEl = document.getElementById('infocus-question-number-badge');
    const qTextEl = document.getElementById('infocus-question-text');
    const optionsContainer = document.getElementById('infocus-options-container');
    const progressTextEl = document.getElementById('infocus-progress-text');
    const timerDisplayEl = document.getElementById('infocus-timer-display');
    const timerBadgeEl = document.getElementById('infocus-timer-badge');

    // Update Header & Badge
    if (badgeTypeEl) {
        badgeTypeEl.textContent = isPG ? 'A. Soal Pilihan Ganda (Batas Waktu: 4 Menit)' : 'B. Soal Essay / Uraian (Batas Waktu: 10 Menit)';
        badgeTypeEl.className = isPG 
            ? 'px-4 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-sm md:text-base font-bold tracking-wide inline-block'
            : 'px-4 py-1 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 text-sm md:text-base font-bold tracking-wide inline-block';
    }

    if (badgeNumEl) {
        badgeNumEl.textContent = `Nomor Soal: ${currentInfocusIndex + 1}`;
    }

    // Update Teks Soal Menggunakan innerHTML (Rich Content: kotak puisi, teks bacaan, dsb.)
    if (qTextEl) {
        let rawContent = currentQ.question_text || '';
        // Format puisi / teks kotak jika ada pola pembatas atau box
        let formattedContent = rawContent;
        
        // Jika rawContent sudah berupa HTML yang diformat
        if (formattedContent.includes('<div') || formattedContent.includes('<p') || formattedContent.includes('<table')) {
            qTextEl.innerHTML = formattedContent;
        } else {
            // Autodeteksi blok puisi (baris-baris berima atau teks bacaan khusus)
            formattedContent = escapeHTML(rawContent).replace(/\n/g, '<br>');
            // Styling khusus untuk kutipan puisi / teks bacaan
            formattedContent = formattedContent.replace(/(Bacalah puisi[^\n<]*|<br>Bacalah[^\n<]*)(.+?)(Jenis puisi|Suasana yang|Objek utama|$)/is, (match, prefix, poem, suffix) => {
                return `${prefix}<div class="my-4 p-4 border-2 border-slate-800 rounded-xl bg-slate-50 font-serif text-lg md:text-2xl text-slate-900 shadow-inner inline-block max-w-xl leading-relaxed">${poem}</div><br>${suffix}`;
            });
            qTextEl.innerHTML = formattedContent;
        }
    }

    // Update Opsi Jawaban
    if (optionsContainer) {
        if (isPG) {
            optionsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6';
            optionsContainer.innerHTML = currentQ.options.map(opt => `
                <div class="p-5 md:p-6 rounded-2xl bg-slate-900 border-2 border-slate-700/80 text-white flex items-center gap-4 shadow-xl">
                    <span class="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center font-black text-2xl md:text-3xl text-amber-400 shrink-0">
                        ${escapeHTML(opt.key)}
                    </span>
                    <span class="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-slate-100">
                        ${escapeHTML(opt.text)}
                    </span>
                </div>
            `).join('');
        } else {
            optionsContainer.className = 'w-full';
            optionsContainer.innerHTML = `
                <div class="p-6 md:p-8 rounded-2xl bg-slate-900/60 border-2 border-dashed border-slate-700 text-slate-300 text-lg md:text-xl font-medium leading-relaxed">
                    ✍️ Tuliskan jawaban uraian lengkap di lembar jawaban masing-masing dengan rapi dan teliti.
                </div>
            `;
        }
    }

    // Update Progress Footer (Soal X dari Y)
    if (progressTextEl) {
        progressTextEl.textContent = `Soal ${currentInfocusIndex + 1} dari ${soalInfocus.length}`;
    }

    // Timer Countdown Loop
    function updateTimer() {
        const m = Math.floor(infocusSecondsRemaining / 60);
        const s = infocusSecondsRemaining % 60;
        const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

        if (timerDisplayEl) timerDisplayEl.textContent = timeFormatted;

        // Visual peringatan ketika sisa <= 60 detik
        if (timerBadgeEl) {
            if (infocusSecondsRemaining <= 60) {
                timerBadgeEl.className = 'px-6 py-2.5 md:px-8 md:py-3 rounded-2xl bg-rose-600 border-2 border-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.8)] flex items-center gap-3 animate-pulse';
            } else {
                timerBadgeEl.className = 'px-6 py-2.5 md:px-8 md:py-3 rounded-2xl bg-rose-950/80 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] flex items-center gap-3';
            }
        }

        if (infocusSecondsRemaining <= 0) {
            clearInterval(infocusTimer);
            infocusTimer = null;
            // Waktu habis: otomatis naikkan index dan panggil soal berikutnya tanpa ampun
            currentInfocusIndex++;
            playNextInfocusQuestion();
            return;
        }

        infocusSecondsRemaining--;
    }

    updateTimer();
    infocusTimer = setInterval(updateTimer, 1000);
}

function initInfocusPresenterListeners() {
    const btnTayang = document.getElementById('btn-tayang-tugas');
    const modalSelect = document.getElementById('modal-select-infocus');
    const btnCloseSelect = document.getElementById('btn-close-select-infocus');
    const btnCancelSelect = document.getElementById('btn-cancel-select-infocus');
    const btnStartSelected = document.getElementById('btn-start-selected-infocus');
    const selectTask = document.getElementById('select-infocus-task');

    const modalPresenter = document.getElementById('modal-infocus-presenter');
    const btnQuit = document.getElementById('btn-quit-infocus');
    const btnForceNext = document.getElementById('btn-force-next-infocus');

    // Buka Modal Pemilihan Tugas/Kuis untuk Ditayangkan
    if (btnTayang) {
        btnTayang.onclick = () => {
            if (!modalSelect || !selectTask) return;

            let optionsHtml = '<option value="">-- Pilih Tugas / Ujian CBT --</option>';

            if (allCbtQuizzes && allCbtQuizzes.length > 0) {
                optionsHtml += '<optgroup label="Ujian CBT Online">';
                allCbtQuizzes.forEach(q => {
                    optionsHtml += `<option value="${q.id}">[CBT] ${escapeHTML(q.title)} (${escapeHTML(q.subject)} - ${escapeHTML(q.class_name)})</option>`;
                });
                optionsHtml += '</optgroup>';
            }

            if (allAssignments && allAssignments.length > 0) {
                optionsHtml += '<optgroup label="Tugas & Soal LMS">';
                allAssignments.filter(a => a.type !== 'materi').forEach(a => {
                    optionsHtml += `<option value="${a.id}">[Tugas] ${escapeHTML(a.title)} (${escapeHTML(a.subject)} - ${escapeHTML(a.class_name)})</option>`;
                });
                optionsHtml += '</optgroup>';
            }

            selectTask.innerHTML = optionsHtml;
            modalSelect.style.display = 'flex';
            modalSelect.classList.remove('hidden');
        };
    }

    if (btnCloseSelect) {
        btnCloseSelect.onclick = () => {
            modalSelect.style.display = 'none';
            modalSelect.classList.add('hidden');
        };
    }
    if (btnCancelSelect) {
        btnCancelSelect.onclick = () => {
            modalSelect.style.display = 'none';
            modalSelect.classList.add('hidden');
        };
    }

    if (btnStartSelected && selectTask) {
        btnStartSelected.onclick = () => {
            const selectedId = selectTask.value;
            if (!selectedId) {
                showToast('Pilih salah satu tugas atau ujian CBT terlebih dahulu!', 'warning');
                return;
            }
            startInfocusMode(selectedId);
        };
    }

    // Tombol Lanjut (Force Next) Guru
    if (btnForceNext) {
        btnForceNext.onclick = () => {
            if (confirm('Lanjut ke butir soal berikutnya sekarang?')) {
                currentInfocusIndex++;
                playNextInfocusQuestion();
            }
        };
    }

    // Tombol Keluar dari Presenter Mode
    if (btnQuit) {
        btnQuit.onclick = () => {
            if (confirm('Keluar dari Live Presenter Mode?')) {
                if (infocusTimer) {
                    clearInterval(infocusTimer);
                    infocusTimer = null;
                }
                if (modalPresenter) {
                    modalPresenter.style.display = 'none';
                    modalPresenter.classList.add('hidden');
                }
                if (document.fullscreenElement && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                }
                showToast('Presenter mode ditutup.', 'info');
            }
        };
    }
}

// Expose globally for SPA router
window.loadLms = initLmsTeacherModule;
window.loadCbt = initCbtTeacherModule;
window.loadCbtRelations = loadCbtRelations;
window.loadKuisForParser = loadKuisForParser;
window.startInfocusMode = startInfocusMode;

document.addEventListener('sectionLoaded', (e) => {
    if (e.detail && (e.detail.id === 'tugas-lms' || e.detail.id === 'cbt-admin')) {
        initLmsTeacherModule();
    }
});

const isLmsOrCbt = window.location.hash === '#tugas-lms' || window.location.hash === '#cbt-admin';
if (isLmsOrCbt) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLmsTeacherModule);
    } else {
        initLmsTeacherModule();
    }
}
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#tugas-lms' || window.location.hash === '#cbt-admin') {
        initLmsTeacherModule();
    }
});
