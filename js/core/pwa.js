/**
 * js/core/pwa.js
 * High-Performance Standalone PWA Module & Mobile Install Prompt
 * SMP Annida Integrated System
 */

const PWA_DISMISS_KEY = 'smpannida_pwa_dismissed_until';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let deferredPrompt = null;

export function initPWA() {
  // 1. Register Service Worker if supported
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration failed:', err);
        });
    });
  }

  // 2. Check if already running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  if (isStandalone) {
    console.log('[PWA] App is running in standalone mode.');
    return;
  }

  // 3. Check 7-day cooldown dismissal
  const dismissedUntil = localStorage.getItem(PWA_DISMISS_KEY);
  if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
    console.log('[PWA] Install prompt is in 7-day cooldown.');
    return;
  }

  // 4. Capture beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('[PWA] beforeinstallprompt captured.');
    
    // Show prompt after a slight delay for better UX
    setTimeout(() => {
      showInstallPrompt();
    }, 2000);
  });

  // 5. Track appinstalled event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully.');
    hideInstallPrompt();
    deferredPrompt = null;
  });
}

function showInstallPrompt() {
  // If prompt already exists in DOM, reveal it
  let container = document.getElementById('pwa-install-banner');
  if (!container) {
    container = createInstallPromptDOM();
    document.body.appendChild(container);
  }

  // Animation reveal
  requestAnimationFrame(() => {
    container.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
    container.classList.add('translate-y-0', 'opacity-100');
  });
}

export function hideInstallPrompt(remember = true) {
  const container = document.getElementById('pwa-install-banner');
  if (container) {
    container.classList.remove('translate-y-0', 'opacity-100');
    container.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 350);
  }

  if (remember) {
    localStorage.setItem(PWA_DISMISS_KEY, (Date.now() + SEVEN_DAYS_MS).toString());
  }
}

function createInstallPromptDOM() {
  const wrapper = document.createElement('div');
  wrapper.id = 'pwa-install-banner';
  wrapper.className = 'fixed bottom-4 inset-x-4 md:inset-x-auto md:bottom-6 md:right-6 z-50 max-w-sm w-auto transition-all duration-300 transform translate-y-full opacity-0 pointer-events-none select-none';

  wrapper.innerHTML = `
    <div class="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/60 dark:border-white/15 text-slate-800 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)] flex flex-col gap-3">
      <div class="flex items-start gap-3">
        <img src="/logo_1x1.png" alt="Logo SMP Annida" class="w-11 h-11 rounded-xl object-contain bg-emerald-500/10 dark:bg-emerald-500/20 p-1 border border-emerald-500/30 shrink-0" onerror="this.src='/assets/logo/1.png'">
        <div class="flex-1 min-w-0 pr-2">
          <h4 class="font-bold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">Install SMP Annida App</h4>
          <p class="text-[0.72rem] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
            Akses portal siswa, guru, & PPDB lebih cepat langsung dari layar utama HP Anda.
          </p>
        </div>
        <button id="btn-pwa-dismiss-x" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1" aria-label="Tutup Banner">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-white/10">
        <button id="btn-pwa-later" class="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer">
          Nanti Saja
        </button>
        <button id="btn-pwa-install" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-all cursor-pointer">
          <span class="material-symbols-outlined text-sm">download</span>
          <span>Install Sekarang</span>
        </button>
      </div>
    </div>
  `;

  // Attach event handlers
  wrapper.querySelector('#btn-pwa-install').addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User choice:', outcome);
      deferredPrompt = null;
      hideInstallPrompt(false);
    } else {
      // Fallback for iOS / non-supported browsers
      alert('Untuk menginstal di iPhone/iPad: Tekan tombol Bagikan (Share) di browser Safari, lalu pilih "Tambah ke Layar Utama" (Add to Home Screen).');
      hideInstallPrompt(true);
    }
  });

  wrapper.querySelector('#btn-pwa-later').addEventListener('click', () => {
    hideInstallPrompt(true);
  });

  wrapper.querySelector('#btn-pwa-dismiss-x').addEventListener('click', () => {
    hideInstallPrompt(true);
  });

  return wrapper;
}

// Auto-run if imported directly
if (typeof window !== 'undefined') {
  initPWA();
}
