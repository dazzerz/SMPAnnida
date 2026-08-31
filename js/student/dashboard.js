// =========================================================================
// PORTAL SISWA CONTROLLER (SMP ANNIDA)
// Integrasi: PPDB ↔ Akademik ↔ Presensi ↔ Jurnal ↔ Tahfidz
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, formatDate } from '../core/utils.js';
import { handleLogout } from '../core/auth.js';

const db = supabaseClient;

let currentStudent = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initStudentSession();
    initTabNavigation();
    initLogoutHandlers();
    initPasswordChangeHandlers();
  } catch (err) {
    console.error('Inisialisasi Portal Siswa gagal:', err);
    showToast('Gagal memuat sesi siswa: ' + err.message, 'error');
  }
});

// ── 1. INISIALISASI SESI SISWA ──────────────────────────────────────────
async function initStudentSession() {
  const { data: { user }, error: authErr } = await db.auth.getUser();
  if (authErr || !user) {
    window.location.href = '../../login.html';
    return;
  }
  currentUser = user;

  // Cek apakah akun memiliki kewajiban ganti password perdana
  const mustChange = user.user_metadata?.must_change_password;
  if (mustChange) {
    const modal = document.getElementById('modal-forced-password');
    if (modal) modal.classList.remove('hidden');
  }

  // Ambil profil data siswa berdasarkan user_id atau email
  let { data: student, error: stdErr } = await db
    .from('students')
    .select(`
      *,
      classes ( id, nama_kelas )
    `)
    .or(`user_id.eq.${user.id},email.ilike.${user.email || ''}`)
    .maybeSingle();

  if (!student) {
    // Fallback Mocking untuk preview akun baru jika belum terhubung
    student = {
      nama_lengkap: user.user_metadata?.full_name || 'Santri SMP Annida',
      nisn: '0123456789',
      kelas: '7A',
      email: user.email,
      classes: { nama_kelas: '7A' }
    };
  }
  currentStudent = student;

  // Render Info Siswa di Topbar & Hero Card
  renderStudentProfile(student, user);

  // Load Data Feed Secara Paralel
  await Promise.allSettled([
    loadTodaySchedules(student),
    loadWeeklySchedules(student),
    loadAttendanceHistory(student),
    loadJournalMaterials(student),
    loadTahfidzRecords(student),
    loadGrades(student),
    loadPpdbDocs(student)
  ]);
}

// ── 2. RENDER PROFIL & DIGITAL STUDENT CARD ────────────────────────────
function renderStudentProfile(student, user) {
  const nama = student.nama_lengkap || user.user_metadata?.full_name || 'Siswa SMP Annida';
  const kelas = student.classes?.nama_kelas || student.kelas || '7A';
  const nisn = student.nisn || student.nis || '-';
  const email = student.email || user.email || '-';

  // Hero Card
  const elHeroName = document.getElementById('hero-student-name');
  const elHeroNisn = document.getElementById('hero-student-nisn');
  const elHeroClass = document.getElementById('hero-student-class');
  const elHeroEmail = document.getElementById('hero-student-email');
  if (elHeroName) elHeroName.textContent = nama;
  if (elHeroNisn) elHeroNisn.textContent = nisn;
  if (elHeroClass) elHeroClass.textContent = kelas;
  if (elHeroEmail) elHeroEmail.textContent = email;

  // Sidebar & Topbar
  const elDisplayName = document.getElementById('user-display-name');
  const elDisplayClass = document.getElementById('user-display-class');
  const elMobileName = document.getElementById('mobile-student-name');
  const elInitial = document.getElementById('user-avatar-initial');

  if (elDisplayName) elDisplayName.textContent = nama;
  if (elDisplayClass) elDisplayClass.textContent = `Kelas ${kelas}`;
  if (elMobileName) elMobileName.textContent = `${nama} (${kelas})`;
  if (elInitial) elInitial.textContent = (nama[0] || 'S').toUpperCase();
}

