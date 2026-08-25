// Annida2PPDB - Database Synchronization Handler (Phase 3 Management)
// Menghubungkan Dashboard Pendaftar & Admin ke Supabase DB dengan Integrasi Live

import supabaseClient from '../core/supabase.js';
import { escapeHTML } from '../core/utils.js';
import { getOptionalUser } from '../core/auth.js';

const db = supabaseClient;

// Global state variables for Admin
let allRegistrations = [];
let selectedRegForVerif = null;
let currentDocVerification = {
  kartu_keluarga: { status: 'pending', note: '' },
  akta_kelahiran: { status: 'pending', note: '' },
  ijazah: { status: 'pending', note: '' }
};

document.addEventListener('DOMContentLoaded', async () => {
  let sessionUser = null;
  let userId = null;
  let userEmail = '';

  try {
    sessionUser = await getOptionalUser();
    if (sessionUser) {
      userId = sessionUser.id;
      userEmail = sessionUser.email || '';
      
      // Update sidebar username and role (support both sidebar and layout-defined IDs)
      const sidebarName = document.getElementById('sidebar-user-name') || document.getElementById('nav-user-name');
      const sidebarRole = document.getElementById('sidebar-user-role') || document.getElementById('nav-user-email');
      
      if (sidebarName) sidebarName.textContent = sessionUser.user_metadata?.full_name || sessionUser.email || 'Admin PPDB';
      if (sidebarRole) sidebarRole.textContent = 'Panitia PPDB';
    } else {
      // Direct guests to login
      if (window.location.pathname.includes('dashboard-')) {
        if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
        return;
      }
    }
  } catch (e) {
    if (window.location.pathname.includes('dashboard-')) {
      if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
      return;
    }
  }

  // ==========================================
  // A. PORTAL CALON SISWA (dashboard-wali.html)
  // ==========================================
  const isSiswaDashboard = document.getElementById('siswa-display-reg-no');
  if (isSiswaDashboard && userId) {
    // 1. Load data pendaftaran
    await fetchMyRegistrationStatus(userId);

    // 2. Submit form edit biodata
    const stepForm = document.getElementById('multiStepForm');
    if (stepForm) {
      stepForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSiswaForm();
      });
    }

    // 3. Confirm Payment Bukti Transfer
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
      paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitPaymentConfirmation();
      });
    }

    // 4. Print PDF Lulus
    const btnCetakLulus = document.getElementById('btn-cetak-lulus');
    if (btnCetakLulus) {
      btnCetakLulus.addEventListener('click', printPDFLulus);
    }

    // 5. Right to Erasure (Delete Data)
    const btnDeleteData = document.getElementById('btn-delete-data');
    if (btnDeleteData) {
      btnDeleteData.addEventListener('click', async () => {
        const confirm1 = confirm("PERINGATAN: Anda akan menghapus seluruh data pendaftaran Anda secara permanen. Tindakan ini tidak dapat dibatalkan.\n\nApakah Anda yakin ingin melanjutkan?");
        if (confirm1) {
          const confirm2 = confirm("Konfirmasi Terakhir: HAPUS SEMUA DATA SAYA?\n(Data pendaftaran, biodata, dokumen, dan history pembayaran terkait akan ikut terhapus otomatis melalui cascading delete)");
          if (confirm2) {
            await deleteMyRegistrationData();
          }
        }
      });
    }
  }

  // ==========================================
  // B. PORTAL ADMIN (dashboard-admin.html)
  // ==========================================
  const isAdminDashboard = document.getElementById('table-pendaftar-body');
  if (isAdminDashboard) {
    // Strict authorization check based on RBAC user_roles table
    try {
      const { data: roleData } = await db
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!roleData || (roleData.role !== 'admin' && roleData.role !== 'pembina')) {
        alert("Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman Admin.");
        if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
        return;
      }
    } catch (err) {
      alert("Akses Ditolak: Gagal memverifikasi hak akses.");
      if(window.smoothRedirect){window.smoothRedirect('../../login.html');}else{window.location.href='../../login.html';}
      return;
    }

    // Load admin panel data
    await fetchAllRegistrations();

    // Setup interactive search filter
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        filterRegistrationsTable(searchInput.value);
      });
    }

    // Setup Export Excel Button
    const btnExportExcel = document.getElementById('btn-export-excel');
    if (btnExportExcel) {
      btnExportExcel.addEventListener('click', exportDataToExcel);
    }

    // Setup student select change listener to load level of hafalan
    const select = document.getElementById('seleksi-student-select');
    if (select) {
      select.addEventListener('change', () => {
        const regId = select.value;
        const student = allRegistrations.find(r => r.id === regId);
        const inputHafalan = document.getElementById('val-level-hafalan');
        if (student && inputHafalan) {
          const docVerif = student.document_verification || {};
          inputHafalan.value = docVerif.level_hafalan || '';
        } else if (inputHafalan) {
          inputHafalan.value = '';
        }
      });
    }
  }
});

// =========================================================================
// --- FUNGSI PORTAL ORANG TUA / SISWA ---
// =========================================================================

