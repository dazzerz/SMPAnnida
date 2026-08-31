// =====================================================
// ANNIDA2FINANCE - SPA Entry Point
// Unified controller for all finance sub-pages
// =====================================================
import { injectSidebar, injectTopbar } from '../core/layout.js';
import supabaseClient from '../core/supabase.js';
import { getOptionalUser, handleLogout } from '../core/auth.js';
import { showToast, setupThemeToggle, applySavedTheme, formatCurrency, formatDate } from '../core/utils.js';
import {
  fetchCategories, fetchTransactions, addTransaction, updateTransaction,
  deleteTransaction, renderTransactionsTable, renderPagination,
  populateCategoryDropdown, getAllCategories,
  fetchMonthlySummary, fetchMonthlyTrend, fetchCategoryBreakdown
} from './transactions.js';
import { downloadTemplate, parseExcelFile, validateAndMapRows, bulkInsertTransactions } from './import.js';
import {
  fetchBudgets, fetchBudgetSpending, upsertBudget, deleteBudget,
  renderBudgetCards, updateBudgetSummary
} from './budget.js';
import { initSyahriah } from './syahriah.js';

// ── State ──────────────────────────────────────────
let userId = null;
let currentSection = 'transactions';
const sectionInited = {};

// ── Topbar titles per section ──────────────────────
const TOPBAR_CONFIG = {
  transactions: {
    greeting: 'Kelola', title: 'Transaksi',
    rightHtml: `<button class="btn btn-ghost btn-sm" id="import-excel-btn" style="gap:0.4rem;">📥 Import Excel</button> <button class="btn btn-primary btn-sm" id="add-transaction-btn">＋ Tambah Transaksi</button>`
  },
  budget: {
    greeting: 'Kelola', title: 'Budget Bulanan',
    rightHtml: `<button class="btn btn-primary btn-sm" id="add-budget-btn">＋ Tambah Budget</button>`
  },
  rab: { greeting: 'Perencanaan', title: 'RAB Kelas Annida 2', rightHtml: '' },
  reports: {
    greeting: 'Lihat & Export', title: 'Laporan Keuangan',
    rightHtml: `<button class="btn btn-success btn-sm" id="export-pdf-btn" style="gap:0.4rem;">📄 Export PDF</button>`
  },
  settings: { greeting: 'Kelola', title: 'Pengaturan', rightHtml: '' },
};

