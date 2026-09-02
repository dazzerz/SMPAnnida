// =========================================================================
// PORTAL SISWA CONTROLLER (SMP ANNIDA)
// Integrasi: PPDB ↔ Akademik ↔ Presensi ↔ Jurnal ↔ Tahfidz
// =========================================================================

import supabaseClient from '../core/supabase.js';
import { showToast, escapeHTML, formatDate } from '../core/utils.js';
import { handleLogout, resolveUserRole } from '../core/auth.js';

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

// ── 1. INISIALISASI SESI SISWA & STRICT ROUTE GUARD ───────────────────────
async function initStudentSession() {
  const { data: { user }, error: authErr } = await db.auth.getUser();
  if (authErr || !user) {
    if (window.smoothRedirect) window.smoothRedirect('../../login.html');
    else window.location.href = '../../login.html';
    return;
  }
  currentUser = user;

  // Strict Role Guard Check
  const role = await resolveUserRole(user);
  if (role && role !== 'siswa' && role !== 'admin') {
    if (role === 'teacher') {
      window.location.href = '../academic/dashboard.html';
      return;
    } else if (role === 'finance') {
      window.location.href = '../finance/dashboard.html';
      return;
    } else if (role === 'calon_siswa' || role === 'wali_murid') {
      window.location.href = '../ppdb/dashboard-wali.html';
      return;
    }
  }

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
    loadAssignments(student),
    loadCbtQuizzes(student),
    loadStudentInteractiveMaterials(student),
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
  // Prevent Escape key modal dismiss
  window.addEventListener('keydown', (e) => {
    const forcedModal = document.getElementById('modal-forced-password');
    if (forcedModal && !forcedModal.classList.contains('hidden') && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
    }
  });

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


// ── 8. PUSAT TUGAS & E-LEARNING (LMS) ──────────────────────────────────
let allStudentAssignments = [];
let currentFilterType = 'all';

async function loadAssignments(student) {
  const feed = document.getElementById('student-assignments-feed');
  if (!feed) return;

  try {
    const studentClass = student.classes?.nama_kelas || student.kelas || '7A';

    // 1. Ambil daftar tugas untuk kelas siswa
    const { data: assignments, error: assErr } = await db
      .from('assignments')
      .select('*')
      .or(`class_name.eq.${studentClass},class_name.eq.Semua`)
      .order('created_at', { ascending: false });

    if (assErr) throw assErr;

    // 2. Ambil submissions siswa
    const { data: submissions, error: subErr } = await db
      .from('assignment_submissions')
      .select('*')
      .or(`student_id.eq.${student.id},student_user_id.eq.${currentUser.id}`);

    if (subErr) throw subErr;

    const subMap = {};
    if (submissions) {
      submissions.forEach(s => {
        subMap[s.assignment_id] = s;
      });
    }

    // 3. Gabungkan data
    allStudentAssignments = (assignments || []).map(a => {
      const sub = subMap[a.id] || null;
      let status = 'pending';
      if (sub) {
        status = sub.status === 'graded' ? 'graded' : 'submitted';
      }
      return {
        ...a,
        submission: sub,
        calculatedStatus: status
      };
    });

    renderAssignmentStats(allStudentAssignments);
    renderAssignmentList(allStudentAssignments, currentFilterType);
    initAssignmentFilters();
    initSubmissionModal();
  } catch (err) {
    console.error('Gagal memuat tugas LMS siswa:', err);
    if (feed) {
      feed.innerHTML = `<div class="text-center py-8 text-rose-400 col-span-full">Gagal memuat data tugas: ${escapeHTML(err.message)}</div>`;
    }
  }
}

function renderAssignmentStats(list) {
  const statTotal = document.getElementById('stat-total-tugas');
  const statPending = document.getElementById('stat-pending-tugas');
  const statSubmitted = document.getElementById('stat-submitted-tugas');
  const statAvg = document.getElementById('stat-avg-tugas');

  const total = list.length;
  const pending = list.filter(a => a.calculatedStatus === 'pending').length;
  const submitted = list.filter(a => a.calculatedStatus === 'submitted').length;
  const gradedList = list.filter(a => a.calculatedStatus === 'graded' && a.submission?.score != null);

  let avg = '-';
  if (gradedList.length > 0) {
    const sum = gradedList.reduce((acc, curr) => acc + Number(curr.submission.score), 0);
    avg = (sum / gradedList.length).toFixed(1);
  }

  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statSubmitted) statSubmitted.textContent = submitted;
  if (statAvg) statAvg.textContent = avg;
}

