import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Layout from './Layout'
import TechWorkSlip from './TechWorkSlip'
import Drafts from './Drafts'
import ViewData from './ViewData'
import Reports from './Reports'
import AdminSettings from './AdminSettings'

/** Wrapper that redirects if user lacks the required permission */
function Guard({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { hasPermission } = useAuth()
  if (!hasPermission(permission)) {
    return <Navigate to="/no-access" replace />
  }
  return <>{children}</>
}

function NoAccess() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <h2 style={{ color: '#b91c1c', marginBottom: 8 }}>Access Restricted</h2>
      <p style={{ color: '#6b7280' }}>You do not have permission to view this page. Contact your administrator to request access.</p>
    </div>
  )
}

function AppRoutes() {
  const { user, isReady, login, isPostLoginLoading } = useAuth()
  if (!isReady) return <div className="app-loading">Loading…</div>
  if (isPostLoginLoading) return <div className="app-loading">Welcome back! Setting up your dashboard…</div>
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Guard permission="work_slip"><TechWorkSlip /></Guard>} />
        <Route path="/drafts" element={<Guard permission="drafts"><Drafts /></Guard>} />
        <Route path="/data" element={<Guard permission="view_data"><ViewData /></Guard>} />
        <Route path="/reports" element={<Guard permission="reports"><Reports /></Guard>} />
        <Route path="/admin" element={<Guard permission="admin"><AdminSettings /></Guard>} />
        <Route path="/no-access" element={<NoAccess />} />
      </Route>
    </Routes>
  )
}

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
