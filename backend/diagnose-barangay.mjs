import sqlite3Module from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sqlite3 = sqlite3Module.verbose();

const db = new sqlite3.Database(path.join(__dirname, 'workslips.db'), (err) => {
  if (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
  }
});

console.log('\n========== BARANGAY OFFICES DIAGNOSTIC ==========\n');

// Check all records with BARANGAY OFFICES
db.all(
  'SELECT DISTINCT selectedBarangay FROM work_slips WHERE offices LIKE \'%BARANGAY%\' ORDER BY selectedBarangay',
  (err, rows) => {
    if (err) {
      console.error('Query error:', err);
      db.close();
      return;
    }

    console.log('📍 Barangays with recorded work slips:');
    if (!rows || rows.length === 0) {
      console.log('   (No records found with BARANGAY OFFICES)');
    } else {
      rows.forEach((r, i) => {
        const barangay = r.selectedBarangay || '(empty/null)';
        console.log(`   ${i + 1}. ${barangay}`);
      });
      console.log(`\n✅ Total: ${rows.length} barangay entries with records\n`);
    }

    // Get count stats
    db.all(
      'SELECT selectedBarangay, COUNT(*) as count FROM work_slips WHERE offices LIKE \'%BARANGAY%\' GROUP BY selectedBarangay ORDER BY count DESC',
      (err, stats) => {
        if (err) {
          console.error('Stats query error:', err);
        } else if (stats && stats.length > 0) {
          console.log('📊 Work slip counts by barangay:');
          stats.forEach((s) => {
            const barangay = s.selectedBarangay || '(empty/null)';
            console.log(`   ${barangay}: ${s.count} record(s)`);
          });
        }

        db.close();
      }
    );
  }
);