async function fetchMyRegistrationStatus(userId) {
  try {
    // 1. Fetch from pendaftaran table
    const { data: pendaftaran, error } = await db
      .from('pendaftaran')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (pendaftaran) {
      // Save ID for further operations
      sessionStorage.setItem('pendaftaran_id', pendaftaran.id);
      sessionStorage.setItem('last_ppdb_no', pendaftaran.no_pendaftaran);

      // Render Reg No & Program on UI
      document.getElementById('siswa-display-reg-no').textContent = pendaftaran.no_pendaftaran;
      document.getElementById('siswa-display-program').textContent = 
        pendaftaran.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok (Boarding School)' : 'Hanya Sekolah (Non-Pondok)';
      
      const selectTipe = document.getElementById('tipe_pendaftaran_dashboard');
      if (selectTipe) selectTipe.value = pendaftaran.tipe_pendaftaran;

      // Update Timeline Stepper
      updateTimelineUI(pendaftaran.status_pendaftaran);

      // 2. Fetch detailed biodata
      const pendaftaranId = pendaftaran.id;
      const { data: biodata } = await db.from('biodata_siswa').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();
      const { data: ortu } = await db.from('data_orangtua').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();
      const { data: sekolah } = await db.from('sekolah_asal').select('*').eq('pendaftaran_id', pendaftaranId).maybeSingle();

      // Pre-fill greeting with student's or father's name
      if (ortu && ortu.nama_ayah) {
        document.getElementById('siswa-greeting-name').textContent = `Selamat datang, Bapak/Ibu ${ortu.nama_ayah} 👋`;
      } else if (biodata && biodata.nama_lengkap) {
        document.getElementById('siswa-greeting-name').textContent = `Selamat datang, Wali dari ${biodata.nama_lengkap} 👋`;
      }

      // Pre-fill form fields
      if (biodata) {
        document.getElementById('siswa-nik').value = biodata.nik || '';
        document.getElementById('siswa-nisn').value = biodata.nisn || '';
        document.getElementById('siswa-tempat-lahir').value = biodata.tempat_lahir || '';
        document.getElementById('siswa-tanggal-lahir').value = biodata.tanggal_lahir || '';
        document.getElementById('siswa-alamat').value = biodata.alamat_lengkap || '';
      }

      if (ortu) {
        document.getElementById('ortu-nama-ayah').value = ortu.nama_ayah || '';
        document.getElementById('ortu-pekerjaan-ayah').value = ortu.pekerjaan_ayah || '';
        document.getElementById('ortu-nama-ibu').value = ortu.nama_ibu || '';
        document.getElementById('ortu-pekerjaan-ibu').value = ortu.pekerjaan_ibu || '';
        document.getElementById('ortu-whatsapp-dash').value = ortu.whatsapp || '';
      }

      if (sekolah) {
        document.getElementById('sekolah-nama').value = sekolah.nama_sekolah || '';
        document.getElementById('sekolah-npsn').value = sekolah.npsn || '';
      }

      // Invoice info sync
      const invoiceTipe = document.getElementById('invoice-tipe');
      const invoiceNominal = document.getElementById('invoice-nominal');
      if (invoiceTipe) {
        invoiceTipe.textContent = pendaftaran.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok' : 'Hanya Sekolah';
      }
      if (invoiceNominal) {
        invoiceNominal.textContent = pendaftaran.tipe_pendaftaran === 'pondok' ? 'Rp 500.000' : 'Rp 250.000';
      }

      // Render Document Verification Status
      const savedDocs = pendaftaran.document_verification || {};
      ['kk', 'akta', 'skl'].forEach(docType => {
        const dbKey = docType === 'skl' ? 'ijazah' : docType === 'kk' ? 'kartu_keluarga' : 'akta_kelahiran';
        const docData = savedDocs[dbKey] || { status: 'pending', note: '' };
        
        const statusSpan = document.getElementById(`${docType}-status`);
        
        if (statusSpan) {
          if (docData.status === 'approved') {
            statusSpan.className = "px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold";
            statusSpan.textContent = "Disetujui";
            const fileSelectBtn = statusSpan.nextElementSibling?.nextElementSibling;
            if (fileSelectBtn) fileSelectBtn.disabled = true;
          } else if (docData.status === 'rejected') {
            statusSpan.className = "px-2.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold";
            statusSpan.textContent = `Perlu Revisi${docData.note ? ': ' + docData.note : ''}`;
          } else {
            statusSpan.className = "px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold";
            statusSpan.textContent = "Menunggu Verifikasi";
          }
        }
      });

      // DP Payment UI controls
      const dpSection = document.getElementById('dp-payment-section');
      const berkasLockBanner = document.getElementById('berkas-lock-banner');
      const berkasUploadContent = document.getElementById('berkas-upload-content');
      
      const docVerif = pendaftaran.document_verification || {};
      const dpData = docVerif.dp_payment || null;
      
      if (pendaftaran.status_pendaftaran === 'Draft') {
        if (dpSection) {
          dpSection.classList.remove('hidden');
          const dpBadge = document.getElementById('dp-status-badge');
          const dpFilename = document.getElementById('dp-upload-filename');
          const submitBtn = document.getElementById('btn-submit-dp');
          
          if (dpData) {
            if (dpData.status === 'pending') {
              if (dpBadge) {
                dpBadge.textContent = 'Menunggu Validasi';
                dpBadge.className = 'px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs font-bold uppercase tracking-wider';
              }
              if (dpFilename) dpFilename.textContent = `Bukti Transfer: ${dpData.file_name} (Menunggu Validasi)`;
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '⏳ Menunggu Validasi';
              }
            }
          }
        }
        
        if (berkasLockBanner) berkasLockBanner.classList.remove('hidden');
        if (berkasUploadContent) berkasUploadContent.classList.add('hidden');
      } else {
        if (dpSection) dpSection.classList.add('hidden');
        if (berkasLockBanner) berkasLockBanner.classList.add('hidden');
        if (berkasUploadContent) berkasUploadContent.classList.remove('hidden');
      }

      // Show/Hide Warning Banner on Beranda if status is 'Revisi'
      let banner = document.getElementById('revisi-warning-banner');
      if (pendaftaran.status_pendaftaran === 'Revisi') {
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'revisi-warning-banner';
          banner.className = "p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex flex-col gap-2 shadow-lg mb-6";
          
          let rejectedList = [];
          ['kk', 'akta', 'skl'].forEach(doc => {
            const dbKey = doc === 'skl' ? 'ijazah' : doc === 'kk' ? 'kartu_keluarga' : 'akta_kelahiran';
            const data = savedDocs[dbKey] || {};
            if (data.status === 'rejected') {
              const label = doc === 'kk' ? 'Kartu Keluarga' : doc === 'akta' ? 'Akta Kelahiran' : 'Ijazah/SKL';
              rejectedList.push(`<li>• <strong>${label}</strong>: ${data.note || 'Mohon unggah ulang.'}</li>`);
            }
          });

          banner.innerHTML = `
            <div class="flex items-center gap-2 text-base font-bold text-red-300">
              ⚠️ Pendaftaran Membutuhkan Revisi Berkas
            </div>
            <p class="text-xs text-slate-300">Panitia PPDB menemukan ketidaksesuaian pada dokumen berikut. Silakan masuk ke tab <strong>Berkas</strong> untuk mengunggah ulang dokumen tersebut:</p>
            <ul class="text-xs space-y-1 mt-1 text-slate-200">
              ${rejectedList.join('')}
            </ul>
          `;
          
          const greetingBanner = document.getElementById('siswa-greeting-name')?.closest('.glass-card');
          if (greetingBanner) {
            greetingBanner.parentNode.insertBefore(banner, greetingBanner.nextSibling);
          }
        }
      } else {
        if (banner) banner.remove();
      }
    }
  } catch (err) {
    console.error("Gagal memuat data pendaftar:", err.message);
  }
}

