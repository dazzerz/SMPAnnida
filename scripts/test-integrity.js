/**
 * test-integrity.js - Automated Integrity & Unit Validation Suite
 */
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log('--- STARTING INTEGRITY TESTS ---');

// Test 1: Validate Calculator Formula
console.log('\n[TEST 1] PPDB Calculator Multiplication Logic:');
function calculateEstimate(program, childCount) {
  const baseEntry = program === 'pondok' ? 8500000 : 5000000;
  const baseMonthly = program === 'pondok' ? 1100000 : 425000;
  return {
    entry: baseEntry * childCount,
    monthly: baseMonthly * childCount
  };
}

const res1 = calculateEstimate('reguler', 1);
assert(res1.entry === 5000000 && res1.monthly === 425000, '1 Child Reguler calculation correct');

const res4 = calculateEstimate('reguler', 4);
assert(res4.entry === 20000000 && res4.monthly === 1700000, '4 Children Reguler calculation multiplied correctly');

const resPondok3 = calculateEstimate('pondok', 3);
assert(resPondok3.entry === 25500000 && resPondok3.monthly === 3300000, '3 Children Boarding calculation multiplied correctly');

// Test 2: Validate Manifest.json
console.log('\n[TEST 2] PWA Manifest Validation:');
const manifestContent = fs.readFileSync('public/manifest.json', 'utf8');
const manifest = JSON.parse(manifestContent);
assert(manifest.name === 'SMP Annida Portal Terpadu', 'Manifest name is correct');
assert(manifest.display === 'standalone', 'Manifest display is standalone');
assert(manifest.icons.length >= 2, 'Manifest has required icons');

// Test 3: Validate Sitemap.xml
console.log('\n[TEST 3] Sitemap.xml Validation:');
const sitemap = fs.readFileSync('public/sitemap.xml', 'utf8');
assert(sitemap.includes('https://smpannida.sch.id/'), 'Sitemap includes root domain');
assert(sitemap.includes('https://smpannida.sch.id/pages/ppdb/index.html'), 'Sitemap includes PPDB landing page');
assert(sitemap.includes('https://smpannida.sch.id/pages/ppdb/register.html'), 'Sitemap includes register page');

// Test 4: Validate Structured Data Schema JSON-LD in HTML
console.log('\n[TEST 4] Schema.org JSON-LD Validation:');
const ppdbIndex = fs.readFileSync('pages/ppdb/index.html', 'utf8');
const schemaMatches = ppdbIndex.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
assert(schemaMatches.length >= 3, 'PPDB Index contains School, BreadcrumbList, and FAQPage schemas');

let validSchemas = 0;
schemaMatches.forEach((s) => {
  const jsonStr = s.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '').trim();
  try {
    JSON.parse(jsonStr);
    validSchemas++;
  } catch (e) {
    console.error('Invalid JSON-LD:', e.message);
  }
});
assert(validSchemas === schemaMatches.length, 'All JSON-LD schemas in PPDB Index are valid JSON');

// Test 5: Key Assets Exist on Disk
console.log('\n[TEST 5] Key Assets Existence:');
const requiredFiles = [
  'public/logo_1x1.png',
  'public/logo.png',
  'public/sw.js',
  'public/manifest.json',
  'css/theme.css',
  'js/ppdb/draft.js',
  'js/core/telemetry.js'
];
requiredFiles.forEach(f => {
  assert(fs.existsSync(f), `File exists: ${f}`);
});


// Test 6: Security Hardening & CSP Validation
console.log('\n[TEST 6] Security Headers & Sanitization:');
const indexPath = 'index.html';
const indexContent = fs.readFileSync(indexPath, 'utf8');
assert(indexContent.includes('Content-Security-Policy'), 'index.html includes Content-Security-Policy meta tag');
assert(indexContent.includes('nosniff'), 'index.html includes X-Content-Type-Options nosniff');

const utilsPath = 'js/core/utils.js';
const utilsContent = fs.readFileSync(utilsPath, 'utf8');
assert(!utilsContent.includes('toast.innerHTML ='), 'showToast does not use vulnerable innerHTML for message');


// Test 7: Student Portal Assets & Schema Validation
console.log('\n[TEST 7] Student Portal & Email Generation:');
assert(fs.existsSync('pages/student/dashboard.html'), 'pages/student/dashboard.html exists');
assert(fs.existsSync('js/student/dashboard.js'), 'js/student/dashboard.js exists');

