import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML } from '../core/utils.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('jurnal-date');
    const classInput = document.getElementById('jurnal-class');
    const subjectInput = document.getElementById('jurnal-subject');
    const timeInput = document.getElementById('jurnal-time');
    const materialInput = document.getElementById('jurnal-material');
    const notesInput = document.getElementById('jurnal-notes');
    const btnSave = document.getElementById('btn-jurnal-save');

    if (!dateInput || !classInput || !btnSave) return;

    let currentTeacherId = null;

    async function initAuth() {
        const { data: { session } } = await db.auth.getSession();
        if (session && session.user) {
            currentTeacherId = session.user.id;
        } else if (window.isGuest) {
            currentTeacherId = '00000000-0000-0000-0000-000000000000'; 
        }
    }

    async function loadJournal() {
        const date = dateInput.value;
        const kelas = classInput.value;

        if (!date || !kelas || !currentTeacherId) {
            btnSave.disabled = true;
            return;
        }

        try {
            const { data, error } = await db
                .from('teacher_journals')
                .select('*')
                .eq('teacher_id', currentTeacherId)
                .eq('journal_date', date)
                .eq('class_id', kelas)
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const journal = data[0];
                subjectInput.value = journal.subject_id || '';
                
                const st = journal.start_time || '';
                const et = journal.end_time || '';
                let tStr = st;
                if (st && et) tStr = `${st} - ${et}`;
                else if (!st && et) tStr = et;
                
                timeInput.value = tStr;
                materialInput.value = journal.material || '';
                notesInput.value = journal.notes || '';
            } else {
                subjectInput.value = '';
                timeInput.value = '';
                materialInput.value = '';
                notesInput.value = '';
            }

            if (!window.isGuest) {
                btnSave.disabled = false;
            } else {
                btnSave.disabled = true;
                btnSave.title = "Guest (View Only)";
            }
        } catch (err) {
            console.error("Error loading journal:", err);
            showToast('Gagal memuat jurnal', 'error');
        }
    }

    initAuth().then(() => {
        dateInput.addEventListener('change', loadJournal);
        classInput.addEventListener('change', loadJournal);
    });

    btnSave.addEventListener('click', async () => {
        const date = dateInput.value;
        const kelas = classInput.value;
        const subject = subjectInput.value.trim();
        const material = materialInput.value.trim();

        if (!date) return showToast('Tanggal wajib diisi', 'warning');
        if (!kelas) return showToast('Kelas wajib dipilih', 'warning');
        if (!subject) return showToast('Mapel wajib diisi', 'warning');
        if (!material) return showToast('Materi wajib diisi', 'warning');

        let start_time = null;
        let end_time = null;
        const timeVal = timeInput.value.trim();
        if (timeVal) {
            const parts = timeVal.split(/s\/d|-/i);
            start_time = parts[0] ? parts[0].trim() : null;
            end_time = parts[1] ? parts[1].trim() : null;
        }

        const payload = {
            teacher_id: currentTeacherId,
            class_id: kelas,
            subject_id: subject,
            journal_date: date,
            start_time: start_time,
            end_time: end_time,
            material: material,
            notes: notesInput.value.trim()
        };

        btnSave.disabled = true;
        const originalText = btnSave.textContent;
        btnSave.textContent = 'Menyimpan...';

        try {
            const { error } = await db
                .from('teacher_journals')
                .upsert(payload, { onConflict: 'teacher_id, journal_date, class_id, subject_id' });

            if (error) throw error;
            showToast('Berhasil menyimpan jurnal', 'success');
        } catch (err) {
            console.error("Error saving journal:", err);
            showToast('Gagal menyimpan jurnal', 'error');
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = originalText;
        }
    });
});
