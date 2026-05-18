const Database = require('better-sqlite3');
const db = new Database('./workslips.db');

const cols = db.prepare('PRAGMA table_info(work_slips)').all();
console.log('\n=== Columns in work_slips ===');
cols.forEach(c => console.log(' - ' + c.name));

const rows = db.prepare("SELECT soNumber, offices, selectedBarangay FROM work_slips WHERE offices LIKE '%BARANGAY%' LIMIT 5").all();
console.log('\n=== Records with BARANGAY OFFICES ===');
if (rows.length === 0) console.log(' (none found)');
rows.forEach(r => {
  console.log(' SO: ' + r.soNumber + ' | selectedBarangay: ' + (r.selectedBarangay || '(null/empty)') + ' | offices: ' + r.offices);
});

db.close();