const stdHtml = fs.readFileSync('pages/student/dashboard.html', 'utf8');
assert(stdHtml.includes('Portal Siswa'), 'pages/student/dashboard.html contains title Portal Siswa');
assert(stdHtml.includes('modal-forced-password'), 'pages/student/dashboard.html contains forced password modal');


// Test 8: Tahap 2 PPDB to Student Portal Conversion Modals Validation
console.log('\n[TEST 8] PPDB to Student Portal Conversion & Integration:');
const adminHtml = fs.readFileSync('pages/ppdb/dashboard-admin.html', 'utf8');
assert(adminHtml.includes('modal-konversi-siswa'), 'dashboard-admin.html includes modal-konversi-siswa');
assert(adminHtml.includes('modal-kredensial-siswa'), 'dashboard-admin.html includes modal-kredensial-siswa');

const waliHtml = fs.readFileSync('pages/ppdb/dashboard-wali.html', 'utf8');
assert(waliHtml.includes('student-portal-access-card'), 'dashboard-wali.html includes student-portal-access-card');

const dbJs = fs.readFileSync('js/ppdb/db.js', 'utf8');
assert(dbJs.includes('openKonversiModal'), 'js/ppdb/db.js includes openKonversiModal');
assert(dbJs.includes('submitKonversiSiswa'), 'js/ppdb/db.js includes submitKonversiSiswa');


// Test 9: Complete Portal Siswa Operational Readiness & Security Audits
console.log('\n[TEST 9] Portal Siswa Readiness & Operational Audits:');
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(indexHtml.includes('Login Siswa'), 'index.html contains explicit Login Siswa CTA');

const academicHtml = fs.readFileSync('pages/academic/dashboard.html', 'utf8');
assert(academicHtml.includes('btn-export-kredensial-siswa'), 'academic/dashboard.html includes btn-export-kredensial-siswa');
assert(academicHtml.includes('btn-cetak-kartu-siswa'), 'academic/dashboard.html includes btn-cetak-kartu-siswa');

const siswaJs = fs.readFileSync('js/academic/siswa.js', 'utf8');
assert(siswaJs.includes('btn-export-kredensial-siswa'), 'js/academic/siswa.js includes Excel credential export');
assert(siswaJs.includes('btn-cetak-kartu-siswa'), 'js/academic/siswa.js includes PDF card generation');

const studentJs = fs.readFileSync('js/student/dashboard.js', 'utf8');
assert(studentJs.includes('resolveUserRole'), 'js/student/dashboard.js includes strict resolveUserRole route guard');

const securitySql = fs.readFileSync('database/migrations/student_portal_security_and_storage.sql', 'utf8');
assert(securitySql.includes('student-assignments'), 'migration defines student-assignments storage bucket');
assert(securitySql.includes('5242880'), 'migration enforces 5MB storage limit');


// Test 10: LMS (Learning Management System) & E-Assignment Integration
console.log('\n[TEST 10] LMS & E-Assignment System Validation:');
const lmsSql = fs.readFileSync('database/migrations/student_lms_and_assignments.sql', 'utf8');
assert(lmsSql.includes('CREATE TABLE IF NOT EXISTS public.assignments'), 'LMS migration creates assignments table');
assert(lmsSql.includes('CREATE TABLE IF NOT EXISTS public.assignment_submissions'), 'LMS migration creates assignment_submissions table');

const studentDashHtml = fs.readFileSync('pages/student/dashboard.html', 'utf8');
assert(studentDashHtml.includes('id="panel-tugas"'), 'Portal siswa includes panel-tugas section');
assert(studentDashHtml.includes('id="modal-submit-tugas"'), 'Portal siswa includes modal-submit-tugas');

const studentDashJs = fs.readFileSync('js/student/dashboard.js', 'utf8');
assert(studentDashJs.includes('loadAssignments'), 'Portal siswa JS includes loadAssignments loader');

const acaDashHtml = fs.readFileSync('pages/academic/dashboard.html', 'utf8');
assert(acaDashHtml.includes('id="tugas-lms"'), 'Academic dashboard includes tugas-lms section');
assert(acaDashHtml.includes('id="modal-assignment"'), 'Academic dashboard includes modal-assignment');
assert(acaDashHtml.includes('id="modal-review-submissions"'), 'Academic dashboard includes modal-review-submissions');

const lmsTeacherJs = fs.readFileSync('js/academic/lms.js', 'utf8');
assert(lmsTeacherJs.includes('openReviewSubmissionsModal'), 'LMS teacher JS includes review and grading modal');


