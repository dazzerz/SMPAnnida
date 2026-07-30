import supabaseClient from './supabase.js';

export async function fetchDashboardMetrics() {
  try {
    // 1. Total Siswa Aktif
    const { count: studentCount } = await supabaseClient
      .from('students')
      .select('*', { count: 'exact', head: true });

    // 2. Total Kas (Pemasukan - Pengeluaran)
    const { data: transactions } = await supabaseClient
      .from('transactions')
      .select('type, amount');
    
    let totalCash = 0;
    if (transactions) {
      transactions.forEach(tx => {
        if (tx.type === 'income') totalCash += tx.amount;
        if (tx.type === 'expense') totalCash -= tx.amount;
      });
    }

    // 3. Pendaftar PPDB
    const { count: ppdbCount } = await supabaseClient
      .from('pendaftaran')
      .select('*', { count: 'exact', head: true });

    // 4. Open Amount (Estimasi Sederhana: 12 bulan SPP @ 100rb per siswa - total income SPP)
    // Untuk tahap ini kita buat kalkulasi dasar
    const estTotalSppSetahun = (studentCount || 0) * 100000 * 12;
    // Anggap 30% dari transaksi income adalah SPP
    const estPaidSpp = totalCash > 0 ? (totalCash * 0.3) : 0;
    let openAmount = estTotalSppSetahun - estPaidSpp;
    if (openAmount < 0) openAmount = 0;

    return {
      studentCount: studentCount || 0,
      totalCash,
      ppdbCount: ppdbCount || 0,
      openAmount
    };
  } catch (error) {
    console.error('Gagal mengambil metrik dashboard:', error);
    return null;
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}
