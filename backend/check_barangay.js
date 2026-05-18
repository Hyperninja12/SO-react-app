import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'workslips.db'));

// Check columns
const cols = db.prepare("PRAGMA table_info(work_slips)").all();
console.log('\n=== Columns in work_slips ===');
cols.forEach(c => console.log(` - ${c.name}`));

// Check records with BARANGAY OFFICES
const rows = db.prepare("SELECT id, soNumber, offices, selectedBarangay FROM work_slips WHERE offices LIKE '%BARANGAY%' LIMIT 10").all();
console.log('\n=== Records with BARANGAY OFFICES ===');
rows.forEach(r => console.log(` SO: ${r.soNumber} | selectedBarangay: ${r.selectedBarangay ?? '(null)'} | offices: ${r.offices}`));

db.close();