// ── SPA Router ─────────────────────────────────────
function navigateTo(sectionId) {
  if (sectionId === currentSection) return;

  // Hide all sections
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none';
  });

  // Show target section
  const target = document.getElementById(`sec-${sectionId}`);
  if (target) {
    target.classList.add('active');
    target.style.display = 'block';
  }

  // Update topbar
  const config = TOPBAR_CONFIG[sectionId] || TOPBAR_CONFIG.transactions;
  injectTopbar('topbar', config);

  // Update sidebar active state
  document.querySelectorAll('#nav-group-finance .nav-item').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`#nav-group-finance [data-target="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('show');

  currentSection = sectionId;
  window.location.hash = sectionId;

  // Lazy-init section
  initSection(sectionId);
}

function initSection(sectionId) {
  if (sectionInited[sectionId]) return;
  sectionInited[sectionId] = true;

  switch (sectionId) {
    case 'transactions': initTransactions(); break;
    case 'budget': initBudget(); break;
    case 'rab': initRab(); break;
    case 'reports': initReports(); break;
    case 'settings': initSettings(); break;
    case 'syahriah': initSyahriah(); break;
  }
}

// ── Inject SPA sidebar ─────────────────────────────
function injectFinanceSidebar() {
  injectSidebar('sidebar');
  // We rely on core/layout.js for the sidebar HTML.
  // Native hash navigation will trigger our window hashchange listener.
}

// ══════════════════════════════════════════════════════
// SECTION: TRANSACTIONS
// ══════════════════════════════════════════════════════
function initTransactions() {
  const PAGE_SIZE = 10;
  let currentPage = 1;
  let editingId = null;
  let filters = { search: '', type: '', categoryId: '', month: '', sumberDana: '' };

  function populateMonthFilter() {
    const select = document.getElementById('filter-month');
    if (!select) return;
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      months.push(`<option value="${val}">${label}</option>`);
    }
    select.innerHTML = `<option value="">Semua Bulan</option>` + months.join('');
  }

  async function loadTransactions() {
    const { data, count } = await fetchTransactions(userId, filters, currentPage);
    renderTransactionsTable(data, !!userId);
    renderPagination(count, currentPage);
  }

  // Event Delegation: pagination
  document.getElementById('pagination-controls')?.addEventListener('click', (e) => {
    const pageBtn = e.target.closest('[data-action="goto-page"]');
    if (pageBtn) {
      currentPage = parseInt(pageBtn.getAttribute('data-page'));
      loadTransactions();
    }
  });

  // Event Delegation: transaction table
  document.getElementById('transactions-tbody')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    if (editBtn) {
      const id = editBtn.getAttribute('data-id');
      const { data } = await supabaseClient.from('transactions').select('*').eq('id', id).single();
      if (!data) return;
      editingId = id;
      document.getElementById('modal-title').textContent = 'Edit Transaksi';
      document.getElementById('modal-type').value = data.type;
      document.getElementById('modal-description').value = data.description || '';
      document.getElementById('modal-amount').value = data.amount;
      document.getElementById('modal-date').value = data.date;
      document.getElementById('modal-sumber-dana').value = data.sumber_dana || 'bank';
      populateCategoryDropdown(data.type);
      setTimeout(() => { document.getElementById('modal-category').value = data.category_id || ''; }, 50);
      document.getElementById('transaction-modal').classList.add('active');
    }

    if (deleteBtn) {
      const id = deleteBtn.getAttribute('data-id');
      if (!confirm('Hapus transaksi ini?')) return;
      try {
        await deleteTransaction(id);
        showToast('Transaksi dihapus.', 'success');
        loadTransactions();
      } catch (err) {
        showToast('Gagal menghapus: ' + err.message, 'error');
      }
    }
  });

  function openModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Tambah Transaksi';
    document.getElementById('transaction-form').reset();
    document.getElementById('modal-date').value = new Date().toISOString().split('T')[0];
    populateCategoryDropdown('expense');
    document.getElementById('transaction-modal').classList.add('active');
  }

  function closeModal() {
    document.getElementById('transaction-modal').classList.remove('active');
  }

  // Filters
  let searchTimeout;
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { filters.search = e.target.value; currentPage = 1; loadTransactions(); }, 400);
  });
  document.getElementById('filter-type')?.addEventListener('change', (e) => { filters.type = e.target.value; currentPage = 1; loadTransactions(); });
  document.getElementById('filter-category')?.addEventListener('change', (e) => { filters.categoryId = e.target.value; currentPage = 1; loadTransactions(); });
  document.getElementById('filter-month')?.addEventListener('change', (e) => { filters.month = e.target.value; currentPage = 1; loadTransactions(); });
  document.getElementById('filter-sumber-dana')?.addEventListener('change', (e) => { filters.sumberDana = e.target.value; currentPage = 1; loadTransactions(); });
  document.getElementById('clear-filter-btn')?.addEventListener('click', () => {
    filters = { search: '', type: '', categoryId: '', month: '', sumberDana: '' };
    document.getElementById('search-input').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-month').value = '';
    document.getElementById('filter-sumber-dana').value = '';
    currentPage = 1;
    loadTransactions();
  });

  // Modal type change
  document.getElementById('modal-type')?.addEventListener('change', (e) => populateCategoryDropdown(e.target.value));

  // Form submit
  document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      type: document.getElementById('modal-type').value,
      description: document.getElementById('modal-description').value.trim(),
      amount: parseFloat(document.getElementById('modal-amount').value),
      date: document.getElementById('modal-date').value,
      category_id: document.getElementById('modal-category').value || null,
      sumber_dana: document.getElementById('modal-sumber-dana').value || 'bank',
    };
    try {
      if (editingId) { await updateTransaction(editingId, payload); showToast('Transaksi diperbarui!', 'success'); }
      else { await addTransaction(userId, payload); showToast('Transaksi ditambahkan!', 'success'); }
      closeModal();
      loadTransactions();
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });

  // Buttons
  document.getElementById('add-transaction-btn')?.addEventListener('click', openModal);
  document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);
  document.getElementById('transaction-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  // ── IMPORT EXCEL ───────────────────────────────
  let parsedRows = [];

  function setImportStep(step) {
    [1,2,3].forEach(n => {
      const el = document.getElementById(`import-step-${n}`);
      const stepEl = document.getElementById(`step-${n}`);
      if (el) el.style.display = n === step ? 'block' : 'none';
      if (stepEl) { stepEl.classList.remove('active','done'); if (n < step) stepEl.classList.add('done'); else if (n === step) stepEl.classList.add('active'); }
    });
  }

  function openImportModal() {
    parsedRows = [];
    document.getElementById('import-modal').classList.add('active');
    document.getElementById('import-confirm-btn').style.display = 'none';
    const fileInput = document.getElementById('import-file-input') || document.getElementById('excel-file-input');
    if (fileInput) fileInput.value = '';
    setImportStep(1);
  }

  function closeImportModal() { document.getElementById('import-modal').classList.remove('active'); }

  async function handleFileSelected(file) {
    if (!file) return;
    document.getElementById('import-confirm-btn').style.display = 'none';
    document.getElementById('import-step-1').style.display = 'none';
    document.getElementById('import-step-2').style.display = 'none';
    document.getElementById('import-step-3').style.display = 'none';
    document.getElementById('import-step-loading').style.display = 'block';

    try {
      const rawRows = await parseExcelFile(file);
      if (!rawRows.length) {
        document.getElementById('import-step-loading').style.display = 'none';
        document.getElementById('import-step-1').style.display = 'block';
        showToast('File kosong atau tidak ada data yang valid.', 'warning');
        return;
      }
      const categories = getAllCategories();
      parsedRows = await validateAndMapRows(rawRows, categories);
      document.getElementById('import-step-loading').style.display = 'none';

      const importable = parsedRows.filter(r => r.valid).length;
      document.getElementById('import-count').textContent = importable;

      const tbody = document.getElementById('import-preview-tbody');
      if (!tbody.dataset.listenerAdded) {
        tbody.addEventListener('click', async (e) => {
          const editBtn = e.target.closest('[data-action="edit-import"]');
          const saveBtn = e.target.closest('[data-action="save-import"]');
          if (editBtn) editImportRow(parseInt(editBtn.getAttribute('data-idx')));
          if (saveBtn) saveImportRow(parseInt(saveBtn.getAttribute('data-idx')));
        });
        tbody.dataset.listenerAdded = 'true';
      }
      renderImportPreview();
      document.getElementById('import-confirm-btn').style.display = importable > 0 ? 'flex' : 'none';
      setImportStep(2);
    } catch (err) {
      document.getElementById('import-step-loading').style.display = 'none';
      document.getElementById('import-step-1').style.display = 'block';
      showToast('Gagal baca file: ' + err.message, 'error');
    }
  }

  function renderImportPreview() {
    const tbody = document.getElementById('import-preview-tbody');
    tbody.innerHTML = parsedRows.map((r, i) => {
      const hasErr = !r.valid && !r.errors.every(e => e.includes('tidak ditemukan'));
      const hasWarn = r.errors.some(e => e.includes('tidak ditemukan'));
      const rowClass = hasErr ? 'has-error' : (hasWarn ? 'has-warning' : '');
      const statusIcon = hasErr ? '❌' : (hasWarn ? '⚠️' : '✅');
      const statusClass = hasErr ? 'err' : (hasWarn ? 'warn' : 'ok');
      const isIncome = r.type === 'income';
      const tooltip = r.errors.length ? r.errors.join(' | ') : '';
      return `<tr class="${rowClass}" title="${tooltip}" id="import-row-${i}">
        <td><div class="row-status ${statusClass}">${statusIcon}</div></td>
        <td id="preview-date-${i}">${r.date || '—'}</td>
        <td id="preview-desc-${i}" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r.description || '—'}</td>
        <td id="preview-type-${i}"><span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}" style="font-size:.7rem">${isIncome ? '↑ Masuk' : '↓ Keluar'}</span></td>
        <td id="preview-cat-${i}">${r.categoryIcon} ${r.categoryName}</td>
        <td id="preview-amount-${i}" style="text-align:right;font-weight:600;color:var(--${isIncome?'income':'expense'}-color)">${isIncome?'+':'-'}${formatCurrency(r.amount)}</td>
        <td style="text-align:center;" id="preview-action-${i}">
          <button type="button" class="btn-icon btn-ghost btn-sm" data-action="edit-import" data-idx="${i}" title="Edit">✏️</button>
        </td>
      </tr>`;
    }).join('');
  }

  function editImportRow(idx) {
    const row = parsedRows[idx];
    if (!row) return;
    const categories = getAllCategories();
    const catOptions = categories.map(c => `<option value="${c.id}" ${row.category_id === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('');
    document.getElementById(`preview-date-${idx}`).innerHTML = `<input type="date" id="edit-date-${idx}" value="${row.date}" style="width:110px;padding:2px;font-size:0.8rem;"/>`;
    document.getElementById(`preview-desc-${idx}`).innerHTML = `<input type="text" id="edit-desc-${idx}" value="${row.description || ''}" style="width:100%;padding:2px;font-size:0.8rem;"/>`;
    document.getElementById(`preview-type-${idx}`).innerHTML = `<select id="edit-type-${idx}" style="width:100px;padding:2px;font-size:0.8rem;"><option value="expense" ${row.type==='expense'?'selected':''}>Pengeluaran</option><option value="income" ${row.type==='income'?'selected':''}>Pemasukan</option></select>`;
    document.getElementById(`preview-cat-${idx}`).innerHTML = `<select id="edit-cat-${idx}" style="width:100%;padding:2px;font-size:0.8rem;"><option value="">- Kategori -</option>${catOptions}</select>`;
    document.getElementById(`preview-amount-${idx}`).innerHTML = `<input type="number" id="edit-amount-${idx}" value="${row.amount || ''}" style="width:80px;padding:2px;font-size:0.8rem;text-align:right;"/>`;
    document.getElementById(`preview-action-${idx}`).innerHTML = `<button type="button" class="btn-icon btn-ghost btn-sm" data-action="save-import" data-idx="${idx}" title="Simpan" style="color:var(--income-color);">💾</button>`;
  }

  function saveImportRow(idx) {
    const row = parsedRows[idx];
    if (!row) return;
    row.date = document.getElementById(`edit-date-${idx}`).value;
    row.description = document.getElementById(`edit-desc-${idx}`).value;
    row.type = document.getElementById(`edit-type-${idx}`).value;
    row.amount = parseFloat(document.getElementById(`edit-amount-${idx}`).value);
    row.category_id = document.getElementById(`edit-cat-${idx}`).value;
    const categories = getAllCategories();
    const cat = categories.find(c => c.id === row.category_id);
    if (cat) { row.categoryName = cat.name; row.categoryIcon = cat.icon; }
    const errors = [];
    if (!row.date) errors.push('Tanggal kosong');
    if (!row.amount || row.amount <= 0) errors.push('Jumlah tidak valid');
    if (!cat) errors.push('Kategori tidak valid');
    row.errors = errors;
    row.valid = errors.length === 0;
    const importable = parsedRows.filter(r => r.valid).length;
    document.getElementById('import-count').textContent = importable;
    document.getElementById('import-confirm-btn').style.display = importable > 0 ? 'flex' : 'none';
    renderImportPreview();
  }

  // Upload area
  const uploadArea = document.getElementById('upload-area');
  uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
  uploadArea?.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('drag-over'); handleFileSelected(e.dataTransfer?.files?.[0]); });
  uploadArea?.addEventListener('click', () => document.getElementById('import-file-input')?.click());
  document.getElementById('import-file-input')?.addEventListener('change', e => handleFileSelected(e.target.files?.[0]));

  document.getElementById('download-template-btn')?.addEventListener('click', () => downloadTemplate(getAllCategories()));

  document.getElementById('import-confirm-btn')?.addEventListener('click', async () => {
    const toImport = parsedRows.filter(r => r.valid);
    if (!toImport.length) { showToast('Tidak ada data yang bisa diimport.', 'warning'); return; }
    const btn = document.getElementById('import-confirm-btn');
    btn.disabled = true; btn.textContent = '⏳ Mengimport...';
    try {
      await bulkInsertTransactions(userId, toImport);
      document.getElementById('import-result-text').textContent = `${toImport.length} transaksi berhasil diimport! 🎉`;
      setImportStep(3);
      showToast(`${toImport.length} transaksi berhasil diimport!`, 'success');
      loadTransactions();
    } catch (err) {
      showToast('Gagal import: ' + err.message, 'error');
      btn.disabled = false; btn.textContent = '✅ Import Sekarang';
    }
  });

  document.getElementById('import-done-btn')?.addEventListener('click', closeImportModal);
  document.getElementById('import-excel-btn')?.addEventListener('click', openImportModal);
  document.getElementById('import-modal-close')?.addEventListener('click', closeImportModal);
  document.getElementById('import-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeImportModal(); });

  // Populate category filter
  const cats = getAllCategories();
  const catFilter = document.getElementById('filter-category');
  if (catFilter && cats.length) {
    catFilter.innerHTML = '<option value="">Semua Kategori</option>' + cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  populateMonthFilter();
  loadTransactions();
}

// ══════════════════════════════════════════════════════
// SECTION: BUDGET
// ══════════════════════════════════════════════════════
function initBudget() {
  let editingBudgetId = null;
  let currentYear, currentMonth;

  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth() + 1;
  const mm = String(currentMonth).padStart(2, '0');
  const monthInput = document.getElementById('budget-month');
  if (monthInput) monthInput.value = `${currentYear}-${mm}`;

  async function loadBudgets() {
    const budgets = await fetchBudgets(userId, currentYear, currentMonth);
    const spending = await fetchBudgetSpending(userId, currentYear, currentMonth);
    renderBudgetCards(budgets, spending, !!userId);
    updateBudgetSummary(budgets, spending);
  }

  // Event delegation for budget card actions
  document.getElementById('budget-grid')?.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.table-action-btn.edit');
    const deleteBtn = e.target.closest('.table-action-btn.delete');
    if (editBtn) {
      const onclick = editBtn.getAttribute('onclick');
      if (onclick) {
        const match = onclick.match(/editBudget\('(.+?)',\s*'(.+?)',\s*(\d+)\)/);
        if (match) {
          editingBudgetId = match[1];
          document.getElementById('budget-modal-title').textContent = 'Edit Budget';
          document.getElementById('budget-category-select').value = match[2];
          document.getElementById('budget-amount').value = match[3];
          document.getElementById('budget-modal').classList.add('active');
        }
      }
    }
    if (deleteBtn) {
      const onclick = deleteBtn.getAttribute('onclick');
      if (onclick) {
        const match = onclick.match(/confirmDeleteBudget\('(.+?)'\)/);
        if (match) {
          if (!confirm('Hapus budget ini?')) return;
          try { await deleteBudget(match[1]); showToast('Budget dihapus.', 'success'); loadBudgets(); }
          catch (e) { showToast('Gagal menghapus budget.', 'error'); }
        }
      }
    }
  });

  monthInput?.addEventListener('change', (e) => {
    if (!e.target.value) return;
    const [y, m] = e.target.value.split('-');
    currentYear = parseInt(y);
    currentMonth = parseInt(m);
    loadBudgets();
  });

  // Populate category dropdown
  (async () => {
    const cats = await fetchCategories(userId);
    const catSelect = document.getElementById('budget-category-select');
    const expCats = cats.filter(c => c.type === 'expense');
    if (catSelect) catSelect.innerHTML = '<option value="">-- Pilih Kategori --</option>' + expCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  })();

  function openBudgetModal() {
    editingBudgetId = null;
    document.getElementById('budget-modal-title').textContent = 'Tambah Budget';
    document.getElementById('budget-form').reset();
    document.getElementById('budget-modal').classList.add('active');
  }
  function closeBudgetModal() { document.getElementById('budget-modal').classList.remove('active'); }

  document.getElementById('budget-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const categoryId = document.getElementById('budget-category-select').value;
    const amount = parseFloat(document.getElementById('budget-amount').value);
    if (!categoryId || !amount) { showToast('Lengkapi semua kolom.', 'warning'); return; }
    try {
      await upsertBudget(userId, categoryId, amount, currentMonth, currentYear);
      showToast('Budget berhasil disimpan!', 'success');
      closeBudgetModal();
      loadBudgets();
    } catch (err) { showToast('Gagal menyimpan: ' + err.message, 'error'); }
  });

  document.getElementById('add-budget-btn')?.addEventListener('click', openBudgetModal);
  document.getElementById('budget-modal-close')?.addEventListener('click', closeBudgetModal);
  document.getElementById('budget-modal-cancel')?.addEventListener('click', closeBudgetModal);
  document.getElementById('budget-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeBudgetModal(); });

  loadBudgets();
}

