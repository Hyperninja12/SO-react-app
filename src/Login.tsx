import { useState, useEffect } from 'react'
import logo from './assets/logo.jpg'
import './Login.css'

type Props = {
  onLogin: (username: string, password: string) => Promise<boolean>
}

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [avoidPos, setAvoidPos] = useState(0)

  useEffect(() => {
    if (username.trim() && password) {
      setAvoidPos(0)
      return
    }

    if (avoidPos !== 0) {
      const timer = setTimeout(() => {
        setAvoidPos(0)
      }, 1200) // Reset after 1.2s
      return () => clearTimeout(timer)
    }
  }, [avoidPos, username, password])

  const handleButtonHover = () => {
    if (!username.trim() || !password) {
      setAvoidPos((prev) => (prev % 4) + 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Please enter username and password.')
      return
    }

    setLoading(true)

    // Artificial delay to ensure the loading screen is visible (1.5 seconds minimum)
    const minDelay = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const [success] = await Promise.all([
        onLogin(username.trim(), password),
        minDelay
      ]);

      if (!success) {
        setError('Invalid username or password.')
      }
    } catch (err) {
      setError('An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-window animate-scale-in">
        <div className="login-window-header">
          <div className="login-logo-circle">
            <img src={logo} alt="City Logo" className="login-logo-img" />
          </div>
          <h1 className="login-welcome">Welcome Back</h1>
          <p className="login-subtitle">
            Enter your account details to access SO slip dashboard.
          </p>
        </div>
        <div className="login-window-body" onMouseLeave={() => setAvoidPos(0)}>
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
            <button
              type="submit"
              className={`login-submit ${avoidPos ? `avoid-${avoidPos}` : ''}`}
              disabled={loading}
              onMouseEnter={handleButtonHover}
              onFocus={handleButtonHover}
            >
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

      {loading && (
        <div className="login-overlay">
          <div className="login-overlay-content">
            <div className="login-spinner-large" />
            <p className="login-overlay-text">Authenticating...</p>
            <p className="login-overlay-sub">Please wait while we verify your credentials</p>
          </div>
        </div>
      )}

      {error && (
        <div className="login-error-overlay" onClick={() => setError('')}>
          <div className="login-error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-error-icon">⚠️</div>
            <h3 className="login-error-title">Login Failed</h3>
            <p className="login-error-text">{error}</p>
            <button
              type="button"
              className="login-error-btn"
              onClick={() => setError('')}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
