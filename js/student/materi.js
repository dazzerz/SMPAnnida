// =========================================================================
// MATERI PEMBELAJARAN (E-LEARNING) SISWA CONTROLLER (SMP ANNIDA)
// Modul: Modul Materi Interaktif, Smart Video Player, PDF & HTML Viewer
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

let studentMaterialsData = [];

export async function initStudentMateriModule(student) {
    if (!student) return;
    await loadStudentMaterials(student);
    initStudentViewerControls();
}

export async function loadStudentMaterials(student) {
    const feed = document.getElementById('student-materials-lms-feed');
    if (!feed) return;

    try {
        const rawClass = student.classes?.nama_kelas || student.kelas || '7A';
        const digitMatch = rawClass.match(/\d+/);
        const gradeLevel = digitMatch ? `Kelas ${digitMatch[0]}` : rawClass;
        const digitOnly = digitMatch ? digitMatch[0] : rawClass;

        // Query matching: Rombel ("7A"), Tingkat ("Kelas 7"), Angka ("7"), atau "Semua"
        const orConditions = [
            `class_name.eq.${rawClass}`,
            `class_name.eq.${gradeLevel}`,
            `class_name.eq.${digitOnly}`,
            `class_name.eq.Semua`,
            `class_name.eq.Semua Kelas`
        ].join(',');

        const { data: materials, error } = await db
            .from('materials')
            .select('*')
            .or(orConditions)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Gagal memuat tabel materials:', error.message);
            feed.innerHTML = '<div class="text-center py-8 text-gray-400 col-span-full">Belum ada materi pembelajaran yang diterbitkan guru untuk kelas Anda.</div>';
            return;
        }

        studentMaterialsData = materials || [];
        renderStudentMaterials(studentMaterialsData);
        populateSubjectFilter(studentMaterialsData);
    } catch (err) {
        console.error('Error loadStudentMaterials:', err);
        if (feed) {
            feed.innerHTML = `<div class="text-center py-8 text-rose-400 col-span-full">Gagal: ${escapeHTML(err.message)}</div>`;
        }
    }
}

function renderStudentMaterials(list) {
    const feed = document.getElementById('student-materials-lms-feed');
    if (!feed) return;

    const filterSubject = document.getElementById('filter-student-material-subject')?.value || '';
    let filtered = list;
    if (filterSubject) {
        filtered = filtered.filter(m => m.subject === filterSubject);
    }

    if (filtered.length === 0) {
        feed.innerHTML = `
            <div class="p-8 rounded-2xl bg-white/5 border border-white/10 text-center col-span-full">
                <span class="material-symbols-outlined text-4xl text-gray-500 mb-2">menu_book</span>
                <div class="text-sm font-semibold text-gray-300">Belum ada materi pembelajaran</div>
                <p class="text-xs text-gray-500 mt-1">Materi digital (Video YouTube, PDF, dan Simulasi) dari guru akan tampil di sini.</p>
            </div>
        `;
        return;
    }

    feed.innerHTML = filtered.map(m => {
        let iconName = 'menu_book';
        let typeBadge = '<span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-white/10 text-gray-300">Materi</span>';
        const mType = m.material_type || 'document';

        if (mType === 'youtube') {
            iconName = 'play_circle';
            typeBadge = '<span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">play_circle</span> YouTube</span>';
        } else if (mType === 'pdf') {
            iconName = 'picture_as_pdf';
            typeBadge = '<span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">picture_as_pdf</span> PDF</span>';
        } else if (mType === 'html') {
            iconName = 'code';
            typeBadge = '<span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">code</span> HTML5 Simulasi</span>';
        } else if (mType === 'image') {
            iconName = 'image';
            typeBadge = '<span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">image</span> Infografis</span>';
        }

        return `
            <div class="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between gap-2 mb-3">
                        <span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-white/10 text-gray-300">${escapeHTML(m.subject)}</span>
                        ${typeBadge}
                    </div>
                    <h4 class="text-base font-bold text-white mb-1.5 leading-snug">${escapeHTML(m.title)}</h4>
                    <p class="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">${escapeHTML(m.description || 'Pelajari materi ini secara mandiri.')}</p>
                </div>

                <div class="border-t border-white/10 pt-3 space-y-2">
                    <div class="flex items-center justify-between text-[0.75rem] text-gray-400">
                        <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-400">person</span> ${escapeHTML(m.teacher_name)}</span>
                        <span class="text-xs text-gray-500">${m.class_name}</span>
                    </div>

                    <button class="btn-play-student-materi w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20" data-url="${escapeHTML(m.material_url)}" data-title="${escapeHTML(m.title)}" data-subtitle="${escapeHTML(m.subject)} • ${escapeHTML(m.teacher_name)}" data-type="${mType}">
                        <span class="material-symbols-outlined text-sm">visibility</span>
                        <span>Buka & Pelajari Materi</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    feed.querySelectorAll('.btn-play-student-materi').forEach(btn => {
        btn.onclick = () => {
            const url = btn.getAttribute('data-url');
            const title = btn.getAttribute('data-title');
            const subtitle = btn.getAttribute('data-subtitle');
            const type = btn.getAttribute('data-type');
            openStudentMaterialViewer(url, title, subtitle, type);
        };
    });
}

function populateSubjectFilter(list) {
    const sel = document.getElementById('filter-student-material-subject');
    if (!sel) return;

    const subjects = [...new Set(list.map(m => m.subject).filter(Boolean))];
    sel.innerHTML = '<option value="">Semua Mata Pelajaran</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');

    sel.onchange = () => renderStudentMaterials(studentMaterialsData);
}

function formatStudentEmbedUrl(rawUrl) {
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

export async function openStudentMaterialViewer(url, title, subtitle, type) {
    const modal = document.getElementById('modal-viewer-materi-student');
    const titleEl = document.getElementById('stu-viewer-title');
    const subtitleEl = document.getElementById('stu-viewer-subtitle');
    const iframe = document.getElementById('stu-viewer-iframe');
    const openExternal = document.getElementById('stu-viewer-open-external');
    const fallbackImg = document.getElementById('stu-viewer-fallback-img');
    const imgEl = document.getElementById('stu-viewer-img-el');
    const iconEl = document.getElementById('stu-viewer-icon');

    if (!modal || !iframe) return;

    if (titleEl) titleEl.textContent = title || 'Materi Pembelajaran';
    if (subtitleEl) subtitleEl.textContent = subtitle || 'SMP Annida E-Learning';

    const isDrive = url.includes('drive.google.com');
    const isHtml = (type === 'html' || /\.(html|htm)(\?.*)?$/i.test(url)) && !isDrive;
    const isImage = (type === 'image' || /\.(jpeg|jpg|png|gif|webp)(\?.*)?$/i.test(url)) && !isDrive;
    const formattedUrl = formatStudentEmbedUrl(url);

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

    modal.classList.remove('hidden');
}

function initStudentViewerControls() {
    const modal = document.getElementById('modal-viewer-materi-student');
    const closeBtn = document.getElementById('btn-close-stu-viewer');
    const iframe = document.getElementById('stu-viewer-iframe');

    if (closeBtn && modal) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
            if (iframe) iframe.src = 'about:blank';
        };
    }
}