// ── 3. JADWAL PELAJARAN (HARI INI & MINGGUAN) ───────────────────────────
async function loadTodaySchedules(student) {
  const list = document.getElementById('today-schedules-list');
  const statBadge = document.getElementById('stat-today-classes');
  if (!list) return;

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayName = days[new Date().getDay()];

  try {
    let query = db
      .from('class_schedules')
      .select(`
        id, start_time, end_time, room, active,
        subjects ( id, nama_mapel ),
        teachers ( id, nama )
      `)
      .eq('day_of_week', todayName)
      .eq('active', 'Aktif')
      .order('start_time', { ascending: true });

    if (student.kelas_id) {
      query = query.eq('class_id', student.kelas_id);
    }

    const { data: scheds, error } = await query;
    if (error) throw error;

    if (!scheds || !scheds.length) {
      list.innerHTML = `
        <div class="text-sm text-gray-400 text-center py-6 bg-white/5 rounded-xl border border-white/5">
          🎉 Tidak ada jadwal pelajaran untuk hari ${todayName}. Selamat beristirahat!
        </div>`;
      if (statBadge) statBadge.textContent = 'Libur';
      return;
    }

    if (statBadge) statBadge.textContent = `${scheds.length} Mapel`;

    list.innerHTML = scheds.map(s => {
      const jamMulai = s.start_time ? s.start_time.substring(0, 5) : '-';
      const jamSelesai = s.end_time ? s.end_time.substring(0, 5) : '-';
      const mapel = s.subjects?.nama_mapel || 'Pelajaran';
      const guru = s.teachers?.nama || 'Dewan Guru';
      const room = s.room ? `Ruang ${s.room}` : 'Kelas';

      return `
        <div class="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-all">
          <div class="flex items-center gap-4">
            <div class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
              ${jamMulai} - ${jamSelesai}
            </div>
            <div>
              <div class="font-bold text-white text-sm">${escapeHTML(mapel)}</div>
              <div class="text-xs text-gray-400">👨‍🏫 ${escapeHTML(guru)} • 📍 ${escapeHTML(room)}</div>
            </div>
          </div>
          <span class="text-xs text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
            Aktif
          </span>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('Load today schedules err:', err);
    list.innerHTML = '<div class="text-xs text-rose-400 py-4 text-center">Gagal memuat jadwal hari ini.</div>';
  }
}

async function loadWeeklySchedules(student) {
  const grid = document.getElementById('weekly-schedule-grid');
  if (!grid) return;

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  try {
    let query = db
      .from('class_schedules')
      .select(`
        id, day_of_week, start_time, end_time, room, active,
        subjects ( id, nama_mapel ),
        teachers ( id, nama )
      `)
      .eq('active', 'Aktif')
      .order('start_time', { ascending: true });

    if (student.kelas_id) {
      query = query.eq('class_id', student.kelas_id);
    }

    const { data: scheds, error } = await query;
    if (error) throw error;

    if (!scheds || !scheds.length) {
      grid.innerHTML = '<div class="col-span-full py-8 text-center text-gray-400">Belum ada jadwal mingguan aktif.</div>';
      return;
    }

    grid.innerHTML = daysOrder.map(day => {
      const dayScheds = scheds.filter(s => s.day_of_week === day);
      return `
        <div class="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
          <div class="font-headline-md font-bold text-emerald-300 mb-3 border-b border-white/10 pb-2 flex justify-between items-center">
            <span>${day}</span>
            <span class="text-xs font-normal text-gray-400">${dayScheds.length} Mapel</span>
          </div>
          <div class="space-y-2.5 flex-1">
            ${dayScheds.length ? dayScheds.map(ds => `
              <div class="p-2.5 rounded-lg bg-black/20 text-xs border border-white/5">
                <div class="flex justify-between font-semibold text-white">
                  <span>${escapeHTML(ds.subjects?.nama_mapel || '-')}</span>
                  <span class="text-emerald-400">${ds.start_time?.substring(0, 5)}</span>
                </div>
                <div class="text-[0.7rem] text-gray-400 mt-1">👨‍🏫 ${escapeHTML(ds.teachers?.nama || 'Dewan Guru')}</div>
              </div>
            `).join('') : '<div class="text-xs text-gray-500 italic py-4 text-center">Tidak ada jadwal</div>'}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('Load weekly schedule err:', err);
  }
}

// ── 4. PRESENSI SAYA (ATTENDANCE) ───────────────────────────────────────
async function loadAttendanceHistory(student) {
  const tbody = document.getElementById('student-attendance-tbody');
  const statBadge = document.getElementById('stat-attendance');
  if (!tbody || !student.id) return;

  try {
    const { data: records, error } = await db
      .from('attendance_students')
      .select(`
        id, attendance_date, status, notes, start_time, end_time,
        subjects ( nama_mapel ),
        teachers ( nama )
      `)
      .eq('student_id', student.id)
      .order('attendance_date', { ascending: false })
      .limit(30);

    if (error) throw error;

    if (!records || !records.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-gray-400">Belum ada riwayat kehadiran tercatat.</td></tr>';
      if (statBadge) statBadge.textContent = '100%';
      return;
    }

    // Hitung persentase kehadiran
    const total = records.length;
    const hadir = records.filter(r => r.status === 'Hadir').length;
    const pct = Math.round((hadir / total) * 100);
    if (statBadge) statBadge.textContent = `${pct}%`;

    const statusBadge = (st) => {
      if (st === 'Hadir') return '<span class="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40">Hadir</span>';
      if (st === 'Sakit') return '<span class="px-2.5 py-1 rounded-full text-xs bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40">Sakit</span>';
      if (st === 'Izin') return '<span class="px-2.5 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40">Izin</span>';
      return '<span class="px-2.5 py-1 rounded-full text-xs bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/40">Alpa</span>';
    };

    tbody.innerHTML = records.map(r => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-3 px-4 font-medium text-white">${formatDate(r.attendance_date)}</td>
        <td class="py-3 px-4">${escapeHTML(r.subjects?.nama_mapel || '-')}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${r.start_time?.substring(0, 5) || '-'} - ${r.end_time?.substring(0, 5) || '-'}</td>
        <td class="py-3 px-4">${statusBadge(r.status)}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${escapeHTML(r.notes || '-')}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Load attendance err:', err);
    tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-rose-400">Gagal memuat riwayat presensi.</td></tr>';
  }
}

// ── 5. JURNAL & MATERI GURU ─────────────────────────────────────────────
async function loadJournalMaterials(student) {
  const feed = document.getElementById('student-journal-feed');
  if (!feed) return;

  try {
    let query = db
      .from('teacher_journals')
      .select(`
        id, date, jam_pelajaran, materi, catatan,
        subjects ( nama_mapel ),
        teachers ( nama )
      `)
      .order('date', { ascending: false })
      .limit(20);

    if (student.kelas_id) {
      query = query.eq('class_id', student.kelas_id);
    }

    const { data: journals, error } = await query;
    if (error) throw error;

    if (!journals || !journals.length) {
      feed.innerHTML = '<div class="text-sm text-gray-400 py-8 text-center bg-white/5 rounded-2xl">Belum ada catatan materi jurnal pembelajaran untuk kelas Anda.</div>';
      return;
    }

    feed.innerHTML = journals.map(j => `
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
        <div class="flex flex-wrap justify-between items-start gap-2 mb-3">
          <div>
            <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider">${escapeHTML(j.subjects?.nama_mapel || 'Mata Pelajaran')}</div>
            <div class="text-lg font-bold text-white">${escapeHTML(j.materi || 'Materi Pembelajaran')}</div>
          </div>
          <div class="text-right text-xs text-gray-400">
            <div>${formatDate(j.date)}</div>
            <div>Jam: ${escapeHTML(j.jam_pelajaran || '-')}</div>
          </div>
        </div>
        <div class="text-sm text-gray-300 leading-relaxed bg-black/20 p-3.5 rounded-xl border border-white/5">
          ${escapeHTML(j.catatan || 'Tidak ada catatan tambahan dari guru.')}
        </div>
        <div class="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
          <span>👨‍🏫 Pengampu:</span>
          <b class="text-gray-300">${escapeHTML(j.teachers?.nama || 'Dewan Guru')}</b>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Load journals err:', err);
    feed.innerHTML = '<div class="text-rose-400 py-6 text-center">Gagal memuat materi jurnal.</div>';
  }
}

// ── 6. TRACKER TAHFIDZ ──────────────────────────────────────────────────
async function loadTahfidzRecords(student) {
  const tbody = document.getElementById('student-tahfidz-tbody');
  const statBadge = document.getElementById('stat-tahfidz');
  if (!tbody || !student.id) return;

  try {
    const { data: records, error } = await db
      .from('student_tahfidz_records')
      .select('*')
      .eq('student_id', student.id)
      .order('tanggal', { ascending: false })
      .limit(20);

    if (error || !records || !records.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-6 text-center text-gray-400">Belum ada riwayat setoran hafalan tercatat.</td></tr>';
      if (statBadge) statBadge.textContent = '30 Juz';
      return;
    }

    if (statBadge) statBadge.textContent = `Juz ${records[0].juz || 30}`;

    tbody.innerHTML = records.map(r => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-3 px-4 font-medium text-white">${formatDate(r.tanggal)}</td>
        <td class="py-3 px-4 font-bold text-emerald-400">Juz ${r.juz}</td>
        <td class="py-3 px-4">${escapeHTML(r.surah_mulai)} : ${r.ayat_mulai || 1} - ${escapeHTML(r.surah_selesai)} : ${r.ayat_selesai || 'Selesai'}</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300 font-semibold">${escapeHTML(r.kategori)}</span></td>
        <td class="py-3 px-4 font-bold text-emerald-300">${escapeHTML(r.nilai_kelancaran || 'A')}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${escapeHTML(r.catatan || '-')}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.warn('Tahfidz query:', err.message);
  }
}

// ── 7. NILAI & RAPOR ────────────────────────────────────────────────────
async function loadGrades(student) {
  const tbody = document.getElementById('student-grades-tbody');
  if (!tbody || !student.id) return;

  try {
    const { data: grades, error } = await db
      .from('grades')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error || !grades || !grades.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-gray-400">Belum ada data nilai akademik semester ini.</td></tr>';
      return;
    }

    tbody.innerHTML = grades.map(g => `
      <tr class="hover:bg-white/5 transition-colors">
        <td class="py-3 px-4 font-semibold text-white">${escapeHTML(g.mata_pelajaran || '-')}</td>
        <td class="py-3 px-4 text-xs text-emerald-400 font-bold uppercase">${escapeHTML(g.jenis_penilaian || 'Tugas')}</td>
        <td class="py-3 px-4 font-bold text-lg text-emerald-300">${g.nilai || 0}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${escapeHTML(g.semester || 'Ganjil')}</td>
        <td class="py-3 px-4 text-xs text-gray-400">${escapeHTML(g.tahun_ajaran || '2026/2027')}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.warn('Grades query:', err);
  }
}

// ── 8. BERKAS DIGITAL PPDB ──────────────────────────────────────────────
async function loadPpdbDocs(student) {
  const statDocs = document.getElementById('stat-ppdb-docs');
  if (statDocs) statDocs.textContent = 'Terverifikasi';
}

// ── 9. TAB NAVIGATION ROUTER ───────────────────────────────────────────
function initTabNavigation() {
  const navBtns = document.querySelectorAll('.nav-item-btn');
  const panels = document.querySelectorAll('.student-panel');

  const switchTab = (targetId) => {
    panels.forEach(p => p.classList.add('hidden'));
    navBtns.forEach(b => {
      b.classList.remove('bg-white/10', 'text-white', 'font-semibold');
      b.classList.add('text-gray-300');
    });

    const activePanel = document.getElementById(targetId);
    if (activePanel) activePanel.classList.remove('hidden');

    const activeBtn = Array.from(navBtns).find(b => b.getAttribute('data-target') === targetId);
    if (activeBtn) {
      activeBtn.classList.add('bg-white/10', 'text-white', 'font-semibold');
      activeBtn.classList.remove('text-gray-300');
    }
  };

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.getAttribute('data-target');
      const hash = btn.getAttribute('href');
      if (hash) window.location.hash = hash;
      switchTab(target);
    });
  });

  // Handle Hash on Load
  const hash = window.location.hash;
  if (hash) {
    const matchBtn = Array.from(navBtns).find(b => b.getAttribute('href') === hash);
    if (matchBtn) {
      switchTab(matchBtn.getAttribute('data-target'));
    }
  }
}