function renderAssignmentList(list, filter) {
  const feed = document.getElementById('student-assignments-feed');
  if (!feed) return;

  let filtered = list;
  if (filter === 'pending') filtered = list.filter(a => a.calculatedStatus === 'pending');
  else if (filter === 'submitted') filtered = list.filter(a => a.calculatedStatus === 'submitted');
  else if (filter === 'graded') filtered = list.filter(a => a.calculatedStatus === 'graded');

  if (filtered.length === 0) {
    feed.innerHTML = `
      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 text-center col-span-full">
        <span class="material-symbols-outlined text-4xl text-gray-500 mb-2">task</span>
        <div class="text-sm font-semibold text-gray-300">Tidak ada tugas pada filter ini</div>
        <p class="text-xs text-gray-500 mt-1">Semua tugas kelas Anda sudah terselesaikan dengan baik.</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = filtered.map(a => {
    const isGraded = a.calculatedStatus === 'graded';
    const isSubmitted = a.calculatedStatus === 'submitted';
    const isPending = a.calculatedStatus === 'pending';

    let badgeStatus = '';
    if (isGraded) {
      badgeStatus = `<span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">verified</span> Nilai: ${a.submission.score}</span>`;
    } else if (isSubmitted) {
      badgeStatus = `<span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">schedule</span> Menunggu Nilai</span>`;
    } else {
      badgeStatus = `<span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1"><span class="material-symbols-outlined text-xs">pending</span> Belum Dikumpul</span>`;
    }

    let deadlineText = 'Tanpa Deadline';
    if (a.deadline) {
      const d = new Date(a.deadline);
      const now = new Date();
      const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) deadlineText = `<span class="text-rose-400 font-semibold">Lewat ${Math.abs(diffDays)} Hari</span>`;
      else if (diffDays === 0) deadlineText = `<span class="text-amber-400 font-semibold">Hari ini!</span>`;
      else deadlineText = `Tersisa ${diffDays} Hari (${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`;
    }

    return `
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-white/10 text-gray-300">${escapeHTML(a.subject || 'Mapel')}</span>
            ${badgeStatus}
          </div>
          <h4 class="text-base font-bold text-white mb-1.5">${escapeHTML(a.title)}</h4>
          <p class="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">${escapeHTML(a.description || 'Tidak ada instruksi khusus.')}</p>
        </div>

        <div class="border-t border-white/10 pt-3 space-y-3">
          <div class="flex items-center justify-between text-[0.75rem] text-gray-400">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-400">person</span> ${escapeHTML(a.teacher_name || 'Guru')}</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-amber-400">timer</span> ${deadlineText}</span>
          </div>

          ${a.attachment_url ? `
            <a href="${a.attachment_url}" target="_blank" class="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all">
              <span class="material-symbols-outlined text-sm">attachment</span>
              <span>Unduh Lampiran Soal</span>
            </a>
          ` : ''}

          ${isPending ? `
            <button class="btn-open-submit-tugas w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer" data-id="${a.id}" data-title="${escapeHTML(a.title)}" data-subject="${escapeHTML(a.subject)}" data-desc="${escapeHTML(a.description || '')}">
              <span class="material-symbols-outlined text-sm">upload_file</span>
              <span>Kumpulkan Tugas</span>
            </button>
          ` : `
            <div class="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs space-y-1">
              <div class="flex items-center justify-between text-gray-400 text-[0.7rem]">
                <span>Terkumpul: ${new Date(a.submission.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                <a href="${a.submission.file_url}" target="_blank" class="text-emerald-400 hover:underline flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-xs">download</span> File Anda
                </a>
              </div>
              ${a.submission.feedback ? `
                <div class="pt-1 text-[0.75rem] text-emerald-300 border-t border-white/5 mt-1">
                  <span class="font-bold text-white">Catatan Guru:</span> "${escapeHTML(a.submission.feedback)}"
                </div>
              ` : ''}
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Bind click open submit modal
  document.querySelectorAll('.btn-open-submit-tugas').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const title = btn.getAttribute('data-title');
      const subject = btn.getAttribute('data-subject');
      const desc = btn.getAttribute('data-desc');
      openSubmissionModal(id, title, subject, desc);
    });
  });
}

function initAssignmentFilters() {
  document.querySelectorAll('.tugas-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tugas-filter-btn').forEach(b => {
        b.className = 'tugas-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:bg-white/10';
      });
      btn.className = 'tugas-filter-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white';
      currentFilterType = btn.getAttribute('data-filter') || 'all';
      renderAssignmentList(allStudentAssignments, currentFilterType);
    });
  });
}

