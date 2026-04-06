import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import './Navbar.css'

const links: { to: string; label: string; permission: string }[] = [
  { to: '/', label: 'New Work Slip', permission: 'work_slip' },
  { to: '/drafts', label: 'Drafts', permission: 'drafts' },
  { to: '/data', label: 'View Data', permission: 'view_data' },
  { to: '/reports', label: 'Reports', permission: 'reports' },
  { to: '/admin', label: 'Admin', permission: 'admin' },
]

export default function Navbar() {
  const location = useLocation()
  const { user, logout, isLogoutLoading, isSuperAdmin, hasPermission } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const profileRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [menuOpen])

  const visibleLinks = useMemo(() => {
    return links.filter((link) => hasPermission(link.permission))
  }, [hasPermission])

  const initials = useMemo(() => {
    if (isSuperAdmin) return 'SA'
    const displayName = user?.displayName || user?.username || ''
    const parts = displayName.split(/[\s.\-_]+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    if (parts.length === 1 && parts[0].length > 0) return parts[0].slice(0, 2).toUpperCase()
    return 'US'
  }, [isSuperAdmin, user?.displayName, user?.username])

  const roleBadge = useMemo(() => {
    if (!user) return ''
    if (isSuperAdmin) return 'Super Admin'
    return user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''
  }, [user, isSuperAdmin])

  return (
    <nav className="app-navbar animate-slide-down">
      <div className="navbar-inner">
        <span className="navbar-brand">SO Work Slip</span>
        <ul className="navbar-links">
          {visibleLinks.map(({ to, label }) => (
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
              <div className="navbar-profile-dropdown animate-scale-in" role="menu">
                <div className="navbar-profile-info">
                  <span className="navbar-profile-name">{user?.displayName || user?.username}</span>
                  <span className="navbar-profile-role">{roleBadge}</span>
                </div>
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
