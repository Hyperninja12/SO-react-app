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

  // ── User Management Tables ──────────────────────────────────────

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      displayName TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Role definitions with customizable permissions
  // permissions is a JSON array of strings like ["work_slip","drafts","view_data","reports"]
  await db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      name TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      permissions TEXT NOT NULL DEFAULT '[]',
      isDefault INTEGER NOT NULL DEFAULT 0,
      sortOrder INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Seed default roles if the roles table is empty
  const roleCount = await db.get('SELECT COUNT(*) as c FROM roles');
  if (roleCount && roleCount.c === 0) {
    await db.run(
      `INSERT INTO roles (name, label, permissions, isDefault, sortOrder) VALUES (?, ?, ?, ?, ?)`,
      ['admin', 'Admin', JSON.stringify(['work_slip', 'drafts', 'view_data', 'reports']), 0, 1]
    );
    await db.run(
      `INSERT INTO roles (name, label, permissions, isDefault, sortOrder) VALUES (?, ?, ?, ?, ?)`,
      ['editor', 'Editor', JSON.stringify(['work_slip', 'drafts', 'view_data']), 1, 2]
    );
    await db.run(
      `INSERT INTO roles (name, label, permissions, isDefault, sortOrder) VALUES (?, ?, ?, ?, ?)`,
      ['viewer', 'Viewer', JSON.stringify(['view_data']), 0, 3]
    );
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      ipAddress TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  return db;
}