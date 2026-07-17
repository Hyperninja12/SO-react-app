const sqlite3 = require('sqlite3');

function checkDb(path) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(path, (err) => {
      if (err) { console.log(path, 'open error:', err.message); resolve(); return; }
      db.get('SELECT COUNT(*) as c FROM work_slips', (err2, row) => {
        if (err2) { console.log(path, 'query error:', err2.message); }
        else { console.log(path, '-> work_slips rows:', row.c); }
        db.close();
        resolve();
      });
    });
  });
}

(async () => {
  await checkDb('./workslips.db');
  await checkDb('./backend/workslips.db');
})();