// ══════════════════════════════════════════════════════
// SECTION: RAB
// ══════════════════════════════════════════════════════
async function initRab() {
  // Dynamically import rab.js init logic
  const rabModule = await import('./rab.js');
  // rab.js handles its own DOMContentLoaded — the DOM is already ready
  // So we trigger init manually if rab.js exports an init function
  if (typeof rabModule.initRab === 'function') {
    rabModule.initRab(userId);
  }
  // If rab.js uses DOMContentLoaded, it will fire since the DOM is already loaded
}

// ══════════════════════════════════════════════════════
// SECTION: REPORTS
// ══════════════════════════════════════════════════════
async function initReports() {
  const { renderReportBarChart, renderReportDonutChart, setupChartDefaults } = await import('./charts.js');
  const { renderReportTransactions, exportToPDF } = await import('./reports.js');

  let currentReportData = null;
  const user = await getOptionalUser();
  const currentUserName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pengguna';

  function populateMonthFilter() {
    const select = document.getElementById('report-month');
    if (!select) return;
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      months.push(`<option value="${val}">${label}</option>`);
    }
    select.innerHTML = `<option value="">Semua Bulan (All Time)</option>` + months.join('');
  }

  async function generateReport() {
    const monthInput = document.getElementById('report-month').value;
    let year = null, month = null;
    let periodLabel = 'Keseluruhan (All Time)';
    let transactionsFilter = {};
    if (monthInput) {
      [year, month] = monthInput.split('-').map(Number);
      periodLabel = new Date(year, month - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      transactionsFilter = { month: monthInput };
    }
    document.getElementById('report-period-label').textContent = periodLabel;

    const [summary, trend, breakdown, { data: transactions }] = await Promise.all([
      fetchMonthlySummary(userId, year, month),
      fetchMonthlyTrend(userId),
      fetchCategoryBreakdown(userId, year, month),
      fetchTransactions(userId, transactionsFilter, 1, 1000),
    ]);

    const balance = summary.income - summary.expense;
    document.getElementById('report-income').textContent = formatCurrency(summary.income);
    document.getElementById('report-expense').textContent = formatCurrency(summary.expense);
    document.getElementById('report-balance').textContent = formatCurrency(balance);
    document.getElementById('report-balance').style.color = balance >= 0 ? 'var(--income-color)' : 'var(--expense-color)';

    setupChartDefaults();
    renderReportBarChart('report-bar-chart', trend);
    renderReportDonutChart('report-donut-chart', breakdown);
    renderReportTransactions(transactions);

    currentReportData = { period: periodLabel, userName: currentUserName, income: summary.income, expense: summary.expense, balance, transactions, categoryBreakdown: breakdown };
    showToast('Laporan berhasil dimuat!', 'success');
  }

  async function handleExportPDF() {
    if (!currentReportData) { showToast('Tampilkan laporan terlebih dahulu sebelum export.', 'warning'); return; }
    try { showToast('Membuat PDF...', 'info'); await exportToPDF(currentReportData); showToast('PDF berhasil diunduh!', 'success'); }
    catch (err) { showToast('Gagal export PDF: ' + err.message, 'error'); }
  }

  populateMonthFilter();
  document.getElementById('generate-report-btn')?.addEventListener('click', generateReport);
  document.getElementById('export-pdf-btn')?.addEventListener('click', handleExportPDF);
  document.getElementById('export-pdf-btn-2')?.addEventListener('click', handleExportPDF);
  generateReport();
}