function openSubmissionModal(id, title, subject, desc) {
  const modal = document.getElementById('modal-submit-tugas');
  if (!modal) return;

  document.getElementById('submit-assignment-id').value = id;
  document.getElementById('modal-tugas-title').textContent = title;
  document.getElementById('modal-tugas-subject').textContent = subject;
  document.getElementById('modal-tugas-desc').textContent = desc || 'Tidak ada instruksi khusus.';
  document.getElementById('tugas-file-input').value = '';
  document.getElementById('tugas-file-label').textContent = 'Klik untuk pilih file atau seret file ke sini';
  document.getElementById('tugas-notes').value = '';

  modal.classList.remove('hidden');
}

function initSubmissionModal() {
  const modal = document.getElementById('modal-submit-tugas');
  const closeBtn = document.getElementById('btn-close-modal-tugas');
  const cancelBtn = document.getElementById('btn-cancel-submit-tugas');
  const form = document.getElementById('form-submit-tugas');
  const dropZone = document.getElementById('drop-zone-tugas');
  const fileInput = document.getElementById('tugas-file-input');
  const fileLabel = document.getElementById('tugas-file-label');

  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
  if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');

  if (dropZone && fileInput) {
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = () => {
      if (fileInput.files && fileInput.files[0]) {
        const f = fileInput.files[0];
        if (f.size > 5 * 1024 * 1024) {
          showToast('Ukuran file melebihi batas 5MB!', 'error');
          fileInput.value = '';
          fileLabel.textContent = 'Klik untuk pilih file atau seret file ke sini';
          return;
        }
        fileLabel.textContent = `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)} MB)`;
      }
    };
  }

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const assignmentId = document.getElementById('submit-assignment-id').value;
      const file = fileInput.files[0];
      const notes = document.getElementById('tugas-notes').value.trim();

      if (!file) {
        return showToast('Silakan pilih berkas tugas yang ingin dikumpulkan!', 'warning');
      }

      const saveBtnText = document.getElementById('btn-save-tugas-text');
      if (saveBtnText) saveBtnText.textContent = 'Mengunggah...';

      try {
        // Upload ke bucket 'student-assignments'
        const fileExt = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${currentUser.id}/${assignmentId}_${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadErr } = await db.storage
          .from('student-assignments')
          .upload(storagePath, file, { upsert: true });

        if (uploadErr) throw uploadErr;

        const { data: publicUrlData } = db.storage
          .from('student-assignments')
          .getPublicUrl(storagePath);

        const fileUrl = publicUrlData?.publicUrl || storagePath;

        // Upsert ke assignment_submissions
        const studentClass = currentStudent?.classes?.nama_kelas || currentStudent?.kelas || '7A';
        const studentName = currentStudent?.nama_lengkap || currentUser.user_metadata?.full_name || 'Siswa';

        const { error: upsertErr } = await db
          .from('assignment_submissions')
          .upsert({
            assignment_id: assignmentId,
            student_id: currentStudent?.id,
            student_user_id: currentUser.id,
            student_name: studentName,
            class_name: studentClass,
            file_url: fileUrl,
            file_name: file.name,
            file_size: file.size,
            notes: notes || null,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          }, { onConflict: 'assignment_id,student_id' });

        if (upsertErr) throw upsertErr;

        showToast('Tugas berhasil dikumpulkan!', 'success');
        modal.classList.add('hidden');
        await loadAssignments(currentStudent);
      } catch (err) {
        console.error('Gagal submit tugas:', err);
        showToast('Gagal mengumpulkan tugas: ' + err.message, 'error');
      } finally {
        if (saveBtnText) saveBtnText.textContent = 'Kirim Tugas';
      }
    };
  }
}


// ── 9. CBT ONLINE EXAM ENGINE (ANTI-CHEAT & INSTANT DISCUSSION) ────────
let studentQuizzesList = [];
let activeQuiz = null;
let activeQuestions = [];
let currentQuestionIndex = 0;
let studentAnswers = {};
let studentDoubtFlags = new Set();
let tabSwitchCount = 0;
let examTimerInterval = null;
let remainingSeconds = 0;

