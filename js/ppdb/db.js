// Annida2PPDB - Database Synchronization Handler (Phase 3 Management)
// Menghubungkan Dashboard Pendaftar & Admin ke Supabase DB dengan Integrasi Live

import supabaseClient from '../core/supabase.js';
import { escapeHTML, showToast } from '../core/utils.js';
import { getOptionalUser } from '../core/auth.js';
import { decryptNik, encryptNik } from './nik-crypto.js';

const db = supabaseClient;

// Global state variables for Admin
let allRegistrations = [];
let selectedRegForVerif = null;

// Endpoint Google Apps Script yang sama dengan dashboard-wali.html (upload ke Drive).
const GAS_UPLOAD_URL = 'https://script.google.com/macros/s/AKfycbwK_BdUAcDMdUTGaM3aLmNJ5i_enWm2vFnE6mtT3wJNEhKIxWsLofudDYGrWpvJMwM/exec';

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Gagal membaca file.'));
    reader.readAsDataURL(file);
  });
}

async function uploadToGas(file, docType) {
  const payload = {
    filename: file.name,
    image: await readFileAsBase64(file),
    docType,
    noPendaftaran: sessionStorage.getItem('last_ppdb_no') || 'UNKNOWN',
    namaSiswa: sessionStorage.getItem('last_student_name') || 'Calon Siswa'
  };
  const response = await fetch(GAS_UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  if (result.status !== 'success') throw new Error(result.message || 'Gagal mengunggah ke Drive');
  return result.url;
}
let currentDocVerification = {
  kartu_keluarga: { status: 'pending', note: '' },
  akta_kelahiran: { status: 'pending', note: '' },
  ijazah: { status: 'pending', note: '' },
  kartu_nisn: { status: 'pending', note: '' },
  ktp_orangtua: { status: 'pending', note: '' }
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
      
      if (!roleData || !['admin', 'pembina', 'panitia_ppdb'].includes(roleData.role)) {
        alert("Akses Ditolak: Anda tidak memiliki izin untuk mengakses halaman Admin PPDB.");
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
        const elNamaLengkap = document.getElementById('siswa-nama-lengkap');
        if (elNamaLengkap) elNamaLengkap.value = biodata.nama_lengkap || '';

        const elJk = document.getElementById('siswa-jenis-kelamin');
        if (elJk) {
          if (biodata.jenis_kelamin === 'L' || biodata.jenis_kelamin === 'Laki-laki') {
            elJk.value = 'Laki-laki';
          } else if (biodata.jenis_kelamin === 'P' || biodata.jenis_kelamin === 'Perempuan') {
            elJk.value = 'Perempuan';
          } else {
            elJk.value = biodata.jenis_kelamin || '';
          }
        }

        document.getElementById('siswa-nik').value = decryptNik(biodata.nik) || '';
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
      ['kk', 'akta', 'skl', 'nisn', 'ktp'].forEach(docType => {
        const dbKey = docType === 'skl' ? 'ijazah' : docType === 'kk' ? 'kartu_keluarga' : docType === 'nisn' ? 'kartu_nisn' : docType === 'ktp' ? 'ktp_orangtua' : 'akta_kelahiran';
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
            <p class="text-xs text-slate-700">Panitia PPDB menemukan ketidaksesuaian pada dokumen berikut. Silakan masuk ke tab <strong>Berkas</strong> untuk mengunggah ulang dokumen tersebut:</p>
            <ul class="text-xs space-y-1 mt-1 text-slate-700">
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
  const namaLengkap = document.getElementById('siswa-nama-lengkap')?.value.trim() || user.user_metadata?.full_name || 'Calon Siswa';
  const jenisKelamin = document.getElementById('siswa-jenis-kelamin')?.value || '';
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
    // 1. Update tipe pendaftaran (status hanya diubah panitia/admin, bukan dari sisi wali)
    const { error: pError } = await db.from('pendaftaran')
      .update({ tipe_pendaftaran: tipe })
      .eq('id', pendaftaranId);

    if (pError) throw pError;

    // 2. Upsert biodata
    const encryptedNik = encryptNik(nik);

    const biodataPayload = {
      pendaftaran_id: pendaftaranId,
      nama_lengkap: namaLengkap,
      jenis_kelamin: jenisKelamin,
      nik: encryptedNik,
      nisn,
      tempat_lahir: tempatLahir,
      tanggal_lahir: tanggalLahir,
      alamat_lengkap: alamat
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

    alert("Sukses! Data formulir pendaftaran berhasil disimpan.");
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
  const file = document.getElementById('bukti-transfer')?.files?.[0];
  if (!file) {
    showToast('Pilih file bukti transfer terlebih dahulu.', 'error');
    return;
  }
  const idleLabel = btn.textContent;
  btn.disabled = true;
  btn.textContent = '⏳ Mengunggah bukti transfer...';

  try {
    // Jalur yang sama dengan DP: unggah via GAS, simpan ke document_verification.dp_payment.
    // status_pendaftaran TIDAK diubah dari klien; hanya panitia yang memvalidasi.
    const fileUrl = await uploadToGas(file, 'dp');
    const ok = await window.submitDpPayment(file.name, fileUrl);
    if (!ok) {
      btn.disabled = false;
      btn.textContent = idleLabel;
    }
  } catch (err) {
    console.error('Gagal mengirim bukti transfer:', err.message);
    showToast('Gagal mengirim bukti transfer: ' + err.message, 'error');
    btn.disabled = false;
    btn.textContent = idleLabel;
  }
}

function updateAnnouncementTab(status, studentName) {
  const announceIcon = document.getElementById('announce-icon-wrapper');
  const announceBadge = document.getElementById('announce-status-badge');
  const announceText = document.getElementById('display-announcement-text');
  const announceActions = document.getElementById('announce-actions-container');
  const announceHelp = document.getElementById('announce-help-container');
  const btnCetakLulus = document.getElementById('btn-cetak-lulus');

  if (!announceText) return;

  const cleanName = studentName && studentName !== '-' ? studentName : 'Calon Siswa';

  if (status === 'Lulus' || status === 'Diterima') {
    if (announceIcon) {
      announceIcon.textContent = '🎉';
      announceIcon.className = 'w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-4xl mx-auto';
    }
    if (announceBadge) {
      announceBadge.className = 'inline-flex items-center px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider';
      announceBadge.textContent = '🟢 Diterima / Lulus';
    }
    announceText.innerHTML = `Selamat! Calon siswa atas nama <strong class="text-slate-900">${escapeHTML(cleanName)}</strong> dinyatakan <strong>LULUS / DITERIMA</strong> seleksi penerimaan murid baru SMP Annida Tahun Ajaran 2027/2028.`;
    
    if (announceActions) announceActions.classList.remove('hidden');
    if (btnCetakLulus) btnCetakLulus.classList.remove('hidden');
    if (announceHelp) announceHelp.classList.remove('hidden');
    const studentPortalCard = document.getElementById('student-portal-access-card');
    if (studentPortalCard) studentPortalCard.classList.remove('hidden');
  } else if (status === 'Gugur') {
    if (announceIcon) {
      announceIcon.textContent = 'ℹ️';
      announceIcon.className = 'w-20 h-20 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center text-4xl mx-auto';
    }
    if (announceBadge) {
      announceBadge.className = 'inline-flex items-center px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider';
      announceBadge.textContent = '🔴 Belum Memenuhi Syarat';
    }
    announceText.innerHTML = `Mohon Maaf, calon siswa atas nama <strong class="text-slate-900">${escapeHTML(cleanName)}</strong> belum memenuhi kriteria penerimaan tahun ajaran 2027/2028. Terima kasih atas partisipasi dan minat Ayah/Bunda mendaftar di SMP Annida.`;
    
    if (announceActions) announceActions.classList.add('hidden');
    if (btnCetakLulus) btnCetakLulus.classList.add('hidden');
    if (announceHelp) announceHelp.classList.remove('hidden');
  } else if (status === 'Seleksi') {
    if (announceIcon) {
      announceIcon.textContent = '📖';
      announceIcon.className = 'w-20 h-20 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center text-4xl mx-auto';
    }
    if (announceBadge) {
      announceBadge.className = 'inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold uppercase tracking-wider';
      announceBadge.textContent = '🟣 Tahap Seleksi Tes Tahfidz';
    }
    announceText.innerHTML = `Berkas persyaratan calon siswa atas nama <strong class="text-slate-900">${escapeHTML(cleanName)}</strong> telah <strong>LOLOS VERIFIKASI</strong>. Calon siswa dijadwalkan mengikuti <strong>Tes Pemetaan Tahfidz & Wawancara</strong>. Silakan hadir sesuai jadwal seleksi yang telah diinformasikan Panitia PPDB.`;
    
    if (announceActions) announceActions.classList.add('hidden');
    if (btnCetakLulus) btnCetakLulus.classList.add('hidden');
    if (announceHelp) announceHelp.classList.remove('hidden');
  } else if (status === 'Revisi') {
    if (announceIcon) {
      announceIcon.textContent = '⚠️';
      announceIcon.className = 'w-20 h-20 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center text-4xl mx-auto';
    }
    if (announceBadge) {
      announceBadge.className = 'inline-flex items-center px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider';
      announceBadge.textContent = '🔴 Perlu Revisi Dokumen';
    }
    announceText.innerHTML = `Panitia menemukan dokumen persyaratan calon siswa atas nama <strong class="text-slate-900">${escapeHTML(cleanName)}</strong> yang belum sesuai. Silakan buka tab <strong>Berkas</strong> untuk mengunggah ulang dokumen yang ditandai revisi.`;
    
    if (announceActions) announceActions.classList.add('hidden');
    if (btnCetakLulus) btnCetakLulus.classList.add('hidden');
    if (announceHelp) announceHelp.classList.remove('hidden');
  } else {
    // Default: Draft / Verifikasi / Menunggu DP
    if (announceIcon) {
      announceIcon.textContent = '⏳';
      announceIcon.className = 'w-20 h-20 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-4xl mx-auto';
    }
    if (announceBadge) {
      announceBadge.className = 'inline-flex items-center px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider';
      announceBadge.textContent = '🟡 Dalam Proses Verifikasi';
    }
    announceText.innerHTML = `Pendaftaran calon siswa atas nama <strong class="text-slate-900">${escapeHTML(cleanName)}</strong> sedang dalam proses peninjauan dan verifikasi berkas oleh Panitia PPDB. Pengumuman hasil seleksi akan diperbarui setelah berkas dinyatakan lengkap dan tes seleksi diselesaikan.`;
    
    if (announceActions) announceActions.classList.add('hidden');
    if (btnCetakLulus) btnCetakLulus.classList.add('hidden');
    if (announceHelp) announceHelp.classList.remove('hidden');
  }
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
      icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-100 text-slate-500 border border-slate-300';
      icon.textContent = i;
    }
    if (text) text.className = 'text-xs font-semibold text-slate-600 mt-1';
    if (line) line.className = 'hidden md:block h-0.5 bg-slate-700 flex-1 mx-2';
  }

  // Active steps mapper based on Alur Komitmen Tahfidz
  let activeMax = 2; // Default is mengisi data
  if (status === 'Draft') activeMax = 3;
  if (status === 'Verifikasi' || status === 'Revisi') activeMax = 4;
  if (status === 'Seleksi') activeMax = 5;
  if (status === 'Gugur') activeMax = 5;
  if (status === 'Lulus' || status === 'Diterima') activeMax = 6;

  // Render completed paths
  for (let i = 1; i <= activeMax; i++) {
    const icon = document.getElementById(`step-icon-${i}`);
    const text = document.getElementById(`step-text-${i}`);
    const line = document.getElementById(`line-track-${i - 1}`);

    if (icon) {
      if ((i === 4 && status === 'Revisi') || (i === 5 && status === 'Gugur')) {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-red-500 text-white ring-4 ring-red-500/20';
        icon.textContent = '✗';
      } else if (i === activeMax && status !== 'Lulus' && status !== 'Diterima') {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-amber-600 text-white ring-4 ring-amber-500/20';
        icon.textContent = i;
      } else {
        icon.className = 'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-500 text-white ring-4 ring-emerald-500/20';
        icon.textContent = '✓';
      }
    }
    if ((i === 4 && status === 'Revisi') || (i === 5 && status === 'Gugur')) {
      if (text) text.className = 'text-xs font-semibold text-red-800 mt-1';
      if (line) line.className = 'hidden md:block h-0.5 bg-red-500 flex-1 mx-2';
    } else {
      if (text) text.className = 'text-xs font-semibold text-emerald-800 mt-1';
      if (line) line.className = 'hidden md:block h-0.5 bg-emerald-500 flex-1 mx-2';
    }
  }

  // Dynamic alert card status
  const badge = document.getElementById('display-badge-status');
  const desc = document.getElementById('display-status-description');
  const alertBox = document.getElementById('status-alert-box');

  if (status === 'Draft') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '⚪ Menunggu DP';
    }
    if (desc) desc.textContent = 'Formulir pendaftaran Anda sudah diterima. Silakan selesaikan pembayaran Pembayaran DP (Sesuai Gelombang & Program) di seksi Pembayaran DP di bawah ini untuk membuka akses pengunggahan berkas persyaratan.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600';
  } else if (status === 'Verifikasi') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🟡 Verifikasi Berkas';
    }
    if (desc) desc.textContent = 'Bukti transfer DP Anda telah divalidasi oleh panitia. Berkas dokumen digital pendaftaran Anda sedang dalam antrean verifikasi oleh panitia PPDB.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-300';
  } else if (status === 'Gugur') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🔴 Belum Memenuhi Syarat';
    }
    if (desc) desc.textContent = 'Mohon maaf, calon siswa belum memenuhi kriteria penerimaan tahun ini. Terima kasih atas partisipasi Ayah/Bunda.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400';  } else if (status === 'Seleksi') {
    if (badge) {
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/35 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = '🟣 Tahap Tes Tahfidz';
    }
    if (desc) desc.textContent = 'Berkas terverifikasi! Calon siswa dijadwalkan mengikuti tes pemetaan Tahfidz secara langsung. Panitia akan menginformasikan detail jadwal via WhatsApp.';
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-purple-300';
  } else if (status === 'Lulus' || status === 'Diterima') {
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
      badge.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold uppercase tracking-wider mb-2';
      badge.textContent = status;
    }
    if (desc) desc.textContent = 'Status pendaftaran Anda saat ini: ' + status;
    if (alertBox) alertBox.className = 'flex items-start gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600';
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
    let badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200';
    let badgeText = r.status_pendaftaran;
    
    if (r.status_pendaftaran === 'Draft') {
      badgeClass = 'bg-slate-100 text-slate-600 border border-slate-200';
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
    } else if (r.status_pendaftaran === 'Gugur') {
      badgeClass = 'bg-rose-50 text-rose-800 border border-rose-200';
      badgeText = 'Tidak Lulus';
    } else if (r.status_pendaftaran === 'Diterima') {
      badgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      badgeText = 'Siswa Aktif';
    }

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-4 px-4 font-mono font-bold text-slate-700">${escapeHTML(r.no_pendaftaran)}</td>
      <td class="py-4 px-4 font-semibold text-slate-800">${escapeHTML(studentName)}</td>
      <td class="py-4 px-4 text-xs text-slate-700">${progLabel}</td>
      <td class="py-4 px-4 text-xs text-slate-600">${dateFormatted}</td>
      <td class="py-4 px-4 text-center">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${badgeClass}">
          ${badgeText}
        </span>
      </td>
      <td class="py-4 px-4 text-center">
        <div class="flex items-center justify-center gap-1.5 flex-wrap">
          <button onclick="viewRegistrationDetails('${r.id}')" class="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all">
            🔍 Detail
          </button>
          ${r.status_pendaftaran === 'Lulus' ? `
            <button onclick="openKonversiModal('${r.id}')" class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition-all flex items-center gap-1">
              🎓 Konversi ke Siswa
            </button>
          ` : r.status_pendaftaran === 'Diterima' ? `
            <span class="text-[0.7rem] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-1 rounded border border-emerald-500/30">
              ✅ Siswa Aktif
            </span>
          ` : ''}
        </div>
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

