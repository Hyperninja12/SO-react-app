import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import './Sidebar.css'

/* ── SVG icon components ─────────────────────────────────────── */

function IconWorkSlip() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function IconDrafts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function IconViewData() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function IconAdmin() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}


/* ── Icon lookup by permission ───────────────────────────────── */

const iconMap: Record<string, () => React.ReactNode> = {
  work_slip: IconWorkSlip,
  drafts: IconDrafts,
  view_data: IconViewData,
  reports: IconReports,
  admin: IconAdmin,
}

/* ── Link definitions (same as old Navbar) ───────────────────── */

const links: { to: string; label: string; permission: string }[] = [
  { to: '/', label: 'New Work Slip', permission: 'work_slip' },
  { to: '/drafts', label: 'Drafts', permission: 'drafts' },
  { to: '/data', label: 'View Data', permission: 'view_data' },
  { to: '/reports', label: 'Reports', permission: 'reports' },
  { to: '/admin', label: 'Admin', permission: 'admin' },
]

/* ── Sidebar Component ───────────────────────────────────────── */

export default function Sidebar() {
  const location = useLocation()
  const { user, logout, isLogoutLoading, isSuperAdmin, hasPermission } = useAuth()
  const [hovered, setHovered] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const collapsed = !hovered

  /* Auto-expand on mouse enter, auto-collapse on mouse leave */
  const handleMouseEnter = () => {
    if (leaveTimeout.current) { clearTimeout(leaveTimeout.current); leaveTimeout.current = null }
    hoverTimeout.current = setTimeout(() => setHovered(true), 80)
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) { clearTimeout(hoverTimeout.current); hoverTimeout.current = null }
    leaveTimeout.current = setTimeout(() => {
      setHovered(false)
      setProfileOpen(false)
    }, 300)
  }

  /* Cleanup timeouts */
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
      if (leaveTimeout.current) clearTimeout(leaveTimeout.current)
    }
  }, [])

  /* Close profile menu on outside click */
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    if (profileOpen) document.addEventListener('click', onOutside)
    return () => document.removeEventListener('click', onOutside)
  }, [profileOpen])

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
    <aside
      className={`app-sidebar${collapsed ? ' collapsed' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Brand / Header ─────────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <img src="/Tagum-City.jpg" alt="Tagum City" className="sidebar-brand-logo" />
          <span className="sidebar-brand-text">SO Work Slip</span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* ── Navigation Links ───────────────────────────── */}
      <nav className="sidebar-nav">
        <ul className="sidebar-links">
          {visibleLinks.map(({ to, label, permission }) => {
            const Icon = iconMap[permission] || IconWorkSlip
            const isActive = location.pathname === to
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                  title={collapsed ? label : undefined}
                >
                  <span className="sidebar-link-icon"><Icon /></span>
                  <span className="sidebar-link-label">{label}</span>
                  {isActive && <span className="sidebar-active-indicator" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ── Footer / Profile ───────────────────────────── */}
      <div className="sidebar-footer" ref={profileRef}>
        <button
          type="button"
          className={`sidebar-profile-trigger${profileOpen ? ' open' : ''}`}
          onClick={() => setProfileOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={profileOpen}
        >
          <span className="sidebar-avatar">{initials}</span>
          <span className="sidebar-profile-text">
            <span className="sidebar-profile-name">{user?.displayName || user?.username}</span>
            <span className="sidebar-profile-role">{roleBadge}</span>
          </span>
        </button>

        {profileOpen && (
          <div className="sidebar-profile-popup animate-scale-in" role="menu">
            <div className="sidebar-popup-info">
              <span className="sidebar-avatar lg">{initials}</span>
              <div>
                <span className="sidebar-popup-name">{user?.displayName || user?.username}</span>
                <span className="sidebar-popup-role">{roleBadge}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="sidebar-logout"
              disabled={isLogoutLoading}
              role="menuitem"
            >
              <IconLogout />
              {isLogoutLoading ? 'Logging out…' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