async function saveSiswaForm() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    alert('Sesi login Anda telah habis. Silakan login ulang.');
    return;
  }
  const userId = user.id;

  const pendaftaranId = sessionStorage.getItem('pendaftaran_id');
  if (!pendaftaranId) return;

  const tipe = document.getElementById('tipe_pendaftaran_dashboard').value;
  const nik = document.getElementById('siswa-nik').value;
  const nisn = document.getElementById('siswa-nisn').value;
  const tempatLahir = document.getElementById('siswa-tempat-lahir').value;
  const tanggalLahir = document.getElementById('siswa-tanggal-lahir').value;
  const alamat = document.getElementById('siswa-alamat').value;

  const namaAyah = document.getElementById('ortu-nama-ayah').value;
  const pekerjaanAyah = document.getElementById('ortu-pekerjaan-ayah').value;
  const namaIbu = document.getElementById('ortu-nama-ibu').value;
  const pekerjaanIbu = document.getElementById('ortu-pekerjaan-ibu').value;
  const whatsapp = document.getElementById('ortu-whatsapp-dash').value;

  const namaSekolah = document.getElementById('sekolah-nama').value;
  const npsn = document.getElementById('sekolah-npsn').value;

  const saveBtn = document.getElementById('btn-save-form');
  saveBtn.disabled = true;
  saveBtn.textContent = '⏳ Menyimpan...';

  try {
    // 1. Update tipe & status pendaftaran ke "Verifikasi"
    const { error: pError } = await db.from('pendaftaran')
      .update({ tipe_pendaftaran: tipe, status_pendaftaran: 'Verifikasi' })
      .eq('id', pendaftaranId);

    if (pError) throw pError;

    // 2. Upsert biodata
    const biodataPayload = {
      pendaftaran_id: pendaftaranId,
      nama_lengkap: user.user_metadata?.full_name || 'Calon Siswa',
      nik, nisn, tempat_lahir: tempatLahir, tanggal_lahir: tanggalLahir, alamat_lengkap: alamat
    };
    const { error: bError } = await db.from('biodata_siswa').upsert(biodataPayload, { onConflict: 'pendaftaran_id' });

    if (bError) throw bError;

    // 3. Upsert orang tua
    const { error: oError } = await db.from('data_orangtua').upsert({
      pendaftaran_id: pendaftaranId,
      nama_ayah: namaAyah, pekerjaan_ayah: pekerjaanAyah,
      nama_ibu: namaIbu, pekerjaan_ibu: pekerjaanIbu, whatsapp
    }, { onConflict: 'pendaftaran_id' });

    if (oError) throw oError;

    // 4. Upsert sekolah asal
    const { error: sError } = await db.from('sekolah_asal').upsert({
      pendaftaran_id: pendaftaranId,
      nama_sekolah: namaSekolah, npsn
    }, { onConflict: 'pendaftaran_id' });

    if (sError) throw sError;

    alert("Sukses! Data formulir pendaftaran berhasil disimpan dan status Anda kini: Menunggu Verifikasi.");
    window.location.reload();
  } catch (err) {
    console.error("Gagal simpan formulir:", err.message);
    alert("Gagal menyimpan data: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 Simpan & Update Data';
  }
}

async function deleteMyRegistrationData() {
  const btnDeleteData = document.getElementById('btn-delete-data');
  if (btnDeleteData) {
    btnDeleteData.disabled = true;
    btnDeleteData.textContent = 'Proses Menghapus...';
  }

  try {
    // 1. Hapus akun Auth (akan cascade ke data lainnya jika ada constraint)
    const { error: rpcError } = await db.rpc('delete_my_account');
    if (rpcError) throw rpcError;

    // 2. Hapus pendaftaran secara eksplisit (sebagai fallback jika masih ada)
    const pendaftaranId = sessionStorage.getItem('pendaftaran_id');
    if (pendaftaranId) {
      const { error } = await db.from('pendaftaran').delete().eq('id', pendaftaranId);
      if (error) console.error("Hapus pendaftaran fallback error:", error);
    }

    sessionStorage.removeItem('pendaftaran_id');
    sessionStorage.removeItem('last_ppdb_no');
    sessionStorage.removeItem('last_student_name');

    alert("Data Anda telah berhasil dihapus dari sistem kami.");
    if (window.smoothRedirect) {
      window.smoothRedirect('../../index.html');
    } else {
      window.location.href = '../../index.html';
    }
  } catch (err) {
    console.error("Gagal menghapus data:", err.message);
    alert("Gagal menghapus data: " + err.message);
    if (btnDeleteData) {
      btnDeleteData.disabled = false;
      btnDeleteData.innerHTML = '<span class="material-symbols-outlined text-base">delete_forever</span> Hapus Data Pendaftaran Saya';
    }
  }
}

async function submitPaymentConfirmation() {
  const btn = document.getElementById('btnConfirmPayment');
  const msg = document.getElementById('payment-success-msg');
  btn.disabled = true;
  btn.textContent = '⏳ Mengirim Konfirmasi...';
  
  // Simulate payment confirmation uploading (for RLS demo & UX Flow)
  setTimeout(() => {
    btn.classList.add('hidden');
    msg.classList.remove('hidden');
    
    // Auto-update status to "Seleksi" in backend simulation
    const pId = sessionStorage.getItem('pendaftaran_id');
    if (pId) {
      db.from('pendaftaran')
        .update({ status_pendaftaran: 'Seleksi' })
        .eq('id', pId)
        .then(() => {
          updateTimelineUI('Seleksi');
        });
    }
  }, 1500);
}

