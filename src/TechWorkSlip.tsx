import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import logo from "./assets/logo.jpg";
import { saveSlip, saveDraft, getDraftById, getNextSONumber, getCurrentSOYear } from './store.ts'
import {
  OFFICES_ON_SITE,
  OFFICES_INTERAGENCY,
  BARANGAY_OFFICES,
  REQUEST_TYPES,
  TECHNICIANS,
  PRINTER_BRANDS,
  QUARTER_OPTIONS,
  getQuarterFromDate,
} from './constants.ts'
import { OFFICES_IN_HOUSE } from "./constants.ts";

import './TechWorkSlip.css'

export default function TechWorkSlip() {
  const [effectiveYY, setEffectiveYY] = useState('')
  const [soSequencePart, setSoSequencePart] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quarter, setQuarter] = useState(() => getQuarterFromDate(new Date().toISOString().slice(0, 10)))
  const [areaInHouse, setAreaInHouse] = useState(false)
  const [areaOnSite, setAreaOnSite] = useState(false)
  const [areaInteragency, setAreaInteragency] = useState(false)
  const [selectedOffices, setSelectedOffices] = useState<string[]>([])
  const [schoolName, setSchoolName] = useState('')
  const [selectedBarangay, setSelectedBarangay] = useState('')
  const [officesOpen, setOfficesOpen] = useState(false)
  const officesRef = useRef<HTMLDivElement>(null)
  const [timeStarted, setTimeStarted] = useState('')
  const [timeEnded, setTimeEnded] = useState('')
  const [reportRows, setReportRows] = useState<Array<{ id: string; request: string; actionDone: string; recommendation: string }>>([
    { id: '1', request: '', actionDone: '', recommendation: '' },
  ])
  const [requesterSignature, setRequesterSignature] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [approvedBy, setApprovedBy] = useState('')
  const [printerBrand, setPrinterBrand] = useState('')
  const [printerModel, setPrinterModel] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitMessage, setSubmitMessage] = useState<'success' | 'error' | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [draftMessage, setDraftMessage] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const location = useLocation()
  const draftId = (location.state as { draftId?: string } | null)?.draftId

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (officesRef.current && !officesRef.current.contains(e.target as Node)) setOfficesOpen(false)
    }
    if (officesOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [officesOpen])

  useEffect(() => {
    if (draftId) {
      const draft = getDraftById(draftId)
      if (draft) {
        const full = draft.soNumber || ''
        const dash = full.indexOf('-')
        if (dash >= 0) {
          setEffectiveYY(full.slice(0, dash))
          setSoSequencePart(full.slice(dash + 1))
        } else {
          setSoSequencePart(full)
        }
        return
      }
    }
    getCurrentSOYear().then(setEffectiveYY)
    setSoSequencePart('')
  }, [draftId])

  useEffect(() => {
    if (!draftId) return
    const draft = getDraftById(draftId)
    if (!draft) return
    const full = draft.soNumber || ''
    const dash = full.indexOf('-')
    if (dash >= 0) {
      setEffectiveYY(full.slice(0, dash))
      setSoSequencePart(full.slice(dash + 1))
    } else {
      setSoSequencePart(full)
    }
    setDate(draft.date)
    setQuarter(draft.quarter ?? getQuarterFromDate(draft.date))
    setAreaInHouse(draft.areaInHouse)
    setAreaOnSite(draft.areaOnSite)
    setAreaInteragency(draft.areaInteragency)
    setSelectedOffices([...draft.offices])
    setSchoolName((draft as { schoolName?: string }).schoolName ?? '')
    setSelectedBarangay((draft as { selectedBarangay?: string }).selectedBarangay ?? '')
    setTimeStarted(draft.timeStarted)
    setTimeEnded(draft.timeEnded)
    const reports = (draft as { technicalReports?: { request: string; actionDone?: string; recommendation: string }[] }).technicalReports
    if (Array.isArray(reports) && reports.length > 0) {
      setReportRows(reports.map((r, i) => ({ id: String(i + 1), request: r.request || '', actionDone: r.actionDone || '', recommendation: r.recommendation || '' })))
    } else {
      setReportRows([{ id: '1', request: draft.actionDone || '', actionDone: '', recommendation: draft.recommendation || '' }])
    }
    setRequesterSignature(draft.requesterSignature)
    setTechnicianName(draft.technicianName)
    setApprovedBy(draft.approvedBy)
    setPrinterBrand(draft.printerBrand || '')
    setPrinterModel(draft.printerModel || '')
  }, [draftId])

  const firstRequest = reportRows[0]?.request ?? ''
  useEffect(() => {
    if (firstRequest !== 'Printer isolation (reset,installation, printer sharing, and checking)') {
      setPrinterBrand('')
      setPrinterModel('')
    }
  }, [firstRequest])

  useEffect(() => {
    setQuarter(getQuarterFromDate(date))
  }, [date])

  const areaSelected = areaInHouse || areaOnSite || areaInteragency

  const availableOffices = useMemo(() => {
    const list: string[] = []
    if (areaInHouse) list.push(...OFFICES_IN_HOUSE)
    if (areaOnSite) list.push(...OFFICES_ON_SITE)
    if (areaInteragency) list.push(...OFFICES_INTERAGENCY)
    return list
  }, [areaInHouse, areaOnSite, areaInteragency])

  useEffect(() => {
    setSelectedOffices((prev) => prev.filter((o) => availableOffices.includes(o)))
  }, [availableOffices])

  useEffect(() => {
    if (!selectedOffices.includes('BARANGAY OFFICES')) {
      setSelectedBarangay('')
    }
  }, [selectedOffices])

  const toggleOffice = (office: string) => {
    setSelectedOffices((prev) =>
      prev.includes(office) ? prev.filter((o) => o !== office) : [...prev, office]
    )
  }

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (touched.offices && selectedOffices.length === 0) e.offices = 'Select at least one office'
    if (touched.date && !date.trim()) e.date = 'Required'
    if (touched.area && !areaSelected) e.area = 'Select at least one area'
    if (touched.timeStarted && !timeStarted) e.timeStarted = 'Required'
    if (touched.timeEnded && !timeEnded) e.timeEnded = 'Required'
    const firstReq = reportRows[0]?.request?.trim()
    const firstActionDone = reportRows[0]?.actionDone?.trim()
    if (touched.actionDone && !firstReq) e.actionDone = 'Select request type for at least one report'
    if (touched.actionDoneText && firstReq && !firstActionDone) e.actionDoneText = 'Action done is required'
    if (touched.technician && !technicianName.trim()) e.technician = 'Required'
    return e
  }, [touched, soSequencePart, selectedOffices, date, areaSelected, timeStarted, timeEnded, reportRows, technicianName])

  const canSubmit = useMemo(() => {
    const firstReq = reportRows[0]?.request?.trim()
    const firstActionDone = reportRows[0]?.actionDone?.trim()
    const validSequence = soSequencePart === '' || /^\d{6}$/.test(soSequencePart)
    return (
      effectiveYY !== '' &&
      validSequence &&
      technicianName.trim() !== '' &&
      selectedOffices.length > 0 &&
      date.trim() !== '' &&
      areaSelected &&
      timeStarted !== '' &&
      timeEnded !== '' &&
      (firstReq ?? '') !== '' &&
      (firstActionDone ?? '') !== ''
    )
  }, [effectiveYY, soSequencePart, technicianName, selectedOffices, date, areaSelected, timeStarted, timeEnded, reportRows])

  const handleBlur = (field: string) => () => setTouched((t) => ({ ...t, [field]: true }))

  const addReportRow = () => {
    setReportRows((prev) => [...prev, { id: String(Date.now()), request: '', actionDone: '', recommendation: '' }])
  }
  const removeReportRow = (id: string) => {
    setReportRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  }
  const updateReportRow = (id: string, field: 'request' | 'actionDone' | 'recommendation', value: string) => {
    setReportRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = async () => {
    setTouched({
      soNumber: true,
      offices: true,
      date: true,
      area: true,
      timeStarted: true,
      timeEnded: true,
      actionDone: true,
      actionDoneText: true,
      technician: true,
    })
    const firstReq = reportRows[0]?.request?.trim()
    const firstActionDone = reportRows[0]?.actionDone?.trim()
    if (
      !effectiveYY ||
      !technicianName.trim() ||
      selectedOffices.length === 0 ||
      !date.trim() ||
      !areaSelected ||
      !timeStarted ||
      !timeEnded ||
      !firstReq ||
      !firstActionDone
    )
      return
    setSubmitting(true)
    setSubmitMessage(null)
    setSubmitError(null)
    const finalSO = (soSequencePart.trim() && /^\d{6}$/.test(soSequencePart))
      ? effectiveYY + '-' + soSequencePart
      : await getNextSONumber()
    const quarterVal = quarter || getQuarterFromDate(date)
    const technicalReports = reportRows.map((r) => ({ request: r.request.trim(), actionDone: r.actionDone.trim(), recommendation: r.recommendation.trim() }))
    try {
      await saveSlip({
        soNumber: finalSO,
        date,
        quarter: quarterVal,
        areaInHouse,
        areaOnSite,
        areaInteragency,
        offices: [...selectedOffices],
        schoolName: selectedOffices.includes('DEP-ED') ? (schoolName?.trim() || undefined) : undefined,
        selectedBarangay: selectedOffices.includes('BARANGAY OFFICES') ? (selectedBarangay?.trim() || undefined) : undefined,
        timeStarted,
        timeEnded,
        actionDone: reportRows[0]?.request?.trim() ?? '',
        recommendation: reportRows[0]?.recommendation?.trim() ?? '',
        requesterSignature,
        technicianName,
        approvedBy,
        printerBrand: printerBrand || undefined,
        printerModel: printerModel || undefined,
        technicalReports,
      })
      setSubmitMessage('success')
      // Clear form so it's ready for the next slip
      const today = new Date().toISOString().slice(0, 10)
      setSoSequencePart('')
      getCurrentSOYear().then(setEffectiveYY)
      setDate(today)
      setQuarter(getQuarterFromDate(today))
      setAreaInHouse(false)
      setAreaOnSite(false)
      setAreaInteragency(false)
      setSelectedOffices([])
      setSchoolName('')
      setSelectedBarangay('')
      setTimeStarted('')
      setTimeEnded('')
      setReportRows([{ id: '1', request: '', actionDone: '', recommendation: '' }])
      setRequesterSignature('')
      setTechnicianName('')
      setApprovedBy('')
      setPrinterBrand('')
      setPrinterModel('')
      setTouched({})
      // Notify View Data to refresh the list if it's open
      window.dispatchEvent(new CustomEvent('slips-updated'))
    } catch (e) {
      setSubmitMessage('error')
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
      setTimeout(() => { setSubmitMessage(null); setSubmitError(null) }, 3000)
    }
  }

  const handleSaveDraft = async () => {
    const draftSO = (soSequencePart.trim() && /^\d{6}$/.test(soSequencePart))
      ? effectiveYY + '-' + soSequencePart
      : await getNextSONumber()
    const technicalReports = reportRows.map((r) => ({ request: r.request, actionDone: r.actionDone, recommendation: r.recommendation }))
    saveDraft({
      soNumber: draftSO || (effectiveYY ? effectiveYY + '-000001' : ''),
      date,
      quarter: quarter || getQuarterFromDate(date),
      areaInHouse,
      areaOnSite,
      areaInteragency,
      offices: [...selectedOffices],
      schoolName: selectedOffices.includes('DEP-ED') ? (schoolName?.trim() || undefined) : undefined,
      selectedBarangay: selectedOffices.includes('BARANGAY OFFICES') ? (selectedBarangay?.trim() || undefined) : undefined,
      timeStarted,
      timeEnded,
      actionDone: reportRows[0]?.request ?? '',
      recommendation: reportRows[0]?.recommendation ?? '',
      requesterSignature,
      technicianName,
      approvedBy,
      printerBrand: printerBrand || undefined,
      printerModel: printerModel || undefined,
      technicalReports,
    })
    setDraftMessage(true)
    setTimeout(() => setDraftMessage(false), 3000)
  }

  return (
    <div className="gradient-border-element">
      <div className="tech-work-slip animate-slide-up">
        <header className="slip-header">
          <div className="header-inner">
            <div className="logo-container">
              <img src={logo} alt="City Logo" className="logo-image" />
            </div>
            <div className="header-center">
              <div className="org-line">REPUBLIC OF THE PHILIPPINES</div>
              <div className="org-line">CITY OF TAGUM</div>
              <div className="org-line org-name">CITY INFORMATION AND COMMUNICATION TECHNOLOGY MANAGEMENT OFFICE</div>
            </div>
            <div className="so-number">
              SO No - Tech: <div className="so-input-wrap">
                <span className="so-yy-prefix">{effectiveYY || '…'}-</span>
                <input
                  type="text"
                  value={soSequencePart}
                  onChange={(e) => setSoSequencePart(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onBlur={handleBlur('soNumber')}
                  placeholder="000001"
                  maxLength={6}
                  className="so-input so-sequence-input"
                />
              </div>
            </div>
          </div>
          <div className="header-divider" />
        </header>

        <main className="slip-body">
          <div className="dashboard-grid no-print" style={{ marginTop: '1.5rem' }}>
            {/* General Information Card */}
            <div className="dashboard-card">
              <div className="card-header"><h3 className="card-title">General Information</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    onBlur={handleBlur('date')}
                    className={`form-input ${errors.date ? 'error' : ''}`}
                    min="2020-01-01"
                    max="2030-12-31"
                  />
                  {errors.date && <span className="field-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Quarter</label>
                  <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)} className="form-select">
                    {QUARTER_OPTIONS.map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time Started</label>
                  <input type="time" value={timeStarted} onChange={(e) => setTimeStarted(e.target.value)} onBlur={handleBlur('timeStarted')} className={`form-input ${errors.timeStarted ? 'error' : ''}`} />
                  {errors.timeStarted && <span className="field-error">{errors.timeStarted}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Time Ended</label>
                  <input type="time" value={timeEnded} onChange={(e) => setTimeEnded(e.target.value)} onBlur={handleBlur('timeEnded')} className={`form-input ${errors.timeEnded ? 'error' : ''}`} />
                  {errors.timeEnded && <span className="field-error">{errors.timeEnded}</span>}
                </div>
              </div>
            </div>

            {/* Location & Routing Card */}
            <div className="dashboard-card">
              <div className="card-header"><h3 className="card-title">Location & Routing</h3></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Area</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <label className="checkbox-label" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <input type="radio" name="area" checked={areaInHouse} onChange={() => { setAreaInHouse(true); setAreaOnSite(false); setAreaInteragency(false); }} onBlur={handleBlur('area')} style={{ marginRight: '8px' }} />
                      In House (within City Hall premises)
                    </label>
                    <label className="checkbox-label" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <input type="radio" name="area" checked={areaOnSite} onChange={() => { setAreaOnSite(true); setAreaInHouse(false); setAreaInteragency(false); }} onBlur={handleBlur('area')} style={{ marginRight: '8px' }} />
                      On Site (outside government offices)
                    </label>
                    <label className="checkbox-label" style={{ padding: '8px 12px', borderRadius: '8px' }}>
                      <input type="radio" name="area" checked={areaInteragency} onChange={() => { setAreaInteragency(true); setAreaInHouse(false); setAreaOnSite(false); }} onBlur={handleBlur('area')} style={{ marginRight: '8px' }} />
                      Interagency
                    </label>
                  </div>
                  {errors.area && <span className="field-error">{errors.area}</span>}
                </div>

                <div className="form-group" ref={officesRef} style={{ position: 'relative' }}>
                  <label className="form-label">OFFICES</label>
                  <button
                    type="button"
                    className={`offices-dropdown ${errors.offices ? 'error' : ''}`}
                    onClick={() => setOfficesOpen((o) => !o)}
                    onBlur={handleBlur('offices')}
                  >
                    <span className="offices-btn-left">
                      <span className="offices-btn-icon">🏢</span>
                      <span className={`offices-btn-text ${selectedOffices.length > 0 ? 'has-selection' : ''}`}>
                        {selectedOffices.length === 0 ? 'Select offices…' : selectedOffices.join(', ')}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {selectedOffices.length > 0 && (
                        <span className="offices-btn-badge">{selectedOffices.length}</span>
                      )}
                      <span className={`offices-btn-chevron ${officesOpen ? 'open' : ''}`}>▼</span>
                    </span>
                  </button>
                  {errors.offices && <span className="field-error">{errors.offices}</span>}
                  {officesOpen && (
                    <div className="offices-dropdown-panel">
                      {availableOffices.length === 0 ? (
                        <div className="offices-empty">Select an area first</div>
                      ) : (
                        availableOffices.map((office) => (
                          <label key={office} className="offices-option">
                            <input type="checkbox" checked={selectedOffices.includes(office)} onChange={() => toggleOffice(office)} /> {office}
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {selectedOffices.includes('DEP-ED') && (
                  <div className="form-group">
                    <label className="form-label">School name (DEP-ED)</label>
                    <input type="text" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g. Tagum City National High School" className="form-input" />
                  </div>
                )}

                {selectedOffices.includes('BARANGAY OFFICES') && (
                  <div className="form-group">
                    <label className="form-label">Select Barangay</label>
                    <select
                      value={selectedBarangay}
                      onChange={(e) => setSelectedBarangay(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select barangay…</option>
                      {BARANGAY_OFFICES.map((brgy) => (
                        <option key={brgy} value={brgy}>{brgy}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Reports Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Technical Reports</h3>
                <button type="button" className="add-report-btn" onClick={addReportRow} style={{ padding: '6px 12px', fontSize: '0.875rem', borderRadius: '6px' }}>+ Add Report</button>
              </div>
              <div className="card-body">
                {reportRows.map((row, index) => (
                  <div key={row.id} className="report-row animate-fade-in delay-100" style={{ padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '1rem', background: 'var(--bg-app)' }}>
                    <div className="report-row-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Report {index + 1}</span>
                      {reportRows.length > 1 && (
                        <button type="button" className="report-row-remove" onClick={() => removeReportRow(row.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">REQUEST</label>
                      <select
                        value={row.request}
                        onChange={(e) => updateReportRow(row.id, 'request', e.target.value)}
                        onBlur={handleBlur('actionDone')}
                        className={`form-select ${index === 0 && errors.actionDone ? 'error' : ''}`}
                      >
                        <option value="" disabled>Select request type…</option>
                        {REQUEST_TYPES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      {index === 0 && errors.actionDone && <span className="field-error">{errors.actionDone}</span>}
                    </div>

                    {row.request === 'Printer isolation (reset,installation, printer sharing, and checking)' && index === 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">PRINTER BRAND</label>
                          <select value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} className="form-select">
                            <option value="">Select printer brand…</option>
                            {PRINTER_BRANDS.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">PRINTER MODEL</label>
                          <input type="text" value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} placeholder="Enter printer model" className="form-input" />
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label className="form-label">ACTION DONE</label>
                      <textarea
                        value={row.actionDone}
                        onChange={(e) => updateReportRow(row.id, 'actionDone', e.target.value)}
                        onBlur={index === 0 ? handleBlur('actionDoneText') : undefined}
                        rows={3}
                        className={`form-textarea ${index === 0 && errors.actionDoneText ? 'error' : ''}`}
                      />
                      {index === 0 && errors.actionDoneText && <span className="field-error">{errors.actionDoneText}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">RECOMMENDATION</label>
                      <textarea
                        value={row.recommendation}
                        onChange={(e) => updateReportRow(row.id, 'recommendation', e.target.value)}
                        rows={3}
                        className="form-textarea"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signatures Card */}
            <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header"><h3 className="card-title">Signatures</h3></div>
              <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Client (Full Name)</label>
                  <input type="text" value={requesterSignature} onChange={(e) => setRequesterSignature(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Technician</label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    onBlur={handleBlur('technician')}
                    className={`form-select ${errors.technician ? 'error' : ''}`}
                  >
                    <option value="" disabled>Select Technician</option>
                    {TECHNICIANS.map((tech) => <option key={tech} value={tech}>{tech}</option>)}
                  </select>
                  {errors.technician && <span className="field-error">{errors.technician}</span>}
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="print-actions no-print">
          {submitMessage === 'success' && <span className="save-msg">Submitted successfully.</span>}
          {submitMessage === 'error' && <span className="save-msg save-msg-error">{submitError || 'Failed to submit. Is the server running?'}</span>}
          {draftMessage && <span className="save-msg">Draft saved.</span>}
          <button
            type="button"
            onClick={handleSubmit}
            className="submit-btn"
            disabled={submitting || !canSubmit}
          >
            {submitting ? (
              <span className="submit-btn-loading">
                <span className="submit-spinner" aria-hidden /> Submitting…
              </span>
            ) : (
              'Submit'
            )}
          </button>
          <button type="button" onClick={handleSaveDraft} className="draft-btn">Save as draft</button>
        </div>
      </div>
    </div>
  )
}
