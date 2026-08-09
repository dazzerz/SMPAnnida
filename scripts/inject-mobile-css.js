const fs = require('fs');
const path = require('path');

const files = [
  'dashboard.html',
  'index.html',
  'pages/academic/dashboard.html',
  'pages/finance/budget.html',
  'pages/finance/rab.html',
  'pages/finance/reports.html',
  'pages/finance/settings.html',
  'pages/finance/transactions.html',
  'pages/ppdb/about.html',
  'pages/ppdb/dashboard-admin.html',
  'pages/ppdb/dashboard-siswa.html',
  'pages/ppdb/index.html',
  'pages/ppdb/login.html',
  'pages/ppdb/register.html'
];

let patchedCount = 0;
for (const f of files) {
  const fullPath = path.join(process.cwd(), f);
  if (!fs.existsSync(fullPath)) { console.log('NOT FOUND:', f); continue; }
  let content = fs.readFileSync(fullPath, 'utf8');
  const depth = f.split('/').length - 1;
  let prefix = './';
  if (depth === 2) prefix = '../../';
  if (depth === 3) prefix = '../../../';
  const tag = `<link rel="stylesheet" href="${prefix}css/mobile.css" />`;
  if (content.includes('mobile.css')) { console.log('SKIP (already has it):', f); continue; }
  content = content.replace('</head>', tag + '\n</head>');
  fs.writeFileSync(fullPath, content);
  console.log('PATCHED:', f);
  patchedCount++;
}
console.log('Total patched:', patchedCount);
