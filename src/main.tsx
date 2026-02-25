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
        <Route path="/" element={<TechWorkSlip />} />
        <Route path="/drafts" element={<Drafts />} />
        <Route path="/data" element={<ViewData />} />
        <Route path="/reports" element={<Reports />} />
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