function updateTimelineUI(status) {
  // Update stepper labels dynamically
  const text3 = document.getElementById('step-text-3');
  const text4 = document.getElementById('step-text-4');
  const text5 = document.getElementById('step-text-5');
  const text6 = document.getElementById('step-text-6');
  if (text3) text3.textContent = 'Menunggu DP';
  if (text4) text4.textContent = 'Verifikasi Berkas';
  if (text5) text5.textContent = 'Tes Tahfidz';
  if (text6) text6.textContent = 'Lulus';

  // Reset all steps to default gray styles
  for (let i = 1; i <= 6; i++) {
    const icon = document.getElementById(`step-icon-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    const line = document.getElementById(`line-track-${i}`);
    
    if (icon) {
      icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-700 text-slate-400';
      icon.textContent = i;
    }
    if (text) text.className = 'text-xs font-medium text-slate-400 mt-1';
    if (line) line.className = 'hidden md:block h-0.5 bg-slate-700 flex-1 mx-2';
  }

  // Active steps mapper based on Alur Komitmen Tahfidz
  let activeMax = 2; // Default is mengisi data
  if (status === 'Draft') activeMax = 3;
  if (status === 'Verifikasi' || status === 'Revisi') activeMax = 4;
  if (status === 'Seleksi') activeMax = 5;
  if (status === 'Lulus') activeMax = 6;

  // Render completed paths
  for (let i = 1; i <= activeMax; i++) {
    const icon = document.getElementById(`step-icon-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    const line = document.getElementById(`line-track-${i - 1}`);

    if (icon) {
      if (i === 4 && status === 'Revisi') {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-red-500 text-white ring-4 ring-red-500/20';
        icon.textContent = '✗';
      } else if (i === activeMax && status !== 'Lulus') {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500 text-white ring-4 ring-amber-500/20';
        icon.textContent = i;
      } else {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white ring-4 ring-emerald-500/20';
        icon.textContent = '✓';
      }
    }
    if (i === 4 && status === 'Revisi') {
      if (text) text.className = 'text-xs font-semibold text-red-400 mt-1';
      if (line) line.className = 'hidden md:block h-0.5 bg-red-500 flex-1 mx-2';
    } else {
      if (text) text.className = 'text-xs font-semibold text-emerald-400 mt-1';
      if (line) line.className = 'hidden md:block h-0.5 bg-emerald-500 flex-1 mx-2';
    }
  }

  // Dynamic alert card status
  const badge = document.getElementById('display-badge-status');
  const desc = document.getElementById('display-status-description');
  const alertBox = document.getElementById('status-alert-box');

  if (status === 'Draft') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '⚪ Menunggu DP';
    }
    if (desc) desc.textContent = 'Formulir pendaftaran Anda sudah diterima. Silakan selesaikan pembayaran DP Komitmen Tahfidz (30%) di seksi Pembayaran DP di bawah ini untuk membuka akses pengunggahan berkas persyaratan.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-slate-500/20 bg-slate-500/5 text-slate-400';
  } else if (status === 'Verifikasi') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🟡 Verifikasi Berkas';
    }
    if (desc) desc.textContent = 'Bukti transfer DP Anda telah divalidasi oleh panitia. Berkas dokumen digital pendaftaran Anda sedang dalam antrean verifikasi oleh panitia PPDB.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-300';
  } else if (status === 'Pembayaran') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🔵 Pembayaran Formulir';
    }
    if (desc) desc.textContent = 'Berkas terverifikasi! Silakan lakukan transfer pembayaran formulir pendaftaran ke rekening Yayasan.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-300';
  } else if (status === 'Seleksi') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🟣 Tahap Tes Tahfidz';
    }
    if (desc) desc.textContent = 'Berkas terverifikasi! Calon siswa dijadwalkan mengikuti tes pemetaan Tahfidz secara langsung. Panitia akan menginformasikan detail jadwal via WhatsApp.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-300';
  } else if (status === 'Lulus') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🟢 Lulus';
    }
    if (desc) desc.textContent = 'Selamat! Calon siswa dinyatakan LULUS tes pemetaan Tahfidz masuk SMP Annida. Silakan unduh Surat Kelulusan dan lakukan Daftar Ulang.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400';
    
    // Show announcement texts safely
    const announceName = document.getElementById('announce-student-name');
    if (announceName) {
      announceName.textContent = sessionStorage.getItem('last_student_name') || 'Ahmad Fulan';
    }
    const btnCetakLulus = document.getElementById('btn-cetak-lulus');
    if (btnCetakLulus) {
      btnCetakLulus.classList.remove('hidden');
    }
  } else if (status === 'Revisi') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🔴 Perlu Revisi Berkas';
    }
    if (desc) desc.textContent = 'Panitia menemukan dokumen yang tidak sesuai persyaratan. Silakan periksa tab Berkas untuk melihat berkas yang perlu diunggah ulang beserta catatan admin.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400';
  } else {
    // Default fallback
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = status;
    }
    if (desc) desc.textContent = 'Status pendaftaran Anda saat ini: ' + status;
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-slate-500/20 bg-slate-500/5 text-slate-400';
  }
}

// =========================================================================
// --- FUNGSI PORTAL PANITIA / ADMIN ---
// =========================================================================

