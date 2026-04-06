import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { getSlips } from './store.ts'
import { getRequestCategory, getQuarterFromDate } from './constants.ts'
import type { WorkSlipEntry } from './types.ts'
import { useAuth } from './AuthContext'
import './Reports.css'

const PIE_COLORS = ['#166534', '#1e40af', '#7c3aed', '#b45309', '#0d9488', '#be123c', '#4f46e5', '#059669']

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
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

const REQUEST_TO_REPORT_ROW: Record<string, number> = {
  'computer isolation': 0,
  'software isolation installation and checking': 1,
  'activation of operating system and ms office': 1,
  'password recovery': 1,
  'network isolation installation and checking': 2,
  'hardware installation and checking': 3,
  'printer isolation (reset,installation, printer sharing, and checking)': 4,
}

function getReportRowIndex(requestOrActionDone: string): number | null {
  if (!requestOrActionDone || !requestOrActionDone.trim()) return null
  const key = requestOrActionDone.trim().toLowerCase()
  if (REQUEST_TO_REPORT_ROW[key] !== undefined) return REQUEST_TO_REPORT_ROW[key]
  return null
}


function getSection(slip: WorkSlipEntry): 0 | 1 | null {
  if (slip.areaInHouse || slip.areaOnSite) return 0
  if (slip.areaInteragency) return 1
  return null
}

