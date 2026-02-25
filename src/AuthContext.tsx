import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AUTH_KEY = 'tech-work-slip-auth'

type User = { email: string }

type AuthContextValue = {
  user: User | null
  login: (username: string, password: string) => boolean
  logout: () => void
  isReady: boolean
  isPostLoginLoading: boolean
  isLogoutLoading: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as User
    return { email: data.email }
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPostLoginLoading, setIsPostLoginLoading] = useState(false)
  const [isLogoutLoading, setIsLogoutLoading] = useState(false)

  useEffect(() => {
    setUser(loadStoredUser())
    setIsReady(true)
  }, [])

  const login = useCallback((username: string, password: string): boolean => {
    if (!username.trim() || !password) return false
    if (!validateCredentials(username.trim(), password)) return false
    const u = { email: username.trim() }
    setUser(u)
    localStorage.setItem(AUTH_KEY, JSON.stringify(u))
    setIsPostLoginLoading(true)
    setTimeout(() => setIsPostLoginLoading(false), 2000) // 2 second loading screen
    return true
  }, [])

  const logout = useCallback(() => {
    setIsLogoutLoading(true)
    setTimeout(() => {
      setUser(null)
      localStorage.removeItem(AUTH_KEY)
      setIsLogoutLoading(false)
    }, 1500) // 1.5 second loading screen for logout
  }, [])

  const superAdminUsername = (String(import.meta.env.VITE_SUPERADMIN_USERNAME || '').trim() || String(import.meta.env.VITE_LOGIN_USERNAME1 || '').trim()).toLowerCase()
  const isSuperAdmin = !!user && superAdminUsername !== '' && user.email.trim().toLowerCase() === superAdminUsername

  const value: AuthContextValue = { user, login, logout, isReady, isPostLoginLoading, isLogoutLoading, isSuperAdmin }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}


function validateCredentials(username: string, password: string): boolean {
  const inputUsername = username.trim().toLowerCase()
  const inputPassword = password.trim()

  // Check numbered accounts first (VITE_LOGIN_USERNAME1, VITE_LOGIN_PASSWORD1, etc.)
  let index = 1
  while (true) {
    const envUsername = import.meta.env[`VITE_LOGIN_USERNAME${index}`]
    const envPassword = import.meta.env[`VITE_LOGIN_PASSWORD${index}`]

    if (!envUsername || !envPassword) break

    if (inputUsername === String(envUsername).trim().toLowerCase() &&
        inputPassword === String(envPassword).trim()) {
      return true
    }
    index++
  }

  // Fallback to single account format for backward compatibility
  const allowed = (String(import.meta.env.VITE_LOGIN_USERNAME || import.meta.env.VITE_LOGIN_EMAIL || '').trim() || 'admin').toLowerCase()
  const allowedPassword = String(import.meta.env.VITE_LOGIN_PASSWORD || '').trim() || 'admin123'
  return inputUsername === allowed && inputPassword === allowedPassword
}
