import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const rpcRole = { value: null };

vi.mock('./supabase.js', () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(async () => ({
        data: { user: { id: 'u1', email: 'user@example.com', user_metadata: {} } },
        error: null,
      })),
      signOut: vi.fn(async () => ({})),
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
    rpc: vi.fn(async () => ({ data: rpcRole.value, error: null })),
    from: vi.fn(() => {
      const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: null }) };
      return q;
    }),
  },
}));

const { handleLogin } = await import('./auth.js');

async function loginAs(role) {
  rpcRole.value = role;
  await handleLogin({ preventDefault() {} });
  vi.advanceTimersByTime(800);
}

describe('handleLogin role redirect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <form id="login-form">
        <input id="login-email" type="email" value="user@example.com">
        <input id="login-password" type="password" value="secret123">
        <button id="login-btn" type="submit"><span id="btn-text"></span></button>
      </form>`;
    window.smoothRedirect = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    delete window.smoothRedirect;
  });

  it.each([
    ['admin', './pages/academic/dashboard.html'],
    ['teacher', './pages/academic/dashboard.html'],
    ['pembina', './pages/academic/dashboard.html'],
    ['finance', './pages/finance/dashboard.html'],
    ['panitia_ppdb', './pages/ppdb/dashboard-admin.html'],
    ['wali_murid', './pages/ppdb/dashboard-wali.html'],
    ['calon_siswa', './pages/ppdb/dashboard-wali.html'],
    ['siswa', './pages/student/dashboard.html'],
    ['student', './pages/student/dashboard.html'],
  ])('role %s -> %s', async (role, target) => {
    await loginAs(role);
    expect(window.smoothRedirect).toHaveBeenCalledWith(target);
  });

  it.each([[null], ['super_admin'], ['toString']])('unknown role %s is rejected without redirect', async (role) => {
    await loginAs(role);
    expect(window.smoothRedirect).not.toHaveBeenCalled();
    expect(document.getElementById('auth-message').className).toContain('error');
    expect(document.getElementById('login-btn').disabled).toBe(false);
  });
});