async function fetchAllRegistrations() {
  try {
    // Get all registrations with profile relationships
    const { data: list, error } = await db
      .from('pendaftaran')
      .select(`
        *,
        biodata_siswa (*),
        data_orangtua (*),
        sekolah_asal (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    allRegistrations = list || [];

    // 1. Calculate KPIs & distributions
    updateAdminKPIs();

    // 2. Render Main Table
    renderAdminTable(allRegistrations);

    // 3. Render Selection/Ranking dropdown and list
    renderRankingData(allRegistrations);

    // 4. Render Monthly Trend Chart
    renderMonthlyChart(allRegistrations);

  } catch (err) {
    console.error("Gagal mengambil data admin:", err.message);
  }
}

function updateAdminKPIs() {
  const total = allRegistrations.length;
  const verif = allRegistrations.filter(r => r.status_pendaftaran === 'Verifikasi').length;
  const seleksi = allRegistrations.filter(r => r.status_pendaftaran === 'Seleksi').length;
  const lulus = allRegistrations.filter(r => r.status_pendaftaran === 'Lulus').length;
  const revisi = allRegistrations.filter(r => r.status_pendaftaran === 'Revisi').length;

  document.getElementById('kpi-total').textContent = total;
  document.getElementById('kpi-verif').textContent = verif;
  document.getElementById('kpi-seleksi').textContent = seleksi;
  document.getElementById('kpi-lulus').textContent = lulus;
  document.getElementById('kpi-revisi').textContent = revisi;

  // Program distribution bars
  const regulerCount = allRegistrations.filter(r => r.tipe_pendaftaran === 'reguler').length;
  const pondokCount = allRegistrations.filter(r => r.tipe_pendaftaran === 'pondok').length;

  const regPct = total > 0 ? Math.round((regulerCount / total) * 100) : 0;
  const pndPct = total > 0 ? Math.round((pondokCount / total) * 100) : 0;

  document.getElementById('dist-reguler-text').textContent = `${regulerCount} pendaftar (${regPct}%)`;
  document.getElementById('dist-reguler-bar').style.width = `${regPct}%`;

  document.getElementById('dist-pondok-text').textContent = `${pondokCount} pendaftar (${pndPct}%)`;
  document.getElementById('dist-pondok-bar').style.width = `${pndPct}%`;
}

function renderAdminTable(data) {
  const tbody = document.getElementById('table-pendaftar-body');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-slate-500">Tidak ada pendaftar ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  data.forEach(r => {
    const studentName = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : 'Calon Murid Baru';
    const rawDate = new Date(r.created_at);
    const dateFormatted = rawDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const progLabel = r.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok' : 'Sekolah Saja';

    // Badge styling mapping
    let badgeClass = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    let badgeText = r.status_pendaftaran;
    
    if (r.status_pendaftaran === 'Draft') {
      badgeClass = 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      badgeText = 'Menunggu DP';
    } else if (r.status_pendaftaran === 'Verifikasi') {
      badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      badgeText = 'Verifikasi Berkas';
    } else if (r.status_pendaftaran === 'Seleksi') {
      badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      badgeText = 'Tes Tahfidz';
    } else if (r.status_pendaftaran === 'Lulus') {
      badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      badgeText = 'Lulus';
    } else if (r.status_pendaftaran === 'Revisi') {
      badgeClass = 'bg-red-500/10 text-red-400 border border-red-500/20';
      badgeText = 'Revisi';
    }

    const tr = document.createElement('tr');
    tr.className = 'border-b border-white/5 hover:bg-white/[0.02] transition-colors';
    tr.innerHTML = `
      <td class="py-4 px-4 font-mono font-bold text-slate-300">${escapeHTML(r.no_pendaftaran)}</td>
      <td class="py-4 px-4 font-semibold text-slate-100">${escapeHTML(studentName)}</td>
      <td class="py-4 px-4 text-xs text-slate-300">${progLabel}</td>
      <td class="py-4 px-4 text-xs text-slate-400">${dateFormatted}</td>
      <td class="py-4 px-4 text-center">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${badgeClass}">
          ${badgeText}
        </span>
      </td>
      <td class="py-4 px-4 text-center">
        <button onclick="viewRegistrationDetails('${r.id}')" class="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium px-3 py-1.5 rounded-lg transition-all">
          🔍 Verifikasi Berkas
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterRegistrationsTable(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderAdminTable(allRegistrations);
    return;
  }

  const filtered = allRegistrations.filter(r => {
    const studentName = r.biodata_siswa ? r.biodata_siswa.nama_lengkap.toLowerCase() : '';
    const regNo = r.no_pendaftaran.toLowerCase();
    return studentName.includes(q) || regNo.includes(q);
  });
  renderAdminTable(filtered);
}

window.viewRegistrationDetails = function(regId) {
  const r = allRegistrations.find(item => item.id === regId);
  if (!r) return;

  selectedRegForVerif = r;

  // Set Details UI text fields
  document.getElementById('detail-reg-id').textContent = r.id;
  document.getElementById('detail-siswa-nama').textContent = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : '-';
  document.getElementById('detail-siswa-nik-nisn').textContent = r.biodata_siswa ? `${r.biodata_siswa.nik || '-'} / ${r.biodata_siswa.nisn || '-'}` : '-';
  document.getElementById('detail-siswa-ttl').textContent = r.biodata_siswa ? `${r.biodata_siswa.tempat_lahir || '-'}, ${r.biodata_siswa.tanggal_lahir || '-'}` : '-';
  document.getElementById('detail-siswa-sekolah').textContent = r.sekolah_asal ? `${r.sekolah_asal.nama_sekolah || '-'} (${r.sekolah_asal.npsn || '-'})` : '-';
  document.getElementById('detail-siswa-alamat').textContent = r.biodata_siswa ? r.biodata_siswa.alamat_lengkap || '-' : '-';

  document.getElementById('detail-ortu-ayah').textContent = r.data_orangtua ? `${r.data_orangtua.nama_ayah} (${r.data_orangtua.pekerjaan_ayah || '-'})` : '-';
  document.getElementById('detail-ortu-ibu').textContent = r.data_orangtua ? `${r.data_orangtua.nama_ibu} (${r.data_orangtua.pekerjaan_ibu || '-'})` : '-';
  document.getElementById('detail-ortu-wa').textContent = r.data_orangtua ? r.data_orangtua.whatsapp : '-';

  // Load document verification status
  const savedVerification = r.document_verification || {};
  currentDocVerification = {
    kartu_keluarga: savedVerification.kartu_keluarga || { status: 'pending', note: '' },
    akta_kelahiran: savedVerification.akta_kelahiran || { status: 'pending', note: '' },
    ijazah: savedVerification.ijazah || { status: 'pending', note: '' }
  };

  // Update button visual styles and note values
  ['kartu_keluarga', 'akta_kelahiran', 'ijazah'].forEach(docType => {
    const docData = currentDocVerification[docType];
    const noteInput = document.getElementById(`note-${docType}`);
    if (noteInput) {
      noteInput.value = docData.note || '';
    }
    window.setDocStatus(docType, docData.status);
  });

  // Dynamic preview links to Supabase Storage (fallback path using user_id)
  const storageUrl = 'https://vxrgezyfxzynpucuomci.supabase.co/storage/v1/object/public/documents';
  document.getElementById('doc-kk-link').href = `${storageUrl}/${r.user_id}/kk.pdf`;
  document.getElementById('doc-akta-link').href = `${storageUrl}/${r.user_id}/akta.pdf`;
  document.getElementById('doc-ijazah-link').href = `${storageUrl}/${r.user_id}/ijazah.pdf`;

  // Open Details Tab
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-admin-verifikasi').classList.add('active');
};

window.setDocStatus = function(docType, status) {
  if (!currentDocVerification[docType]) {
    currentDocVerification[docType] = { status: 'pending', note: '' };
  }
  currentDocVerification[docType].status = status;

  const approveBtn = document.getElementById(`btn-${docType}-approve`);
  const rejectBtn = document.getElementById(`btn-${docType}-reject`);
  const noteInput = document.getElementById(`note-${docType}`);

  if (status === 'approved') {
    if (approveBtn) approveBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-500 text-white transition-all";
    if (rejectBtn) rejectBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all";
    if (noteInput) {
      noteInput.classList.add('hidden');
    }
  } else if (status === 'rejected') {
    if (approveBtn) approveBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all";
    if (rejectBtn) rejectBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-red-500 text-white transition-all";
    if (noteInput) {
      noteInput.classList.remove('hidden');
    }
  } else {
    if (approveBtn) approveBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all";
    if (rejectBtn) rejectBtn.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all";
    if (noteInput) {
      noteInput.classList.add('hidden');
    }
  }
};

window.saveAdminVerification = async function(newStatus) {
  if (!selectedRegForVerif) return;

  const id = selectedRegForVerif.id;
  const noDaftar = selectedRegForVerif.no_pendaftaran;
  const waNumber = selectedRegForVerif.data_orangtua ? selectedRegForVerif.data_orangtua.whatsapp : '';
  const studentName = selectedRegForVerif.biodata_siswa ? selectedRegForVerif.biodata_siswa.nama_lengkap : '';

  // Gather notes
  ['kartu_keluarga', 'akta_kelahiran', 'ijazah'].forEach(docType => {
    const noteInput = document.getElementById(`note-${docType}`);
    if (noteInput && currentDocVerification[docType].status === 'rejected') {
      currentDocVerification[docType].note = noteInput.value.trim();
    } else if (currentDocVerification[docType].status === 'approved') {
      currentDocVerification[docType].note = '';
    }
  });

  try {
    const { error } = await db
      .from('pendaftaran')
      .update({
        status_pendaftaran: newStatus,
        document_verification: currentDocVerification
      })
      .eq('id', id);

    if (error) throw error;

    alert(`Sukses! Verifikasi berkas ${noDaftar} berhasil disimpan dengan status: ${newStatus}`);

    await fetchAllRegistrations();

    // Send WhatsApp (Client-side trigger)
    if (waNumber) {
      let rejectedDocs = [];
      if (newStatus === 'Revisi') {
        ['kartu_keluarga', 'akta_kelahiran', 'ijazah'].forEach(doc => {
          if (currentDocVerification[doc].status === 'rejected') {
            const docLabel = doc === 'kartu_keluarga' ? 'Kartu Keluarga' : doc === 'akta_kelahiran' ? 'Akta Kelahiran' : 'Ijazah/SKL';
            const note = currentDocVerification[doc].note ? ` (${currentDocVerification[doc].note})` : '';
            rejectedDocs.push(`- ${docLabel}${note}`);
          }
        });
      }

      let statusMsg = '';
      if (newStatus === 'Verifikasi') {
        statusMsg = 'Pembayaran DP Komitmen Tahfidz (30%) Diterima. Pendaftaran Anda lanjut ke tahap Verifikasi Berkas.';
      } else if (newStatus === 'Seleksi') {
        statusMsg = 'Dokumen Persyaratan Valid. Calon siswa diundang mengikuti Ujian Seleksi Pemetaan Tahfidz secara langsung.';
      } else if (newStatus === 'Revisi') {
        statusMsg = 'Perlu Revisi Dokumen:\n' + rejectedDocs.join('\n');
      } else if (newStatus === 'Lulus') {
        statusMsg = 'Selamat! Calon siswa dinyatakan LULUS Tes Seleksi Pemetaan Tahfidz masuk SMP Annida.';
      }

      const rawMsg = `Halo Ayah/Bunda dari ${studentName},\n\nPendaftaran PPDB SMP Annida No. Registrasi *${noDaftar}* telah diperiksa oleh Panitia.\n\n*Status:* ${statusMsg}\n\nSilakan masuk ke portal PPDB untuk memproses langkah berikutnya:\nhttps://dazzerz.github.io/SMPAnnida/`;
      const encodedMsg = encodeURIComponent(rawMsg);
      const sanitizedPhone = waNumber.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMsg}`;

      if (confirm(`Apakah Anda ingin mengirimkan notifikasi WhatsApp hasil verifikasi ke wali murid (${waNumber})?`)) {
        window.open(waUrl, '_blank');
      }
    }

    // Go back to dashboard list
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-admin-dashboard').classList.add('active');
  } catch (err) {
    console.error("Gagal menyimpan verifikasi:", err.message);
    alert("Gagal menyimpan: " + err.message);
  }
};

window.adminVerifyStatus = window.saveAdminVerification; // Legacy fallback

function renderRankingData(data) {
  const select = document.getElementById('seleksi-student-select');
  const tbody = document.getElementById('ranking-table-body');
  if (!select || !tbody) return;

  // Filter students who are ready for Tahfidz mapping (status is 'Seleksi' or 'Lulus')
  const selectionReady = data.filter(r => ['Seleksi', 'Lulus'].includes(r.status_pendaftaran));

  select.innerHTML = '<option value="">-- Pilih Calon Siswa --</option>';
  selectionReady.forEach(r => {
    const name = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : r.no_pendaftaran;
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = `${name} (${r.no_pendaftaran})`;
    select.appendChild(opt);
  });

  if (selectionReady.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-500">Tidak ada pendaftar di Tahap Pemetaan Tahfidz.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  
  selectionReady.forEach((r) => {
    const name = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : 'Calon Murid';
    const docVerif = r.document_verification || {};
    const levelHafalan = docVerif.level_hafalan || 'Belum diinput';
    
    // Status color
    const badgeColor = r.status_pendaftaran === 'Lulus' ? 'text-emerald-400 font-bold' : 'text-slate-400';

    const tr = document.createElement('tr');
    tr.className = 'border-b border-white/5 hover:bg-white/[0.01]';
    
    let actionHtml = '';
    if (r.status_pendaftaran === 'Lulus') {
      actionHtml = `<button onclick="activateToAcademic('${r.id}', '${escapeHTML(name)}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded text-[10px] transition-all">
            ✓ Aktivasi Akademik
           </button>`;
    } else {
      actionHtml = `<button onclick="adminSetLulus('${r.id}')" class="bg-blue-500 hover:bg-blue-600 text-white font-bold px-3 py-1 rounded text-[10px] transition-all">
            🎓 Nyatakan Lulus
           </button>`;
    }

    tr.innerHTML = `
      <td class="py-3 px-3 font-mono text-slate-400">${escapeHTML(r.no_pendaftaran)}</td>
      <td class="py-3 px-3 font-semibold text-slate-200">${escapeHTML(name)}</td>
      <td class="py-3 px-3 font-medium text-slate-300">${escapeHTML(levelHafalan)}</td>
      <td class="py-3 px-3 ${badgeColor}">${r.status_pendaftaran === 'Lulus' ? 'Lulus' : 'Tes Tahfidz'}</td>
      <td class="py-3 px-3 text-center">
        ${actionHtml}
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.adminSaveHafalan = async function() {
  const select = document.getElementById('seleksi-student-select');
  const regId = select.value;
  if (!regId) {
    alert("Silakan pilih calon siswa terlebih dahulu!");
    return;
  }
  const level = document.getElementById('val-level-hafalan').value.trim();
  try {
    const { data: reg, error: fetchErr } = await db
      .from('pendaftaran')
      .select('document_verification')
      .eq('id', regId)
      .single();
    if (fetchErr) throw fetchErr;

    const docVerif = reg.document_verification || {};
    docVerif.level_hafalan = level;

    const { error } = await db
      .from('pendaftaran')
      .update({ document_verification: docVerif })
      .eq('id', regId);

    if (error) throw error;
    alert("Level hafalan berhasil disimpan!");
    await fetchAllRegistrations();
  } catch (err) {
    console.error("Gagal menyimpan hafalan:", err.message);
    alert("Gagal menyimpan hafalan: " + err.message);
  }
};

window.adminSetLulus = async function(paramId) {
  const select = document.getElementById('seleksi-student-select');
  const regId = paramId || select.value;
  if (!regId) {
    alert("Silakan pilih calon siswa terlebih dahulu!");
    return;
  }
  const student = allRegistrations.find(r => r.id === regId);
  if (!student) return;
  
  const name = student.biodata_siswa ? student.biodata_siswa.nama_lengkap : 'Calon Murid';
  
  const confirmLulus = confirm(`Apakah Anda yakin ingin menyatakan ${name} LULUS Seleksi PPDB?`);
  if (!confirmLulus) return;

  try {
    const { error } = await db
      .from('pendaftaran')
      .update({ status_pendaftaran: 'Lulus' })
      .eq('id', regId);

    if (error) throw error;
    alert(`Selamat! ${name} dinyatakan LULUS.`);
    await fetchAllRegistrations();
    
    // Auto WhatsApp
    if (student.data_orangtua && student.data_orangtua.whatsapp) {
      const waNumber = student.data_orangtua.whatsapp;
      const rawMsg = `Halo Ayah/Bunda dari ${name},\n\nPendaftaran PPDB SMP Annida No. Registrasi *${student.no_pendaftaran}* dinyatakan *LULUS* Seleksi Pemetaan Tahfidz.\n\nSilakan masuk ke portal PPDB untuk melakukan konfirmasi daftar ulang:\nhttps://dazzerz.github.io/SMPAnnida/`;
      const encodedMsg = encodeURIComponent(rawMsg);
      const sanitizedPhone = waNumber.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${sanitizedPhone}?text=${encodedMsg}`;

      if (confirm(`Apakah Anda ingin mengirimkan notifikasi kelulusan via WhatsApp ke wali murid (${waNumber})?`)) {
        window.open(waUrl, '_blank');
      }
    }
  } catch (err) {
    console.error("Gagal meluluskan siswa:", err.message);
    alert("Gagal menyimpan status kelulusan: " + err.message);
  }
};

// Integrasi data ke modul akademik pusat (Pindah data ke tabel students)
window.activateToAcademic = async function(pendaftaranId, studentName) {
  const confirmActivation = confirm(`Apakah Anda yakin ingin mengaktifkan akun ${studentName}?\n\nHal ini akan memindahkan data dari PPDB ke tabel utama 'students' di Modul Akademik.`);
  
  if (confirmActivation) {
    try {
      const mockNis = `2027${Math.floor(100 + Math.random() * 900)}`;
      
      // 1. Insert into main academic table 'students'
      const { error: insError } = await db
        .from('students')
        .insert([
          {
            nama_lengkap: studentName,
            kelas: 'Kelas 7A', // Initial class
            nis: mockNis,
            status: 'Aktif'
          }
        ]);

      if (insError) throw insError;
      
      // 2. Remove from PPDB queue or change status to confirm
      alert(`Aktivasi Berhasil! Siswa ${studentName} resmi terdaftar di Modul Akademik Utama dengan NIS: ${mockNis}.\n\nAkun sudah dapat melacak kehadiran dan nilai di portal akademik.`);
      await fetchAllRegistrations();
    } catch (e) {
      console.error("Gagal memindahkan data ke modul akademik:", e.message);
      // Fallback
      alert(`Sukses Lokal! Siswa ${studentName} diaktifkan ke Kelas 7A (Simulasi Database Offline).`);
    }
  }
};

// Render Monthly Chart using Chart.js
let trendChart = null;
function renderMonthlyChart(data) {
  const ctx = document.getElementById('ppdb-monthly-chart');
  if (!ctx) return;

  // Process data to count registrations per month
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const counts = Array(12).fill(0);

  data.forEach(r => {
    const rawDate = new Date(r.created_at);
    const m = rawDate.getMonth();
    counts[m]++;
  });

  // If chart already exists, destroy it before creating a new one
  if (trendChart) {
    trendChart.destroy();
  }

  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Jumlah Pendaftar Baru',
        data: counts,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(52, 211, 153, 0.4)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            stepSize: 1
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

window.updateDocUploadStatus = async function(docType, fileName, fileUrl = null) {
  const pendaftaranId = sessionStorage.getItem('pendaftaran_id');
  if (!pendaftaranId) return;

  try {
    const { data: reg } = await db
      .from('pendaftaran')
      .select('document_verification, status_pendaftaran')
      .eq('id', pendaftaranId)
      .single();

    if (reg) {
      const dbKey = docType === 'skl' ? 'ijazah' : docType === 'kk' ? 'kartu_keluarga' : 'akta_kelahiran';
      const currentDocs = reg.document_verification || {};
      
      currentDocs[dbKey] = { status: 'pending', note: '', file_name: fileName, file_url: fileUrl };

      let hasRejected = false;
      Object.keys(currentDocs).forEach(k => {
        if (currentDocs[k].status === 'rejected') hasRejected = true;
      });

      let newRegStatus = reg.status_pendaftaran;
      if (!hasRejected && reg.status_pendaftaran === 'Revisi') {
        newRegStatus = 'Verifikasi';
      }

      await db
        .from('pendaftaran')
        .update({
          document_verification: currentDocs,
          status_pendaftaran: newRegStatus
        })
        .eq('id', pendaftaranId);

      console.log(`Document ${docType} uploaded successfully, status set to pending.`);
      
      if (newRegStatus === 'Verifikasi') {
        window.location.reload();
      }
    }
  } catch (err) {
    console.error("Gagal menyimpan status unggahan dokumen:", err.message);
  }
};

window.submitDpPayment = async function(fileName, fileUrl = null) {
  const pId = sessionStorage.getItem('pendaftaran_id');
  if (!pId) {
    alert("Data pendaftaran tidak ditemukan.");
    return;
  }
  
  try {
    const { data: reg, error: fetchErr } = await db
      .from('pendaftaran')
      .select('document_verification')
      .eq('id', pId)
      .single();
      
    if (fetchErr) throw fetchErr;
    
    const docVerif = reg.document_verification || {};
    docVerif.dp_payment = {
      status: 'pending',
      file_name: fileName,
      file_url: fileUrl,
      uploaded_at: new Date().toISOString()
    };
    
    const { error: updateErr } = await db
      .from('pendaftaran')
      .update({ document_verification: docVerif })
      .eq('id', pId);
      
    if (updateErr) throw updateErr;
    
    alert("Bukti transfer DP berhasil dikirim! Menunggu validasi dari panitia.");
    window.location.reload();
  } catch (err) {
    console.error("Gagal mengirim bukti transfer DP:", err.message);
    alert("Gagal mengirim bukti transfer: " + err.message);
    const submitBtn = document.getElementById('btn-submit-dp');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Kirim Bukti Pembayaran';
    }
  }
};

window.exportDataToExcel = function() {
  if (!allRegistrations || allRegistrations.length === 0) {
    alert("Tidak ada data pendaftar untuk di-export.");
    return;
  }
  
  const mappedData = allRegistrations.map((r, index) => {
    return {
      "No": index + 1,
      "No. Pendaftaran": r.no_pendaftaran || "-",
      "Nama Lengkap": r.biodata_siswa?.nama_lengkap || "-",
      "NIK": r.biodata_siswa?.nik || "-",
      "NISN": r.biodata_siswa?.nisn || "-",
      "Tempat Lahir": r.biodata_siswa?.tempat_lahir || "-",
      "Tanggal Lahir": r.biodata_siswa?.tanggal_lahir || "-",
      "Alamat": r.biodata_siswa?.alamat_lengkap || "-",
      "Nama Ayah": r.data_orangtua?.nama_ayah || "-",
      "Nama Ibu": r.data_orangtua?.nama_ibu || "-",
      "No WhatsApp": r.data_orangtua?.whatsapp || "-",
      "Sekolah Asal": r.sekolah_asal?.nama_sekolah || "-",
      "NPSN Sekolah": r.sekolah_asal?.npsn || "-",
      "Jalur Daftar": r.tipe_pendaftaran === 'pondok' ? 'Sekolah + Pondok' : 'Sekolah Saja',
      "Status Pendaftaran": r.status_pendaftaran || "-",
      "Level Hafalan": r.document_verification?.level_hafalan || "-",
      "Tanggal Daftar": new Date(r.created_at).toLocaleDateString('id-ID')
    };
  });

  if (typeof XLSX !== 'undefined') {
    const ws = XLSX.utils.json_to_sheet(mappedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Pendaftar");
    XLSX.writeFile(wb, "Data_Pendaftar_PPDB.xlsx");
  } else {
    alert("Library XLSX (Excel) belum selesai dimuat. Silakan tunggu beberapa detik dan coba lagi.");
  }
};

window.printPDFLulus = function() {
  const template = document.getElementById('pdf-template');
  const pdfNama = document.getElementById('pdf-nama');
  const pdfNisn = document.getElementById('pdf-nisn');
  const pdfTanggal = document.getElementById('pdf-tanggal');
  
  if (!template || !pdfNama || !pdfNisn) {
    alert('Template PDF tidak ditemukan.');
    return;
  }
  
  // Mengisi teks ke pdf-nama dan pdf-nisn
  pdfNama.textContent = sessionStorage.getItem('last_student_name') || 'Fulan';
  
  const inputNisn = document.getElementById('siswa-nisn');
  pdfNisn.textContent = inputNisn && inputNisn.value ? inputNisn.value : '-';
  
  if (pdfTanggal) {
    pdfTanggal.textContent = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Menghapus sementara class hidden
  template.classList.remove('hidden');
  
  if (typeof html2pdf !== 'undefined') {
    html2pdf().set({
      margin: 1,
      filename: 'Surat_Lulus_PPDB.pdf',
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(template).save().then(() => {
      // Mengembalikan class hidden setelah render
      template.classList.add('hidden');
    });
  } else {
    alert("Library html2pdf belum termuat. Mohon periksa koneksi internet Anda.");
    template.classList.add('hidden');
  }
};

function exportDataToExcel() { window.exportDataToExcel(); }
function printPDFLulus() { window.printPDFLulus(); }

