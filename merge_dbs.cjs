/**
 * merge_dbs.cjs  (v2 — handles schema mismatch)
 * 1. Ensures backend/workslips.db has the technicianNames column
 * 2. Migrates legacy technicianName → technicianNames in backend DB
 * 3. Merges all 120 missing rows from root workslips.db into backend DB
 *
 * Run from project root: node merge_dbs.cjs
 */

const sqlite3 = require('./backend/node_modules/sqlite3').verbose();

const ROOT_DB    = './workslips.db';
const BACKEND_DB = './backend/workslips.db';

// ── Promisified helpers ──────────────────────────────────────────

function openDb(path) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(path, err => {
      if (err) reject(new Error(`Cannot open ${path}: ${err.message}`));
      else resolve(db);
    });
  });
}

function all(db, sql, params) {
  return new Promise((resolve, reject) =>
    db.all(sql, params || [], (err, rows) => err ? reject(err) : resolve(rows))
  );
}

function run(db, sql, params) {
  return new Promise((resolve, reject) =>
    db.run(sql, params || [], function(err) { err ? reject(err) : resolve(this); })
  );
}

function close(db) {
  return new Promise(resolve => db.close(resolve));
}

function getColumns(db, table) {
  return new Promise((resolve, reject) =>
    db.all(`PRAGMA table_info(${table})`, [], (err, rows) =>
      err ? reject(err) : resolve(rows.map(r => r.name))
    )
  );
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== Database Merge Tool v2 ===\n');

  const rootDb    = await openDb(ROOT_DB);
  const backendDb = await openDb(BACKEND_DB);

  // ── Step 1: Check & fix backend schema ──────────────────────────
  console.log('Step 1: Checking backend DB schema...');
  const backendCols = await getColumns(backendDb, 'work_slips');
  console.log('  Backend columns:', backendCols.join(', '));

  if (!backendCols.includes('technicianNames')) {
    console.log('  ⚠ Missing column: technicianNames — adding it now...');
    await run(backendDb, 'ALTER TABLE work_slips ADD COLUMN technicianNames TEXT');
    console.log('  ✓ Column added.');

    // Migrate legacy technicianName → technicianNames (JSON array)
    if (backendCols.includes('technicianName')) {
      console.log('  Migrating technicianName → technicianNames...');
      await run(backendDb, `
        UPDATE work_slips
        SET technicianNames = json_array(technicianName)
        WHERE technicianName IS NOT NULL
          AND technicianName != ''
          AND technicianNames IS NULL
      `);
      console.log('  ✓ Migration done.');
    }
  } else {
    console.log('  ✓ Schema OK.');
  }

  // ── Step 2: Get rows to merge ────────────────────────────────────
  console.log('\nStep 2: Comparing records...');
  const rootRows    = await all(rootDb,    'SELECT * FROM work_slips', []);
  const backendRows = await all(backendDb, 'SELECT * FROM work_slips', []);

  const backendIds = new Set(backendRows.map(r => r.id));
  const toMerge    = rootRows.filter(r => !backendIds.has(r.id));

  console.log(`  Root DB:    ${rootRows.length} rows`);
  console.log(`  Backend DB: ${backendRows.length} rows`);
  console.log(`  To merge:   ${toMerge.length} rows`);

  // ── Step 3: Merge ───────────────────────────────────────────────
  if (toMerge.length === 0) {
    console.log('\n✓ Nothing to merge — backend DB already has all records.');
  } else {
    console.log('\nStep 3: Merging rows...');
    let success = 0;
    let failed  = 0;

    for (const row of toMerge) {
      // Normalise technicianNames: if row has it use it; else wrap technicianName
      let techNames = row.technicianNames;
      if (!techNames && row.technicianName) {
        techNames = JSON.stringify([row.technicianName]);
      }
      if (!techNames) techNames = '[]';

      try {
        await run(backendDb, `
          INSERT INTO work_slips (
            id, soNumber, date,
            areaInHouse, areaOnSite, areaInteragency,
            offices, schoolName, selectedBarangay,
            timeStarted, timeEnded,
            actionDone, recommendation,
            requesterSignature, technicianNames, approvedBy, createdAt,
            printerBrand, printerModel, quarter, technicalReports
          ) VALUES (?,?,?, ?,?,?, ?,?,?, ?,?, ?,?, ?,?,?,?, ?,?,?,?)
        `, [
          row.id, row.soNumber, row.date,
          row.areaInHouse, row.areaOnSite, row.areaInteragency,
          row.offices, row.schoolName ?? null, row.selectedBarangay ?? null,
          row.timeStarted, row.timeEnded,
          row.actionDone, row.recommendation,
          row.requesterSignature, techNames, row.approvedBy, row.createdAt,
          row.printerBrand ?? null, row.printerModel ?? null,
          row.quarter ?? null, row.technicalReports ?? '[]'
        ]);
        console.log(`  ✓ ${row.soNumber}  (${row.date})`);
        success++;
      } catch (e) {
        console.error(`  ✗ ${row.id}: ${e.message}`);
        failed++;
      }
    }

    console.log(`\n  Inserted: ${success}  |  Failed: ${failed}`);
  }

  // ── Step 4: Check for duplicates ────────────────────────────────
  console.log('\nStep 4: Checking for duplicate soNumbers...');
  const dupes = await all(backendDb, `
    SELECT soNumber, COUNT(*) as cnt
    FROM work_slips
    GROUP BY soNumber
    HAVING cnt > 1
  `, []);

  if (dupes.length === 0) {
    console.log('  ✓ No duplicate SO numbers found.');
  } else {
    console.log(`  ⚠ Found ${dupes.length} duplicate SO numbers:`);
    dupes.forEach(d => console.log(`    ${d.soNumber} (${d.cnt} copies)`));
  }

  // ── Final count ─────────────────────────────────────────────────
  const finalRows = await all(backendDb, 'SELECT COUNT(*) as c FROM work_slips', []);
  console.log(`\n=== Backend DB final total: ${finalRows[0].c} work slips ===`);

  await close(rootDb);
  await close(backendDb);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
