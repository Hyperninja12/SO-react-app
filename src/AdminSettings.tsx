import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import {
  Users, ShieldCheck, CalendarClock, Archive, UserPlus, Edit2, Trash2,
  Eye, Download, X, AlertCircle, Check, History, Settings
} from 'lucide-react'
import {
  closeYear, getArchiveList, getArchiveSlips, type ArchiveItem,
  getUsers, createUser, updateUser, deleteUser,
  getRoles, updateRole, getAccessLogs,
  type ManagedUser, type RoleDef, type AccessLog
} from './store.ts'
import type { WorkSlipEntry } from './types.ts'
import './AdminSettings.css'

const PERM_LABELS: Record<string, string> = {
  work_slip: 'New Work Slip',
  drafts: 'Drafts',
  view_data: 'View Data',
  reports: 'Reports',
  admin: 'Admin Settings',
}

function areaLabel(s: WorkSlipEntry): string {
  const parts: string[] = []
  if (s.areaInHouse) parts.push('In House')
  if (s.areaOnSite) parts.push('On Site')
  if (s.areaInteragency) parts.push('Interagency')
  return parts.length ? parts.join(', ') : '—'
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    superadmin: { bg: '#ecfdf5', text: '#059669' },
    admin: { bg: '#eff6ff', text: '#2563eb' },
    editor: { bg: '#fffbeb', text: '#d97706' },
    viewer: { bg: '#f3f4f6', text: '#6b7280' },
  }
  const c = colors[role] ?? colors.viewer
  return (
    <span className="role-badge" style={{ background: c.bg, color: c.text }}>
      {role === 'superadmin' ? 'Super Admin' : role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

export default function AdminSettings() {
  const { isSuperAdmin } = useAuth()

  // ── Year-End Reset state ──────────────────────────────────────
  const [step, setStep] = useState<'idle' | 'confirm' | 'password'>('idle')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [viewingSlips, setViewingSlips] = useState<WorkSlipEntry[] | null>(null)
  const [viewArchiveTitle, setViewArchiveTitle] = useState('')

  // ── User Management state ─────────────────────────────────────
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [roles, setRoles] = useState<RoleDef[]>([])
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [userLoading, setUserLoading] = useState(false)
  const [userMsg, setUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Access Logs state ─────────────────────────────────────────
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  // User modal
  const [userModal, setUserModal] = useState<'add' | 'edit' | null>(null)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formRole, setFormRole] = useState('viewer')
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Delete modal
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Role editor
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null)
  const [rolePerms, setRolePerms] = useState<string[]>([])
  const [roleSaving, setRoleSaving] = useState(false)

  // ── Tab state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'history' | 'yearend' | 'archives'>('users')

  // ── Load data ─────────────────────────────────────────────────
  useEffect(() => {
    if (isSuperAdmin) {
      loadUsers()
      loadRoles()
      getArchiveList().then(setArchives)
      loadAccessLogs()
    }
  }, [isSuperAdmin])

  async function loadUsers() {
    setUserLoading(true)
    const u = await getUsers()
    setUsers(u)
    setUserLoading(false)
  }

  async function loadRoles() {
    const data = await getRoles()
    setRoles(data.roles)
    setAllPermissions(data.allPermissions)
  }

  async function loadAccessLogs() {
    setLogsLoading(true)
    const logs = await getAccessLogs()
    setAccessLogs(logs)
    setLogsLoading(false)
  }

  // ── Year-End handlers ─────────────────────────────────────────
  const handleOpenReset = () => setStep('confirm')
  const handleConfirmProceed = () => setStep('password')
  const handleCancel = () => {
    setStep('idle')
    setPassword('')
    setMessage(null)
  }

  const handleCloseYear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return
    setLoading(true)
    setMessage(null)
    const result = await closeYear(password)
    setLoading(false)
    if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Year closed successfully.' })
      setPassword('')
      getArchiveList().then(setArchives)
      setTimeout(() => handleCancel(), 2500)
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to close year.' })
    }
  }

  const handleViewArchive = async (item: ArchiveItem) => {
    setArchiveLoading(true)
    const slips = await getArchiveSlips(item.filename)
    setArchiveLoading(false)
    setViewArchiveTitle(`Archived data — ${item.year} (${item.filename})`)
    setViewingSlips(slips)
  }

  const handleDownloadArchive = async (item: ArchiveItem) => {
    const base = (import.meta.env.VITE_API_URL as string) ?? ''
    const url = `${base}/api/admin/archive/${encodeURIComponent(item.filename)}`
    try {
      const res = await fetch(url)
      if (!res.ok) return
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data.slips ?? [], null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = item.filename
      a.click()
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(url, '_blank')
    }
  }

  const closeViewModal = () => {
    setViewingSlips(null)
    setViewArchiveTitle('')
  }

  // ── User CRUD handlers ────────────────────────────────────────
  function openAddUser() {
    setUserModal('add')
    setEditingUser(null)
    setFormUsername('')
    setFormPassword('')
    setFormDisplayName('')
    setFormRole(roles.find(r => r.isDefault)?.name || 'viewer')
    setFormError('')
  }

  function openEditUser(u: ManagedUser) {
    setUserModal('edit')
    setEditingUser(u)
    setFormUsername(u.username)
    setFormPassword('')
    setFormDisplayName(u.displayName)
    setFormRole(u.role)
    setFormError('')
  }

  function closeUserModal() {
    setUserModal(null)
    setEditingUser(null)
    setFormError('')
  }

  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      if (userModal === 'add') {
        await createUser({ username: formUsername, password: formPassword, role: formRole, displayName: formDisplayName || formUsername })
        setUserMsg({ type: 'success', text: `Account "${formUsername}" created successfully.` })
      } else if (userModal === 'edit' && editingUser) {
        await updateUser(editingUser.id, {
          username: formUsername,
          password: formPassword || undefined,
          role: formRole,
          displayName: formDisplayName || formUsername,
        })
        setUserMsg({ type: 'success', text: `Account "${formUsername}" updated successfully.` })
      }
      closeUserModal()
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setFormLoading(false)
    }
  }

  function openDeleteUser(u: ManagedUser) {
    setDeletingUser(u)
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return
    setDeleteLoading(true)
    const ok = await deleteUser(deletingUser.id)
    setDeleteLoading(false)
    if (ok) {
      setUserMsg({ type: 'success', text: `Account "${deletingUser.username}" deleted.` })
      setDeletingUser(null)
      await loadUsers()
    } else {
      setUserMsg({ type: 'error', text: 'Failed to delete user.' })
      setDeletingUser(null)
    }
  }

  // ── Role Editor handlers ──────────────────────────────────────
  function openRoleEditor(role: RoleDef) {
    setEditingRole(role)
    setRolePerms([...role.permissions])
  }

  function toggleRolePerm(perm: string) {
    setRolePerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  async function saveRolePerms() {
    if (!editingRole) return
    setRoleSaving(true)
    try {
      await updateRole(editingRole.name, { permissions: rolePerms })
      setEditingRole(null)
      await loadRoles()
      setUserMsg({ type: 'success', text: `"${editingRole.label}" role permissions updated.` })
    } catch (err) {
      setUserMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save role.' })
    } finally {
      setRoleSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────

  if (!isSuperAdmin) {
    return (
      <div className="admin-settings-page">
        <h1 className="page-title"><Settings /> Admin Settings</h1>
        <p className="admin-restricted">You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="admin-settings-page">
      <h1 className="page-title"><Settings /> Admin Settings</h1>

      {/* Tab Nav */}
      <div className="admin-tabs">
        <button type="button" className={`admin-tab ${activeTab === 'users' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={18} /> User Accounts
        </button>
        <button type="button" className={`admin-tab ${activeTab === 'roles' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('roles')}>
          <ShieldCheck size={18} /> Role Permissions
        </button>
        <button type="button" className={`admin-tab ${activeTab === 'history' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('history')}>
          <History size={18} /> Access History
        </button>
        <button type="button" className={`admin-tab ${activeTab === 'yearend' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('yearend')}>
          <CalendarClock size={18} /> Year-End Reset
        </button>
        <button type="button" className={`admin-tab ${activeTab === 'archives' ? 'admin-tab-active' : ''}`} onClick={() => setActiveTab('archives')}>
          <Archive size={18} /> Archives
        </button>
      </div>

      {/* Global message */}
      {userMsg && (
        <div className={`admin-message ${userMsg.type === 'error' ? 'admin-message-error' : 'admin-message-success'}`}>
          {userMsg.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          {userMsg.text}
          <button type="button" className="admin-msg-dismiss" onClick={() => setUserMsg(null)}><X size={20} /></button>
        </div>
      )}

      {/* ═══════ USERS TAB ═══════ */}
      {activeTab === 'users' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title"><Users size={20} /> User Accounts</h2>
              <p className="admin-section-desc">Create and manage user accounts. Each user gets a role that controls which pages they can access.</p>
            </div>
            <button type="button" className="admin-btn admin-btn-primary" onClick={openAddUser}>
              <UserPlus size={18} /> Add User
            </button>
          </div>
          {userLoading ? (
            <p className="admin-loading">Loading users…</p>
          ) : users.length === 0 ? (
            <div className="admin-empty-state">
              <Users className="admin-empty-icon" />
              <p>No user accounts yet. Click <strong>"Add User"</strong> to create one.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Display Name</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td className="admin-cell-username">{u.username}</td>
                      <td>{u.displayName || '—'}</td>
                      <td><RoleBadge role={u.role} /></td>
                      <td className="admin-cell-date">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td className="admin-cell-actions">
                        <button type="button" className="admin-btn admin-btn-small admin-btn-secondary" onClick={() => openEditUser(u)}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button type="button" className="admin-btn admin-btn-small admin-btn-danger" onClick={() => openDeleteUser(u)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════ ROLES TAB ═══════ */}
      {activeTab === 'roles' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title"><ShieldCheck size={20} /> Role Permissions</h2>
              <p className="admin-section-desc">Customize which pages each role can access. Changes apply immediately to all users with that role.</p>
            </div>
          </div>
          {roles.length === 0 ? (
            <p className="admin-loading">Loading roles…</p>
          ) : (
            <div className="admin-roles-grid">
              {roles.map(role => (
                <div key={role.name} className="admin-role-card">
                  <div className="admin-role-card-header">
                    <RoleBadge role={role.name} />
                    <button type="button" className="admin-btn admin-btn-small admin-btn-secondary" onClick={() => openRoleEditor(role)}>
                      <Edit2 size={14} /> Edit Permissions
                    </button>
                  </div>
                  <div className="admin-role-perms">
                    {allPermissions.filter(p => p !== 'admin').map(p => (
                      <span key={p} className="admin-perm-chip">
                        {role.permissions.includes(p) ? (
                          <Check size={16} className="admin-perm-icon-on" />
                        ) : (
                          <X size={16} className="admin-perm-icon-off" />
                        )}
                        {PERM_LABELS[p] || p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════ ACCESS HISTORY TAB ═══════ */}
      {activeTab === 'history' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title"><History size={20} /> Access History</h2>
              <p className="admin-section-desc">View a log of users who have recently logged into the system.</p>
            </div>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={loadAccessLogs}>
               Refresh
            </button>
          </div>
          {logsLoading ? (
            <p className="admin-loading">Loading access history…</p>
          ) : accessLogs.length === 0 ? (
            <div className="admin-empty-state">
              <History className="admin-empty-icon" />
              <p>No access logs recorded yet.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {accessLogs.map(log => (
                    <tr key={log.id}>
                      <td className="admin-cell-date">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="admin-cell-username">{log.username}</td>
                      <td>
                        <span className="role-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                           {log.action.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ═══════ YEAR-END TAB ═══════ */}
      {activeTab === 'yearend' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title"><CalendarClock size={20} /> Year-End Reset</h2>
              <p className="admin-section-desc">
                Archive all slips for the current year to a file, remove them from View Data (so you start fresh for the new year),
                and prepare the next year's SO counter (e.g. 27-000001).
              </p>
            </div>
          </div>
          <button type="button" className="admin-btn admin-btn-reset" onClick={handleOpenReset}>
            <CalendarClock size={18} /> Close Year &amp; Reset Counter
          </button>
        </section>
      )}

      {/* ═══════ ARCHIVES TAB ═══════ */}
      {activeTab === 'archives' && (
        <section className="admin-section">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title"><Archive size={20} /> Archived Data</h2>
              <p className="admin-section-desc">
                Data from closed years is stored in archive files. Select a year to view or download (read-only).
              </p>
            </div>
          </div>
          {archives.length === 0 ? (
            <div className="admin-empty-state">
              <Archive className="admin-empty-icon" />
              <p>No archives yet. Close a year to create one.</p>
            </div>
          ) : (
            <ul className="admin-archive-list">
              {archives.map((item) => (
                <li key={item.filename} className="admin-archive-item">
                  <span className="admin-archive-label">
                    <Archive size={16} color="#6b7280" />
                    Year {item.year} — {item.filename}
                  </span>
                  <span className="admin-archive-actions">
                    <button type="button" className="admin-btn admin-btn-small admin-btn-secondary" onClick={() => handleViewArchive(item)} disabled={archiveLoading}>
                      <Eye size={14} /> View
                    </button>
                    <button type="button" className="admin-btn admin-btn-small admin-btn-primary" onClick={() => handleDownloadArchive(item)}>
                      <Download size={14} /> Download JSON
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ═══════ MODALS ═══════ */}

      {/* Archive View Modal */}
      {viewingSlips !== null && (
        <div className="admin-modal-overlay" onClick={closeViewModal}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header-row">
              <h3 className="admin-modal-title"><Archive size={24} /> {viewArchiveTitle}</h3>
              <button type="button" className="admin-modal-close" onClick={closeViewModal} aria-label="Close"><X size={24} /></button>
            </div>
            <div className="admin-archive-table-wrap">
              <table className="admin-archive-table">
                <thead>
                  <tr>
                    <th>SO No</th>
                    <th>Date</th>
                    <th>Area</th>
                    <th>Offices</th>
                    <th>School</th>
                    <th>Time</th>
                    <th>Request</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingSlips.map((s) => (
                    <tr key={s.id}>
                      <td>{s.soNumber}</td>
                      <td>{s.date}</td>
                      <td>{areaLabel(s)}</td>
                      <td>{(s.offices || []).join(', ')}</td>
                      <td>{s.schoolName || '—'}</td>
                      <td>{s.timeStarted} – {s.timeEnded}</td>
                      <td>{s.actionDone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={closeViewModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Year-End Confirm Modal */}
      {step === 'confirm' && (
        <div className="admin-modal-overlay" onClick={handleCancel}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title"><AlertCircle size={24} color="#dc2626" /> Confirm Close Year</h3>
            <p className="admin-modal-text">
              This will archive all data for the current year to a file, remove it from View Data, and prepare the next year's counter (e.g. 27-000001).
              You can view or download the archived data anytime in the Archives tab.
            </p>
            <p className="admin-modal-text admin-modal-warning">Do you want to continue?</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCancel}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleConfirmProceed}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Year-End Password Modal */}
      {step === 'password' && (
        <div className="admin-modal-overlay" onClick={handleCancel}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title"><ShieldCheck size={24} color="#10b981" /> Admin Password</h3>
            <p className="admin-modal-text">
              Enter the admin reset password to close the year and prepare the next year counter.
            </p>
            <form onSubmit={handleCloseYear} className="admin-form">
              <label className="admin-field">
                <span className="admin-label">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="admin-input"
                  autoFocus
                  disabled={loading}
                />
              </label>
              {message && (
                <p className={`admin-message ${message.type === 'error' ? 'admin-message-error' : 'admin-message-success'}`}>
                  {message.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                  {message.text}
                </p>
              )}
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCancel} disabled={loading}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-reset" disabled={loading || !password.trim()}>
                  {loading ? 'Processing…' : 'Close Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {userModal && (
        <div className="admin-modal-overlay" onClick={closeUserModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header-row">
              <h3 className="admin-modal-title">
                {userModal === 'add' ? <UserPlus size={24} /> : <Edit2 size={24} />}
                {userModal === 'add' ? ' Add New User' : ' Edit User'}
              </h3>
              <button type="button" className="admin-modal-close" onClick={closeUserModal} aria-label="Close"><X size={24} /></button>
            </div>
            <form onSubmit={handleSaveUser} className="admin-form">
              <label className="admin-field">
                <span className="admin-label">Username</span>
                <input
                  type="text"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="e.g. john.doe"
                  className="admin-input"
                  required
                  minLength={3}
                  autoFocus
                  disabled={formLoading}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Display Name</span>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="admin-input"
                  disabled={formLoading}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">{userModal === 'edit' ? 'New Password (leave blank to keep current)' : 'Password'}</span>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={userModal === 'edit' ? '••••••••' : 'Minimum 4 characters'}
                  className="admin-input"
                  required={userModal === 'add'}
                  minLength={userModal === 'add' ? 4 : undefined}
                  disabled={formLoading}
                />
              </label>
              <label className="admin-field">
                <span className="admin-label">Role</span>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="admin-input" disabled={formLoading}>
                  {roles.map(r => (
                    <option key={r.name} value={r.name}>{r.label}</option>
                  ))}
                </select>
              </label>
              {formError && (
                <p className="admin-message admin-message-error"><AlertCircle size={16} /> {formError}</p>
              )}
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeUserModal} disabled={formLoading}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving…' : userModal === 'add' ? 'Create Account' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <div className="admin-modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title"><AlertCircle size={24} color="#dc2626" /> Delete User</h3>
            <p className="admin-modal-text">
              Are you sure you want to delete the account <strong>"{deletingUser.username}"</strong>?
              This action cannot be undone.
            </p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setDeletingUser(null)} disabled={deleteLoading}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={confirmDeleteUser} disabled={deleteLoading}>
                <Trash2 size={16} /> {deleteLoading ? 'Deleting…' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Permission Editor Modal */}
      {editingRole && (
        <div className="admin-modal-overlay" onClick={() => setEditingRole(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header-row">
              <h3 className="admin-modal-title">
                <ShieldCheck size={24} /> Edit Permissions
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setEditingRole(null)} aria-label="Close"><X size={24} /></button>
            </div>
            
            <p className="admin-modal-text">Editing role: <RoleBadge role={editingRole.name} /></p>
            <p className="admin-modal-text">Toggle which pages users with this role can access.</p>
            
            <div className="admin-perm-toggle-list">
              {allPermissions.filter(p => p !== 'admin').map(p => (
                <label key={p} className="admin-perm-toggle">
                  <input
                    type="checkbox"
                    checked={rolePerms.includes(p)}
                    onChange={() => toggleRolePerm(p)}
                    disabled={roleSaving}
                  />
                  <span className="admin-perm-toggle-label">{PERM_LABELS[p] || p}</span>
                </label>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setEditingRole(null)} disabled={roleSaving}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={saveRolePerms} disabled={roleSaving}>
                <Check size={16} /> {roleSaving ? 'Saving…' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