// ══════════════════════════════════════════════════════
// SECTION: SETTINGS
// ══════════════════════════════════════════════════════
async function initSettings() {
  const geminiInput = document.getElementById('gemini-key');
  const whatsappInput = document.getElementById('whatsapp-number');
  const savedKey = localStorage.getItem('gemini_api_key') || '';
  if (geminiInput) geminiInput.value = savedKey;

  const user = await getOptionalUser();
  if (user) {
    try {
      const { data: profile } = await supabaseClient.from('profiles').select('whatsapp_number').eq('id', user.id).maybeSingle();
      if (profile?.whatsapp_number && whatsappInput) whatsappInput.value = profile.whatsapp_number;
    } catch (err) { console.error('Failed to load profile settings:', err); }
  }

  document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const keyVal = geminiInput?.value.trim();
    const whatsappVal = whatsappInput?.value.trim();
    const whatsappClean = whatsappVal?.replace(/[^0-9]/g, '');
    try {
      localStorage.setItem('gemini_api_key', keyVal);
      if (user) {
        const { error } = await supabaseClient.from('profiles').update({ whatsapp_number: whatsappClean || null, updated_at: new Date().toISOString() }).eq('id', user.id);
        if (error) { showToast('Gagal menyimpan: ' + error.message, 'error'); return; }
      }
      showToast('Pengaturan berhasil disimpan!', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
  });
}

