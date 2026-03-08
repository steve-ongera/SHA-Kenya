import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
    } catch (err) {
      setError(err?.detail || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Visual Panel */}
      <div className="login-visual">
        <div className="login-visual-content">
          {/* Logo */}
          <div className="login-logo-wrap">
            <img
              src="/logo.png"
              alt="SHA Kenya"
              className="login-logo-img"
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
            <div className="login-coat-fallback">🦅</div>
          </div>

          <h1>Social Health<br />Authority</h1>
          <p>
            Kenya's national health insurance system — ensuring universal health coverage
            for all citizens. Managed with transparency, efficiency, and care.
          </p>

          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-value">4.7M+</div>
              <div className="login-stat-label">Registered Members</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">6,800+</div>
              <div className="login-stat-label">Accredited Facilities</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-value">47</div>
              <div className="login-stat-label">Counties Covered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          {/* Header */}
          <div className="login-form-header">
            <div className="login-form-brand">
              <img
                src="/logo.png"
                alt="SHA"
                className="login-brand-logo"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="login-brand-fallback">SHA</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>
                Government of Kenya<br />
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Management Portal</span>
              </div>
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to access the SHA Management System</p>
          </div>

          {error && (
            <div className="login-error">
              <i className="bi bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username / Staff ID</label>
              <div className="input-group">
                <i className="bi bi-person input-icon" />
                <input
                  className="form-control"
                  type="text"
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-group">
                <i className="bi bi-lock input-icon" />
                <input
                  className="form-control"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`bi bi-${showPassword ? 'eye-slash' : 'eye'}`} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
              <a href="#" style={{ fontSize: 12, color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />Signing in...</>
              ) : (
                <><i className="bi bi-shield-lock-fill" />Sign In to SHA Portal</>
              )}
            </button>
          </form>

          <div className="login-demo-box">
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 6 }}>
              <i className="bi bi-info-circle" style={{ marginRight: 4 }} />Demo Credentials
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin: <b>admin</b> / <b>Admin@1234</b></div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Officer: <b>officer</b> / <b>Officer@1234</b></div>
          </div>

          <div className="login-footer">
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Kenya.svg/30px-Flag_of_Kenya.svg.png" alt="Kenya" style={{ height: 14 }} />
              <span>Republic of Kenya</span>
            </div>
            <div>© 2024 Social Health Authority · Ministry of Health</div>
            <div style={{ marginTop: 4 }}>Confidential Government System — Authorized Access Only</div>
          </div>
        </div>
      </div>
    </div>
  );
}