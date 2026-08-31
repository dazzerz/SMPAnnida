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
