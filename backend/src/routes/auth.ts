import express from 'express';
import bcrypt from 'bcrypt';
import { Database } from 'sqlite';

const SALT_ROUNDS = 10;

// All possible permission keys — matches frontend page identifiers
const ALL_PERMISSIONS = ['work_slip', 'drafts', 'view_data', 'reports', 'admin'] as const;

type Role = {
  name: string;
  label: string;
  permissions: string; // JSON string in SQLite, parse before use
  isDefault: number;
  sortOrder: number;
};

type UserRow = {
  id: string;
  username: string;
  password: string;
  role: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
};

function getSuperAdminCredentials(): { username: string; password: string } | null {
  // Read from the same env vars the frontend used to use
  const username = (process.env.VITE_SUPERADMIN_USERNAME || process.env.VITE_LOGIN_USERNAME1 || '').trim();
  const password = (process.env.VITE_SUPERADMIN_PASSWORD || process.env.VITE_LOGIN_PASSWORD1 || '').trim();
  if (!username || !password) return null;
  return { username: username.toLowerCase(), password };
}

export function createAuthRoutes(db: Database) {
  const router = express.Router();

  // ══════════════════════════════════════════════════════════════
  // POST /auth/login — validate credentials, return user + permissions
  // ══════════════════════════════════════════════════════════════
  router.post('/auth/login', async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const inputUsername = String(username).trim().toLowerCase();
    const inputPassword = String(password).trim();

    const logAccess = async (usernameStr: string) => {
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ip = req.ip || req.socket.remoteAddress || 'Unknown';
      const now = new Date().toISOString();
      try {
        await db.run(
          'INSERT INTO access_logs (id, username, action, ipAddress, timestamp) VALUES (?, ?, ?, ?, ?)',
          [logId, usernameStr, 'login', ip, now]
        );
      } catch (err) {
        console.error('Failed to log access:', err);
      }
    };

    // 1. Check super admin (.env)
    const sa = getSuperAdminCredentials();
    if (sa && inputUsername === sa.username && inputPassword === sa.password) {
      await logAccess(sa.username);
      return res.json({
        user: { id: '__superadmin__', username: sa.username, displayName: 'Super Admin', role: 'superadmin' },
        permissions: [...ALL_PERMISSIONS],
      });
    }

    // 2. Check database users
    const userRow = await db.get(
      'SELECT * FROM users WHERE LOWER(username) = ?',
      inputUsername
    ) as UserRow | undefined;

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(inputPassword, userRow.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Fetch role permissions
    const role = await db.get('SELECT * FROM roles WHERE name = ?', userRow.role) as Role | undefined;
    const permissions: string[] = role ? JSON.parse(role.permissions) : [];

    await logAccess(userRow.username);

    return res.json({
      user: {
        id: userRow.id,
        username: userRow.username,
        displayName: userRow.displayName || userRow.username,
        role: userRow.role,
      },
      permissions,
    });
  });

  // ══════════════════════════════════════════════════════════════
  // GET /auth/users — list all managed users (super admin only)
  // ══════════════════════════════════════════════════════════════
  router.get('/auth/users', async (_req, res) => {
    try {
      const users = await db.all(
        'SELECT id, username, role, displayName, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
      );
      res.json({ users });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Failed to list users' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // POST /auth/users — create a new user (super admin only)
  // ══════════════════════════════════════════════════════════════
  router.post('/auth/users', async (req, res) => {
    const { username, password, role, displayName } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const cleanUsername = String(username).trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    // Check if username is taken (or matches super admin)
    const sa = getSuperAdminCredentials();
    if (sa && cleanUsername.toLowerCase() === sa.username) {
      return res.status(409).json({ error: 'This username is reserved' });
    }
    const existing = await db.get('SELECT id FROM users WHERE LOWER(username) = ?', cleanUsername.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Validate role exists
    const validRole = await db.get('SELECT name FROM roles WHERE name = ?', role || 'viewer');
    const finalRole = validRole ? validRole.name : 'viewer';

    const hashedPassword = await bcrypt.hash(String(password).trim(), SALT_ROUNDS);
    const now = new Date().toISOString();
    const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await db.run(
      `INSERT INTO users (id, username, password, role, displayName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, cleanUsername, hashedPassword, finalRole, (displayName || cleanUsername).trim(), now, now]
    );

    res.status(201).json({
      user: { id, username: cleanUsername, role: finalRole, displayName: (displayName || cleanUsername).trim(), createdAt: now, updatedAt: now },
    });
  });

  // ══════════════════════════════════════════════════════════════
  // PUT /auth/users/:id — update a user (super admin only)
  // ══════════════════════════════════════════════════════════════
  router.put('/auth/users/:id', async (req, res) => {
    const { id } = req.params;
    const { username, password, role, displayName } = req.body || {};

    const existing = await db.get('SELECT * FROM users WHERE id = ?', id) as UserRow | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // If changing username, check uniqueness
    const newUsername = username ? String(username).trim() : existing.username;
    if (newUsername.toLowerCase() !== existing.username.toLowerCase()) {
      const sa = getSuperAdminCredentials();
      if (sa && newUsername.toLowerCase() === sa.username) {
        return res.status(409).json({ error: 'This username is reserved' });
      }
      const dup = await db.get('SELECT id FROM users WHERE LOWER(username) = ? AND id != ?', newUsername.toLowerCase(), id);
      if (dup) {
        return res.status(409).json({ error: 'Username already exists' });
      }
    }

    // Password: only re-hash if a new password was provided
    let hashedPassword = existing.password;
    if (password && String(password).trim().length > 0) {
      if (String(password).trim().length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
      }
      hashedPassword = await bcrypt.hash(String(password).trim(), SALT_ROUNDS);
    }

    const newRole = role || existing.role;
    const newDisplayName = (displayName !== undefined ? String(displayName).trim() : existing.displayName) || newUsername;
    const now = new Date().toISOString();

    await db.run(
      `UPDATE users SET username = ?, password = ?, role = ?, displayName = ?, updatedAt = ? WHERE id = ?`,
      [newUsername, hashedPassword, newRole, newDisplayName, now, id]
    );

    res.json({
      user: { id, username: newUsername, role: newRole, displayName: newDisplayName, createdAt: existing.createdAt, updatedAt: now },
    });
  });

  // ══════════════════════════════════════════════════════════════
  // DELETE /auth/users/:id — delete a user (super admin only)
  // ══════════════════════════════════════════════════════════════
  router.delete('/auth/users/:id', async (req, res) => {
    const { id } = req.params;
    const existing = await db.get('SELECT id FROM users WHERE id = ?', id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }
    await db.run('DELETE FROM users WHERE id = ?', id);
    res.status(204).send();
  });

  // ══════════════════════════════════════════════════════════════
  // GET /auth/roles — list all roles + permissions
  // ══════════════════════════════════════════════════════════════
  router.get('/auth/roles', async (_req, res) => {
    try {
      const roles = await db.all('SELECT * FROM roles ORDER BY sortOrder ASC') as Role[];
      const parsed = roles.map(r => ({ ...r, permissions: JSON.parse(r.permissions) }));
      res.json({ roles: parsed, allPermissions: ALL_PERMISSIONS });
    } catch (error) {
      console.error('List roles error:', error);
      res.status(500).json({ error: 'Failed to list roles' });
    }
  });

  // ══════════════════════════════════════════════════════════════
  // PUT /auth/roles/:name — update a role's permissions (super admin only)
  // ══════════════════════════════════════════════════════════════
  router.put('/auth/roles/:name', async (req, res) => {
    const { name } = req.params;
    const { permissions, label } = req.body || {};

    const existing = await db.get('SELECT * FROM roles WHERE name = ?', name) as Role | undefined;
    if (!existing) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const newPerms = Array.isArray(permissions)
      ? permissions.filter((p: string) => ALL_PERMISSIONS.includes(p as typeof ALL_PERMISSIONS[number]))
      : JSON.parse(existing.permissions);
    const newLabel = label ? String(label).trim() : existing.label;

    await db.run(
      'UPDATE roles SET permissions = ?, label = ? WHERE name = ?',
      [JSON.stringify(newPerms), newLabel, name]
    );

    res.json({ role: { name, label: newLabel, permissions: newPerms, isDefault: existing.isDefault, sortOrder: existing.sortOrder } });
  });

  return router;
}
