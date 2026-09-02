// =========================================================================
// MATERI PEMBELAJARAN (E-LEARNING) TEACHER CONTROLLER (SMP ANNIDA)
// Modul: Manajemen Materi Digital, Smart Video Embed, PDF & HTML Viewer
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, formatDate } from '../core/utils.js';
import { authState } from './authState.js';

const db = supabaseClient;

let allMaterials = [];
let masterClasses = [];
let masterSubjects = [];

export function initMateriModule() {
    loadMateriDropdowns();
    loadMaterials();
    initMateriEventListeners();
    initTeacherViewer();
}

async function loadMateriDropdowns() {
    try {
        const [clsRes, mapelRes] = await Promise.all([
            db.from('classes').select('id, nama_kelas').order('nama_kelas'),
            db.from('subjects').select('id, nama_mapel').order('nama_mapel')
        ]);

        masterClasses = clsRes.data || [];
        masterSubjects = mapelRes.data || [];

        const selClass = document.getElementById('material-class');
        const filterClass = document.getElementById('filter-materi-class');
        const selSubject = document.getElementById('material-subject');
        const filterSubject = document.getElementById('filter-materi-subject');

        if (selClass) {
            selClass.innerHTML = `
                <option value="">-- Pilih Tingkat Kelas --</option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
                <option value="Semua">Semua Tingkat (7, 8, 9)</option>
            `;
        }

        if (filterClass) {
            filterClass.innerHTML = `
                <option value="">Semua Tingkat</option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
            `;
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
        console.error('Gagal memuat dropdown materi:', err);
    }
}

export async function loadMaterials() {
    const tbody = document.getElementById('tbody-materials');
    if (!tbody) return;

    try {
        const { data: materials, error } = await db
            .from('materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            // Jika tabel materials belum ada di cache, fallback gracefully
            console.warn('Tabel materials belum terdeteksi:', error.message);
            tbody.innerHTML = '<tr><td colspan="7" class="aca-inline-22">Belum ada materi pembelajaran yang dibuat. Klik "+ Buat Materi Baru" untuk memulai.</td></tr>';
            return;
        }

        allMaterials = materials || [];

        const filterTeacherEl = document.getElementById('filter-materi-teacher');
        if (filterTeacherEl && allMaterials.length > 0) {
            const uniqueTeachers = [...new Set(allMaterials.map(m => m.teacher_name).filter(Boolean))].sort();
            const currentVal = filterTeacherEl.value;
            let tHtml = '<option value="">Semua Guru</option>';
            uniqueTeachers.forEach(t => tHtml += `<option value="${escapeHTML(t)}">${escapeHTML(t)}</option>`);
            filterTeacherEl.innerHTML = tHtml;
            if (currentVal) filterTeacherEl.value = currentVal;
        }

        renderMaterialsTable(allMaterials);
    } catch (err) {
        console.error('Gagal memuat daftar materi:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="aca-inline-22 text-rose-400">Gagal memuat data: ${escapeHTML(err.message)}</td></tr>`;
        }
    }
}

function renderMaterialsTable(list) {
    const tbody = document.getElementById('tbody-materials');
    if (!tbody) return;

    const filterCls = document.getElementById('filter-materi-class')?.value || '';
    const filterSub = document.getElementById('filter-materi-subject')?.value || '';
    const filterTch = document.getElementById('filter-materi-teacher')?.value || '';
    const query = document.getElementById('search-materi-query')?.value.toLowerCase().trim() || '';

    let filtered = list;
    if (filterCls) {
        const targetDigit = filterCls.match(/\d+/)?.[0];
        filtered = filtered.filter(m => {
            if (m.class_name === 'Semua' || m.class_name === 'Semua Kelas') return true;
            if (m.class_name === filterCls) return true;
            if (targetDigit && m.class_name && m.class_name.includes(targetDigit)) return true;
            return false;
        });
    }
    if (filterSub) filtered = filtered.filter(m => m.subject === filterSub);
    if (filterTch) filtered = filtered.filter(m => m.teacher_name === filterTch);
    if (query) filtered = filtered.filter(m => m.title.toLowerCase().includes(query) || (m.description || '').toLowerCase().includes(query));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="aca-inline-22">Belum ada materi pembelajaran. Klik "+ Buat Materi Baru" untuk memulai.</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map((m, idx) => {
        let typeBadge = '';
        const mType = m.material_type || 'document';
        if (mType === 'youtube') typeBadge = '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">🎥 YouTube</span>';
        else if (mType === 'pdf') typeBadge = '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">📄 PDF</span>';
        else if (mType === 'html') typeBadge = '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🌐 HTML5</span>';
        else if (mType === 'image') typeBadge = '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">🖼️ Gambar</span>';
        else typeBadge = '<span class="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-white/10 text-gray-300">📑 Dokumen</span>';

        const createdDate = m.created_at ? new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

        return `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <div class="font-bold text-white">${escapeHTML(m.title)}</div>
                    <div class="text-xs text-gray-400 truncate max-w-xs">${escapeHTML(m.description || '-')}</div>
                    <div class="text-[10px] text-gray-500 mt-1">Oleh: ${escapeHTML(m.teacher_name || 'Admin')}</div>
                </td>
                <td><span class="badge badge-primary">${escapeHTML(m.class_name)}</span></td>
                <td>${escapeHTML(m.subject)}</td>
                <td>${typeBadge}</td>
                <td><span class="text-xs text-gray-400">${createdDate}</span></td>
                <td>
                    <div class="flex items-center gap-1.5">
                        <button class="btn-preview-materi btn-sm btn-primary flex items-center gap-1" data-url="${escapeHTML(m.material_url)}" data-title="${escapeHTML(m.title)}" data-subtitle="${m.subject} • Kelas ${m.class_name}" data-type="${mType}" title="Buka Materi di Web">
                            <span class="material-symbols-outlined text-xs">visibility</span>
                            <span>Lihat</span>
                        </button>
                        <button class="btn-edit-material btn-sm btn-secondary" data-id="${m.id}" title="Edit Data">✏️</button>
                        <button class="btn-del-material btn-sm btn-danger" data-id="${m.id}" title="Hapus Data">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('.btn-preview-materi').forEach(btn => {
        btn.onclick = () => {
            const url = btn.getAttribute('data-url');
            const title = btn.getAttribute('data-title');
            const subtitle = btn.getAttribute('data-subtitle');
            const type = btn.getAttribute('data-type');
            openTeacherViewer(url, title, subtitle, type);
        };
    });

    tbody.querySelectorAll('.btn-edit-material').forEach(btn => {
        btn.onclick = () => {
            const id = btn.getAttribute('data-id');
            const item = allMaterials.find(m => m.id === id);
            if (item) openMaterialFormModal(item);
        };
    });

    tbody.querySelectorAll('.btn-del-material').forEach(btn => {
        btn.onclick = async () => {
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
            const id = btn.getAttribute('data-id');
            if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;

            try {
                const { error } = await db.from('materials').delete().eq('id', id);
                if (error) throw error;
                showToast('Materi berhasil dihapus.', 'success');
                await loadMaterials();
            } catch (err) {
                showToast('Gagal menghapus materi: ' + err.message, 'error');
            }
        };
    });
}

function openMaterialFormModal(item = null) {
    const modal = document.getElementById('modal-form-materi');
    if (!modal) return;

    const titleEl = document.getElementById('modal-form-materi-title');
    const form = document.getElementById('form-material');
    const saveBtnText = document.getElementById('btn-save-material-text');
    const fileInput = document.getElementById('material-file-upload');
    if (fileInput) fileInput.value = '';

    form.reset();

    if (item) {
        titleEl.textContent = 'Edit Materi Pembelajaran';
        document.getElementById('material-id').value = item.id;
        document.getElementById('material-title').value = item.title;
        document.getElementById('material-class').value = item.class_name;
        document.getElementById('material-subject').value = item.subject;
        document.getElementById('material-type-select').value = item.material_type || 'youtube';
        document.getElementById('material-url-input').value = item.material_url || '';
        document.getElementById('material-description').value = item.description || '';
        if (saveBtnText) saveBtnText.textContent = 'Simpan Perubahan';
    } else {
        titleEl.textContent = 'Tambah Materi Pembelajaran';
        document.getElementById('material-id').value = '';
        if (saveBtnText) saveBtnText.textContent = 'Simpan Materi';
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function initMateriEventListeners() {
    const btnCreate = document.getElementById('btn-create-materi');
    const modalForm = document.getElementById('modal-form-materi');
    const btnClose = document.getElementById('btn-close-material-modal');
    const form = document.getElementById('form-material');

    const filterCls = document.getElementById('filter-materi-class');
    const filterSub = document.getElementById('filter-materi-subject');
    const filterTchInput = document.getElementById('filter-materi-teacher');
    const searchInput = document.getElementById('search-materi-query');

    if (btnCreate) btnCreate.onclick = () => {
        if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');
        openMaterialFormModal();
    };

    if (btnClose) btnClose.onclick = () => {
        modalForm.style.display = 'none';
        modalForm.classList.add('hidden');
    };

    if (filterCls) filterCls.onchange = () => renderMaterialsTable(allMaterials);
    if (filterSub) filterSub.onchange = () => renderMaterialsTable(allMaterials);
    if (filterTchInput) filterTchInput.onchange = () => renderMaterialsTable(allMaterials);
    if (searchInput) searchInput.oninput = () => renderMaterialsTable(allMaterials);

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            if (authState.isGuest) return showToast('Akses ditolak untuk Guest', 'warning');

            const id = document.getElementById('material-id').value;
            const title = document.getElementById('material-title').value.trim();
            const className = document.getElementById('material-class').value;
            const subject = document.getElementById('material-subject').value;
            let materialType = document.getElementById('material-type-select').value;
            let materialUrl = document.getElementById('material-url-input').value.trim();
            const description = document.getElementById('material-description').value.trim();
            const fileUpload = document.getElementById('material-file-upload')?.files?.[0];
            const saveBtnText = document.getElementById('btn-save-material-text');

            const { data: { user } } = await db.auth.getUser();
            const teacherName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Guru Annida';

            if (saveBtnText) saveBtnText.textContent = 'Menyimpan...';

            try {
                // Handle file upload if provided (Google Drive GAS Auto-Router with Supabase fallback)
                if (fileUpload) {
                    const ext = fileUpload.name.split('.').pop().toLowerCase();
                    if (ext === 'html' || ext === 'htm') materialType = 'html';
                    else if (ext === 'pdf') materialType = 'pdf';
                    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) materialType = 'image';

                    try {
                        // 1. Coba upload langsung ke Google Drive Auto-Folder Router (/Materi/[Mapel]/[Kelas])
                        const gasRes = await uploadToGoogleDriveGAS(fileUpload, subject, className);
                        if (gasRes && gasRes.embedUrl) {
                            materialUrl = gasRes.embedUrl;
                            console.log('Berkas berhasil disimpan ke Google Drive:', gasRes.folderPath);
                        } else {
                            throw new Error('GAS response invalid');
                        }
                    } catch (gasErr) {
                        console.warn('GAS upload gagal / dialihkan ke Supabase Storage:', gasErr.message);
                        // 2. Fallback aman ke Supabase Storage
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

                        const { error: uploadErr } = await db.storage
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

                        materialUrl = publicUrlData?.publicUrl || storagePath;
                    }
                }

                // Otomatis deteksi YouTube jika memasukkan URL
                if (materialUrl.includes('youtube.com') || materialUrl.includes('youtu.be')) {
                    materialType = 'youtube';
                } else if (materialUrl.endsWith('.pdf')) {
                    materialType = 'pdf';
                }

                if (!materialUrl) {
                    throw new Error('Unggah berkas atau masukkan URL materi!');
                }

                const payload = {
                    teacher_id: user?.id,
                    teacher_name: teacherName,
                    class_name: className,
                    subject: subject,
                    title: title,
                    material_type: materialType,
                    material_url: materialUrl,
                    description: description || null,
                    updated_at: new Date().toISOString()
                };

                if (id) {
                    const { error } = await db.from('materials').update(payload).eq('id', id);
                    if (error) throw error;
                    showToast('Materi pembelajaran berhasil diperbarui!', 'success');
                } else {
                    const { error } = await db.from('materials').insert(payload);
                    if (error) throw error;
                    showToast('Materi pembelajaran berhasil diterbitkan!', 'success');
                }

                modalForm.style.display = 'none';
                modalForm.classList.add('hidden');
                await loadMaterials();
            } catch (err) {
                console.error('Gagal menyimpan materi:', err);
                showToast('Gagal: ' + err.message, 'error');
            } finally {
                if (saveBtnText) saveBtnText.textContent = id ? 'Simpan Perubahan' : 'Simpan Materi';
            }
        };
    }
}

// ── SMART VIEWER LOGIC ────────────────────────────────────────────────
function formatEmbedUrl(rawUrl) {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();

    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
        return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }

    if (trimmed.includes('drive.google.com/file/d/')) {
        return trimmed.replace(/\/view.*$/, '/preview');
    }

    return trimmed;
}

export async function openTeacherViewer(url, title, subtitle, type) {
    const modal = document.getElementById('modal-viewer-materi');
    const titleEl = document.getElementById('teacher-viewer-title');
    const subtitleEl = document.getElementById('teacher-viewer-subtitle');
    const iframe = document.getElementById('teacher-viewer-iframe');
    const openExternal = document.getElementById('teacher-viewer-open-external');
    const fallbackImg = document.getElementById('teacher-viewer-fallback-img');
    const imgEl = document.getElementById('teacher-viewer-img-el');
    const iconEl = document.getElementById('teacher-viewer-icon');

    if (!modal || !iframe) return;

    if (titleEl) titleEl.textContent = title || 'Materi Pembelajaran';
    if (subtitleEl) subtitleEl.textContent = subtitle || 'SMP Annida E-Learning';

    const isDrive = url.includes('drive.google.com');
    const isHtml = (type === 'html' || /\.(html|htm)(\?.*)?$/i.test(url)) && !isDrive;
    const isImage = (type === 'image' || /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(url)) && !isDrive;
    const formattedUrl = formatEmbedUrl(url);

    if (openExternal) {
        openExternal.onclick = async (e) => {
            e.preventDefault();
            if (isHtml) {
                try {
                    const res = await fetch(url);
                    const htmlText = await res.text();
                    const blob = new Blob([htmlText], { type: 'text/html; charset=utf-8' });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                } catch (err) {
                    window.open(url, '_blank');
                }
            } else {
                window.open(formattedUrl || url, '_blank');
            }
        };
    }

    iframe.removeAttribute('srcdoc');

    if (isImage) {
        iframe.style.display = 'none';
        iframe.src = 'about:blank';
        if (fallbackImg && imgEl) {
            fallbackImg.classList.remove('hidden');
            imgEl.src = url;
        }
        if (iconEl) iconEl.textContent = 'image';
    } else if (isHtml) {
        if (fallbackImg) fallbackImg.classList.add('hidden');
        iframe.style.display = 'block';
        iframe.src = '';
        iframe.removeAttribute('src');
        if (iconEl) iconEl.textContent = 'code';
        try {
            const res = await fetch(url);
            if (res.ok) {
                const htmlText = await res.text();
                iframe.srcdoc = htmlText;
            } else {
                iframe.srcdoc = '<div style="color:white;text-align:center;padding:40px;font-family:sans-serif;"><h3>Gagal memuat file HTML</h3></div>';
            }
        } catch (e) {
            iframe.srcdoc = '<div style="color:white;text-align:center;padding:40px;font-family:sans-serif;"><h3>Gagal memuat file HTML: ' + (e.message || '') + '</h3></div>';
        }
    } else {
        if (fallbackImg) fallbackImg.classList.add('hidden');
        iframe.style.display = 'block';
        iframe.src = formattedUrl;
        if (iconEl) {
            if (formattedUrl.includes('youtube.com')) iconEl.textContent = 'play_circle';
            else if (formattedUrl.includes('.pdf') || formattedUrl.includes('drive.google.com')) iconEl.textContent = 'description';
            else iconEl.textContent = 'menu_book';
        }
    }

    modal.style.display = 'flex';
    modal.classList.remove('hidden');
}

function initTeacherViewer() {
    const modal = document.getElementById('modal-viewer-materi');
    const closeBtn = document.getElementById('btn-close-teacher-viewer');
    const iframe = document.getElementById('teacher-viewer-iframe');

    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
            modal.classList.add('hidden');
            if (iframe) iframe.src = 'about:blank';
        };
    }
}

// Inisialisasi Lifecycle
if (typeof document !== 'undefined') {
    if (document.readyState !== 'loading') {
        initMateriModule();
    } else {
        document.addEventListener('DOMContentLoaded', initMateriModule);
    }
}


/**
 * Helper pengunggah berkas ke Google Drive via GAS Auto-Router
 * Struktur: /Materi/[Mata Pelajaran]/[Kelas]
 */
export async function uploadToGoogleDriveGAS(fileUpload, subject, className, customGasUrl) {
    const gasUrl = customGasUrl || window.SMPANNIDA_GAS_URL || localStorage.getItem('smpannida_gas_url') || 'https://script.google.com/macros/s/AKfycbxrv-j6LtdK-9mGc56uhqC1_unPDGG7rFu3ZmLL7Dqh4A5Yx8JWWKmrJAGPo5EmXFA/exec';
    if (!gasUrl) return null;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64Data = reader.result.split(',')[1];
                const payload = {
                    filename: fileUpload.name,
                    mimeType: fileUpload.type || 'application/octet-stream',
                    base64: base64Data,
                    subject: subject || 'Umum',
                    className: className || 'Semua'
                };

                const res = await fetch(gasUrl, {
                    method: 'POST',
                    mode: 'cors',
                    redirect: 'follow',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });

                const text = await res.text();
                let json;
                try {
                    json = JSON.parse(text);
                } catch (parseErr) {
                    throw new Error('Respon GAS bukan JSON valid: ' + text.slice(0, 100));
                }

                if (json && json.status === 'success') {
                    resolve(json);
                } else {
                    reject(new Error(json?.message || 'Gagal upload ke Google Drive'));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Gagal membaca berkas lokal'));
        reader.readAsDataURL(fileUpload);
    });
}
