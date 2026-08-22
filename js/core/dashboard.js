(function(){
const allowed = ["dazzerz.github.io", "localhost", "127.0.0.1"];
const host = window.location.hostname;
if (!allowed.includes(host) && host !== "") {
document.body.innerHTML = "<div style='display:flex;justify-content:center;align-items:center;height:100vh;background-color:#0b1320;color:#ef4444;font-family:sans-serif;font-size:2rem;font-weight:bold;'>Unauthorized Domain Access Restricted</div>";
throw new Error("Access restricted");
}
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
if (e.key === 'F12' ||
(e.ctrlKey && e.shiftKey && e.key === 'I') ||
(e.ctrlKey && e.shiftKey && e.key === 'J') ||
(e.ctrlKey && e.key === 'U')) {
e.preventDefault();
}
});
})();
import supabaseClient from './supabase.js';
export async function fetchDashboardMetrics() {
try {
const { count: studentCount } = await supabaseClient
.from('students')
.select('id', { count: 'exact' });
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
const { count: ppdbCount } = await supabaseClient
.from('pendaftaran')
.select('id', { count: 'exact' });
const estTotalSppSetahun = (studentCount || 0) * 100000 * 12;
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