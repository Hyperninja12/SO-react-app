import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

export async function initializeDatabase(): Promise<Database> {
  const dbPath = process.env.DB_PATH || './workslips.db';
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS work_slips (
      id TEXT PRIMARY KEY,
      soNumber TEXT,
      date TEXT,
      areaInHouse INTEGER,
      areaOnSite INTEGER,
      areaInteragency INTEGER,
      offices TEXT, -- JSON string
      timeStarted TEXT,
      timeEnded TEXT,
      actionDone TEXT,
      recommendation TEXT,
      requesterSignature TEXT,
      technicianName TEXT,
      approvedBy TEXT,
      createdAt TEXT,
      printerBrand TEXT,
      printerModel TEXT,
      quarter INTEGER,
      technicalReports TEXT, -- JSON string
      schoolName TEXT
    )
  `);

  // Add schoolName column if DB was created before this field existed
  try {
    await db.run('ALTER TABLE work_slips ADD COLUMN schoolName TEXT');
  } catch {
    // Column already exists
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS so_sequence (
      year INTEGER PRIMARY KEY,
      next_sequence INTEGER NOT NULL DEFAULT 1
    )
  `);

  return db;
}