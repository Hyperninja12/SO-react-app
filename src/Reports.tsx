import { useMemo, useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { getSlips } from './store.ts'
import { getRequestCategory, getQuarterFromDate } from './constants.ts'
import type { WorkSlipEntry } from './types.ts'
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

export default function Reports() {
  const [slips, setSlips] = useState<WorkSlipEntry[]>([])
  const [loading, setLoading] = useState(true)

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
    const headers = ['Category', 'Count']
    const rows = [
      ['Total Slips', slips.length],
      ['Hardware', hardwareCount],
      ['Software', softwareCount],
      ['In House', slips.filter((s) => s.areaInHouse).length],
      ['On Site', slips.filter((s) => s.areaOnSite).length],
      ['Interagency', slips.filter((s) => s.areaInteragency).length],
    ]
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SO-WorkSlip-Totals-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="reports-page"><p className="empty-msg">Loading…</p></div>

  return (
    <div className="reports-page">
      <h1 className="page-title">Reports</h1>

      <div className="filter-bar">
        <button
          type="button"
          className="filter-btn download-btn"
          onClick={downloadTotals}
          disabled={slips.length === 0}
        >
          Download Totals (Excel/CSV)
        </button>
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
