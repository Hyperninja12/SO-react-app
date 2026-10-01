import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, LabelList, Legend } from 'recharts'
import { getSlips } from './store.ts'
import { getRequestCategory, getQuarterFromDate, REQUEST_TYPES } from './constants.ts'
import type { WorkSlipEntry } from './types.ts'
import { useAuth } from './AuthContext'
import './Reports.css'

const PIE_COLORS = ['#166534', '#1e40af', '#7c3aed', '#b45309', '#0d9488', '#be123c', '#4f46e5', '#059669']
function parseSlipDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null
  const clean = dateStr.trim().slice(0, 10)
  const d = new Date(clean + 'T12:00:00')
  if (!isNaN(d.getTime())) return d
  const fallback = new Date(dateStr)
  return isNaN(fallback.getTime()) ? null : fallback
}

function getMonthKey(dateStr: string): string {
  const d = parseSlipDate(dateStr)
  if (!d) return ''
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  return `${y}-${String(m).padStart(2, '0')}`
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m, 10) - 1]} ${y}`
}

const REPORT_ROW_LABELS = [
  'COMPUTER ISOLATION',
  'SOFTWARE ISOLATION, INSTALLATION & CHECKING',
  'NETWORK ISOLATION, INSTALLATION & CHECKING',
  'HARDWARE INSTALLATION & CHECKING',
  'PRINTER ISOLATION, INSTALLATION, PRINTER SHARING & CHECKING',
] as const

function normalizeRequestKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const REQUEST_TO_REPORT_ROW: Record<string, number> = {
  'computer isolation': 0,
  'software isolation installation and checking': 1,
  'activation of operating system and ms office': 1,
  'password recovery': 1,
  'network isolation installation and checking': 2,
  'hardware installation and checking': 3,
  'printer isolation reset installation printer sharing and checking': 4,
}

function getReportRowIndex(requestOrActionDone: string): number | null {
  if (!requestOrActionDone || !requestOrActionDone.trim()) return null
  const key = normalizeRequestKey(requestOrActionDone)
  for (const [k, v] of Object.entries(REQUEST_TO_REPORT_ROW)) {
    if (normalizeRequestKey(k) === key) return v
  }
  return null
}


function getSection(slip: WorkSlipEntry): 0 | 1 | null {
  if (slip.areaInHouse || slip.areaOnSite) return 0
  if (slip.areaInteragency) return 1
  return null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-chart-tooltip">
        <p className="custom-chart-tooltip-label">{label}</p>
        <div className="custom-chart-tooltip-item">
          <span className="label">Total Slips</span>
          <span className="value">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function Reports() {
  const { user } = useAuth()
  const role = user?.role?.toLowerCase() || ''
  const isAdmin = role === 'admin' || role === 'superadmin'

  const [slips, setSlips] = useState<WorkSlipEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear())
  const [reportQuarter, setReportQuarter] = useState<0 | 1 | 2 | 3 | 4>(0)
  const [reportMonth, setReportMonth] = useState<number>(0)

  useEffect(() => {
    const loadSlips = async () => {
      setLoading(true)
      const data = await getSlips()
      setSlips(data)
      setLoading(false)
    }
    loadSlips()
  }, [])


  // Slips filtered by selected year + quarter + month
  const filteredSlips = useMemo(() => {
    return slips.filter((s) => {
      if (!s.date) return false
      const d = parseSlipDate(s.date)
      if (!d) return false
      if (d.getFullYear() !== reportYear) return false
      if (reportQuarter !== 0) {
        const q = s.quarter ?? getQuarterFromDate(s.date)
        if (q !== reportQuarter) return false
      }
      if (reportMonth !== 0) {
        if ((d.getMonth() + 1) !== reportMonth) return false
      }
      return true
    })
  }, [slips, reportYear, reportQuarter, reportMonth])

  const hardwareCount = useMemo(() => filteredSlips.filter((s) => getRequestCategory(s.actionDone) === 'hardware').length, [filteredSlips])
  const softwareCount = useMemo(() => filteredSlips.filter((s) => getRequestCategory(s.actionDone) === 'software').length, [filteredSlips])
  const hwSwChartData = useMemo(() => [
    { name: 'Hardware', count: hardwareCount, fill: '#166534' },
    { name: 'Software', count: softwareCount, fill: '#1e40af' },
  ], [hardwareCount, softwareCount])

  const requestTypeChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredSlips.forEach((s) => {
      const keyNorm = normalizeRequestKey(s.actionDone || '')
      const matched = REQUEST_TYPES.find(r => normalizeRequestKey(r) === keyNorm)
      if (matched) {
        map.set(matched, (map.get(matched) ?? 0) + 1)
      }
    })
    return Array.from(map.entries())
      .map(([name, count], i) => ({
        name: name.length > 30 ? name.slice(0, 28) + '…' : name,
        fullName: name,
        count,
        fill: PIE_COLORS[i % PIE_COLORS.length]
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredSlips])

  const technicianChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredSlips.forEach((s) => {
      let techList: string[] = []
      if (Array.isArray(s.technicianNames)) {
        techList = s.technicianNames
      } else if (typeof (s as any).technicianNames === 'string') {
        try {
          const parsed = JSON.parse((s as any).technicianNames)
          if (Array.isArray(parsed)) techList = parsed
          else if ((s as any).technicianNames.trim()) techList = [(s as any).technicianNames.trim()]
        } catch {
          if ((s as any).technicianNames.trim()) techList = [(s as any).technicianNames.trim()]
        }
      } else if ((s as any).technicianName) {
        techList = [(s as any).technicianName]
      }

      techList.forEach((tech) => {
        if (!tech || !tech.trim()) return
        map.set(tech.trim(), (map.get(tech.trim()) ?? 0) + 1)
      })
    })
    return Array.from(map.entries())
      .map(([name, count], i) => ({ name, count, fill: PIE_COLORS[i % PIE_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
  }, [filteredSlips])

  const quarterChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredSlips.forEach((s) => {
      const q = s.quarter ?? getQuarterFromDate(s.date)
      const key = `Q${q}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return ['Q1', 'Q2', 'Q3', 'Q4']
      .map((key) => ({ name: key, count: map.get(key) ?? 0 }))
  }, [filteredSlips])

  const areaChartData = useMemo(() => [
    { name: 'In House', count: filteredSlips.filter((s) => s.areaInHouse).length, fill: '#166534' },
    { name: 'On Site', count: filteredSlips.filter((s) => s.areaOnSite).length, fill: '#1e40af' },
    { name: 'Interagency', count: filteredSlips.filter((s) => s.areaInteragency).length, fill: '#7c3aed' },
  ], [filteredSlips])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of filteredSlips) {
      if (!s.date) continue
      const key = getMonthKey(s.date)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ name: formatMonthLabel(key), key, count }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [filteredSlips])

  const downloadTotals = () => {
    const year = reportYear
    const allMonthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC']

    // Quarter month ranges (0-indexed)
    const quarterMonthRanges: Record<number, number[]> = {
      0: [0,1,2,3,4,5,6,7,8,9,10,11],
      1: [0,1,2],
      2: [3,4,5],
      3: [6,7,8],
      4: [9,10,11],
    }
    const monthCols = reportMonth !== 0 ? [reportMonth - 1] : quarterMonthRanges[reportQuarter]
    const monthLabels = monthCols.map((i) => allMonthLabels[i])

    type CountGrid = number[][][]
    const count: CountGrid = [
      Array.from({ length: 5 }, () => Array(12).fill(0)),
      Array.from({ length: 5 }, () => Array(12).fill(0)),
    ]

    for (const slip of filteredSlips) {
      const section = getSection(slip)
      if (section === null) continue
      const d = parseSlipDate(slip.date)
      const month1Based = d ? d.getMonth() + 1 : 1
      const col = month1Based - 1

      const primaryRequest = slip.actionDone || (slip.technicalReports && slip.technicalReports[0]?.request) || (slip.technicalReports && slip.technicalReports[0]?.actionDone) || ''
      const rowIndex = getReportRowIndex(primaryRequest)
      if (rowIndex !== null) {
        count[section][rowIndex][col] += 1
      }
    }

    const qLabel = reportMonth !== 0 ? `${year}-${allMonthLabels[reportMonth - 1]}` : (reportQuarter === 0 ? `${year}` : `${year}-Q${reportQuarter}`)
    const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`
    const rows: string[][] = []

    rows.push(['', qLabel, ...Array(monthLabels.length - 1).fill(''), ''])
    rows.push(['Local Government of Tagum (On-Site & In House)', ...monthLabels, 'TOTAL'])
    for (let r = 0; r < 5; r++) {
      const vals = monthCols.map((col) => count[0][r][col])
      const total = vals.reduce((s, n) => s + n, 0)
      rows.push([REPORT_ROW_LABELS[r], ...vals.map(String), String(total)])
    }
    const sec0Vals = monthCols.map((col) => count[0].reduce((sum, row) => sum + row[col], 0))
    const sec0Total = sec0Vals.reduce((s, n) => s + n, 0)
    rows.push(['SUBTOTAL (Local Government)', ...sec0Vals.map(String), String(sec0Total)])

    rows.push([])

    rows.push(["Interagency Assistance (DEP-ED, BARANGAY'S, PAO, RTC, BJMP, PNP)", ...monthLabels, 'TOTAL'])
    for (let r = 0; r < 5; r++) {
      const vals = monthCols.map((col) => count[1][r][col])
      const total = vals.reduce((s, n) => s + n, 0)
      rows.push([REPORT_ROW_LABELS[r], ...vals.map(String), String(total)])
    }
    const sec1Vals = monthCols.map((col) => count[1].reduce((sum, row) => sum + row[col], 0))
    const sec1Total = sec1Vals.reduce((s, n) => s + n, 0)
    rows.push(['SUBTOTAL (Interagency)', ...sec1Vals.map(String), String(sec1Total)])

    rows.push([])

    const grandVals = monthCols.map((_, i) => sec0Vals[i] + sec1Vals[i])
    const grandTotal = sec0Total + sec1Total
    rows.push(['TOTAL WORK SLIPS', ...grandVals.map(String), String(grandTotal)])

    const csvContent = rows.map((row) => row.map(escape).join(',')).join('\r\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SO-WorkSlip-Reports-${qLabel}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="dashboard-layout"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="dashboard-layout animate-fade-in">
      {/* Hero Header */}
      <div className="reports-hero">
        <div className="reports-hero-content">
          <h1 className="reports-hero-title">📊 Reports Dashboard</h1>
          <p className="reports-hero-subtitle">Real-time analytics and insights for your work slips</p>
        </div>
        <div className="reports-hero-actions">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Year</label>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(Number(e.target.value))}
              className="form-select"
              style={{ minWidth: 100 }}
            >
              {Array.from(new Set([reportYear, new Date().getFullYear(), ...slips.map((s) => s.date ? new Date(s.date + 'T12:00:00').getFullYear() : new Date().getFullYear())])).sort((a, b) => b - a).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Quarter</label>
            <select
              value={reportQuarter}
              onChange={(e) => {
                setReportQuarter(Number(e.target.value) as 0 | 1 | 2 | 3 | 4)
                setReportMonth(0)
              }}
              className="form-select"
              style={{ minWidth: 160 }}
            >
              <option value={0}>All Quarters</option>
              <option value={1}>Q1 — Jan, Feb, Mar</option>
              <option value={2}>Q2 — Apr, May, Jun</option>
              <option value={3}>Q3 — Jul, Aug, Sep</option>
              <option value={4}>Q4 — Oct, Nov, Dec</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Month</label>
            <select
              value={reportMonth}
              onChange={(e) => {
                const m = Number(e.target.value)
                setReportMonth(m)
                if (m !== 0) {
                  const q = Math.ceil(m / 3) as 1 | 2 | 3 | 4
                  setReportQuarter(q)
                }
              }}
              className="form-select"
              style={{ minWidth: 140 }}
            >
              <option value={0}>All Months</option>
              <option value={1}>January (Q1)</option>
              <option value={2}>February (Q1)</option>
              <option value={3}>March (Q1)</option>
              <option value={4}>April (Q2)</option>
              <option value={5}>May (Q2)</option>
              <option value={6}>June (Q2)</option>
              <option value={7}>July (Q3)</option>
              <option value={8}>August (Q3)</option>
              <option value={9}>September (Q3)</option>
              <option value={10}>October (Q4)</option>
              <option value={11}>November (Q4)</option>
              <option value={12}>December (Q4)</option>
            </select>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="reports-download-btn"
              onClick={downloadTotals}
              disabled={filteredSlips.length === 0}
            >
              ⬇ Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Colorful Stat Cards */}
      <div className="reports-stats-grid">
        <div className="report-stat-card report-stat-total">
          <div className="report-stat-icon">📋</div>
          <div className="report-stat-info">
            <span className="report-stat-label">Total Slips</span>
            <span className="report-stat-value">{filteredSlips.length}</span>
          </div>
        </div>
        <div className="report-stat-card report-stat-hardware">
          <div className="report-stat-icon">🖥️</div>
          <div className="report-stat-info">
            <span className="report-stat-label">Hardware</span>
            <span className="report-stat-value">{hardwareCount}</span>
          </div>
        </div>
        <div className="report-stat-card report-stat-software">
          <div className="report-stat-icon">💿</div>
          <div className="report-stat-info">
            <span className="report-stat-label">Software</span>
            <span className="report-stat-value">{softwareCount}</span>
          </div>
        </div>
        <div className="report-stat-card report-stat-inhouse">
          <div className="report-stat-icon">🏢</div>
          <div className="report-stat-info">
            <span className="report-stat-label">In House</span>
            <span className="report-stat-value">{filteredSlips.filter((s) => s.areaInHouse).length}</span>
          </div>
        </div>
        <div className="report-stat-card report-stat-onsite">
          <div className="report-stat-icon">📍</div>
          <div className="report-stat-info">
            <span className="report-stat-label">On Site</span>
            <span className="report-stat-value">{filteredSlips.filter((s) => s.areaOnSite).length}</span>
          </div>
        </div>
        <div className="report-stat-card report-stat-interagency">
          <div className="report-stat-icon">🤝</div>
          <div className="report-stat-info">
            <span className="report-stat-label">Interagency</span>
            <span className="report-stat-value">{filteredSlips.filter((s) => s.areaInteragency).length}</span>
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="empty-msg" style={{ gridColumn: '1/-1' }}>No data to show. Save work slips to see reports.</p>
      ) : (
        <>
          {/* Full-width charts */}
          <div className="report-chart-card report-chart-accent-emerald">
            <div className="report-chart-header">
              <span className="report-chart-icon">📈</span>
              <h2 className="report-chart-title">Work Slips by Month</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={chartData} margin={{ top: 35, right: 20, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="premiumEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                    </linearGradient>
                    <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={12} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                  <Bar dataKey="count" name="Slips" radius={[10, 10, 0, 0]} fill="url(#premiumEmerald)" maxBarSize={80} animationDuration={1000} filter="url(#glow)">
                    <LabelList dataKey="count" position="top" style={{ fill: '#0f172a', fontSize: '14px', fontWeight: '700' }} dy={-8} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="report-chart-card report-chart-accent-blue">
            <div className="report-chart-header">
              <span className="report-chart-icon">⚙️</span>
              <h2 className="report-chart-title">Hardware vs Software</h2>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hwSwChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Slips" radius={[10, 10, 0, 0]}>
                    {hwSwChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2x2 Chart Grid */}
          <div className="reports-chart-grid">
            <div className="report-chart-card report-chart-accent-violet">
              <div className="report-chart-header">
                <span className="report-chart-icon">🔖</span>
                <h2 className="report-chart-title">By Request Type</h2>
              </div>
              <div className="card-body" style={{ minHeight: '300px' }}>
                {requestTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie 
                        data={requestTypeChartData} 
                        dataKey="count" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={85} 
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {requestTypeChartData.map((_, i) => (
                          <Cell key={i} fill={requestTypeChartData[i].fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Slips']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-msg">No data</p>
                )}
              </div>
            </div>

            <div className="report-chart-card report-chart-accent-amber">
              <div className="report-chart-header">
                <span className="report-chart-icon">👨‍🔧</span>
                <h2 className="report-chart-title">By Technician</h2>
              </div>
              <div className="card-body" style={{ minHeight: '300px' }}>
                {technicianChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={290}>
                    <PieChart>
                      <Pie 
                        data={technicianChartData} 
                        dataKey="count" 
                        nameKey="name" 
                        cx="50%" 
                        cy="42%" 
                        innerRadius={50}
                        outerRadius={75} 
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {technicianChartData.map((_, i) => (
                          <Cell key={i} fill={technicianChartData[i].fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, 'Slips']} />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="empty-msg">No data</p>
                )}
              </div>
            </div>

            <div className="report-chart-card report-chart-accent-teal">
              <div className="report-chart-header">
                <span className="report-chart-icon">📅</span>
                <h2 className="report-chart-title">By Quarter</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={quarterChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Slips" radius={[10, 10, 0, 0]} fill="#0d9488" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-chart-card report-chart-accent-rose">
              <div className="report-chart-header">
                <span className="report-chart-icon">🗺️</span>
                <h2 className="report-chart-title">By Area</h2>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={areaChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Slips" radius={[10, 10, 0, 0]}>
                      {areaChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
