const fs = require('fs');
let html = fs.readFileSync('pages/academic/dashboard.html', 'utf8');
html = html.replace('<th>Nama</th>', '<th>Nama</th><th>Tanggal</th>');
fs.writeFileSync('pages/academic/dashboard.html', html);

let js = fs.readFileSync('js/academic/teacher-attendance.js', 'utf8');
js = js.replace('<td><strong>\</strong></td>', '<td><strong>\</strong></td><td>\</td>');
fs.writeFileSync('js/academic/teacher-attendance.js', js);
console.log('Headers updated');
