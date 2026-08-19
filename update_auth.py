import re

js_path = 'js/core/auth.js'
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Modify requireAuth
old_require_auth = '''export async function requireAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../../index.html' : './index.html';
    return null;
  }
  return user;
}'''

new_require_auth = '''export async function requireAuth() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) {
    const isInPages = window.location.pathname.includes('/pages/');
    window.location.href = isInPages ? '../../index.html' : './index.html';
    return null;
  }

  // P0 Fix: Role-based Routing (RBAC)
  const { data: roleData } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  const role = roleData ? roleData.role : null;
  
  if (role) {
    sessionStorage.setItem('user_role', role);
  }

  const path = window.location.pathname.toLowerCase();

  // Redirect based on role constraints
  if (role === 'teacher' && path.includes('/finance/')) {
    window.location.href = '/pages/academic/dashboard.html';
    return null;
  }
  if (role === 'finance' && path.includes('/academic/')) {
    window.location.href = '/pages/finance/dashboard.html';
    return null;
  }
  if (role === 'calon_siswa' && (path.includes('/academic/') || path.includes('/finance/') || path.endsWith('/dashboard.html') && !path.includes('/ppdb/'))) {
    window.location.href = '/pages/ppdb/dashboard-siswa.html';
    return null;
  }

  return user;
}'''

js = js.replace(old_require_auth, new_require_auth)

# Modify handleLogin redirect logic
# We need to replace the timeout redirect block in handleLogin
login_redirect_regex = r"setTimeout\(\(\) => \{\s*if \(isAdmin \|\| isPembina\) \{.*?\},\s*800\);"
new_login_redirect = '''setTimeout(() => { 
    const r = roleData ? roleData.role : null;
    if (r === 'calon_siswa') {
      window.location.href = './pages/ppdb/dashboard-siswa.html';
    } else if (r === 'finance') {
      window.location.href = './pages/finance/dashboard.html';
    } else if (r === 'teacher') {
      window.location.href = './pages/academic/dashboard.html';
    } else {
      window.location.href = './dashboard.html'; 
    }
  }, 800);'''

js = re.sub(login_redirect_regex, new_login_redirect, js, flags=re.DOTALL)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated auth.js")
