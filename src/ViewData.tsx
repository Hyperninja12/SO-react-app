import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getSlips, updateSlip } from './store.ts'
import { 
  OFFICES_IN_HOUSE, 
  OFFICES_ON_SITE, 
  OFFICES_INTERAGENCY, 
  BARANGAY_OFFICES, 
  REQUEST_TYPES, 
  TECHNICIANS,
  QUARTER_OPTIONS,
  getQuarterFromDate,
} from './constants.ts'
import type { WorkSlipEntry } from './types.ts'
import './ViewData.css'

function areaLabel(s: WorkSlipEntry): string {
  const parts: string[] = []
  if (s.areaInHouse) parts.push('In House')
  if (s.areaOnSite) parts.push('On Site')
  if (s.areaInteragency) parts.push('Interagency')
  return parts.length ? parts.join(', ') : '—'
}

function quarterLabel(s: WorkSlipEntry): string {
  const q = s.quarter ?? getQuarterFromDate(s.date)
  return `Q${q}`
}

const emptyForm: Omit<WorkSlipEntry, 'id' | 'createdAt'> = {
  soNumber: '',
  date: '',
  quarter: 1,
  areaInHouse: false,
  areaOnSite: false,
  areaInteragency: false,
  offices: [],
  timeStarted: '',
  timeEnded: '',
  actionDone: '',
  recommendation: '',
  requesterSignature: '',
  technicianName: '',
  approvedBy: '',
  printerBrand: '',
  printerModel: '',
}