async function loadCbtQuizzes(student) {
  const feed = document.getElementById('student-cbt-feed');
  if (!feed) return;

  try {
    const studentClass = student.classes?.nama_kelas || student.kelas || '7A';

    const [quizRes, attemptRes] = await Promise.all([
      db.from('quizzes')
        .select('*')
        .or(`class_name.eq.${studentClass},class_name.eq.Semua`)
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
      db.from('quiz_attempts')
        .select('*')
        .or(`student_id.eq.${student.id},student_user_id.eq.${currentUser.id}`)
    ]);

    if (quizRes.error) throw quizRes.error;
    const quizzes = quizRes.data || [];
    const attempts = attemptRes.data || [];

    const attemptMap = {};
    attempts.forEach(att => {
      attemptMap[att.quiz_id] = att;
    });

    studentQuizzesList = quizzes.map(q => ({
      ...q,
      attempt: attemptMap[q.id] || null
    }));

    renderCbtQuizzesList(studentQuizzesList);
  } catch (err) {
    console.error('Gagal memuat kuis CBT:', err);
    if (feed) {
      feed.innerHTML = `<div class="text-center py-8 text-rose-400 col-span-full">Gagal memuat ujian CBT: ${escapeHTML(err.message)}</div>`;
    }
  }
}

function renderCbtQuizzesList(list) {
  const feed = document.getElementById('student-cbt-feed');
  if (!feed) return;

  if (list.length === 0) {
    feed.innerHTML = `
      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 text-center col-span-full">
        <span class="material-symbols-outlined text-4xl text-gray-500 mb-2">quiz</span>
        <div class="text-sm font-semibold text-gray-300">Belum ada ujian CBT yang aktif</div>
        <p class="text-xs text-gray-500 mt-1">Ujian atau kuis online yang diterbitkan guru akan muncul di sini.</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = list.map(q => {
    const isCompleted = !!q.attempt;
    const scoreText = isCompleted ? (q.attempt.total_score != null ? q.attempt.total_score : q.attempt.pg_score) : null;

    return `
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-white/10 text-gray-300">${escapeHTML(q.subject)}</span>
            ${isCompleted ? `
              <span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">verified</span> Skor: ${scoreText}
              </span>
            ` : `
              <span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">play_circle</span> Siap Dikerjakan
              </span>
            `}
          </div>
          <h4 class="text-base font-bold text-white mb-1.5">${escapeHTML(q.title)}</h4>
          <p class="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">${escapeHTML(q.description || 'Ujian CBT dengan evaluasi otomatis.')}</p>
        </div>

        <div class="border-t border-white/10 pt-3 space-y-3">
          <div class="flex items-center justify-between text-[0.75rem] text-gray-400">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-400">person</span> ${escapeHTML(q.teacher_name)}</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-amber-400">timer</span> ${q.duration_minutes} Menit</span>
          </div>

          ${isCompleted ? `
            <button class="btn-view-cbt-discussion w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer" data-id="${q.id}">
              <span class="material-symbols-outlined text-sm">visibility</span>
              <span>Lihat Pembahasan & Kunci Jawaban</span>
            </button>
          ` : `
            <button class="btn-start-cbt w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer" data-id="${q.id}">
              <span class="material-symbols-outlined text-sm">quiz</span>
              <span>Mulai Kerjakan Ujian</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Bind start exam click
  feed.querySelectorAll('.btn-start-cbt').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-id');
      const quiz = studentQuizzesList.find(item => item.id === qId);
      if (quiz) startCbtExam(quiz);
    });
  });

  // Bind view discussion click
  feed.querySelectorAll('.btn-view-cbt-discussion').forEach(btn => {
    btn.addEventListener('click', () => {
      const qId = btn.getAttribute('data-id');
      const quiz = studentQuizzesList.find(item => item.id === qId);
      if (quiz && quiz.attempt) showCbtResultsAndDiscussion(quiz, quiz.attempt);
    });
  });
}

async function startCbtExam(quiz) {
  if (!confirm(`Mulai ujian "${quiz.title}"?\nDurasi: ${quiz.duration_minutes} Menit.\nSistem anti-cheat aktif: dilarang berpindah tab browser!`)) return;

  activeQuiz = quiz;
  currentQuestionIndex = 0;
  studentAnswers = {};
  studentDoubtFlags.clear();
  tabSwitchCount = 0;
  remainingSeconds = (quiz.duration_minutes || 60) * 60;

  try {
    const { data: questions, error } = await db
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('question_order', { ascending: true });

    if (error) throw error;
    if (!questions || questions.length === 0) {
      return showToast('Soal ujian belum tersedia!', 'warning');
    }

    activeQuestions = questions;

    // Open Runner Modal
    const modal = document.getElementById('modal-cbt-runner');
    document.getElementById('cbt-exam-title').textContent = quiz.title;
    document.getElementById('cbt-exam-subject').textContent = quiz.subject;
    document.getElementById('cbt-total-q-num').textContent = activeQuestions.length;
    document.getElementById('cbt-tab-switch-count').textContent = '0';

    modal.classList.remove('hidden');

    initAntiCheatTracking();
    startExamTimer();
    renderCurrentQuestion();
    renderCbtNavigator();
    initCbtRunnerActions();
  } catch (err) {
    console.error('Gagal memulai CBT:', err);
    showToast('Gagal memuat butir soal: ' + err.message, 'error');
  }
}

function initAntiCheatTracking() {
  const onVisibilityChange = () => {
    if (document.hidden && activeQuiz) {
      tabSwitchCount++;
      document.getElementById('cbt-tab-switch-count').textContent = tabSwitchCount;
      showToast(`⚠️ PERINGATAN INTEGRITAS: Anda terdeteksi beralih tab (${tabSwitchCount} kali)!`, 'error');
    }
  };

  document.removeEventListener('visibilitychange', window._cbtVisibilityHandler);
  window._cbtVisibilityHandler = onVisibilityChange;
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function startExamTimer() {
  if (examTimerInterval) clearInterval(examTimerInterval);

  const timerText = document.getElementById('cbt-timer-text');
  const timerBadge = document.getElementById('cbt-timer-badge');

  function updateTimerDisplay() {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    timerText.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (remainingSeconds <= 300) {
      timerBadge.className = 'px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-sm font-black flex items-center gap-1.5 animate-pulse';
    } else {
      timerBadge.className = 'px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-black flex items-center gap-1.5';
    }

    if (remainingSeconds <= 0) {
      clearInterval(examTimerInterval);
      showToast('Waktu ujian telah habis! Mengirim lembar jawaban...', 'warning');
      submitCbtExam();
    }
    remainingSeconds--;
  }

  updateTimerDisplay();
  examTimerInterval = setInterval(updateTimerDisplay, 1000);
}

function renderCurrentQuestion() {
  if (!activeQuestions || activeQuestions.length === 0) return;
  const q = activeQuestions[currentQuestionIndex];

  document.getElementById('cbt-current-q-num').textContent = currentQuestionIndex + 1;
  document.getElementById('cbt-question-type-badge').textContent = q.type === 'essay' ? 'Soal Uraian (Essay)' : 'Pilihan Ganda';
  document.getElementById('cbt-question-text').innerHTML = escapeHTML(q.question_text).replace(/\n/g, '<br>');

  const optionsContainer = document.getElementById('cbt-options-container');
  const currentAnswer = studentAnswers[q.id] || '';

  if (q.type === 'essay') {
    optionsContainer.innerHTML = `
      <textarea id="cbt-essay-input" class="w-full bg-slate-900 border border-white/20 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" rows="5" placeholder="Ketikkan jawaban uraian Anda di sini...">${escapeHTML(currentAnswer)}</textarea>
    `;
    const input = document.getElementById('cbt-essay-input');
    input.oninput = (e) => {
      studentAnswers[q.id] = e.target.value;
      renderCbtNavigator();
    };
  } else {
    const opts = Array.isArray(q.options) ? q.options : [];
    optionsContainer.innerHTML = opts.map(opt => {
      const isSelected = currentAnswer === opt.key;
      return `
        <button type="button" class="btn-cbt-option w-full p-3.5 rounded-xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${isSelected ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'}" data-key="${opt.key}">
          <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-300'}">${opt.key}</span>
          <span class="text-sm flex-1 leading-relaxed">${escapeHTML(opt.text)}</span>
        </button>
      `;
    }).join('');

    optionsContainer.querySelectorAll('.btn-cbt-option').forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-key');
        studentAnswers[q.id] = key;
        renderCurrentQuestion();
        renderCbtNavigator();
      };
    });
  }

  // Update Doubt button visual
  const btnDoubt = document.getElementById('btn-cbt-doubt');
  if (studentDoubtFlags.has(q.id)) {
    btnDoubt.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-black border border-amber-500 flex items-center gap-1 font-bold';
  } else {
    btnDoubt.className = 'px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1';
  }
}

function renderCbtNavigator() {
  const grid = document.getElementById('cbt-nav-grid');
  if (!grid) return;

  grid.innerHTML = activeQuestions.map((q, idx) => {
    const isCurrent = idx === currentQuestionIndex;
    const hasAnswered = !!studentAnswers[q.id];
    const isDoubt = studentDoubtFlags.has(q.id);

    let bgClass = 'bg-white/10 text-gray-300 border-white/10';
    if (isDoubt) bgClass = 'bg-amber-500 text-black border-amber-400 font-bold';
    else if (hasAnswered) bgClass = 'bg-emerald-500 text-white border-emerald-400 font-bold';

    const borderFocus = isCurrent ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950' : '';

    return `
      <button type="button" class="btn-nav-q h-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${bgClass} ${borderFocus}" data-idx="${idx}">
        ${idx + 1}
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.btn-nav-q').forEach(btn => {
    btn.onclick = () => {
      currentQuestionIndex = parseInt(btn.getAttribute('data-idx'));
      renderCurrentQuestion();
      renderCbtNavigator();
    };
  });
}