// ══════════════════════════════════════════════════════
// MAIN INIT
// ══════════════════════════════════════════════════════
async function main() {
  // Inject global style overrides for table transitions, zebra-striping and currency helpers
  const entryStyles = document.createElement('style');
  entryStyles.textContent = `
    .currency-helper-text {
      color: #10b981;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.25rem;
      display: block;
    }
    .page-section {
      animation: finFadeIn 0.3s ease-in-out;
    }
    @keyframes finFadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .transactions-table tbody tr:nth-child(even) {
      background: rgba(255, 255, 255, 0.02);
    }
    .transactions-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.04);
      transition: background 0.2s ease;
    }
  `;
  document.head.appendChild(entryStyles);

  // Global event delegation for monetary input currency formatting previews
  document.addEventListener('input', (e) => {
    const input = e.target;
    if (input && input.tagName === 'INPUT' && (input.type === 'number' || input.type === 'text')) {
      const id = input.id || '';
      const className = input.className || '';
      const dataTarget = input.getAttribute('data-target') || '';
      
      const isMoney = id.includes('nominal') || id.includes('val') || id.includes('spp') || 
                      id.includes('amount') || id.includes('biaya') || id.includes('harga') ||
                      className.includes('val') || className.includes('money') ||
                      dataTarget !== '';
                      
      if (isMoney) {
        let helper = input.parentElement.querySelector('.currency-helper-text');
        if (!helper) {
          helper = document.createElement('span');
          helper.className = 'currency-helper-text';
          input.parentElement.appendChild(helper);
        }
        const val = parseFloat(input.value) || 0;
        helper.textContent = val > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val) : '';
      }
    }
  });


  applySavedTheme();

  const user = await getOptionalUser();
  if (!user) {
    if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
    return;
  }

  userId = user.id;

  // Inject sidebar & topbar
  injectFinanceSidebar();
  const initialHash = window.location.hash.replace('#', '') || 'transactions';
  const config = TOPBAR_CONFIG[initialHash] || TOPBAR_CONFIG.transactions;
  injectTopbar('topbar', config);

  // Set user info
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna';
  
  // Role check for topbar & sidebar role text
  let roleLabel = 'Guru / Karyawan';
  const { data: roleData } = await supabaseClient.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  if (roleData) {
      if (roleData.role === 'admin') roleLabel = 'Admin Keuangan';
      else if (roleData.role === 'pembina') {
          roleLabel = 'Pembina';
          // Hide add buttons
          TOPBAR_CONFIG.transactions.rightHtml = '';
          TOPBAR_CONFIG.budget.rightHtml = '';
          // Also hide settings save button later
          const saveSettingsBtn = document.querySelector('#settings-form button[type="submit"]');
          if (saveSettingsBtn) saveSettingsBtn.style.display = 'none';

          // Inject CSS to hide all action buttons and columns globally
          const style = document.createElement('style');
          style.textContent = `
              .table-actions { display: none; }
              #transactions-table th:last-child, #transactions-table td:last-child, 
              #budget-table th:last-child, #budget-table td:last-child { display: none; }
              #add-transaction-btn, #add-budget-btn, #import-excel-btn, #generate-report-btn { display: none; }
              #settings-form button[type="submit"] { display: none; }
          `;
          document.head.appendChild(style);
      }
  }

  // Update TOPBAR again just in case it was already injected
  const newConfig = TOPBAR_CONFIG[initialHash] || TOPBAR_CONFIG.transactions;
  injectTopbar('topbar', newConfig);

  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('user-avatar', initials);
  set('nav-user-name', fullName);
  set('nav-user-email', user.email);
  set('sidebar-user-name', fullName);
  set('sidebar-user-role', roleLabel);
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // Mobile sidebar toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('show');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
  });
  document.getElementById('sidebar-close-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('show');
  });

  setupThemeToggle('theme-toggle');

  // Load categories once
  await fetchCategories(userId);

  // Navigate to initial section
  const validSections = ['transactions', 'budget', 'rab', 'reports', 'settings', 'syahriah'];
  const startSection = validSections.includes(initialHash) ? initialHash : 'transactions';

  // Show initial section
  document.querySelectorAll('.page-section').forEach(sec => { sec.style.display = 'none'; sec.classList.remove('active'); });
  const startEl = document.getElementById(`sec-${startSection}`);
  if (startEl) { startEl.style.display = 'block'; startEl.classList.add('active'); }
  currentSection = startSection;

  // Update sidebar active
  document.querySelectorAll('#nav-group-finance .nav-item').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector(`#nav-group-finance [data-target="${startSection}"]`);
  if (activeLink) activeLink.classList.add('active');

  // Init the starting section
  initSection(startSection);

  
  // Intercept click on finance nav items for instantaneous SPA switching
  document.addEventListener('click', (e) => {
    const link = e.target.closest('#nav-group-finance .nav-item');
    if (link) {
      const target = link.getAttribute('data-target');
      if (target && validSections.includes(target)) {
        e.preventDefault();
        navigateTo(target);
      }
    }
  });

  // Hash change listener
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (validSections.includes(hash)) navigateTo(hash);
  });
}

main();


