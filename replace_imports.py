import os

with open('js/academic/main.js', 'r', encoding='utf-8') as f:
    content = f.read()

import_code = '''
            // Trigger initialization hook berdasarkan hash/modul
            if (hash === 'data-siswa') {
                import('./siswa.js').then(m => m.initStudentSection?.() || (typeof window.loadStudents === 'function' && window.loadStudents()));
            } else if (hash === 'guru' || hash === 'data-guru') {
                import('./guru.js').then(m => m.initGuruSection?.() || (typeof window.loadTeachers === 'function' && window.loadTeachers()));
            } else if (hash === 'absensi-guru') {
                import('./teacher-attendance.js').then(m => m.initTeacherAttendance?.() || (typeof window.loadAttendance === 'function' && window.loadAttendance()));
            } else if (hash === 'jurnal-guru') {
                import('./jurnal.js').then(m => m.initJurnalSection?.() || (typeof window.loadJournals === 'function' && window.loadJournals()));
            } else if (hash === 'absensi') {
                import('./attendance.js').then(m => m.initAttendanceSection?.() || (typeof window.loadStudentAttendance === 'function' && window.loadStudentAttendance()));
            } else if (hash === 'nilai') {
                import('./nilai.js').then(m => m.initNilaiSection?.() || (typeof window.loadNilai === 'function' && window.loadNilai()));
            } else if (hash === 'rapor') {
                import('./dashboard.js').then(m => m.initRaporSection?.() || (typeof window.loadRapor === 'function' && window.loadRapor()));
            } else if (hash === 'jadwal') {
                import('./jadwal.js').then(m => m.initJadwalSection?.() || (typeof window.loadJadwal === 'function' && window.loadJadwal()));
            } else if (hash === 'mata-pelajaran') {
                import('./mapel.js').then(m => m.initMapelSection?.() || (typeof window.loadMapel === 'function' && window.loadMapel()));
            } else if (hash === 'kelas') {
                import('./kelas.js').then(m => m.initKelasSection?.() || (typeof window.loadKelas === 'function' && window.loadKelas()));
            } else if (hash === 'data-migration') {
                import('./migration.js').then(m => m.initMigrationSection?.() || (typeof window.loadMigration === 'function' && window.loadMigration()));
            }
'''

# We will replace the block from "if (hash === 'data-siswa' && typeof window.loadStudents === 'function') {" 
# to the end of the if-else chain.
import re
new_content = re.sub(r'if \(hash === \'data-siswa\' && typeof window\.loadStudents === \'function\'\) \{.*?window\.loadMigration\(\);\s*\}', import_code.strip(), content, flags=re.DOTALL)

with open('js/academic/main.js', 'w', encoding='utf-8') as f:
    f.write(new_content)
