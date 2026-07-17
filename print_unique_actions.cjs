const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/workslips.db');

db.all('SELECT DISTINCT actionDone FROM work_slips', [], (err, rows) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Unique request types in DB:');
  rows.forEach(r => console.log(` - "${r.actionDone}"`));
  db.close();
});