export default function Reports() {
  const { user } = useAuth()
  const role = user?.role?.toLowerCase() || ''
  const isAdmin = role === 'admin' || role === 'superadmin'

  const [slips, setSlips] = useState<WorkSlipEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [reportYear, setReportYear] = useState(() => new Date().getFullYear())

  useEffect(() => {
    const loadSlips = async () => {
      setLoading(true)
      const data = await getSlips()
      setSlips(data)
      setLoading(false)
    }
    loadSlips()
  }, [])

  const hardwareCount = useMemo(() => slips.filter((s) => getRequestCategory(s.actionDone) === 'hardware' || s.actionDone === 'Printer isolation (reset,installation, printer sharing, and checking)').length, [slips])
  const softwareCount = useMemo(() => slips.filter((s) => getRequestCategory(s.actionDone) === 'software' || s.actionDone === 'Printer isolation (reset,installation, printer sharing, and checking)').length, [slips])
  const hwSwChartData = useMemo(() => [
    { name: 'Hardware', count: hardwareCount, fill: '#166534' },
    { name: 'Software', count: softwareCount, fill: '#1e40af' },
  ], [hardwareCount, softwareCount])

  const requestTypeChartData = useMemo(() => {
    const map = new Map<string, number>()
    slips.forEach((s) => {
      const key = s.actionDone || '—'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count], i) => ({ name: name.length > 30 ? name.slice(0, 28) + '…' : name, fullName: name, count, fill: PIE_COLORS[i % PIE_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
  }, [slips])

  const technicianChartData = useMemo(() => {
    const map = new Map<string, number>()
    slips.forEach((s) => {
      const key = s.technicianName || 'Unassigned'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, count], i) => ({ name, count, fill: PIE_COLORS[i % PIE_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
  }, [slips])

  const quarterChartData = useMemo(() => {
    const map = new Map<string, number>()
    slips.forEach((s) => {
      const q = s.quarter ?? getQuarterFromDate(s.date)
      const key = `Q${q}`
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return ['Q1', 'Q2', 'Q3', 'Q4']
      .map((key) => ({ name: key, count: map.get(key) ?? 0 }))
  }, [slips])

  const areaChartData = useMemo(() => [
    { name: 'In House', count: slips.filter((s) => s.areaInHouse).length, fill: '#166534' },
    { name: 'On Site', count: slips.filter((s) => s.areaOnSite).length, fill: '#1e40af' },
    { name: 'Interagency', count: slips.filter((s) => s.areaInteragency).length, fill: '#7c3aed' },
  ], [slips])

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of slips) {
      if (!s.date) continue
      const key = getMonthKey(s.date)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([key, count]) => ({ name: formatMonthLabel(key), key, count }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [slips])

  const downloadTotals = () => {
    const year = reportYear
    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEPT', 'OCT', 'NOV', 'DEC']

    // count[section][rowIndex][month1-12] then total per row
    type CountGrid = number[][][]
    const count: CountGrid = [
      [ [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0] ],
      [ [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0,0,0] ],
    ]

    for (const slip of slips) {
      const section = getSection(slip)
      if (section === null) continue
      const slipYear = slip.date ? new Date(slip.date + 'T12:00:00').getFullYear() : year
      if (slipYear !== year) continue

      const reports = slip.technicalReports && slip.technicalReports.length > 0
        ? slip.technicalReports
        : [{ request: slip.actionDone, actionDone: slip.actionDone, recommendation: slip.recommendation }]

      const month1Based = slip.date ? new Date(slip.date + 'T12:00:00').getMonth() + 1 : 1
      const col = month1Based - 1

      for (const r of reports) {
        const rowIndex = getReportRowIndex(r.request || r.actionDone)
        if (rowIndex !== null) {
          count[section][rowIndex][col] += 1
        }
      }
    }

    const escape = (cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`
    const rows: string[][] = []

    rows.push(['', String(year), '', '', '', '', '', '', '', '', '', '', '', ''])
    rows.push(['Local Government of Tagum (On-Site & In House)', ...monthLabels, 'TOTAL'])
    for (let r = 0; r < 5; r++) {
      const total = count[0][r].reduce((s, n) => s + n, 0)
      rows.push([REPORT_ROW_LABELS[r], ...count[0][r].map(String), String(total)])
    }
    
    rows.push(['Interagency Assistance (DEP-ED, BARANGAY\'S, PAO, RTC, BJMP, PNP)', ...monthLabels, 'TOTAL'])
    for (let r = 0; r < 5; r++) {
      const total = count[1][r].reduce((s, n) => s + n, 0)
      rows.push([REPORT_ROW_LABELS[r], ...count[1][r].map(String), String(total)])
    }

    const csvContent = rows.map((row) => row.map(escape).join(',')).join('\r\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SO-WorkSlip-Reports-${year}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="reports-page"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="reports-page">
      <h1 className="page-title">Reports</h1>

      <div className="filter-bar">
        <label className="filter-year-label">
          Year for report:
          <select
            value={reportYear}
            onChange={(e) => setReportYear(Number(e.target.value))}
            className="filter-year-select"
          >
            {Array.from(new Set([reportYear, new Date().getFullYear(), ...slips.map((s) => s.date ? new Date(s.date + 'T12:00:00').getFullYear() : new Date().getFullYear())])).sort((a, b) => b - a).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
        {isAdmin && (
          <button
            type="button"
            className="filter-btn download-btn"
            onClick={downloadTotals}
            disabled={slips.length === 0}
          >
            Download reports by month (Excel/CSV)
          </button>
        )}
      </div>

      <div className="summary-cards summary-cards-top">
        <div className="card">
          <span className="card-label">Total slips</span>
          <span className="card-value">{slips.length}</span>
        </div>
        <div className="card">
          <span className="card-label">Hardware</span>
          <span className="card-value">{hardwareCount}</span>
        </div>
        <div className="card">
          <span className="card-label">Software</span>
          <span className="card-value">{softwareCount}</span>
        </div>
        <div className="card">
          <span className="card-label">In House</span>
          <span className="card-value">{slips.filter((s) => s.areaInHouse).length}</span>
        </div>
        <div className="card">
          <span className="card-label">On Site</span>
          <span className="card-value">{slips.filter((s) => s.areaOnSite).length}</span>
        </div>
        <div className="card">
          <span className="card-label">Interagency</span>
          <span className="card-value">{slips.filter((s) => s.areaInteragency).length}</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <p className="empty-msg">No data to show. Save work slips to see reports.</p>
      ) : (
        <>
          <div className="chart-wrap">
            <h2 className="chart-title">Work slips by month</h2>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Slips" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="#166534" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-wrap">
            <h2 className="chart-title">By request type (Hardware vs Software)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hwSwChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Slips" radius={[4, 4, 0, 0]}>
                  {hwSwChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="charts-grid">
            <div className="chart-wrap chart-pie">
              <h2 className="chart-title">By request type</h2>
              {requestTypeChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={requestTypeChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {requestTypeChartData.map((_, i) => (
                        <Cell key={i} fill={requestTypeChartData[i].fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Slips']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">No data</p>
              )}
            </div>
            <div className="chart-wrap chart-pie">
              <h2 className="chart-title">By technician</h2>
              {technicianChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={technicianChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {technicianChartData.map((_, i) => (
                        <Cell key={i} fill={technicianChartData[i].fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, 'Slips']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="chart-empty">No data</p>
              )}
            </div>
          </div>

          <div className="chart-wrap">
            <h2 className="chart-title">By quarter</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={quarterChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Slips" radius={[4, 4, 0, 0]} fill="#0d9488" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrap">
            <h2 className="chart-title">By area</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={areaChartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Slips" radius={[4, 4, 0, 0]}>
                  {areaChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