export default function ViewData() {
  const { isSuperAdmin } = useAuth()
  const [refresh, setRefresh] = useState(0)
  const [slips, setSlips] = useState<WorkSlipEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterArea, setFilterArea] = useState<string>('')
  const [filterOffice, setFilterOffice] = useState<string>('')
  const [filterQuarter, setFilterQuarter] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [reportRows, setReportRows] = useState<Array<{ id: string; request: string; actionDone: string; recommendation: string }>>([])
  const [officesOpen, setOfficesOpen] = useState(false)
  const officesRef = useRef<HTMLDivElement>(null)

  // Load slips data on component mount and when refresh changes
  useEffect(() => {
    const loadSlips = async () => {
      setLoading(true)
      const data = await getSlips()
      setSlips(data)
      setLoading(false)
    }
    loadSlips()
  }, [refresh])

  const slip = editingId ? slips.find(s => s.id === editingId) : null

  const availableOffices = useMemo(() => {
    const list: string[] = []
    if (form.areaInHouse) list.push(...OFFICES_IN_HOUSE)
    if (form.areaOnSite) list.push(...OFFICES_ON_SITE)
    if (form.areaInteragency) list.push(...OFFICES_INTERAGENCY, ...BARANGAY_OFFICES)
    return list
  }, [form.areaInHouse, form.areaOnSite, form.areaInteragency])

  useEffect(() => {
    setForm((f) => ({ ...f, offices: f.offices.filter((o) => availableOffices.includes(o)) }))
  }, [availableOffices])

  useEffect(() => {
    if (!slip) {
      setForm(emptyForm)
      setReportRows([])
      return
    }
    setForm({
      soNumber: slip.soNumber,
      date: slip.date,
      quarter: slip.quarter ?? getQuarterFromDate(slip.date),
      areaInHouse: slip.areaInHouse,
      areaOnSite: slip.areaOnSite,
      areaInteragency: slip.areaInteragency,
      offices: [...slip.offices],
      timeStarted: slip.timeStarted,
      timeEnded: slip.timeEnded,
      actionDone: slip.actionDone,
      recommendation: slip.recommendation,
      requesterSignature: slip.requesterSignature,
      technicianName: slip.technicianName,
      approvedBy: slip.approvedBy,
      printerBrand: slip.printerBrand || '',
      printerModel: slip.printerModel || '',
    })
    // Load technicalReports into reportRows for editing
    if (Array.isArray(slip.technicalReports) && slip.technicalReports.length > 0) {
      setReportRows(slip.technicalReports.map((r, i) => ({ id: String(i + 1), request: r.request || '', actionDone: r.actionDone || '', recommendation: r.recommendation || '' })))
    } else {
      setReportRows([{ id: '1', request: slip.actionDone || '', actionDone: '', recommendation: slip.recommendation || '' }])
    }
  }, [slip])

  useEffect(() => {
    // Clear printer fields if request type is not printer-related
    if (form.actionDone !== 'Printer isolation (reset,installation, printer sharing, and checking)') {
      setForm((f) => ({ ...f, printerBrand: '', printerModel: '' }))
    }
  }, [form.actionDone])

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (officesRef.current && !officesRef.current.contains(e.target as Node)) setOfficesOpen(false)
    }
    if (officesOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [officesOpen])

  const toggleOffice = (office: string) => {
    setForm((f) => ({
      ...f,
      offices: f.offices.includes(office) ? f.offices.filter((o) => o !== office) : [...f.offices, office],
    }))
  }

  const handleSaveEdit = async () => {
    if (!editingId || !slip) return
    const success = await updateSlip({
      ...form,
      id: slip.id,
      createdAt: slip.createdAt,
      technicalReports: reportRows.map((r) => ({ request: r.request, actionDone: r.actionDone, recommendation: r.recommendation })),
    })
    if (success) {
      setEditingId(null)
      setRefresh((r) => r + 1)
    }
  }

  const addReportRow = () => {
    setReportRows((prev) => [...prev, { id: String(Date.now()), request: '', actionDone: '', recommendation: '' }])
  }
  const removeReportRow = (id: string) => {
    setReportRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }
  const updateReportRow = (id: string, field: 'request' | 'actionDone' | 'recommendation', value: string) => {
    setReportRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const filtered = useMemo(() => {
    let list = slips
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (s) =>
          s.soNumber.toLowerCase().includes(q) ||
          s.date.includes(q) ||
          areaLabel(s).toLowerCase().includes(q) ||
          s.offices.some((o) => o.toLowerCase().includes(q)) ||
          (s.actionDone || '').toLowerCase().includes(q)
      )
    }
    if (filterArea) {
      list = list.filter((s) => {
        if (filterArea === 'In House') return s.areaInHouse
        if (filterArea === 'On Site') return s.areaOnSite
        if (filterArea === 'Interagency') return s.areaInteragency
        return true
      })
    }
    if (filterOffice) {
      list = list.filter((s) => s.offices.includes(filterOffice))
    }
    if (filterQuarter) {
      const qNum = Number(filterQuarter) as 1 | 2 | 3 | 4
      list = list.filter((s) => (s.quarter ?? getQuarterFromDate(s.date)) === qNum)
    }
    return list
  }, [slips, search, filterArea, filterOffice, filterQuarter, refresh])

  const allOffices = useMemo(() => {
    const set = new Set<string>()
    slips.forEach((s) => s.offices.forEach((o) => set.add(o)))
    return Array.from(set).sort()
  }, [slips])

  const downloadReport = () => {
    const headers = ['SO No', 'Date', 'Quarter', 'Area', 'Offices', 'Time Started', 'Time Ended', 'Request', 'Technician', 'Requester', 'Approved By', 'Recommendation', 'Printer Brand', 'Printer Model']
    const areaStr = (s: WorkSlipEntry) => {
      const parts: string[] = []
      if (s.areaInHouse) parts.push('In House')
      if (s.areaOnSite) parts.push('On Site')
      if (s.areaInteragency) parts.push('Interagency')
      return parts.join('; ')
    }
    const quarterStr = (s: WorkSlipEntry) => `Q${s.quarter ?? getQuarterFromDate(s.date)}`
    const rows = slips.map((s) => [
      s.soNumber,
      s.date,
      quarterStr(s),
      areaStr(s),
      (s.offices || []).join('; '),
      s.timeStarted,
      s.timeEnded,
      s.actionDone || '',
      s.technicianName || '',
      s.requesterSignature || '',
      s.approvedBy || '',
      (s.recommendation || '').replace(/\r?\n/g, ' '),
      s.printerBrand || '',
      s.printerModel || '',
    ])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SO-WorkSlip-Report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="view-data"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="view-data">
      <h1 className="page-title">All Work Slip Data</h1>

      <div className="view-data-toolbar">
        <div className="search-wrap">
          <label className="toolbar-label">Search</label>
          <input
            type="text"
            placeholder="SO No, date, office, request…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-wrap">
          <label className="toolbar-label">Area</label>
          <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="filter-select">
            <option value="">All</option>
            <option value="In House">In House</option>
            <option value="On Site">On Site</option>
            <option value="Interagency">Interagency</option>
          </select>
        </div>
        <div className="filter-wrap">
          <label className="toolbar-label">Office</label>
          <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} className="filter-select">
            <option value="">All</option>
            {allOffices.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="filter-wrap">
          <label className="toolbar-label">Quarter</label>
          <select value={filterQuarter} onChange={(e) => setFilterQuarter(e.target.value)} className="filter-select">
            <option value="">All</option>
            {QUARTER_OPTIONS.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>
        <button type="button" className="view-data-download-btn" onClick={downloadReport} disabled={slips.length === 0}>
          Download Report (Excel/CSV)
        </button>
      </div>

      {slips.length === 0 ? (
        <p className="empty-msg">No work slips saved yet. Create one from the New Work Slip page.</p>
      ) : filtered.length === 0 ? (
        <p className="empty-msg">No results match your search or filters.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>SO No</th>
                <th>Date</th>
                <th>Quarter</th>
                <th>Area</th>
                <th>Offices</th>
                <th>Time</th>
                <th>Request</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>{s.soNumber}</td>
                  <td>{s.date}</td>
                  <td>{quarterLabel(s)}</td>
                  <td>{areaLabel(s)}</td>
                  <td>{s.offices.length ? s.offices.join(', ') : '—'}</td>
                  <td>{s.timeStarted} – {s.timeEnded}</td>
                  <td className="cell-action">{s.actionDone || '—'}</td>
                  <td>
                    {isSuperAdmin ? (
                      <button type="button" className="btn-edit" onClick={() => setEditingId(s.id)}>Edit</button>
                    ) : (
                      <span className="edit-restricted">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <div className="edit-modal-overlay" onClick={() => setEditingId(null)}>
          <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h2>Edit Work Slip</h2>
              <button type="button" className="edit-modal-close" onClick={() => setEditingId(null)} aria-label="Close">×</button>
            </div>
            <form className="edit-modal-body" onSubmit={(e) => { e.preventDefault(); handleSaveEdit() }}>
              <div className="edit-form-row">
                <label className="edit-field">
                  <span className="edit-label">SO Number</span>
                  <input type="text" value={form.soNumber} onChange={(e) => setForm((f) => ({ ...f, soNumber: e.target.value }))} />
                </label>
                <label className="edit-field">
                  <span className="edit-label">Date</span>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, quarter: getQuarterFromDate(e.target.value) }))} />
                </label>
                <label className="edit-field">
                  <span className="edit-label">Quarter</span>
                  <select value={form.quarter ?? 1} onChange={(e) => setForm((f) => ({ ...f, quarter: Number(e.target.value) as 1 | 2 | 3 | 4 }))}>
                    {QUARTER_OPTIONS.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="edit-form-row edit-area-row">
                <span className="edit-label">Area</span>
                <label className="edit-check"><input type="radio" name="edit-area" checked={form.areaInHouse} onChange={() => setForm((f) => ({ ...f, areaInHouse: true, areaOnSite: false, areaInteragency: false }))} /> In House</label>
                <label className="edit-check"><input type="radio" name="edit-area" checked={form.areaOnSite} onChange={() => setForm((f) => ({ ...f, areaOnSite: true, areaInHouse: false, areaInteragency: false }))} /> On Site</label>
                <label className="edit-check"><input type="radio" name="edit-area" checked={form.areaInteragency} onChange={() => setForm((f) => ({ ...f, areaInteragency: true, areaInHouse: false, areaOnSite: false }))} /> Interagency</label>
              </div>
              <div className="edit-form-row" ref={officesRef}>
                <div className="edit-field edit-offices-wrap">
                  <span className="edit-label">Offices</span>
                  <button type="button" className="edit-offices-btn" onClick={() => setOfficesOpen((o) => !o)}>
                    {form.offices.length === 0 ? 'Select offices…' : `${form.offices.length} selected`}
                  </button>
                  {officesOpen && (
                    <div className="edit-offices-panel">
                      {availableOffices.length === 0 ? (
                        <div className="edit-offices-empty">Select an area first</div>
                      ) : (
                        availableOffices.map((o) => (
                          <label key={o} className="edit-offices-option">
                            <input type="checkbox" checked={form.offices.includes(o)} onChange={() => toggleOffice(o)} />
                            {o}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="edit-form-row">
                <label className="edit-field">
                  <span className="edit-label">Time Started</span>
                  <input type="time" value={form.timeStarted} onChange={(e) => setForm((f) => ({ ...f, timeStarted: e.target.value }))} />
                </label>
                <label className="edit-field">
                  <span className="edit-label">Time Ended</span>
                  <input type="time" value={form.timeEnded} onChange={(e) => setForm((f) => ({ ...f, timeEnded: e.target.value }))} />
                </label>
              </div>
              <section className="technical-report">
                <h3 className="report-title">TECHNICAL REPORT</h3>
                {reportRows.map((row, index) => (
                  <div key={row.id} className="report-row">
                    <div className="report-row-header">
                      <span className="report-row-title">Report {index + 1}</span>
                      {reportRows.length > 1 && (
                        <button type="button" className="report-row-remove" onClick={() => removeReportRow(row.id)} aria-label="Remove report">Remove</button>
                      )}
                    </div>
                    <label className="edit-field edit-field-full">
                      <span className="edit-label">Request</span>
                      <select value={row.request} onChange={(e) => updateReportRow(row.id, 'request', e.target.value)}>
                        <option value="">Select…</option>
                        {REQUEST_TYPES.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </label>
                    <label className="edit-field edit-field-full">
                      <span className="edit-label">Action Done</span>
                      <textarea value={row.actionDone} onChange={(e) => updateReportRow(row.id, 'actionDone', e.target.value)} rows={2} />
                    </label>
                    <label className="edit-field edit-field-full">
                      <span className="edit-label">Recommendation</span>
                      <textarea value={row.recommendation} onChange={(e) => updateReportRow(row.id, 'recommendation', e.target.value)} rows={2} />
                    </label>
                  </div>
                ))}
                <button type="button" className="add-report-btn" onClick={addReportRow}>+ Add another report</button>
              </section>
              <div className="edit-form-row">
                <label className="edit-field">
                  <span className="edit-label">Requester (Print Name & Signature)</span>
                  <input type="text" value={form.requesterSignature} onChange={(e) => setForm((f) => ({ ...f, requesterSignature: e.target.value }))} />
                </label>
                <label className="edit-field">
                  <span className="edit-label">Technician</span>
                  <select value={form.technicianName} onChange={(e) => setForm((f) => ({ ...f, technicianName: e.target.value }))}>
                    <option value="">Select Technician</option>
                    {TECHNICIANS.map((tech) => (
                      <option key={tech} value={tech}>{tech}</option>
                    ))}
                  </select>
                </label>
              </div>
              
              <div className="edit-modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>Cancel</button>
                <button type="submit" className="btn-save-edit">Save changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
