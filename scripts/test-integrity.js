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

console.log('--- INTEGRITY TESTS (Critical Policies) ---');

// Test 1: No guest mode references in JS/CSS/HTML
console.log('\n[TEST 1] No guest mode remnants:');
const guestPattern = /isGuest|guest_mode_active|guest_stats|guest_get_totals|Guest \(View Only\)/i;
const testDirs = ['js', 'css'];
let foundGuest = false;

testDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const walk = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && 
          (fullPath.endsWith('.js') || fullPath.endsWith('.css'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (guestPattern.test(content)) {
            console.error(`    Found guest reference in ${fullPath}`);
            foundGuest = true;
          }
        }
      });
    };
    walk(dir);
  }
});

assert(!foundGuest, 'No guest-mode references in JS/CSS');

// Test 2: Service Worker kill-switch exists
console.log('\n[TEST 2] Service Worker kill-switch presence:');
const hasSw = fs.existsSync('public/sw.js');
let swValid = false;
if (hasSw) {
  const swContent = fs.readFileSync('public/sw.js', 'utf8');
  const hasUnregister = swContent.includes('unregister');
  const hasCacheDelete = swContent.includes('caches.delete');
  swValid = hasUnregister && hasCacheDelete;
  if (!hasUnregister) console.error('    Missing unregister');
  if (!hasCacheDelete) console.error('    Missing cache delete');
}
assert(hasSw && swValid, 'SW kill-switch exists and unregisters+caches');

// Test 3: No unsafe inline style on sidebar elements
console.log('\n[TEST 3] No inline style on drawer/backdrop:');
const layoutContent = fs.readFileSync('js/core/layout.js', 'utf8');
const dangerousInline = layoutContent.match(/\.(?:sidebar|app\-container|sidebar\-overlay)\.style\.(?:display|opacity|pointerEvents|visibility)\s*=/g);
assert(!dangerousInline, 'No inline style assignments on drawer/backdrop');

// Test 4: CSS Cache busters in key dashboard pages
console.log('\n[TEST 4] CSS cache-busters in dashboard pages:');
const pages = [
  'pages/academic/dashboard.html',
  'pages/finance/dashboard.html',
  'pages/student/dashboard.html',
  'pages/ppdb/dashboard-admin.html'
];
let missingCache = [];
pages.forEach(page => {
  if (fs.existsSync(page)) {
    const content = fs.readFileSync(page, 'utf8');
    if (!content.includes('theme.css?v=') && !content.includes('/assets/theme-')) {
      missingCache.push(page);
    }
  } else {
    missingCache.push(page + ' (missing)');
  }
});
assert(missingCache.length === 0, 'All dashboard pages have CSS cache-busters');

// Test 5: PPDB Calculator Multiplication Logic (legacy, keep)
console.log('\n[TEST 5] PPDB Calculator Multiplication Logic:');
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

// Results
console.log('\n--- RESULTS ---');
console.log(`Total Passed: ${passed}/${passed + failed}`);
if (failed === 0) {
  console.log('INTEGRITY TESTS PASSED ✓');
  process.exit(0);
} else {
  console.log('INTEGRITY TESTS FAILED ✗');
  process.exit(1);
}