// Hanya izinkan http(s): file_url berasal dari JSON yang bisa diisi wali murid.
function safeHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url) ? url : null;
}

function setPreviewLink(el, url, emptyHint) {
  if (!el) return;
  const safe = safeHttpUrl(url);
  if (safe) {
    el.href = safe;
    el.rel = 'noopener noreferrer';
    el.title = '';
    el.classList.remove('pointer-events-none', 'opacity-50');
  } else {
    el.removeAttribute('href');
    el.title = emptyHint;
    el.classList.add('pointer-events-none', 'opacity-50');
  }
}

// Awalan nama file hasil unggah register.html ke bucket 'ppdb_documents'.
const DOC_FILE_PREFIX = { kartu_keluarga: ['kk_'], akta_kelahiran: ['akta_'], ijazah: ['ijazah_', 'skl_'], kartu_nisn: ['nisn_', 'kartu_nisn_'], ktp_orangtua: ['ktp_', 'ktp_ortu_'] };

// Prioritas: file_url di document_verification (GAS/Drive) -> berkas di bucket privat
// 'ppdb_documents' ({pendaftaran_id}/{awalan}{nama}) lewat signed URL (bucket tidak publik).
async function resolveDocLink(reg, docKey, storedFiles) {
  const fileUrl = safeHttpUrl((reg.document_verification || {})[docKey]?.file_url);
  if (fileUrl) return fileUrl;
  const found = storedFiles.find(f => (DOC_FILE_PREFIX[docKey] || []).some(pre => f.name.startsWith(pre)));
  if (!found) return null;
  const { data, error } = await db.storage.from('ppdb_documents').createSignedUrl(`${reg.id}/${found.name}`, 3600);
  return error ? null : data.signedUrl;
}

