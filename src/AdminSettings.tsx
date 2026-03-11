import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { closeYear, getArchiveList, getArchiveSlips, type ArchiveItem } from './store.ts'
import type { WorkSlipEntry } from './types.ts'
import './AdminSettings.css'

function areaLabel(s: WorkSlipEntry): string {
  const parts: string[] = []
  if (s.areaInHouse) parts.push('In House')
  if (s.areaOnSite) parts.push('On Site')
  if (s.areaInteragency) parts.push('Interagency')
  return parts.length ? parts.join(', ') : '—'
}

export default function AdminSettings() {
  const { isSuperAdmin } = useAuth()
  const [step, setStep] = useState<'idle' | 'confirm' | 'password'>('idle')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [archives, setArchives] = useState<ArchiveItem[]>([])
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [viewingSlips, setViewingSlips] = useState<WorkSlipEntry[] | null>(null)
  const [viewArchiveTitle, setViewArchiveTitle] = useState('')

  useEffect(() => {
    if (isSuperAdmin) {
      getArchiveList().then(setArchives)
    }
  }, [isSuperAdmin])

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

  if (!isSuperAdmin) {
    return (
      <div className="admin-settings-page">
        <h1 className="page-title">Admin Settings</h1>
        <p className="admin-restricted">You do not have permission to access this page.</p>
      </div>
    )
  }

  return (
    <div className="admin-settings-page">
      <h1 className="page-title">Admin Settings</h1>
      <section className="admin-section">
        <h2 className="admin-section-title">Year-End Reset</h2>
        <p className="admin-section-desc">
          Archive all slips for the current year to a file, remove them from View Data (so you start fresh for the new year),
          and prepare the next year&apos;s SO counter (27-000001, etc.). You can always view or download archived data below.
        </p>
        <button type="button" className="admin-btn admin-btn-reset" onClick={handleOpenReset}>
          Close Year & Reset Counter
        </button>
      </section>

      <section className="admin-section">
        <h2 className="admin-section-title">View archived data</h2>
        <p className="admin-section-desc">
          Data from closed years is stored in archive files. Select a year to view or download (read-only).
        </p>
        {archives.length === 0 ? (
          <p className="admin-archive-empty">No archives yet. Close a year to create one.</p>
        ) : (
          <ul className="admin-archive-list">
            {archives.map((item) => (
              <li key={item.filename} className="admin-archive-item">
                <span className="admin-archive-label">Year {item.year} — {item.filename}</span>
                <span className="admin-archive-actions">
                  <button type="button" className="admin-btn admin-btn-small" onClick={() => handleViewArchive(item)} disabled={archiveLoading}>
                    View
                  </button>
                  <button type="button" className="admin-btn admin-btn-small admin-btn-secondary" onClick={() => handleDownloadArchive(item)}>
                    Download JSON
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewingSlips !== null && (
        <div className="admin-modal-overlay" onClick={closeViewModal}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header-row">
              <h3 className="admin-modal-title">{viewArchiveTitle}</h3>
              <button type="button" className="admin-modal-close" onClick={closeViewModal} aria-label="Close">×</button>
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

      {step === 'confirm' && (
        <div className="admin-modal-overlay" onClick={handleCancel}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Confirm</h3>
            <p className="admin-modal-text">
              This will archive all data for the current year to a file, remove it from View Data, and prepare the next year&apos;s counter (e.g. 27-000001).
              You can view or download the archived data anytime in &quot;View archived data&quot; below.
            </p>
            <p className="admin-modal-text admin-modal-warning">Do you want to continue?</p>
            <div className="admin-modal-actions">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCancel}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleConfirmProceed}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className="admin-modal-overlay" onClick={handleCancel}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Admin password</h3>
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
                  {message.text}
                </p>
              )}
              <div className="admin-modal-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={handleCancel} disabled={loading}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={loading || !password.trim()}>
                  {loading ? 'Processing…' : 'Close Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
