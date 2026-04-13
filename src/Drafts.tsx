import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDrafts, deleteDraft } from './store.ts'
import './Drafts.css'

export default function Drafts() {
  const [, setRefresh] = useState(0)
  const drafts = getDrafts()
  const navigate = useNavigate()

  const handleResume = (id: string) => {
    navigate('/', { state: { draftId: id } })
  }

  const handleDelete = (id: string) => {
    deleteDraft(id)
    setRefresh((r) => r + 1)
  }

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Hero Header */}
      <div className="drafts-hero">
        <div className="drafts-hero-content">
          <h1 className="drafts-hero-title">📝 Drafts</h1>
          <p className="drafts-hero-subtitle">Resume or manage your saved draft work slips</p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="empty-msg">No drafts. Use "Save as draft" on the New Work Slip form to save incomplete slips.</p>
      ) : (
        <div className="dashboard-card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SO No</th>
                <th>Date</th>
                <th>Offices</th>
                <th>Request</th>
                <th>Saved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d) => (
                <tr key={d.id} className="animate-fade-in">
                  <td>{d.soNumber}</td>
                  <td>{d.date || '—'}</td>
                  <td>{d.offices?.length ? d.offices.join(', ') : '—'}</td>
                  <td>{d.actionDone || '—'}</td>
                  <td>{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="actions-cell">
                    <button type="button" className="btn-resume" onClick={() => handleResume(d.id)} style={{ marginRight: '8px' }}>Resume</button>
                    <button type="button" className="btn-delete" onClick={() => handleDelete(d.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
