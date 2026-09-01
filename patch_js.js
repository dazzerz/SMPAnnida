const fs = require('fs');
let code = fs.readFileSync('js/academic/teacher-attendance.js', 'utf8');

// Replace dateRekap initialization logic with filterContainer logic
code = code.replace(/if \(dateRekap\) \{\s*dateRekap\.value = today;\s*dateRekap\.addEventListener\('change', loadRekap\);\s*\}/g, 
\if (filterContainer) {
    if (dateRekap) {
        dateRekap.value = today;
        dateRekap.addEventListener('change', loadRekap);
    }
    if (monthRekap) {
        monthRekap.value = today.substring(0, 7);
        monthRekap.addEventListener('change', loadRekap);
    }
    if (typeRekap) {
        typeRekap.addEventListener('change', () => {
            if (typeRekap.value === 'day') {
                dateRekap.style.display = 'inline-block';
                monthRekap.style.display = 'none';
            } else {
                dateRekap.style.display = 'none';
                monthRekap.style.display = 'inline-block';
            }
            loadRekap();
        });
    }
}\);

code = code.replace(/if \(dateRekap\) \{\s*dateRekap\.style\.setProperty\('display', 'none', 'important'\);\s*dateRekap\.classList\.add\('hidden'\);\s*\}/g, 
\if (filterContainer) {
    filterContainer.style.setProperty('display', 'none', 'important');
    filterContainer.classList.add('hidden');
}\);

code = code.replace(/if \(dateRekap\) \{\s*dateRekap\.style\.display = 'none';\s*dateRekap\.classList\.add\('hidden'\);\s*\}/g, 
\if (filterContainer) {
    filterContainer.style.display = 'none';
    filterContainer.classList.add('hidden');
}\);

code = code.replace(/if \(dateRekap\) \{\s*dateRekap\.style\.display = 'inline-block';\s*dateRekap\.classList\.remove\('hidden'\);\s*loadRekap\(\);\s*\}/g, 
\if (filterContainer) {
    filterContainer.style.display = 'flex';
    filterContainer.classList.remove('hidden');
    loadRekap();
}\);

// Modify loadRekap query
code = code.replace(/const d = dateRekap\.value \|\| today;/g, 
\const d = dateRekap.value || today;
const m = monthRekap ? monthRekap.value : today.substring(0, 7);
const isMonth = typeRekap && typeRekap.value === 'month';\);

code = code.replace(/\.eq\('attendance_date', d\)/g, 
\...(isMonth 
    ? [
        { method: 'gte', args: ['attendance_date', \\-01\] },
        { method: 'lte', args: ['attendance_date', \\-31\] }
      ]
    : [{ method: 'eq', args: ['attendance_date', d] }]
)\);

// Wait, the chaining format \...(isMonth ? ...)\ doesn't work well with supabase JS client chaining directly.
// Let's rewrite the fetch logic for attendance explicitly.
\
fs.writeFileSync('patch_js.js', code);

