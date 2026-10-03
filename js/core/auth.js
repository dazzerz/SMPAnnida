import { logError } from './analytics.js';
// Note: All endpoints are now RLS-protected in Supabase (see sql/rls_policies.sql)
// =====================================================
// ANNIDA2FINANCE - Authentication Module
// Mode guest dihapus total (audit 2026-09-27): seluruh dashboard privat
// wajib sesi login Supabase. Halaman publik (PPDB landing/register,
// index, login) tidak memakai modul ini untuk akses data.
// =====================================================
import supabaseClient from './supabase.js';
import { showToast, setupThemeToggle, applySavedTheme } from './utils.js';

function showAuthMessage(message, type) {
  let el = document.getElementById('auth-message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-message';
    el.style.padding = '0.75rem';
    el.style.borderRadius = '8px';
    el.style.marginBottom = '1rem';
    el.style.fontSize = '0.9rem';
    el.style.display = 'none';
    const form = document.querySelector('form');
    if (form) {
      form.parentNode.insertBefore(el, form);
    } else {
      return;
    }
  }
  el.textContent = message;
  el.className = `auth-message ${type} show`;
  // Add inline styles for success/error dynamically if styles are missing
  if (type === 'error') {
    el.style.background = 'rgba(239, 68, 68, 0.2)';
    el.style.border = '1px solid rgba(239, 68, 68, 0.5)';
    el.style.color = '#fca5a5';
  } else if (type === 'success') {
    el.style.background = 'rgba(34, 197, 94, 0.2)';
    el.style.border = '1px solid rgba(34, 197, 94, 0.5)';
    el.style.color = '#86efac';
  }
  el.style.display = 'block';
  setTimeout(() => {
    el.classList.remove('show');
    el.style.display = 'none';
  }, 5000);
}

function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId) || document.querySelector('.btn-login') || document.querySelector('.btn-submit') || document.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.classList.toggle('loading', isLoading);
  btn.disabled = isLoading;
  const btnText = document.getElementById('btn-text');
  if (btnText) {
    if (isLoading) {
      btnText.innerHTML = '<span class="auth-spinner inline-block mr-2"></span> Memverifikasi...';
    } else {
      btnText.textContent = 'Masuk ke Portal';
    }
  }
}

// ── USER ROLE RESOLVER ────────────────────────────
// ── USER ROLE RESOLVER ────────────────────────────
export async function resolveUserRole(user) {
  if (!user) return null;

  // Direct check in user_metadata for teacher or admin
  if (user.user_metadata?.role === 'teacher' || user.user_metadata?.role === 'admin') {
    return user.user_metadata.role;
  }

  // School domain resolution – only teachers have entries in teachers table
  if (user.email && user.email.toLowerCase().endsWith('@smpannida.sch.id')) {
    const cleanEmail = user.email.toLowerCase().trim();
    try {
      const { data: teacher } = await supabaseClient
        .from('teachers')
        .select('id')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (teacher) return 'teacher';
      // Not a teacher, treat as unknown
    } catch (e) {
      console.warn('Teacher check error:', e);
    }
  }

  // Fallback: get role from RPC or user_roles table
  let role = null;
  try {
    const { data: rpcRole, error: rpcErr } = await supabaseClient.rpc('get_user_role');
    if (!rpcErr && rpcRole) {
      role = rpcRole;
    } else {
      const { data: roleData } = await supabaseClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      role = roleData ? roleData.role : null;
    }
  } catch (err) {
    console.warn('resolveUserRole error:', err);
  }

  // No fallback to student or wali_murid; unknown roles remain null
  return role;
}

