import supabaseClient from '../core/supabase.js';
import { showToast } from '../core/utils.js';
import { injectSidebar } from '../core/layout.js';
import { getOptionalUser, handleLogout } from '../core/auth.js';

const db = supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Setup Layout
    injectSidebar('sidebar', 'syahriah');
    const user = await getOptionalUser();
    if (!user) {
        window.location.href = '../../index.html';
        return;
    }
    
    // Cek Role
    const { data: roleData } = await db.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
    const isAdmin = roleData && roleData.role === 'admin';

    // Update Sidebar Profile
    const userNameEl = document.getElementById('sidebar-user-name');
    const userRoleEl = document.getElementById('sidebar-user-role');
    if (userNameEl) {
        const { data: tData } = await db.from('teachers').select('nama').eq('email', user.email).maybeSingle();
        userNameEl.textContent = tData ? tData.nama : (user.user_metadata?.full_name || user.email.split('@')[0]);
    }
    if (userRoleEl) {
        userRoleEl.textContent = isAdmin ? 'Admin Keuangan' : 'Guru / Karyawan';
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const btnGenerate = document.getElementById('btn-generate');
    const btnSettings = document.getElementById('btn-settings'); // Asumsi ada ID ini
    const btnLoadData = document.getElementById('btn-load-data');
    const filterMonth = document.getElementById('filter-month');
    const filterYear = document.getElementById('filter-year');
    const tbody = document.getElementById('syahriah-tbody');
    const summaryTotal = document.getElementById('summary-total');
    const summaryGuru = document.getElementById('summary-guru');

    // Hide admin controls for teachers
    if (!isAdmin) {
        if(btnGenerate) btnGenerate.style.display = 'none';
        if(btnSettings) btnSettings.style.display = 'none';
        // Ubah label summary karena hanya melihat diri sendiri
        const summaryGuruLabel = summaryGuru.previousElementSibling;
        if (summaryGuruLabel) summaryGuruLabel.textContent = 'Status Guru';
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
        
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Memuat data...</td></tr>';
        
        try {
            // Get all teachers
            const { data: teachers, error: tErr } = await db.from('teachers').select('*').eq('aktif', true);
            if (tErr) throw tErr;

            // Get generated slips for this period
            const { data: slips, error: sErr } = await db
                .from('salary_slips')
                .select('*, salary_slip_items(*)')
                .eq('period_month', month)
                .eq('period_year', year);
            if (sErr) throw sErr;

            currentData = slips || [];
            
            let totalPengeluaran = 0;
            let html = '';

            if (currentData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">Belum ada slip digenerate untuk bulan ini. Klik Generate Slip.</div></td></tr>';
                summaryTotal.textContent = 'Rp 0';
                summaryGuru.textContent = '0 Guru';
                return;
            }

            currentData.forEach((slip, index) => {
                const teacher = teachers.find(t => t.id === slip.teacher_id);
                const teacherName = teacher ? teacher.nama : 'Unknown';
                totalPengeluaran += slip.total_amount;

                let statusBadge = '';
                if(slip.status === 'draft') statusBadge = '<span class="badge" style="background:var(--warning-color)">Draft</span>';
                if(slip.status === 'finalized') statusBadge = '<span class="badge" style="background:var(--primary-color)">Final</span>';
                if(slip.status === 'paid') statusBadge = '<span class="badge" style="background:var(--success-color)">Lunas</span>';

                html += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${teacherName}</td>
                        <td>${month}/${year}</td>
                        <td>${formatRp(slip.total_amount)}</td>
                        <td>${statusBadge}</td>
                        <td style="text-align:right;">
                            <button class="btn btn-outline btn-sm btn-view-slip" data-id="${slip.id}">Lihat Slip</button>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
            summaryTotal.textContent = formatRp(totalPengeluaran);
            summaryGuru.textContent = `${currentData.length} Guru`;

            document.querySelectorAll('.btn-view-slip').forEach(btn => {
                btn.addEventListener('click', (e) => viewSlip(e.target.dataset.id));
            });

        } catch (error) {
            console.error("Error loading data:", error);
            showToast('Gagal memuat data syahriah', 'error');
        }
    }

    async function viewSlip(slipId) {
        const slip = currentData.find(s => s.id === slipId);
        if (!slip) return;
        
        // Load teacher name
        const { data: tData } = await db.from('teachers').select('nama').eq('id', slip.teacher_id).single();
        
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
                            <td style="border:1px solid #000; padding:0.5rem; text-align:center;">${item.quantity}</td>
                            <td style="border:1px solid #000; padding:0.5rem; text-align:right;">${formatRp(item.subtotal)}</td>
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
        slipModal.style.display = 'flex';
    }

    btnCloseSlip.addEventListener('click', () => {
        slipModal.style.display = 'none';
    });

    btnPrintSlip.addEventListener('click', () => {
        window.print();
    });

    btnLoadData.addEventListener('click', loadData);
    
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
            
            for (let teacher of teachers) {
                // Kalkulasi per guru (Contoh dummy sederhana dulu untuk skeleton)
                // Seharusnya: fetch teacher_attendance, hitung quantity
                let totalAmount = 0;
                let itemsToInsert = [];
                
                // Cek apakah slip sudah ada
                const { data: existingSlip } = await db.from('salary_slips')
                    .select('id')
                    .eq('teacher_id', teacher.id)
                    .eq('period_month', month)
                    .eq('period_year', year)
                    .maybeSingle();
                    
                if (existingSlip) continue; // Skip jika sudah ada
                
                // Insert Header
                const { data: newSlip, error: headerErr } = await db.from('salary_slips')
                    .insert({
                        teacher_id: teacher.id,
                        period_month: month,
                        period_year: year,
                        total_amount: 0 // Update nanti
                    }).select().single();
                    
                if (headerErr) throw headerErr;
                
                // Loop components and insert (Dummy quantity = 0 for now)
                for (let comp of components) {
                    let qty = 0;
                    if(comp.code === 'tunj_kepsek' && teacher.nama.includes('Kepsek')) qty = 1;
                    
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

    // Init load
    loadData();
});