function initCbtRunnerActions() {
  const btnPrev = document.getElementById('btn-cbt-prev');
  const btnNext = document.getElementById('btn-cbt-next');
  const btnDoubt = document.getElementById('btn-cbt-doubt');
  const btnSubmit = document.getElementById('btn-cbt-submit');

  if (btnPrev) btnPrev.onclick = () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderCurrentQuestion();
      renderCbtNavigator();
    }
  };

  if (btnNext) btnNext.onclick = () => {
    if (currentQuestionIndex < activeQuestions.length - 1) {
      currentQuestionIndex++;
      renderCurrentQuestion();
      renderCbtNavigator();
    }
  };

  if (btnDoubt) btnDoubt.onclick = () => {
    const q = activeQuestions[currentQuestionIndex];
    if (studentDoubtFlags.has(q.id)) studentDoubtFlags.delete(q.id);
    else studentDoubtFlags.add(q.id);
    renderCurrentQuestion();
    renderCbtNavigator();
  };

  if (btnSubmit) btnSubmit.onclick = () => {
    const answeredCount = Object.keys(studentAnswers).length;
    const total = activeQuestions.length;
    if (confirm(`Apakah Anda yakin ingin mengumpulkan ujian ini?\nSoal terjawab: ${answeredCount} dari ${total} soal.`)) {
      submitCbtExam();
    }
  };
}

