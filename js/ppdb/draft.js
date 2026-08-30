/**
 * draft.js - Auto-Save & Restore Draft Form for PPDB
 */

export function setupAutoSaveDraft(formId, storageKey, statusIndicatorId) {
  if (typeof window === 'undefined') return;

  const form = document.getElementById(formId);
  if (!form) return;

  const indicator = statusIndicatorId ? document.getElementById(statusIndicatorId) : null;

  // Restore draft on load
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const data = JSON.parse(saved);
      Object.keys(data).forEach(id => {
        const input = document.getElementById(id) || document.querySelector(`[name="${id}"][value="${data[id]}"]`);
        if (input) {
          if (input.type === 'radio' || input.type === 'checkbox') {
            input.checked = true;
          } else {
            // Only overwrite if current value is empty
            if (!input.value) {
              input.value = data[id];
            }
          }
        }
      });
      if (indicator) {
        indicator.textContent = '✓ Draft formulir sebelumnya berhasil dimuat otomatis.';
        indicator.classList.remove('hidden');
      }
    }
  } catch (e) {
    console.warn("Gagal memuat draft:", e);
  }

  // Debounced auto-save on input changes
  let saveTimer;
  form.addEventListener('input', () => {
    clearTimeout(saveTimer);
    if (indicator) {
      indicator.textContent = '⏳ Menyimpan draft...';
      indicator.classList.remove('hidden');
    }
    saveTimer = setTimeout(() => {
      saveFormData(form, storageKey);
      if (indicator) {
        indicator.textContent = '✓ Draft tersimpan otomatis di perangkat Anda';
      }
    }, 1200);
  });

  form.addEventListener('change', () => {
    clearTimeout(saveTimer);
    saveFormData(form, storageKey);
    if (indicator) {
      indicator.textContent = '✓ Draft tersimpan otomatis di perangkat Anda';
      indicator.classList.remove('hidden');
    }
  });
}

function saveFormData(form, storageKey) {
  try {
    const data = {};
    const inputs = form.querySelectorAll('input:not([type="password"]):not([type="file"]), select, textarea');
    inputs.forEach(el => {
      if (el.id) {
        if (el.type === 'radio' || el.type === 'checkbox') {
          if (el.checked) data[el.name || el.id] = el.value;
        } else if (el.value) {
          data[el.id] = el.value;
        }
      }
    });
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (e) {}
}

export function clearAutoSaveDraft(storageKey) {
  try {
    localStorage.removeItem(storageKey);
  } catch (e) {}
}