async function renderAdminDocLinks(reg) {
  const links = { kartu_keluarga: 'doc-kk-link', akta_kelahiran: 'doc-akta-link', ijazah: 'doc-ijazah-link', kartu_nisn: 'doc-nisn-link', ktp_orangtua: 'doc-ktp-link' };
  Object.values(links).forEach(id => setPreviewLink(document.getElementById(id), null, 'Memuat berkas...'));

  let storedFiles = [];
  try {
    const { data, error } = await db.storage.from('ppdb_documents').list(reg.id);
    if (error) throw error;
    storedFiles = data || [];
  } catch (err) {
    console.warn('Gagal membaca daftar berkas storage:', err.message);
  }

  for (const [docKey, elId] of Object.entries(links)) {
    const url = await resolveDocLink(reg, docKey, storedFiles);
    if (selectedRegForVerif?.id !== reg.id) return; // admin sudah membuka pendaftar lain
    setPreviewLink(document.getElementById(elId), url, 'Berkas belum diunggah');
  }
}

function renderAdminDpCard(reg) {
  const dp = (reg.document_verification || {}).dp_payment || null;
  const hasFile = !!(dp && safeHttpUrl(dp.file_url));
  setPreviewLink(document.getElementById('doc-dp-link'), dp && dp.file_url, 'Belum ada bukti transfer');

  const badge = document.getElementById('dp-admin-badge');
  if (badge) {
    const approved = dp && dp.status === 'approved';
    badge.textContent = !dp ? 'Belum ada bukti' : approved ? 'Tervalidasi' : 'Menunggu Validasi';
    badge.className = 'px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider border ' +
      (approved ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : dp ? 'bg-amber-50 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-600 border-slate-300');
  }
  const fileName = document.getElementById('dp-admin-filename');
  if (fileName) fileName.textContent = dp && dp.file_name ? dp.file_name : '-';

  // Validasi DP hanya bermakna saat status masih Draft dan bukti sudah ada.
  const btn = document.getElementById('btn-validate-dp');
  if (btn) {
    const canValidate = hasFile && reg.status_pendaftaran === 'Draft';
    btn.disabled = !canValidate;
    btn.classList.toggle('opacity-50', !canValidate);
    btn.classList.toggle('cursor-not-allowed', !canValidate);
    btn.title = canValidate ? '' : (reg.status_pendaftaran !== 'Draft' ? 'DP sudah divalidasi' : 'Menunggu bukti transfer dari wali murid');
  }
}

