import supabaseClient from '../core/supabase.js';
import { showToast } from '../core/utils.js';
import { injectSidebar } from '../core/layout.js';
import { getOptionalUser, handleLogout } from '../core/auth.js';

const db = supabaseClient;

export async function initSyahriah() {
    // 1. Setup Layout
    
    const user = await getOptionalUser();
    if (!user) {
        
        return;
    }
    
    // Cek Role
    const { data: roleData } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    const isAdmin = roleData && roleData.role === 'admin';
    const isPembina = roleData && roleData.role === 'pembina';

    // Update Sidebar Profile
    const userNameEl = document.getElementById('nav-user-name');
    const userEmailEl = document.getElementById('nav-user-email');
    const userAvatarEl = document.getElementById('user-avatar');
    if (userNameEl) {
        const { data: tData } = await db.from('teachers').select('nama').eq('email', user.email).maybeSingle();
        const finalName = tData ? tData.nama : (user.user_metadata?.full_name || user.email.split('@')[0]);
        userNameEl.textContent = finalName;
        if (userEmailEl) userEmailEl.textContent = isAdmin ? 'Admin' : (isPembina ? 'Pembina' : 'Guru');
        if (userAvatarEl) userAvatarEl.textContent = finalName.charAt(0).toUpperCase();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const btnGenerate = document.getElementById('btn-generate');
    const btnSettings = document.getElementById('btn-settings'); // Asumsi ada ID ini
    const btnLoadData = document.getElementById('btn-load-data');
    const filterMonth = document.getElementById('syahriah-filter-month');
    const filterYear = document.getElementById('filter-year');
    const grid = document.getElementById('syahriah-grid');
    const summaryTotal = document.getElementById('summary-total');
    const summaryGuru = document.getElementById('summary-guru');

    // Hide admin controls for teachers and pembina
    if (!isAdmin) {
        if(btnGenerate) btnGenerate.style.display = 'none';
        if(btnSettings) btnSettings.style.display = 'none';
        
        // Ubah label summary karena hanya melihat diri sendiri jika bukan pembina
        if (!isPembina) {
            document.querySelector('.summary-card:nth-child(1) .text-sm').textContent = 'Total Syahriah Anda Bulan Ini';
            document.querySelector('.summary-card:nth-child(2)').style.display = 'none'; // Sembunyikan total guru
        }
    }

    const slipModal = document.getElementById('slip-modal');
    const btnCloseSlip = document.getElementById('btn-close-slip');
    const btnPrintSlip = document.getElementById('btn-print-slip');

    let currentData = [];

    // Format Rupiah
    const formatRp = (num) => 'Rp ' + parseInt(num).toLocaleString('id-ID');

    // Default current month
    const d = new Date();
    filterMonth.value = d.getMonth() + 1;
    filterYear.value = d.getFullYear();

    async function loadData() {
        const month = parseInt(filterMonth.value);
        const year = parseInt(filterYear.value);
        
        grid.innerHTML = '<div class="empty-state" style="padding:3rem; grid-column: 1 / -1; text-align: center;"><div class="empty-state-title">Memuat data...</div></div>';
        
        try {
            // Get all teachers
            const { data: teachers, error: tErr } = await db.from('teachers').select('*').eq('aktif', true);
            if (tErr) throw tErr;

            // Get generated slips for this period
            const { data: slips, error: sErr } = await db
                .from('salary_slips')
                .select('*, salary_slip_items(*, salary_components(name, sort_order))')
                .eq('period_month', month)
                .eq('period_year', year);
            if (sErr) throw sErr;

            currentData = slips || [];
            
            let totalPengeluaran = 0;
            let html = '';

            if (currentData.length === 0) {
                grid.innerHTML = '<div class="empty-state" style="padding:3rem; grid-column: 1 / -1; text-align: center;"><div class="empty-state-title">Belum ada slip digenerate untuk bulan ini. Klik Generate Slip.</div></div>';
                summaryTotal.textContent = 'Rp 0';
                summaryGuru.textContent = '0 Guru';
                return;
            }

            currentData.forEach((slip) => {
                const teacher = teachers.find(t => t.id === slip.teacher_id);
                const teacherName = teacher ? teacher.nama : 'Unknown';
                totalPengeluaran += slip.total_amount;

                let statusClass = 'draft';
                let statusLabel = 'Draft';
                if(slip.status === 'finalized') { statusClass = 'finalized'; statusLabel = 'Final'; }
                if(slip.status === 'paid') { statusClass = 'paid'; statusLabel = 'Lunas'; }

                let items = slip.salary_slip_items || [];
                items.sort((a, b) => {
                    const orderA = a.salary_components ? a.salary_components.sort_order : 99;
                    const orderB = b.salary_components ? b.salary_components.sort_order : 99;
                    return orderA - orderB;
                });

                let detailRows = '';
                items.forEach(item => {
                    if (item.subtotal > 0 || (item.quantity > 0 && item.rate > 0)) {
                        const compName = item.salary_components ? item.salary_components.name : 'Unknown';
                        detailRows += `
                            <tr>
                                <td>${compName}</td>
                                <td>${item.quantity} x ${formatRp(item.rate)}</td>
                                <td>${formatRp(item.subtotal)}</td>
                            </tr>
                        `;
                    }
                });
                
                if (!detailRows) {
                    detailRows = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Tidak ada rincian</td></tr>';
                }

                html += `
                    <div class="slip-card">
                        <div class="slip-card-header">
                            <div>
                                <h3 class="slip-card-title">${teacherName}</h3>
                                <div class="slip-card-subtitle">Periode: ${month}/${year}</div>
                            </div>
                            <span class="slip-card-status ${statusClass}">${statusLabel}</span>
                        </div>
                        <div class="slip-card-body">
                            <table class="slip-detail-table">
                                ${detailRows}
                            </table>
                        </div>
                        <div class="slip-card-footer">
                            <div class="slip-card-total">
                                <span>Total</span>
                                <span>${formatRp(slip.total_amount)}</span>
                            </div>
                            <div class="slip-card-actions">
                                <button class="btn btn-outline btn-sm btn-view-slip" data-id="${slip.id}">Lihat Slip Lengkap</button>
                            </div>
                        </div>
                    </div>
                `;
            });

            grid.innerHTML = html;
            summaryTotal.textContent = formatRp(totalPengeluaran);
            summaryGuru.textContent = `${currentData.length} Guru`;

        } catch (error) {
            console.error("Error loading data:", error);
            showToast('Gagal memuat data syahriah', 'error');
        }
    }

    async function viewSlip(slipId) {
        const slip = currentData.find(s => s.id == slipId);
        if (!slip) return;
        
        // Load teacher name
        const { data: tData } = await db.from('teachers').select('nama').eq('id', slip.teacher_id).maybeSingle();
        
        document.getElementById('slip-teacher-name').textContent = tData ? tData.nama : 'Unknown';
        document.getElementById('slip-period').textContent = `${slip.period_month}/${slip.period_year}`;
        document.getElementById('slip-total-amount').textContent = formatRp(slip.total_amount);
        
        // Tanggal print
        const today = new Date();
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        document.getElementById('slip-date-print').textContent = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

        // Get components for sorting
        const { data: comps } = await db.from('salary_components').select('*').order('sort_order');
        
        let itemsHtml = '';
        let rowCount = 1;
        
        if (comps && slip.salary_slip_items) {
            comps.forEach(comp => {
                const item = slip.salary_slip_items.find(i => i.component_id === comp.id);
                if (item) {
                    const isEmpty = item.subtotal === 0;
                    itemsHtml += `
                        <tr class="${isEmpty ? 'row-empty' : ''}">
                            <td style="border:1px solid #000; padding:0.5rem; text-align:center;">${rowCount++}</td>
                            <td style="border:1px solid #000; padding:0.5rem;">${comp.name}</td>
                            <td style="border:1px solid #000; padding:0.5rem; text-align:right;">${formatRp(item.rate)}</td>
                            <td style="border:1px solid #000; padding:0.5rem; text-align:center;">
                                ${isAdmin ? `<input type="number" class="edit-slip-qty form-input" data-itemid="${item.id}" data-rate="${item.rate}" data-slipid="${slip.id}" value="${item.quantity}" style="width:60px; text-align:center; padding:0.2rem; color:black;">` : item.quantity}
                            </td>
                            <td style="border:1px solid #000; padding:0.5rem; text-align:right;" class="edit-slip-subtotal" data-itemid="${item.id}">${formatRp(item.subtotal)}</td>
                        </tr>
                    `;
                }
            });
        }
        
        // Ensure minimum 8 rows for format
        while(rowCount <= 8) {
             itemsHtml += `
                <tr class="row-empty">
                    <td style="border:1px solid #000; padding:0.5rem; text-align:center;">${rowCount++}</td>
                    <td style="border:1px solid #000; padding:0.5rem;">-</td>
                    <td style="border:1px solid #000; padding:0.5rem; text-align:right;">-</td>
                    <td style="border:1px solid #000; padding:0.5rem; text-align:center;">-</td>
                    <td style="border:1px solid #000; padding:0.5rem; text-align:right;">-</td>
                </tr>
            `;
        }

        document.getElementById('slip-items-tbody').innerHTML = itemsHtml;
        
        const btnSaveSlip = document.getElementById('btn-save-slip');
        if (isAdmin && btnSaveSlip) {
            btnSaveSlip.style.display = 'inline-block';
            
            // Auto calculate subtotal on input change
            document.querySelectorAll('.edit-slip-qty').forEach(input => {
                input.addEventListener('input', (e) => {
                    const qty = parseInt(e.target.value) || 0;
                    const rate = parseInt(e.target.dataset.rate) || 0;
                    const subtotal = qty * rate;
                    const itemId = e.target.dataset.itemid;
                    const subtotalCell = document.querySelector(`.edit-slip-subtotal[data-itemid="${itemId}"]`);
                    if (subtotalCell) subtotalCell.textContent = formatRp(subtotal);
                    
                    // Recalculate Total
                    let newTotal = 0;
                    document.querySelectorAll('.edit-slip-qty').forEach(inp => {
                        newTotal += (parseInt(inp.value) || 0) * (parseInt(inp.dataset.rate) || 0);
                    });
                    document.getElementById('slip-total-amount').textContent = formatRp(newTotal);
                });
            });
            
            // Bind Save
            btnSaveSlip.onclick = async () => {
                btnSaveSlip.disabled = true;
                btnSaveSlip.textContent = 'Menyimpan...';
                
                try {
                    let finalTotal = 0;
                    const inputs = document.querySelectorAll('.edit-slip-qty');
                    for (const inp of inputs) {
                        const qty = parseInt(inp.value) || 0;
                        const rate = parseInt(inp.dataset.rate) || 0;
                        const subtotal = qty * rate;
                        finalTotal += subtotal;
                        
                        await db.from('salary_slip_items')
                            .update({ quantity: qty, subtotal: subtotal })
                            .eq('id', inp.dataset.itemid);
                    }
                    
                    await db.from('salary_slips').update({ total_amount: finalTotal }).eq('id', slipId);
                    showToast('Slip berhasil diperbarui', 'success');
                    
                    // Refresh data
                    loadData();
                    slipModal.style.display = 'none'; slipModal.style.opacity = '0'; slipModal.style.pointerEvents = 'none';
                } catch(err) {
                    console.error(err);
                    showToast('Gagal menyimpan slip', 'error');
                } finally {
                    btnSaveSlip.disabled = false;
                    btnSaveSlip.textContent = '💾 Simpan Perubahan';
                }
            };
        }
        
        slipModal.style.display = 'flex';
        slipModal.style.opacity = '1';
        slipModal.style.pointerEvents = 'all';
    }

    btnCloseSlip.addEventListener('click', () => {
        slipModal.style.display = 'none'; slipModal.style.opacity = '0'; slipModal.style.pointerEvents = 'none';
        slipModal.style.opacity = '0';
        slipModal.style.pointerEvents = 'none';
    });

    btnPrintSlip.addEventListener('click', () => {
        window.print();
    });

    btnLoadData.addEventListener('click', loadData);
    
    // Event delegation for view slip buttons
    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-view-slip');
        if (btn) {
            console.log("Membuka slip dengan ID:", btn.dataset.id);
            viewSlip(btn.dataset.id);
        }
    });
    
    btnGenerate.addEventListener('click', async () => {
        if(!confirm('Generate slip untuk semua guru di bulan ini? Aksi ini membutuhkan waktu memproses data absensi.')) return;
        
        const month = parseInt(filterMonth.value);
        const year = parseInt(filterYear.value);
        
        btnGenerate.disabled = true;
        btnGenerate.textContent = 'Generating...';
        
        try {
            // 1. Get all active teachers
            const { data: teachers } = await db.from('teachers').select('*').eq('aktif', true);
            
            // 2. Get master components
            const { data: components } = await db.from('salary_components').select('*');
            
            // 3. Get attendance for the month
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const nextMonth = month === 12 ? 1 : month + 1;
            const nextYear = month === 12 ? year + 1 : year;
            const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
            
            const { data: attendances } = await db.from('teacher_attendance')
                .select('*')
                .gte('attendance_date', startDate)
                .lt('attendance_date', endDate);
                
            // 4. Get profiles mapping for matching UUIDs
            const { data: profiles } = await db.from('profiles').select('id, full_name');
            
            for (let teacher of teachers) {
                // Kalkulasi per guru berdasarkan instruksi
                let totalAmount = 0;
                let itemsToInsert = [];
                
                // Cek apakah slip sudah ada
                const { data: existingSlip } = await db.from('salary_slips')
                    .select('id, status')
                    .eq('teacher_id', teacher.id)
                    .eq('period_month', month)
                    .eq('period_year', year)
                    .maybeSingle();
                    
                if (existingSlip) {
                    if (existingSlip.status === 'draft') {
                        await db.from('salary_slips').delete().eq('id', existingSlip.id);
                    } else {
                        continue; // Skip jika sudah final/paid
                    }
                }
                
                // Match profile by name to get correct UUID for attendance
                const profile = profiles ? profiles.find(p => p.full_name === teacher.nama) : null;
                const tAttendances = (attendances && profile) ? attendances.filter(a => a.teacher_id === profile.id) : [];
                
                let qtyMengajar = 0;
                let qtyTransport = 0;
                let qtyInsentifHadir = 0;
                let qtyInsentifPagi = 0;
                
                tAttendances.forEach(att => {
                    const hasCheckIn = !!att.check_in;
                    const hasCheckOut = !!att.check_out;
                    
                    // Mengajar: jika absen in diitung 1 hari
                    if (hasCheckIn) {
                        qtyMengajar++;
                        
                        // Insentif Pagi: jika absen in max sebelum jam 7 pagi
                        const checkInTime = new Date(att.check_in);
                        if (checkInTime.getHours() < 7) {
                            qtyInsentifPagi++;
                        }
                    }
                    
                    // Transport & Insentif Hadir: jika absen in dan out
                    if (hasCheckIn && hasCheckOut) {
                        qtyTransport++;
                        qtyInsentifHadir++;
                    }
                });
                
                // Insert Header
                const { data: newSlip, error: headerErr } = await db.from('salary_slips')
                    .insert({
                        teacher_id: teacher.id,
                        period_month: month,
                        period_year: year,
                        total_amount: 0 // Update nanti
                    }).select().maybeSingle();
                    
                if (headerErr) throw headerErr;
                
                // Loop components and assign qty
                for (let comp of components) {
                    let qty = 0;
                    if (comp.code === 'mengajar') qty = qtyMengajar;
                    else if (comp.code === 'transport') qty = qtyTransport;
                    else if (comp.code === 'insentif_hadir') qty = qtyInsentifHadir;
                    else if (comp.code === 'insentif_pagi') qty = qtyInsentifPagi;
                    else if (comp.code === 'tunj_kepsek' && teacher.nama.toLowerCase().includes('kepsek')) qty = 1;
                    else if (comp.code === 'tunj_wali_kelas' && teacher.nama.toLowerCase().includes('wali kelas')) qty = 1;
                    else if (comp.code === 'tata_usaha' && teacher.nama.toLowerCase().includes('tata usaha')) qty = 1;
                    
                    // Mengajar Pesantren, Ins. Tdrs/upcr, Badal Mengajar dikunci 0
                    if (['mengajar_pesantren', 'ins_tdrs', 'badal_mengajar'].includes(comp.code)) {
                        qty = 0;
                    }
                    
                    const subtotal = qty * comp.default_rate;
                    totalAmount += subtotal;
                    
                    itemsToInsert.push({
                        slip_id: newSlip.id,
                        component_id: comp.id,
                        rate: comp.default_rate,
                        quantity: qty,
                        subtotal: subtotal
                    });
                }
                
                // Insert items
                await db.from('salary_slip_items').insert(itemsToInsert);
                
                // Update total
                await db.from('salary_slips').update({ total_amount: totalAmount }).eq('id', newSlip.id);
            }
            
            showToast('Generate berhasil', 'success');
            loadData();
        } catch(err) {
            console.error(err);
            showToast('Generate gagal: ' + err.message, 'error');
        } finally {
            btnGenerate.disabled = false;
            btnGenerate.textContent = 'Generate Slip Bulan Ini';
        }
    });

    // --- PENGATURAN RATE ---
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const settingsTbody = document.getElementById('settings-tbody');
    const btnAddComp = document.getElementById('btn-add-comp');

    if (btnSettings && settingsModal) {
        btnSettings.addEventListener('click', async () => {
            settingsModal.style.display = 'flex';
            await loadSettings();
        });

        btnCloseSettings.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        async function loadSettings() {
            settingsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Memuat data...</td></tr>';
            const { data, error } = await db.from('salary_components').select('*').order('sort_order');
            if (error) {
                settingsTbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:red;">Gagal memuat data</td></tr>';
                return;
            }
            
            let html = '';
            data.forEach(comp => {
                html += `
                    <tr>
                        <td>${comp.name}</td>
                        <td>
                            <input type="number" class="form-input comp-rate-input" data-id="${comp.id}" value="${comp.default_rate}" style="width: 100px; padding: 0.25rem;">
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm btn-save-comp" data-id="${comp.id}">Simpan</button>
                        </td>
                    </tr>
                `;
            });
            settingsTbody.innerHTML = html;

            document.querySelectorAll('.btn-save-comp').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    const input = document.querySelector(`.comp-rate-input[data-id="${id}"]`);
                    const newRate = parseInt(input.value);
                    
                    const { error: updErr } = await db.from('salary_components').update({ default_rate: newRate }).eq('id', id);
                    if (updErr) {
                        showToast('Gagal update rate', 'error');
                    } else {
                        showToast('Rate berhasil diupdate!', 'success');
                    }
                });
            });
        }

        if (btnAddComp) {
            btnAddComp.addEventListener('click', async () => {
                const code = document.getElementById('new-comp-code').value.trim();
                const name = document.getElementById('new-comp-name').value.trim();
                const rate = parseInt(document.getElementById('new-comp-rate').value || 0);

                if (!code || !name) {
                    showToast('Kode dan Nama harus diisi', 'error');
                    return;
                }

                const { error: insErr } = await db.from('salary_components').insert({
                    code: code,
                    name: name,
                    default_rate: rate,
                    calculation_type: 'flat'
                });

                if (insErr) {
                    showToast('Gagal tambah komponen: ' + insErr.message, 'error');
                } else {
                    showToast('Komponen berhasil ditambahkan!', 'success');
                    document.getElementById('new-comp-code').value = '';
                    document.getElementById('new-comp-name').value = '';
                    document.getElementById('new-comp-rate').value = '';
                    loadSettings();
                }
            });
        }
    }
}

