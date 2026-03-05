import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getEffectiveYear(): number {
  const override = process.env.SO_YEAR_OVERRIDE;
  if (override != null && override !== '') {
    const y = parseInt(override, 10);
    if (!Number.isNaN(y) && y >= 2000 && y <= 2100) return y;
  }
  return new Date().getFullYear();
}

function getArchiveDir(): string {
  return path.join(__dirname, '..', '..', 'archive');
}

export function createAdminRoutes(db: Database) {
  const router = express.Router();

  const ADMIN_RESET_PASSWORD = (process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_PASSWORD || '').trim();

  // POST close year: archive that year's data to a file, remove from DB, prepare next year
  router.post('/admin/close-year', async (req, res) => {
    if (!ADMIN_RESET_PASSWORD) {
      return res.status(503).json({ error: 'Close year is not configured (ADMIN_RESET_PASSWORD missing)' });
    }
    const { password } = req.body || {};
    if (typeof password !== 'string' || password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' });
    }
    if (password.trim() !== ADMIN_RESET_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    try {
      const yearToClose = getEffectiveYear();
      const yy = String(yearToClose % 100).padStart(2, '0');
      const nextYear = yearToClose + 1;

      const slips = await db.all(
        'SELECT * FROM work_slips WHERE (date LIKE ? OR soNumber LIKE ?)',
        [`${yearToClose}-%`, `${yy}-%`]
      );

      const parsed = (slips as Record<string, unknown>[]).map((s) => ({
        ...s,
        offices: typeof s.offices === 'string' ? s.offices : JSON.stringify(s.offices || '[]'),
        technicalReports: typeof s.technicalReports === 'string' ? s.technicalReports : JSON.stringify(s.technicalReports || '[]'),
      }));

      const archiveDir = getArchiveDir();
      if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `slips-${yearToClose}-${timestamp}.json`;
      const filePath = path.join(archiveDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), 'utf-8');

      const ids = parsed.map((s: Record<string, unknown>) => s.id).filter(Boolean) as string[];
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        await db.run(`DELETE FROM work_slips WHERE id IN (${placeholders})`, ids);
      }

      await db.run('DELETE FROM so_sequence WHERE year = ?', yearToClose);
      await db.run('INSERT OR REPLACE INTO so_sequence (year, next_sequence) VALUES (?, 1)', nextYear);

      res.json({
        success: true,
        message: `${yearToClose} data archived to ${filename} and removed from View Data. Next year (${nextYear}) is ready — new slips will use ${String(nextYear % 100).padStart(2, '0')}-00001.`,
        archivedCount: parsed.length,
        archiveFile: filename,
      });
    } catch (error) {
      console.error('Close year error:', error);
      res.status(500).json({ error: 'Failed to close year' });
    }
  });

  // GET list of archive files (admin only; no auth check here — frontend hides from non-admin)
  router.get('/admin/archive', async (_req, res) => {
    try {
      const archiveDir = getArchiveDir();
      if (!fs.existsSync(archiveDir)) {
        return res.json({ archives: [] });
      }
      const files = fs.readdirSync(archiveDir)
        .filter((f) => f.startsWith('slips-') && f.endsWith('.json'))
        .map((f) => {
          const match = f.match(/^slips-(\d{4})-(.+)\.json$/);
          const year = match ? parseInt(match[1], 10) : 0;
          const createdAt = match ? match[2].replace(/-/g, ':').slice(0, 19) : '';
          return { year, filename: f, createdAt };
        })
        .sort((a, b) => b.year - a.year || b.filename.localeCompare(a.filename));
      res.json({ archives: files });
    } catch (error) {
      console.error('List archive error:', error);
      res.status(500).json({ error: 'Failed to list archives' });
    }
  });

  // GET one archive file content (filename safe: only slips-YYYY-*.json)
  router.get('/admin/archive/:filename', (req, res) => {
    const { filename } = req.params;
    if (!/^slips-\d{4}-[0-9T\-]+\.json$/.test(filename)) {
      return res.status(400).json({ error: 'Invalid archive filename' });
    }
    try {
      const filePath = path.join(getArchiveDir(), filename);
      if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Archive not found' });
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      res.json({ year: filename.match(/^slips-(\d{4})/)?.[1], slips: data });
    } catch (error) {
      console.error('Get archive error:', error);
      res.status(500).json({ error: 'Failed to read archive' });
    }
  });

  return router;
}
