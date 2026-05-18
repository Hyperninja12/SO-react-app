import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = await open({ filename: path.join(__dirname, 'workslips.db'), driver: sqlite3.Database });

const cols = await db.all('PRAGMA table_info(work_slips)');
console.log('\n=== Columns ===');
console.log(cols.map(c => c.name).join(', '));

const rows = await db.all("SELECT soNumber, offices, selectedBarangay FROM work_slips WHERE offices LIKE '%BARANGAY%' LIMIT 5");
console.log('\n=== BARANGAY Records ===');
if (rows.length === 0) {
  console.log('(no records with BARANGAY OFFICES found)');
} else {
  rows.forEach(r => {
    console.log('SO:', r.soNumber, '| selectedBarangay:', r.selectedBarangay ?? '(null)', '| offices:', r.offices);
  });
}

await db.close();