async function submitCbtExam() {
  if (examTimerInterval) clearInterval(examTimerInterval);

  // Hitung Skor Pilihan Ganda secara otomatis
  let pgTotalPoints = 0;
  let earnedPgPoints = 0;
  let correctCount = 0;
  let wrongCount = 0;

  activeQuestions.forEach(q => {
    if (q.type === 'multiple_choice') {
      const p = Number(q.points || 10);
      pgTotalPoints += p;
      const givenAns = studentAnswers[q.id];
      if (givenAns && q.correct_key && givenAns.toUpperCase() === q.correct_key.toUpperCase()) {
        earnedPgPoints += p;
        correctCount++;
      } else {
        wrongCount++;
      }
    }
  });

  const studentClass = currentStudent?.classes?.nama_kelas || currentStudent?.kelas || '7A';
  const studentName = currentStudent?.nama_lengkap || currentUser?.user_metadata?.full_name || 'Siswa';

  const attemptPayload = {
    quiz_id: activeQuiz.id,
    student_id: currentStudent?.id,
    student_user_id: currentUser.id,
    student_name: studentName,
    class_name: studentClass,
    answers: studentAnswers,
    tab_switch_count: tabSwitchCount,
    pg_score: earnedPgPoints,
    total_score: earnedPgPoints,
    status: 'submitted',
    submitted_at: new Date().toISOString()
  };

  try {
    const { data: savedAttempt, error } = await db
      .from('quiz_attempts')
      .upsert(attemptPayload, { onConflict: 'quiz_id,student_id' })
      .select()
      .single();

    if (error) throw error;

    showToast('Ujian berhasil dikumpulkan!', 'success');

    // Tutup runner modal & Buka discussion modal
    document.getElementById('modal-cbt-runner').classList.add('hidden');
    showCbtResultsAndDiscussion(activeQuiz, savedAttempt || attemptPayload);

    await loadCbtQuizzes(currentStudent);
  } catch (err) {
    console.error('Gagal menyimpan hasil ujian:', err);
    showToast('Gagal submit ujian: ' + err.message, 'error');
  }
}