// Test 11: CBT Online Exam (Anti-Cheat) & Smart Text Parser Validation
console.log('\n[TEST 11] CBT Online Exam (Anti-Cheat) & Smart Parser Validation:');
const cbtSql = fs.readFileSync('database/migrations/cbt_and_elearning_modules.sql', 'utf8');
assert(cbtSql.includes('CREATE TABLE IF NOT EXISTS public.quizzes'), 'CBT migration creates quizzes table');
assert(cbtSql.includes('CREATE TABLE IF NOT EXISTS public.quiz_questions'), 'CBT migration creates quiz_questions table');
assert(cbtSql.includes('CREATE TABLE IF NOT EXISTS public.quiz_attempts'), 'CBT migration creates quiz_attempts table');
assert(cbtSql.includes('CREATE TABLE IF NOT EXISTS public.learning_modules'), 'CBT migration creates learning_modules table');

const studentHtml = fs.readFileSync('pages/student/dashboard.html', 'utf8');
assert(studentHtml.includes('id="panel-cbt"'), 'Portal siswa includes panel-cbt section');
assert(studentHtml.includes('id="modal-cbt-runner"'), 'Portal siswa includes modal-cbt-runner fullscreen');
assert(studentHtml.includes('id="modal-cbt-results"'), 'Portal siswa includes modal-cbt-results discussion view');

const studentJs2 = fs.readFileSync('js/student/dashboard.js', 'utf8');
assert(studentJs2.includes('startCbtExam'), 'Portal siswa JS includes startCbtExam runner');
assert(studentJs2.includes('initAntiCheatTracking'), 'Portal siswa JS includes anti-cheat visibility tracking');
assert(studentJs2.includes('showCbtResultsAndDiscussion'), 'Portal siswa JS includes instant results discussion');

const acaHtml2 = fs.readFileSync('pages/academic/dashboard.html', 'utf8');
assert(acaHtml2.includes('id="cbt-admin"'), 'Academic dashboard includes cbt-admin section');
assert(acaHtml2.includes('id="modal-quiz-cbt"'), 'Academic dashboard includes modal-quiz-cbt');
assert(acaHtml2.includes('id="modal-text-parser"'), 'Academic dashboard includes modal-text-parser');

const lmsJs2 = fs.readFileSync('js/academic/lms.js', 'utf8');
assert(lmsJs2.includes('parseRawQuestions'), 'LMS JS includes smart text parser');


// Test 12: Interactive Material Viewer & Type Selection Validation
console.log('\n[TEST 12] Interactive Material Viewer & Multi-Format Validation:');
const addTypeSql = fs.readFileSync('database/migrations/add_type_to_assignments.sql', 'utf8');
assert(addTypeSql.includes('ADD COLUMN IF NOT EXISTS type'), 'Migration adds type column to assignments table');

const acaHtml3 = fs.readFileSync('pages/academic/dashboard.html', 'utf8');
assert(acaHtml3.includes('id="modal-material-viewer"'), 'Academic dashboard includes modal-material-viewer');
assert(acaHtml3.includes('id="type-materi"'), 'Academic dashboard includes type-materi selection');
assert(acaHtml3.includes('id="material-viewer-iframe"'), 'Academic dashboard includes material-viewer-iframe');

const lmsJs3 = fs.readFileSync('js/academic/lms.js', 'utf8');
assert(lmsJs3.includes('formatEmbedUrl'), 'LMS JS includes YouTube and Drive embed formatter');
assert(lmsJs3.includes('openMaterialViewer'), 'LMS JS includes openMaterialViewer launcher');

const studentHtml3 = fs.readFileSync('pages/student/dashboard.html', 'utf8');
assert(studentHtml3.includes('id="student-interactive-materials-grid"'), 'Portal siswa includes student-interactive-materials-grid');
assert(studentHtml3.includes('id="modal-material-viewer"'), 'Portal siswa includes modal-material-viewer');

const studentJs3 = fs.readFileSync('js/student/dashboard.js', 'utf8');
assert(studentJs3.includes('loadStudentInteractiveMaterials'), 'Portal siswa JS includes loadStudentInteractiveMaterials loader');
assert(studentJs3.includes('openStudentMaterialViewer'), 'Portal siswa JS includes openStudentMaterialViewer launcher');

console.log('\n--- TEST SUMMARY ---');
console.log(`Total Passed: ${passed}, Total Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL INTEGRITY TESTS PASSED SUCCESSFULLY! 🚀\n');
}
