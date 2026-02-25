import { useState } from 'react'
import logo from './assets/logo.jpg'
import './Login.css'

type Props = {
  onLogin: (username: string, password: string) => boolean
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter username and password.')
      return
    }
    setLoading(true)
    const success = onLogin(username.trim(), password)
    setLoading(false)
    if (!success) {
      setError('Invalid username or password.')
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-window">
        <div className="login-window-header">
          <div className="login-logo-circle">
            <img src={logo} alt="City Logo" className="login-logo-img" />
          </div>
          <h1 className="login-welcome">Welcome Back</h1>
          <p className="login-subtitle">
            Enter your account details to access SO slip dashboard.
          </p>
        </div>
        <div className="login-window-body">
          <h2 className="login-title">Login</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                autoComplete="username"
                disabled={loading}
              />
            </label>
            <label className="login-field">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </label>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? (
                <span className="login-submit-loading">
                  <span className="login-spinner" aria-hidden /> Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
