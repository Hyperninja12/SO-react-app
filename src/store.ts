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
    schoolName: (raw as { schoolName?: string }).schoolName ?? undefined,
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

/** Get current SO year (2-digit) for automatic YY prefix. Does not reserve a number. */
export async function getCurrentSOYear(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/slips/current-so-year`)
    if (!res.ok) throw new Error('Failed to get current year')
    const data = (await res.json()) as { yy?: string }
    return data.yy ?? String(new Date().getFullYear() % 100).padStart(2, '0')
  } catch (e) {
    console.error('Failed to fetch current SO year:', e)
    return String(new Date().getFullYear() % 100).padStart(2, '0')
  }
}

/** Get next SO number in format YY-000001 (6-digit sequence). Reserves the number on the server. */
export async function getNextSONumber(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/slips/next-so-number`)
    if (!res.ok) throw new Error('Failed to get next SO number')
    const data = (await res.json()) as { soNumber: string }
    return data.soNumber || ''
  } catch (e) {
    console.error('Failed to fetch next SO number:', e)
    const yy = String(new Date().getFullYear() % 100).padStart(2, '0')
    return `${yy}-000001`
  }
}

/** Admin only: close year and prepare next year's sequence. Requires backend password. */
export async function closeYear(password: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/close-year`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.trim() }),
    })
    const data = (await res.json()) as { success?: boolean; message?: string; error?: string }
    if (!res.ok) return { success: false, error: data.error || 'Failed to close year' }
    return { success: true, message: data.message }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Request failed' }
  }
}

export type ArchiveItem = { year: number; filename: string; createdAt: string }

/** Admin only: list archived year files. */
export async function getArchiveList(): Promise<ArchiveItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/archive`)
    if (!res.ok) return []
    const data = (await res.json()) as { archives?: ArchiveItem[] }
    return data.archives ?? []
  } catch (e) {
    console.error('Failed to list archives:', e)
    return []
  }
}

/** Admin only: get archived slips for a filename (read-only). */
export async function getArchiveSlips(filename: string): Promise<WorkSlipEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/archive/${encodeURIComponent(filename)}`)
    if (!res.ok) return []
    const data = (await res.json()) as { slips?: LegacyEntry[] }
    const list = Array.isArray(data.slips) ? data.slips : []
    return list.map((s) => normalizeEntry(s))
  } catch (e) {
    console.error('Failed to fetch archive:', e)
    return []
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

// ── User Management API ─────────────────────────────────────────

export type AuthUser = {
  id: string
  username: string
  displayName: string
  role: string
}

export type ManagedUser = {
  id: string
  username: string
  role: string
  displayName: string
  createdAt: string
  updatedAt: string
}

export type RoleDef = {
  name: string
  label: string
  permissions: string[]
  isDefault: number
  sortOrder: number
}

export type LoginResult = {
  user: AuthUser
  permissions: string[]
}

export async function loginUser(username: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || 'Login failed')
  }
  return res.json()
}

export async function getUsers(): Promise<ManagedUser[]> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/users`)
    if (!res.ok) return []
    const data = (await res.json()) as { users?: ManagedUser[] }
    return data.users ?? []
  } catch {
    return []
  }
}

export async function createUser(data: { username: string; password: string; role: string; displayName: string }): Promise<ManagedUser> {
  const res = await fetch(`${API_BASE}/api/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to create user')
  }
  const result = (await res.json()) as { user: ManagedUser }
  return result.user
}

export async function updateUser(id: string, data: { username?: string; password?: string; role?: string; displayName?: string }): Promise<ManagedUser> {
  const res = await fetch(`${API_BASE}/api/auth/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update user')
  }
  const result = (await res.json()) as { user: ManagedUser }
  return result.user
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/users/${id}`, { method: 'DELETE' })
    return res.status === 204 || res.ok
  } catch {
    return false
  }
}

export async function getRoles(): Promise<{ roles: RoleDef[]; allPermissions: string[] }> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/roles`)
    if (!res.ok) return { roles: [], allPermissions: [] }
    return res.json()
  } catch {
    return { roles: [], allPermissions: [] }
  }
}

export async function updateRole(name: string, data: { permissions?: string[]; label?: string }): Promise<RoleDef> {
  const res = await fetch(`${API_BASE}/api/auth/roles/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error || 'Failed to update role')
  }
  const result = (await res.json()) as { role: RoleDef }
  return result.role
}

// ── Access History API ─────────────────────────────────────────

export type AccessLog = {
  id: string
  username: string
  action: string
  ipAddress: string
  timestamp: string
}

export async function getAccessLogs(): Promise<AccessLog[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/access-logs`)
    if (!res.ok) return []
    const data = (await res.json()) as { logs?: AccessLog[] }
    return data.logs ?? []
  } catch {
    return []
  }
}
