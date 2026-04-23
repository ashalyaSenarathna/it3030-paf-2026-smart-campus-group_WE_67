import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = '';

export default function LoginPage({ user, onLoginSuccess }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.roles.includes('ROLE_ADMIN')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.roles.includes('ROLE_TECHNICIAN')) {
        navigate('/tech/dashboard', { replace: true });
      } else if (user.roles.includes('ROLE_STUDENT')) {
        navigate('/home', { replace: true });
      }
    }
  }, [navigate, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await onLoginSuccess(username.trim(), password);
      if (data.roles.includes('ROLE_ADMIN')) {
        navigate('/admin/dashboard', { replace: true });
      } else if (data.roles.includes('ROLE_TECHNICIAN')) {
        navigate('/tech/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-brand">
          <div className="brand-icon">🏛️</div>
          <h1 className="brand-title">Smart Campus</h1>
          <p className="brand-description">
            Streamline and automate campus operations. Manage resources, track maintenance requests, and coordinate support across all departments efficiently.
          </p>
        </div>
        <div className="login-footer">
          © 2026 SmartCampus. All rights reserved.
        </div>
      </div>

      <div className="login-right">
        <div className="login-header">
          <Link to="/" className="back-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to Home</span>
          </Link>
          <h2 className="login-app-name">Smart Campus</h2>
        </div>
        
        <div className="login-form-wrapper">
          <h3 className="login-title">Welcome Back!</h3>
          <p className="login-subtitle">Sign in to manage your campus resources</p>

          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            <div className="form-group">
              <label htmlFor="username">USERNAME</label>
              <input
                id="username"
                type="text"
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">PASSWORD</label>
              <div className="password-input-wrap">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  spellCheck={false}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Login'}
            </button>
          </form>

          <button className="btn-google" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.23 3.6l6.88-6.88C35.91 2.3 30.36 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.99 6.2C12.52 13.47 17.82 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.55c0-1.64-.15-3.22-.43-4.73H24v8.95h12.66c-.55 2.96-2.22 5.47-4.73 7.16l7.36 5.72C43.73 37.58 46.5 31.58 46.5 24.55z"/>
              <path fill="#FBBC05" d="M10.55 28.58a14.5 14.5 0 0 1 0-9.16l-7.99-6.2A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.99-6.2z"/>
              <path fill="#34A853" d="M24 48c6.36 0 11.7-2.1 15.6-5.69l-7.36-5.72c-2.05 1.38-4.67 2.19-8.24 2.19-6.18 0-11.48-3.97-13.45-9.92l-7.99 6.2C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Login with Google
          </button>

          <div className="login-footer-link">
            <span>Forgot password?</span>
            <a href="#"> Click here</a>
          </div>
        </div>
      </div>
    </div>
  );
}
