const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/workslips.db');

db.all('SELECT id, soNumber, date, technicianNames, quarter, createdAt FROM work_slips ORDER BY createdAt DESC LIMIT 20', [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Total sample rows:', rows.length);
  rows.forEach(r => console.log(r));
  
  db.all('SELECT COUNT(*) as count FROM work_slips WHERE date LIKE "%-08-%" OR date LIKE "%/08/%"', [], (err2, augRows) => {
    console.log('August rows count:', augRows);
    db.close();
  });
});