async function showCbtResultsAndDiscussion(quiz, attempt) {
  const modal = document.getElementById('modal-cbt-results');
  const titleEl = document.getElementById('results-quiz-title');
  const subtitleEl = document.getElementById('results-quiz-subtitle');
  const totalScoreEl = document.getElementById('results-total-score');
  const correctEl = document.getElementById('results-correct-count');
  const wrongEl = document.getElementById('results-wrong-count');
  const tabSwitchesEl = document.getElementById('results-tab-switches');
  const discussionList = document.getElementById('results-discussion-list');
  const closeBtn = document.getElementById('btn-close-results-modal');

  if (!modal) return;

  titleEl.textContent = `Hasil & Pembahasan: ${quiz.title}`;
  subtitleEl.textContent = `Mata Pelajaran ${quiz.subject} • Disubmit pada ${new Date(attempt.submitted_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;

  totalScoreEl.textContent = attempt.total_score != null ? attempt.total_score : attempt.pg_score;
  tabSwitchesEl.textContent = attempt.tab_switch_count || 0;

  modal.classList.remove('hidden');
  if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');

  try {
    const { data: questions, error } = await db
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quiz.id)
      .order('question_order', { ascending: true });

    if (error) throw error;

    const answers = attempt.answers || {};
    let correctC = 0, wrongC = 0;

    discussionList.innerHTML = (questions || []).map((q, idx) => {
      const studentAns = answers[q.id] || '-';
      const isPg = q.type === 'multiple_choice';
      const isCorrect = isPg && studentAns && q.correct_key && studentAns.toUpperCase() === q.correct_key.toUpperCase();

      if (isPg) {
        if (isCorrect) correctC++;
        else wrongC++;
      }

      const statusBadge = isPg ? (
        isCorrect
          ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✓ Jawaban Benar (+10)</span>'
          : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">✕ Jawaban Salah (0)</span>'
      ) : '<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300">Soal Uraian (Menunggu Koreksi Guru)</span>';

      return `
        <div class="p-5 rounded-2xl bg-white/5 border ${isCorrect ? 'border-emerald-500/30' : 'border-white/10'} space-y-3">
          <div class="flex items-center justify-between text-xs text-gray-400">
            <span class="font-bold text-white">Soal No. ${idx + 1}</span>
            ${statusBadge}
          </div>

          <div class="text-sm text-gray-100 font-medium leading-relaxed">
            ${escapeHTML(q.question_text).replace(/\n/g, '<br>')}
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div class="p-3 rounded-xl bg-slate-900 border border-white/10">
              <span class="text-gray-400">Jawaban Anda:</span>
              <div class="font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'} text-sm mt-0.5">${escapeHTML(studentAns)}</div>
            </div>
            ${isPg ? `
              <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span class="text-emerald-300 font-semibold">Kunci Jawaban Benar:</span>
                <div class="font-bold text-emerald-400 text-sm mt-0.5">${q.correct_key}</div>
              </div>
            ` : ''}
          </div>

          ${q.explanation ? `
            <div class="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300">
              <div class="font-bold text-emerald-300 mb-0.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">lightbulb</span> Pembahasan:
              </div>
              <p class="text-gray-400 leading-relaxed">${escapeHTML(q.explanation)}</p>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    correctEl.textContent = correctC;
    wrongEl.textContent = wrongC;
  } catch (err) {
    console.error('Gagal memuat pembahasan soal:', err);
  }
}


// ── 10. INTERACTIVE STUDY MATERIALS & VIEWER (YOUTUBE, PDF, HTML) ─────
let studentMaterialsList = [];

async function loadStudentInteractiveMaterials(student) {
  const grid = document.getElementById('student-interactive-materials-grid');
  if (!grid) return;

  try {
    const studentClass = student.classes?.nama_kelas || student.kelas || '7A';

    const { data: materials, error } = await db
      .from('assignments')
      .select('*')
      .or(`class_name.eq.${studentClass},class_name.eq.Semua`)
      .in('type', ['materi', 'material'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    studentMaterialsList = materials || [];
    renderStudentMaterialsGrid(studentMaterialsList);
    initMateriTabHandlers();
    initStudentMaterialViewer();
  } catch (err) {
    console.error('Gagal memuat materi interaktif:', err);
    if (grid) {
      grid.innerHTML = `<div class="text-center py-8 text-rose-400 col-span-full">Gagal memuat materi: ${escapeHTML(err.message)}</div>`;
    }
  }
}

function renderStudentMaterialsGrid(list) {
  const grid = document.getElementById('student-interactive-materials-grid');
  if (!grid) return;

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="p-8 rounded-2xl bg-white/5 border border-white/10 text-center col-span-full">
        <span class="material-symbols-outlined text-4xl text-gray-500 mb-2">menu_book</span>
        <div class="text-sm font-semibold text-gray-300">Belum ada modul materi interaktif</div>
        <p class="text-xs text-gray-500 mt-1">Materi ajar digital (Video YouTube, Modul PDF, & Simulasi) dari guru akan tampil di sini.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(m => {
    let iconName = 'menu_book';
    let typeLabel = 'Modul Bacaan';
    let url = m.attachment_url || '';

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      iconName = 'play_circle';
      typeLabel = 'Video YouTube';
    } else if (url.endsWith('.pdf')) {
      iconName = 'picture_as_pdf';
      typeLabel = 'Dokumen PDF';
    } else if (url.endsWith('.html') || url.endsWith('.htm')) {
      iconName = 'code';
      typeLabel = 'Simulasi HTML Interaktif';
    } else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
      iconName = 'image';
      typeLabel = 'Infografis Gambar';
    }

    return `
      <div class="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between gap-2 mb-3">
            <span class="px-2.5 py-0.5 rounded-lg text-[0.7rem] font-bold bg-white/10 text-gray-300">${escapeHTML(m.subject)}</span>
            <span class="px-2.5 py-1 rounded-full text-[0.7rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">${iconName}</span> ${typeLabel}
            </span>
          </div>
          <h4 class="text-base font-bold text-white mb-1.5">${escapeHTML(m.title)}</h4>
          <p class="text-xs text-gray-400 line-clamp-3 mb-4 leading-relaxed">${escapeHTML(m.description || 'Pelajari materi ini secara mandiri.')}</p>
        </div>

        <div class="border-t border-white/10 pt-3 space-y-2">
          <div class="flex items-center justify-between text-[0.75rem] text-gray-400">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs text-emerald-400">person</span> ${escapeHTML(m.teacher_name)}</span>
            <span class="text-xs text-gray-500">${m.class_name}</span>
          </div>

          ${url ? `
            <button class="btn-open-student-viewer w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer" data-url="${escapeHTML(url)}" data-title="${escapeHTML(m.title)}" data-subtitle="${escapeHTML(m.subject)} • ${escapeHTML(m.teacher_name)}">
              <span class="material-symbols-outlined text-sm">visibility</span>
              <span>Buka & Pelajari Materi</span>
            </button>
          ` : `
            <div class="text-xs text-gray-500 text-center py-1">Teks Materi Lengkap</div>
          `}
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn-open-student-viewer').forEach(btn => {
    btn.onclick = () => {
      const url = btn.getAttribute('data-url');
      const title = btn.getAttribute('data-title');
      const subtitle = btn.getAttribute('data-subtitle');
      openStudentMaterialViewer(url, title, subtitle);
    };
  });
}