window.viewRegistrationDetails = function(regId) {
  const r = allRegistrations.find(item => item.id === regId);
  if (!r) return;

  selectedRegForVerif = r;

  // Set Details UI text fields
  document.getElementById('detail-reg-id').textContent = r.id;
  document.getElementById('detail-siswa-nama').textContent = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : '-';
  const elDetailJk = document.getElementById('detail-siswa-jk');
  if (elDetailJk) {
    elDetailJk.textContent = (r.biodata_siswa && r.biodata_siswa.jenis_kelamin) ? r.biodata_siswa.jenis_kelamin : '-';
  }
  
  let maskedNik = '-';
  if (r.biodata_siswa && r.biodata_siswa.nik) {
    const asli = decryptNik(r.biodata_siswa.nik);
    if (asli && asli.length > 4) {
      maskedNik = '*'.repeat(asli.length - 4) + asli.slice(-4);
    } else {
      maskedNik = asli;
    }
  }
  document.getElementById('detail-siswa-nik-nisn').textContent = r.biodata_siswa ? `${maskedNik} / ${r.biodata_siswa.nisn || '-'}` : '-';
  
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
    ijazah: savedVerification.ijazah || { status: 'pending', note: '' },
    kartu_nisn: savedVerification.kartu_nisn || { status: 'pending', note: '' },
    ktp_orangtua: savedVerification.ktp_orangtua || { status: 'pending', note: '' }
  };

  // Update button visual styles and note values
  ['kartu_keluarga', 'akta_kelahiran', 'ijazah', 'kartu_nisn', 'ktp_orangtua'].forEach(docType => {
    const docData = currentDocVerification[docType];
    const noteInput = document.getElementById(`note-${docType}`);
    if (noteInput) {
      noteInput.value = docData.note || '';
    }
    window.setDocStatus(docType, docData.status);
  });

  // Tautan pratinjau berkas + kartu Bukti Transfer DP
  renderAdminDpCard(r);
  renderAdminDocLinks(r);

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
  const studentName = selectedRegForVerif.biodata_siswa ? selectedRegForVerif.biodata_siswa.nama_lengkap : 'Calon Siswa';

  const currentStatus = selectedRegForVerif.status_pendaftaran;
  const prevDocs = selectedRegForVerif.document_verification || {};
  const dp = prevDocs.dp_payment || null;

  // Tahap DP: selama masih Draft hanya boleh Validasi DP (butuh bukti) atau Gugur.
  if (currentStatus === 'Draft' && newStatus !== 'Verifikasi' && newStatus !== 'Gugur') {
    showToast('Validasi bukti transfer DP terlebih dahulu sebelum melanjutkan ke tahap berikutnya.', 'error');
    return;
  }
  if (currentStatus === 'Draft' && newStatus === 'Verifikasi' && !(dp && safeHttpUrl(dp.file_url))) {
    showToast('Belum ada bukti transfer DP dari wali murid.', 'error');
    return;
  }

  // Gather notes
  ['kartu_keluarga', 'akta_kelahiran', 'ijazah'].forEach(docType => {
    const noteInput = document.getElementById(`note-${docType}`);
    if (noteInput && currentDocVerification[docType].status === 'rejected') {
      currentDocVerification[docType].note = noteInput.value.trim();
    } else if (currentDocVerification[docType].status === 'approved') {
      currentDocVerification[docType].note = '';
    }
  });

  // Gabungkan dengan data lama agar dp_payment (dan field lain) tidak terhapus.
  const mergedDocs = { ...prevDocs, ...currentDocVerification };
  if (currentStatus === 'Draft' && newStatus === 'Verifikasi') {
    mergedDocs.dp_payment = { ...dp, status: 'approved', approved_at: new Date().toISOString() };
  }

  try {
    const { error } = await db
      .from('pendaftaran')
      .update({
        status_pendaftaran: newStatus,
        document_verification: mergedDocs
      })
      .eq('id', id);

    if (error) throw error;

    alert(`Sukses! Verifikasi berkas ${noDaftar} berhasil disimpan dengan status: ${newStatus}`);

    await fetchAllRegistrations();

    // Send WhatsApp (Client-side trigger)
    if (waNumber) {
      let rejectedDocs = [];
      if (newStatus === 'Revisi') {
        ['kartu_keluarga', 'akta_kelahiran', 'ijazah', 'kartu_nisn', 'ktp_orangtua'].forEach(doc => {
          if (currentDocVerification[doc].status === 'rejected') {
            const docLabel = doc === 'kartu_keluarga' ? 'Kartu Keluarga' : doc === 'akta_kelahiran' ? 'Akta Kelahiran' : doc === 'kartu_nisn' ? 'Kartu NISN' : doc === 'ktp_orangtua' ? 'KTP Orang Tua' : 'Ijazah/SKL';
            const note = currentDocVerification[doc].note ? ` (${currentDocVerification[doc].note})` : '';
            rejectedDocs.push(`- ${docLabel}${note}`);
          }
        });
      }

      let statusMsg = '';
      if (newStatus === 'Verifikasi') {
        statusMsg = 'Pembayaran Pembayaran DP (Sesuai Gelombang & Program) Diterima. Pendaftaran Anda lanjut ke tahap Verifikasi Berkas.';
      } else if (newStatus === 'Seleksi') {
        statusMsg = 'Dokumen Persyaratan Valid. Calon siswa diundang mengikuti Ujian Seleksi Pemetaan Tahfidz secara langsung.';
      } else if (newStatus === 'Revisi') {
        statusMsg = 'Perlu Revisi Dokumen:\n' + rejectedDocs.join('\n');
      } else if (newStatus === 'Lulus') {
        statusMsg = 'Selamat! Calon siswa dinyatakan LULUS Seleksi PPDB SMP Annida.';
      } else if (newStatus === 'Gugur') {
        statusMsg = 'Mohon Maaf, pendaftaran calon siswa belum memenuhi kriteria penerimaan tahun ini.';
      }

      const rawMsg = `Halo Ayah/Bunda dari ${studentName},\n\nPendaftaran PPDB SMP Annida No. Registrasi *${noDaftar}* telah diperiksa oleh Panitia.\n\n*Status:* ${statusMsg}\n\nSilakan masuk ke portal PPDB untuk memproses langkah berikutnya:\nhttps://smpannida.sch.id/`;
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
    const badgeColor = r.status_pendaftaran === 'Lulus' ? 'text-emerald-700 font-bold' : 'text-slate-600';

    const tr = document.createElement('tr');
    tr.className = 'border-b border-slate-200 hover:bg-slate-50';
    
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
      <td class="py-3 px-3 font-mono text-slate-600">${escapeHTML(r.no_pendaftaran)}</td>
      <td class="py-3 px-3 font-semibold text-slate-700">${escapeHTML(name)}</td>
      <td class="py-3 px-3 font-medium text-slate-700">${escapeHTML(levelHafalan)}</td>
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


window.adminSetTidakLulus = async function(paramId) {
  const select = document.getElementById('seleksi-student-select');
  const regId = paramId || (select ? select.value : null);
  if (!regId) {
    alert("Silakan pilih calon siswa terlebih dahulu!");
    return;
  }
  const student = allRegistrations.find(r => r.id === regId);
  if (!student) return;
  
  const name = student.biodata_siswa ? student.biodata_siswa.nama_lengkap : 'Calon Murid';
  
  const confirmReject = confirm(`Apakah Anda yakin ingin menyatakan ${name} TIDAK LULUS Seleksi PPDB?`);
  if (!confirmReject) return;

  try {
    const { error } = await db
      .from('pendaftaran')
      .update({ status_pendaftaran: 'Gugur' })
      .eq('id', regId);

    if (error) throw error;
    alert(`Status ${name} berhasil diubah menjadi TIDAK LULUS.`);
    await fetchAllRegistrations();
  } catch (err) {
    console.error("Gagal mengubah status:", err.message);
    alert("Gagal mengubah status: " + err.message);
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
      const rawMsg = `Halo Ayah/Bunda dari ${name},\n\nPendaftaran PPDB SMP Annida No. Registrasi *${student.no_pendaftaran}* dinyatakan *LULUS* Seleksi Pemetaan Tahfidz.\n\nSilakan masuk ke portal PPDB untuk melakukan konfirmasi daftar ulang:\nhttps://smpannida.sch.id/`;
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

// =========================================================================
// TAHAP 2: KONVERSI SISWA & TERBITKAN AKUN PORTAL SISWA
// =========================================================================
let selectedRegForKonversi = null;

window.openKonversiModal = function(regId) {
  const r = allRegistrations.find(item => item.id === regId);
  if (!r) return;
  selectedRegForKonversi = r;

  const studentName = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : 'Calon Murid';
  const nisn = r.biodata_siswa ? (r.biodata_siswa.nisn || '-') : '-';
  
  const elNama = document.getElementById('konversi-nama');
  const elNoReg = document.getElementById('konversi-no-reg');
  const elNisn = document.getElementById('konversi-nisn');
  if (elNama) elNama.textContent = studentName;
  if (elNoReg) elNoReg.textContent = r.no_pendaftaran;
  if (elNisn) elNisn.textContent = nisn;
  
  const nisInput = document.getElementById('konversi-input-nis');
  if (nisInput) {
    nisInput.value = `2026${(nisn !== '-' ? String(nisn).slice(-4) : Math.floor(1000 + Math.random() * 9000))}`;
  }

  const modal = document.getElementById('modal-konversi-siswa');
  if (modal) modal.classList.remove('hidden');
};

window.closeKonversiModal = function() {
  const modal = document.getElementById('modal-konversi-siswa');
  if (modal) modal.classList.add('hidden');
  selectedRegForKonversi = null;
};

window.submitKonversiSiswa = async function() {
  if (!selectedRegForKonversi) return;
  const r = selectedRegForKonversi;
  const studentName = r.biodata_siswa ? r.biodata_siswa.nama_lengkap : 'Calon Murid';
  const nisn = r.biodata_siswa ? r.biodata_siswa.nisn : '';
  const selectedClass = document.getElementById('konversi-select-kelas')?.value || '7A';
  const inputNis = document.getElementById('konversi-input-nis')?.value.trim();

  const btn = document.getElementById('btn-submit-konversi');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Memproses Akun...';
  }

  try {
    // 1. Generate clean email format: 2 nama depan
    const cleanName = (studentName || '')
      .toLowerCase()
      .replace(/['`’\-\.\,\_]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    const parts = cleanName.split(' ').filter(Boolean);
    const baseUsername = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : (parts[0] || 'siswa');
    const studentEmail = `${baseUsername}@smpannida.sch.id`;

    // 2. Insert into students table
    const studentPayload = {
      nama_lengkap: studentName,
      nisn: nisn || null,
      nis: inputNis || null,
      kelas: selectedClass,
      jenis_kelamin: r.biodata_siswa?.jenis_kelamin || 'L',
      tanggal_lahir: r.biodata_siswa?.tanggal_lahir || null,
      alamat: r.biodata_siswa?.alamat_lengkap || null,
      nama_orang_tua: r.data_orangtua?.nama_ayah || r.data_orangtua?.nama_ibu || null,
      no_hp_orang_tua: r.data_orangtua?.whatsapp || null,
      aktif: true,
      email: studentEmail
    };

    let insErr = null;
    if (studentPayload.nisn) {
      const { error } = await db.from('students').upsert(studentPayload, { onConflict: 'nisn' });
      insErr = error;
    } else {
      const { data: exist } = await db.from('students').select('id').eq('email', studentEmail).maybeSingle();
      if (exist) {
        const { error } = await db.from('students').update(studentPayload).eq('id', exist.id);
        insErr = error;
      } else {
        const { error } = await db.from('students').insert(studentPayload);
        insErr = error;
      }
    }

    if (insErr) throw new Error("Gagal menyimpan ke tabel siswa: " + insErr.message);

    // 3. Update status pendaftaran ke Diterima; berhenti jika gagal
    const { error: statusErr } = await db
      .from('pendaftaran')
      .update({ status_pendaftaran: 'Diterima' })
      .eq('id', r.id);
    if (statusErr) throw new Error('Data siswa tersimpan, tetapi status pendaftaran gagal diperbarui: ' + statusErr.message);

    window.closeKonversiModal();

    // 4. Akun login BELUM dibuat otomatis (butuh Edge Function service_role).
    //    Modal kredensial sengaja tidak dibuka agar tidak menampilkan kredensial palsu.
    showToast(`${studentName} resmi dikonversi ke Kelas ${selectedClass}. Akun login portal siswa belum dibuat otomatis; buat melalui Supabase Auth.`, 'success');

    await fetchAllRegistrations();
  } catch (err) {
    console.error("Gagal konversi siswa:", err.message);
    alert("Gagal melakukan konversi: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Konversi ke Siswa';
    }
  }
};

window.activateToAcademic = function(pendaftaranId, studentName) {
  window.openKonversiModal(pendaftaranId);
};

window.copyStudentCredentials = function() {
  const email = document.getElementById('cred-student-email')?.textContent || '';
  const pass = document.getElementById('cred-student-password')?.textContent || '';
  const text = `Akun Portal Siswa SMP Annida\nEmail: ${email}\nPassword: ${pass}\nLogin: https://smpannida.sch.id/login.html`;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('btn-copy-cred');
    if (btn) {
      btn.textContent = '✅ Berhasil Disalin!';
      setTimeout(() => { btn.textContent = '📋 Salin Kredensial'; }, 2000);
    }
  });
};

window.closeCredentialModal = function() {
  const credModal = document.getElementById('modal-kredensial-siswa');
  if (credModal) credModal.classList.add('hidden');
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
            color: 'rgba(100, 116, 139, 0.15)'
          },
          ticks: {
            color: '#475569',
            stepSize: 1
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#475569'
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
      const dbKey = docType === 'skl' ? 'ijazah' : docType === 'ijazah' ? 'ijazah' : docType === 'kk' ? 'kartu_keluarga' : docType === 'nisn' ? 'kartu_nisn' : docType === 'ktp' ? 'ktp_orangtua' : 'akta_kelahiran';
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

      const { error: upErr } = await db
        .from('pendaftaran')
        .update({
          document_verification: currentDocs,
          status_pendaftaran: newRegStatus
        })
        .eq('id', pendaftaranId);
      if (upErr) throw upErr;

      console.log(`Document ${docType} uploaded successfully, status set to pending.`);
      
      if (newRegStatus === 'Verifikasi') {
        window.location.reload();
      }
    }
  } catch (err) {
    console.error("Gagal menyimpan status unggahan dokumen:", err.message);
    showToast('Gagal menyimpan status unggahan dokumen: ' + err.message, 'error');
  }
};

window.submitDpPayment = async function(fileName, fileUrl = null) {
  const pId = sessionStorage.getItem('pendaftaran_id');
  if (!pId) {
    alert("Data pendaftaran tidak ditemukan.");
    return false;
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
    return true;
  } catch (err) {
    console.error("Gagal mengirim bukti transfer DP:", err.message);
    alert("Gagal mengirim bukti transfer: " + err.message);
    const submitBtn = document.getElementById('btn-submit-dp');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '🚀 Kirim Bukti Pembayaran';
    }
    return false;
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
      "NIK": decryptNik(r.biodata_siswa?.nik) || "-",
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

