import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './Navbar.css'

const links = [
  { to: '/', label: 'New Work Slip' },
  { to: '/drafts', label: 'Drafts' },
  { to: '/data', label: 'View Data' },
  { to: '/reports', label: 'Reports' },
]

export default function Navbar() {
  const location = useLocation()
  const { user, logout, isLogoutLoading } = useAuth()

  return (
    <nav className="app-navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">SO Work Slip</span>
        <ul className="navbar-links">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link to={to} className={location.pathname === to ? 'active' : ''}>
                {label}
              </Link>
            </li>
          ))}
          <li className="navbar-logout-wrap">
            <span className="navbar-user">{user?.email}</span>
            <button 
              type="button" 
              onClick={logout} 
              className="navbar-logout" 
              disabled={isLogoutLoading}
            >
              {isLogoutLoading ? 'Logging out...' : 'Logout'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