function initMateriTabHandlers() {
  const tabBtnInteractive = document.getElementById('tab-btn-interactive-materi');
  const tabBtnJournal = document.getElementById('tab-btn-journal-materi');
  const viewInteractive = document.getElementById('view-interactive-materi');
  const viewJournal = document.getElementById('view-journal-materi');

  if (tabBtnInteractive && tabBtnJournal && viewInteractive && viewJournal) {
    tabBtnInteractive.onclick = () => {
      tabBtnInteractive.className = 'materi-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white';
      tabBtnJournal.className = 'materi-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:bg-white/10';
      viewInteractive.classList.remove('hidden');
      viewJournal.classList.add('hidden');
    };

    tabBtnJournal.onclick = () => {
      tabBtnJournal.className = 'materi-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-white';
      tabBtnInteractive.className = 'materi-tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 text-gray-300 hover:bg-white/10';
      viewJournal.classList.remove('hidden');
      viewInteractive.classList.add('hidden');
    };
  }
}

function formatStudentEmbedUrl(rawUrl) {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  // Google Drive preview link
  if (trimmed.includes('drive.google.com/file/d/')) {
    return trimmed.replace(/\/view.*$/, '/preview');
  }

  return trimmed;
}

function openStudentMaterialViewer(url, title, subtitle) {
  const modal = document.getElementById('modal-material-viewer');
  const titleEl = document.getElementById('student-viewer-title');
  const subtitleEl = document.getElementById('student-viewer-subtitle');
  const iframe = document.getElementById('student-viewer-iframe');
  const openExternal = document.getElementById('student-viewer-open-external');
  const fallbackImg = document.getElementById('student-viewer-fallback-img');
  const imgEl = document.getElementById('student-viewer-img-el');
  const iconEl = document.getElementById('student-viewer-icon');

  if (!modal || !iframe) return;

  if (titleEl) titleEl.textContent = title || 'Materi Pembelajaran';
  if (subtitleEl) subtitleEl.textContent = subtitle || 'SMP Annida E-Learning';
  if (openExternal) openExternal.href = url;

  const formattedUrl = formatStudentEmbedUrl(url);
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
      else if (formattedUrl.includes('.html')) iconEl.textContent = 'code';
      else iconEl.textContent = 'preview';
    }
  }

  modal.classList.remove('hidden');
}

function initStudentMaterialViewer() {
  const modal = document.getElementById('modal-material-viewer');
  const closeBtn = document.getElementById('btn-close-student-viewer');
  const iframe = document.getElementById('student-viewer-iframe');

  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      if (iframe) iframe.src = 'about:blank';
    };
  }
}
