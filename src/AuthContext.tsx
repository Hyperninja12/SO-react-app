import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { loginUser, type AuthUser } from './store.ts'

const AUTH_KEY = 'tech-work-slip-auth'

type AuthContextValue = {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isReady: boolean
  isPostLoginLoading: boolean
  isLogoutLoading: boolean
  isSuperAdmin: boolean
  permissions: string[]
  hasPermission: (page: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

type StoredAuth = {
  user: AuthUser
  permissions: string[]
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredAuth
    if (!data.user || !data.user.id) return null
    return data
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false)
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)

  useEffect(() => {
    const stored = loadStoredAuth()
    if (stored) {
      setUser(stored.user)
      setPermissions(stored.permissions)
    }
    setIsReady(true)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!username.trim() || !password) return false
    try {
      const result = await loginUser(username.trim(), password)
      setUser(result.user)
      setPermissions(result.permissions)
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: result.user, permissions: result.permissions }))
      setIsPostLoginLoading(true)
      setTimeout(() => setIsPostLoginLoading(false), 2000)
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setIsLogoutLoading(true)
    setTimeout(() => {
      setUser(null)
      setPermissions([])
      localStorage.removeItem(AUTH_KEY)
      setIsLogoutLoading(false)
    }, 1500)
  }, [])

  const isSuperAdmin = !!user && user.role === 'superadmin'

  const hasPermission = useCallback((page: string): boolean => {
    if (!user) return false
    if (isSuperAdmin) return true
    return permissions.includes(page)
  }, [user, isSuperAdmin, permissions])

  const value: AuthContextValue = { user, login, logout, isReady, isPostLoginLoading, isLogoutLoading, isSuperAdmin, permissions, hasPermission }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