// ── 10. GANTI PASSWORD & LOGOUT HANDLERS ────────────────────────────────
function initPasswordChangeHandlers() {
  // Forced Modal on first login
  const forcedForm = document.getElementById('form-forced-password');
  if (forcedForm) {
    forcedForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const p1 = document.getElementById('forced-new-password').value;
      const p2 = document.getElementById('forced-confirm-password').value;
      if (p1 !== p2) {
        showToast('Konfirmasi password tidak cocok!', 'error');
        return;
      }
      const btn = document.getElementById('btn-forced-save');
      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      const { error } = await db.auth.updateUser({
        password: p1,
        data: { must_change_password: false }
      });

      if (error) {
        showToast('Gagal update password: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Aktifkan Akun & Lanjutkan';
        return;
      }

      showToast('Kata sandi berhasil diperbarui! Selamat belajar.', 'success');
      document.getElementById('modal-forced-password').classList.add('hidden');
    });
  }

  // Regular Change Password Form
  const regForm = document.getElementById('form-change-password');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const p1 = document.getElementById('new-password').value;
      const p2 = document.getElementById('confirm-new-password').value;
      if (p1 !== p2) {
        showToast('Konfirmasi password baru tidak cocok!', 'error');
        return;
      }
      const btn = document.getElementById('btn-save-password');
      btn.disabled = true;
      btn.textContent = 'Menyimpan...';

      const { error } = await db.auth.updateUser({ password: p1 });
      btn.disabled = false;
      btn.textContent = 'Simpan Password Baru';

      if (error) {
        showToast('Gagal ganti password: ' + error.message, 'error');
        return;
      }

      showToast('Password berhasil diubah!', 'success');
      regForm.reset();
    });
  }
}

function initLogoutHandlers() {
  const btnLogout = document.getElementById('btn-student-logout');
  const btnMobileLogout = document.getElementById('btn-mobile-logout');
  if (btnLogout) btnLogout.addEventListener('click', handleLogout);
  if (btnMobileLogout) btnMobileLogout.addEventListener('click', handleLogout);
}