// ── LOGIN ─────────────────────────────────────────
export async function handleLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email') || document.querySelector('input[type="email"]') || document.querySelector('input[type="text"]');
  const passwordInput = document.getElementById('login-password') || document.querySelector('input[type="password"]');
  const identifier = emailInput ? emailInput.value.trim() : '';
  const password = passwordInput ? passwordInput.value : '';
  
  if (!identifier || !password) {
    showAuthMessage('Mohon isi email/No. HP dan password.', 'error');
    return;
  }
  setLoading('login-btn', true);

  // Detect Email or Phone using regex
  let payload = {};
  if (/[a-zA-Z@]/.test(identifier)) {
    payload = { email: identifier, password };
  } else {
    // Phone authentication (auto-format to E.164)
    let formattedPhone = identifier.replace(/[^0-9+]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '+62' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('62')) {
      formattedPhone = '+' + formattedPhone;
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    payload = { phone: formattedPhone, password };
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword(payload);
  if (error) {
    const msgs = {
      'Invalid login credentials': 'Email/No. HP atau password salah.',
      'Email not confirmed': 'Cek email kamu dan klik link verifikasi terlebih dahulu.',
    };
    showAuthMessage(msgs[error.message] || error.message, 'error');
    setLoading('login-btn', false);
    return;
  }
  showAuthMessage('Login berhasil! Mengalihkan...', 'success');
  // Periksa role untuk menentukan halaman redirect
  let r = await resolveUserRole(data.user);

    const allowedRoles = ['admin','teacher','pembina','finance','wali_murid','calon_siswa','siswa','student'];
  if (!allowedRoles.includes(r)) {
    showAuthMessage('Akses ditolak: role tidak dikenali', 'error');
    setLoading('login-btn', false);
    return;
  }

  setTimeout(() => {
    if (r === 'teacher' || r === 'admin' || r === 'pembina') {
      window.location.href = './pages/academic/dashboard.html';
    } else if (r === 'finance') {
      window.location.href = './pages/finance/dashboard.html';
    } else if (r === 'panitia_ppdb') {
      window.location.href = './pages/ppdb/dashboard-admin.html';
    } else if (r === 'wali_murid' || r === 'calon_siswa') {
      window.location.href = './pages/ppdb/dashboard-wali.html';
    } else if (r === 'siswa') {
      window.location.href = './pages/student/dashboard.html';
    } else {
      window.location.href = './dashboard.html';
    }

  }, 800);
}

// ── REGISTER ──────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('register-name').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm').value;

  if (!name || !email || !password || !confirmPassword) {
    showAuthMessage('Mohon isi semua kolom.', 'error'); return;
  }
  if (password.length < 6) {
    showAuthMessage('Password minimal 6 karakter.', 'error'); return;
  }
  if (password !== confirmPassword) {
    showAuthMessage('Konfirmasi password tidak cocok.', 'error'); return;
  }
  setLoading('register-btn', true);

  // Cek Kuota Akun (Maks 5)
  const { count, error: countErr } = await supabaseClient
    .from('profiles')
    .select('*', { count: 'exact', head: true });
    
  if (!countErr && count >= 5) {
    showAuthMessage('Maaf, kuota pendaftaran sudah penuh (Maksimal 5 Akun).', 'error');
    setLoading('register-btn', false);
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email, password,
    options: { data: { full_name: name } },
  });

  if (error) {
    const msgs = { 'User already registered': 'Email ini sudah terdaftar. Silakan login.' };
    showAuthMessage(msgs[error.message] || error.message, 'error');
    setLoading('register-btn', false);
    return;
  }

  showAuthMessage(
    data.session
      ? 'Registrasi berhasil! Mengalihkan ke dashboard...'
      : 'Registrasi berhasil! Cek email kamu untuk verifikasi lalu login.',
    'success'
  );
  setLoading('register-btn', false);

  if (data.session) {
    setTimeout(() => { if(window.smoothRedirect){window.smoothRedirect('./login.html');}else{window.location.href='./login.html';} }, 800);
  } else {
    document.getElementById('register-form').reset();
    setTimeout(() => switchTab('login'), 3000);
  }
}

