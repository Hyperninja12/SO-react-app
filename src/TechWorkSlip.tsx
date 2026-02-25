import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import logo from "./assets/logo.jpg";
import { saveSlip, saveDraft, getDraftById } from './store.ts'
import { 
  OFFICES_IN_HOUSE, 
  OFFICES_ON_SITE, 
  OFFICES_INTERAGENCY, 
  BARANGAY_OFFICES, 
  REQUEST_TYPES, 
  TECHNICIANS,
  PRINTER_BRANDS,
  QUARTER_OPTIONS,
  getQuarterFromDate,
} from './constants.ts'
import './TechWorkSlip.css'

function generateSONumber(): string {
  const shortYear = new Date().getFullYear() % 100
  const key = 'tech-work-slip-so-counter'
  const stored = localStorage.getItem(key)
  const lastYear = stored ? parseInt(stored.slice(0, 2), 10) : null
  let count = stored ? parseInt(stored.slice(3), 10) : 0
  if (lastYear !== shortYear) count = 0
  count += 1
  const next = `${String(shortYear).padStart(2, '0')}-${count.toString().padStart(6, '0')}`
  localStorage.setItem(key, next)
  return next
}

export default function TechWorkSlip() {
  const [soNumber, setSONumber] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [quarter, setQuarter] = useState(() => getQuarterFromDate(new Date().toISOString().slice(0, 10)))
  const [areaInHouse, setAreaInHouse] = useState(false)
  const [areaOnSite, setAreaOnSite] = useState(false)
  const [areaInteragency, setAreaInteragency] = useState(false)
  const [selectedOffices, setSelectedOffices] = useState<string[]>([])
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
    if (!draftId) return
    const draft = getDraftById(draftId)
    if (!draft) return
    setSONumber(draft.soNumber)
    setDate(draft.date)
    setQuarter(draft.quarter ?? getQuarterFromDate(draft.date))
    setAreaInHouse(draft.areaInHouse)
    setAreaOnSite(draft.areaOnSite)
    setAreaInteragency(draft.areaInteragency)
    setSelectedOffices([...draft.offices])
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
    if (areaInteragency) list.push(...OFFICES_INTERAGENCY, ...BARANGAY_OFFICES)
    return list
  }, [areaInHouse, areaOnSite, areaInteragency])

  useEffect(() => {
    setSelectedOffices((prev) => prev.filter((o) => availableOffices.includes(o)))
  }, [availableOffices])

  const toggleOffice = (office: string) => {
    setSelectedOffices((prev) =>
      prev.includes(office) ? prev.filter((o) => o !== office) : [...prev, office]
    )
  }

  const errors = useMemo(() => {
    const e: Record<string, string> = {}
    if (touched.soNumber && !soNumber.trim()) e.soNumber = 'Required'
    if (touched.offices && selectedOffices.length === 0) e.offices = 'Select at least one office'
    if (touched.date && !date.trim()) e.date = 'Required'
    if (touched.area && !areaSelected) e.area = 'Select at least one area'
    if (touched.timeStarted && !timeStarted) e.timeStarted = 'Required'
    if (touched.timeEnded && !timeEnded) e.timeEnded = 'Required'
    const firstReq = reportRows[0]?.request?.trim()
    if (touched.actionDone && !firstReq) e.actionDone = 'Select request type for at least one report'
    if (touched.technician && !technicianName.trim()) e.technician = 'Required'
    return e
  }, [touched, soNumber, selectedOffices, date, areaSelected, timeStarted, timeEnded, reportRows, technicianName])

  const canSubmit = useMemo(() => {
    const firstReq = reportRows[0]?.request?.trim()
    return (
      soNumber.trim() !== '' &&
      technicianName.trim() !== '' &&
      selectedOffices.length > 0 &&
      date.trim() !== '' &&
      areaSelected &&
      timeStarted !== '' &&
      timeEnded !== '' &&
      (firstReq ?? '') !== ''
    )
  }, [soNumber, technicianName, selectedOffices, date, areaSelected, timeStarted, timeEnded, reportRows])

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
      technician: true,
    })
    const firstReq = reportRows[0]?.request?.trim()
    if (
      !soNumber.trim() ||
      !technicianName.trim() ||
      selectedOffices.length === 0 ||
      !date.trim() ||
      !areaSelected ||
      !timeStarted ||
      !timeEnded ||
      !firstReq
    )
      return
    setSubmitting(true)
    setSubmitMessage(null)
    setSubmitError(null)
    const finalSO = soNumber.trim()
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
    } catch (e) {
      setSubmitMessage('error')
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
      setTimeout(() => { setSubmitMessage(null); setSubmitError(null) }, 3000)
    }
  }

  const handleSaveDraft = () => {
    const draftSO = soNumber.trim() || generateSONumber()
    const technicalReports = reportRows.map((r) => ({ request: r.request, actionDone: r.actionDone, recommendation: r.recommendation }))
    saveDraft({
      soNumber: draftSO,
      date,
      quarter: quarter || getQuarterFromDate(date),
      areaInHouse,
      areaOnSite,
      areaInteragency,
      offices: [...selectedOffices],
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
    <div className="tech-work-slip">
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
            SO No - Tech: <input
  type="text"
  value={soNumber}
  onChange={(e) => {
    let value = e.target.value.replace(/[^0-9]/g, '')
    if (value.length > 8) value = value.slice(0, 8)
    if (value.length > 2) value = value.slice(0, 2) + '-' + value.slice(2)
    setSONumber(value)
  }}
  onBlur={handleBlur('soNumber')}
  placeholder="26-000001"
  maxLength={9}
  className={`so-input ${errors.soNumber ? 'error' : ''}`}
/>
            {errors.soNumber && <span className="field-error so-error-inline">{errors.soNumber}</span>}

          </div>
        </div>
        <div className="header-divider" />
      </header>

      <main className="slip-body">
        <div className="fields-row fields-row-date-quarter">
          <div className="field-box field-date">
            <label className="field">
              <span className="field-label">DATE</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                onBlur={handleBlur('date')}
                className={`date-input ${errors.date ? 'error' : ''}`}
                min="2020-01-01"
                max="2030-12-31"
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </label>
          </div>
          <div className="quarter-box">
            <span className="quarter-label">QUARTER</span>
            <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)} className="quarter-select">
              {QUARTER_OPTIONS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="fields-row area-row">
          <div className="field-box area-group">
            <span className="field-label">Area</span>
            <label className="checkbox-label">
              <input type="radio" name="area" checked={areaInHouse} onChange={() => { setAreaInHouse(true); setAreaOnSite(false); setAreaInteragency(false); }} onBlur={handleBlur('area')} />
              In House (within City Hall premises)
            </label>
            <label className="checkbox-label">
              <input type="radio" name="area" checked={areaOnSite} onChange={() => { setAreaOnSite(true); setAreaInHouse(false); setAreaInteragency(false); }} onBlur={handleBlur('area')} />
              On Site (outside government offices and barangays)
            </label>
            <label className="checkbox-label">
              <input type="radio" name="area" checked={areaInteragency} onChange={() => { setAreaInteragency(true); setAreaInHouse(false); setAreaOnSite(false); }} onBlur={handleBlur('area')} />
              Interagency
            </label>
            {errors.area && <span className="field-error">{errors.area}</span>}
          </div>
          <div className="field-box field offices-field" ref={officesRef}>
            <span className="field-label">OFFICES</span>
            <button
              type="button"
              className={`offices-dropdown ${errors.offices ? 'error' : ''}`}
              onClick={() => setOfficesOpen((o) => !o)}
              onBlur={handleBlur('offices')}
            >
              {selectedOffices.length === 0 ? 'Select offices…' : `${selectedOffices.length} selected`}
            </button>
            {errors.offices && <span className="field-error">{errors.offices}</span>}
            {officesOpen && (
              <div className="offices-dropdown-panel">
                {availableOffices.length === 0 ? (
                  <div className="offices-empty">Select an area first</div>
                ) : (
                  availableOffices.map((office) => (
                    <label key={office} className="offices-option">
                      <input type="checkbox" checked={selectedOffices.includes(office)} onChange={() => toggleOffice(office)} />
                      {office}
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="field-box">
            <label className="field">
              <span className="field-label">Time Started</span>
              <input type="time" value={timeStarted} onChange={(e) => setTimeStarted(e.target.value)} onBlur={handleBlur('timeStarted')} className={errors.timeStarted ? 'error' : ''} />
              {errors.timeStarted && <span className="field-error">{errors.timeStarted}</span>}
            </label>
          </div>
          <div className="field-box">
            <label className="field">
              <span className="field-label">Time Ended</span>
              <input type="time" value={timeEnded} onChange={(e) => setTimeEnded(e.target.value)} onBlur={handleBlur('timeEnded')} className={errors.timeEnded ? 'error' : ''} />
              {errors.timeEnded && <span className="field-error">{errors.timeEnded}</span>}
            </label>
          </div>
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
              <label className="field block">
                <span className="field-label">REQUEST</span>
                <select
                  value={row.request}
                  onChange={(e) => updateReportRow(row.id, 'request', e.target.value)}
                  onBlur={handleBlur('actionDone')}
                  className={index === 0 && errors.actionDone ? 'error request-select' : 'request-select'}
                >
                  <option value="" disabled>Select request type…</option>
                  {REQUEST_TYPES.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {index === 0 && errors.actionDone && <span className="field-error">{errors.actionDone}</span>}
              </label>
              {row.request === 'Printer isolation (reset,installation, printer sharing, and checking)' && index === 0 && (
                <>
                  <label className="field block">
                    <span className="field-label">PRINTER BRAND</span>
                    <select value={printerBrand} onChange={(e) => setPrinterBrand(e.target.value)} className="printer-select">
                      <option value="">Select printer brand…</option>
                      {PRINTER_BRANDS.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field block">
                    <span className="field-label">PRINTER MODEL</span>
                    <input type="text" value={printerModel} onChange={(e) => setPrinterModel(e.target.value)} placeholder="Enter printer model" className="printer-model-input" />
                  </label>
                  </>
              )}
                    
                    <label className="field block">
                      <span className="field-label">ACTION DONE</span>
                      <textarea
                        value={row.actionDone}
                        onChange={(e) => updateReportRow(row.id, 'actionDone', e.target.value)}
                        rows={3}
                      />
                    </label>
                    <label className="field block">
                      <span className="field-label">RECOMMENDATION</span>
                      <textarea
                        value={row.recommendation}
                        onChange={(e) => updateReportRow(row.id, 'recommendation', e.target.value)}
                        rows={3}
                      />
                    </label>

            </div>
          ))}

          <button type="button" className="add-report-btn" onClick={addReportRow}>+ Add another report</button>
        </section>

        <footer className="slip-footer">
          <div className="signature-row">
            <div className="signature-block">
              <span className="field-label">Client (Full Name)</span>
              <input type="text" value={requesterSignature} onChange={(e) => setRequesterSignature(e.target.value)} className="signature-input" />
            </div>
            <div className="signature-block">
              <span className="field-label">Technician</span>
              <select
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                onBlur={handleBlur('technician')}
                className={`signature-select ${errors.technician ? 'error' : ''}`}
              >
                <option value="" disabled>Select Technician</option>
                {TECHNICIANS.map((tech) => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
              {errors.technician && <span className="field-error">{errors.technician}</span>}
            </div>
          </div>

        </footer>
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
  )
}
