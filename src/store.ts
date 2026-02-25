import type { WorkSlipEntry } from './types.ts'

const DRAFTS_KEY = 'tech-work-slip-drafts'

const API_BASE = (import.meta.env.VITE_API_URL as string) ?? ''

type LegacyEntry = WorkSlipEntry & { office?: string; name?: string; mobileNo?: string; units?: string[]; values?: string[]; serials?: string[] }

function getQuarterFromDate(dateStr: string): number {
  if (!dateStr) return 1
  const m = new Date(dateStr + 'T12:00:00').getMonth() + 1
  return Math.ceil(m / 3) as 1 | 2 | 3 | 4
}

function normalizeEntry(raw: LegacyEntry): WorkSlipEntry {
  const offices = Array.isArray(raw.offices) ? raw.offices : (raw.office ? [raw.office] : [])
  const rawEntry = raw as WorkSlipEntry & {
    areaInteragency?: boolean
    quarter?: number
    technicalReports?: { request: string; actionDone?: string; recommendation: string }[]
  }

  const quarter = rawEntry.quarter ?? getQuarterFromDate(raw.date)
  const technicalReports =
  Array.isArray(rawEntry.technicalReports) && rawEntry.technicalReports.length > 0
    ? rawEntry.technicalReports.map((r) => ({
        request: r.request ?? '',
        actionDone: r.actionDone ?? '',
        recommendation: r.recommendation ?? '',
      }))
    : [
        {
          request: raw.actionDone ?? '',
          actionDone: raw.actionDone ?? '',
          recommendation: raw.recommendation ?? '',
        },
      ]
  return {
    id: raw.id,
    soNumber: raw.soNumber,
    date: raw.date,
    areaInHouse: !!raw.areaInHouse,
    areaOnSite: !!raw.areaOnSite,
    areaInteragency: !!rawEntry.areaInteragency,
    offices,
    timeStarted: raw.timeStarted ?? '',
    timeEnded: raw.timeEnded ?? '',
    actionDone: raw.actionDone ?? '',
    recommendation: raw.recommendation ?? '',
    requesterSignature: raw.requesterSignature ?? '',
    technicianName: raw.technicianName ?? '',
    approvedBy: raw.approvedBy ?? '',
    createdAt: raw.createdAt,
    printerBrand: rawEntry.printerBrand,
    printerModel: rawEntry.printerModel,
    quarter,
    technicalReports,
  }
}

export async function getSlips(): Promise<WorkSlipEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/slips`)
    if (!res.ok) return []
    const parsed = (await res.json()) as unknown
    const list = Array.isArray(parsed) ? parsed : []
    return list.map((s: LegacyEntry) => normalizeEntry(s))
  } catch (e) {
    console.error('Failed to fetch slips:', e)
    return []
  }
}

export async function saveSlip(entry: Omit<WorkSlipEntry, 'id' | 'createdAt'>): Promise<WorkSlipEntry> {
  const withMeta: WorkSlipEntry = {
    ...entry,
    id: `slip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  const res = await fetch(`${API_BASE}/api/slips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withMeta),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to save slip')
  }
  return withMeta
}

export async function deleteSlip(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/slips/${id}`, { method: 'DELETE' })
    return res.status === 204 || res.ok
  } catch {
    return false
  }
}

export async function getSlipById(id: string): Promise<WorkSlipEntry | undefined> {
  try {
    const res = await fetch(`${API_BASE}/api/slips/${id}`)
    if (!res.ok) return undefined
    const raw = (await res.json()) as LegacyEntry
    return normalizeEntry(raw)
  } catch {
    return undefined
  }
}

export async function updateSlip(entry: WorkSlipEntry): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/slips/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    return res.ok
  } catch {
    return false
  }
}

export function getDrafts(): WorkSlipEntry[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as LegacyEntry[]).map(normalizeEntry) : []
  } catch {
    return []
  }
}

export function saveDraft(entry: Omit<WorkSlipEntry, 'id' | 'createdAt'>): WorkSlipEntry {
  const drafts = getDrafts()
  const withMeta: WorkSlipEntry = {
    ...entry,
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  drafts.unshift(withMeta)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  return withMeta
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter((d) => d.id !== id)
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
}

export function getDraftById(id: string): WorkSlipEntry | undefined {
  return getDrafts().find((d) => d.id === id)
}
