import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import './Navbar.css'

const links: { to: string; label: string; adminOnly?: boolean }[] = [
  { to: '/', label: 'New Work Slip' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/data', label: 'View Data' },
  { to: '/reports', label: 'Reports' },
  { to: '/admin', label: 'Admin', adminOnly: true },
]

export default function Navbar() {
  const location = useLocation()
  const { user, logout, isLogoutLoading, isSuperAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const profileRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [menuOpen])

  const initials = useMemo(() => {
    if (isSuperAdmin) return 'SA'
    const email = user?.email ?? ''
    const local = email.split('@')[0] ?? ''
    const parts = local.split(/[.\-_ ]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase()
    return 'US'
  }, [isSuperAdmin, user?.email])

  return (
    <nav className="app-navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">SO Work Slip</span>
        <ul className="navbar-links">
          {links.filter((link) => !link.adminOnly || isSuperAdmin).map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className={location.pathname === to ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
          <li className="navbar-profile-wrap" ref={profileRef}>
            <button
              type="button"
              className="navbar-profile-trigger"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="navbar-avatar">{initials}</span>
              <span className="navbar-chevron" aria-hidden>▾</span>
            </button>
            {menuOpen && (
              <div className="navbar-profile-dropdown" role="menu">
                <button
                  type="button"
                  onClick={logout}
                  className="navbar-logout"
                  disabled={isLogoutLoading}
                  role="menuitem"
                >
                  {isLogoutLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}
          </li>
        </ul>
      </div>
    </nav>
  )
}