// ── LOGOUT ────────────────────────────────────────
export async function handleLogout() {
  await supabaseClient.auth.signOut();
  // Bersihkan sisa flag guest versi lama (satu kali, untuk perangkat yang
  // pernah membuka versi lama sebelum guest dihapus total).
  try {
    
    
    
  } catch (_) { /* abaikan */ }
  const isInPages = window.location.pathname.includes('/pages/');
  if(window.smoothRedirect){window.smoothRedirect(isInPages ? '../../index.html' : './index.html');}else{window.location.href=isInPages ? '../../index.html' : './index.html';}
}

// ── AUTH GUARD ────────────────────────────────────
export async function requireAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    const isInPages = window.location.pathname.includes('/pages/');
    if(window.smoothRedirect){window.smoothRedirect(isInPages ? '../../login.html' : './login.html');}else{window.location.href=isInPages ? '../../login.html' : './login.html';}
    return null;
  }

  const role = await resolveUserRole(user);

  if (role) {
    sessionStorage.setItem('user_role', role);
  }

  const path = window.location.pathname.toLowerCase();

  // Redirect based on role constraints
  if (role === 'teacher' && path.includes('/finance/')) {
    if(window.smoothRedirect){window.smoothRedirect('/pages/academic/dashboard.html');}else{window.location.href='/pages/academic/dashboard.html';}
    return null;
  }
  if (role === 'finance' && path.includes('/academic/')) {
    if(window.smoothRedirect){window.smoothRedirect('/pages/finance/dashboard.html');}else{window.location.href='/pages/finance/dashboard.html';}
    return null;
  }
  if (role === 'siswa' && !path.includes('/student/')) {
    if(window.smoothRedirect){window.smoothRedirect('/pages/student/dashboard.html');}else{window.location.href='/pages/student/dashboard.html';}
    return null;
  }
  if ((role === 'calon_siswa' || role === 'wali_murid') && (path.includes('/academic/') || path.includes('/finance/') || path.endsWith('/dashboard.html') && !path.includes('/ppdb/'))) {
    if(window.smoothRedirect){window.smoothRedirect('/pages/ppdb/dashboard-wali.html');}else{window.location.href='/pages/ppdb/dashboard-wali.html';}
    return null;
  }

  return user;
}

// ── OPTIONAL AUTH ─────────────────────────────────
export async function getOptionalUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

// ── TAB SWITCHING ─────────────────────────────────
function switchTab(tab) {
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.auth-form-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `${tab}-panel`);
  });
  const msgEl = document.getElementById('auth-message');
  if (msgEl) { msgEl.className = 'auth-message'; msgEl.textContent = ''; }
}

// ── PASSWORD TOGGLE ───────────────────────────────
function setupPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      if (!input) return;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.textContent = isPass ? '🙈' : '👁️';
    });
  });
}

// ── INIT AUTH PAGE ────────────────────────────────
export function initAuthPage() {
  applySavedTheme();

  // Redirect if already logged in
  supabaseClient.auth.getUser().then(({ data: { user } }) => {
    if (user) if(window.smoothRedirect){window.smoothRedirect('./login.html');}else{window.location.href='./login.html';}
  });

  // Tab buttons
  document.querySelectorAll('.auth-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Quick switch links
  document.getElementById('goto-register')?.addEventListener('click', e => { e.preventDefault(); switchTab('register'); });
  document.getElementById('goto-login')?.addEventListener('click', e => { e.preventDefault(); switchTab('login'); });

  // Forms
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  setupPasswordToggles();
  setupThemeToggle('auth-theme-toggle');
}
// ── AUTO-LOGOUT (30 Menit Idle) ───────────────────
let idleTimeout;

function resetTimer() {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(() => {
    handleLogout();
  }, 1800000); // 30 minutes
}

window.addEventListener('mousemove', resetTimer);
window.addEventListener('keydown', resetTimer);
window.addEventListener('scroll', resetTimer);
window.addEventListener('click', resetTimer);

resetTimer();
