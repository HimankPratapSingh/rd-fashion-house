import { useState } from 'react';
import logo from './assets/rd_logo.png';
import watermark from './assets/watermark.png';

// Credentials stored in brand site localStorage
// Default: admin / admin123  (same as CRM)
const CREDS_KEY = 'rd_site_creds';

function getCreds() {
  try {
    const d = localStorage.getItem(CREDS_KEY);
    if (d) return JSON.parse(d);
  } catch {}
  return [{ username: 'admin', password: 'admin123', role: 'Owner' }];
}

export function validateLogin(username, password) {
  const creds = getCreds();
  return creds.find(
    c => c.username.toLowerCase() === username.toLowerCase() && c.password === password
  ) || null;
}

export default function LoginPage({ onSuccess, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Date.now() < lockedUntil) {
      const secs = Math.ceil((lockedUntil - Date.now()) / 1000);
      setError(`Too many attempts. Try again in ${secs}s.`);
      return;
    }
    if (!username.trim() || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');
    // Small delay for UX feel
    setTimeout(() => {
      const user = validateLogin(username, password);
      if (user) {
        setFailCount(0);
        onSuccess(user);
      } else {
        const newCount = failCount + 1;
        if (newCount >= 5) {
          setLockedUntil(Date.now() + 30000);
          setFailCount(0);
        } else {
          setFailCount(newCount);
        }
        setError('Incorrect username or password.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="login-page">
      {/* Watermark */}
      <div className="login-watermark">
        <img src={watermark} alt="" />
      </div>

      {/* Card */}
      <div className="login-card">
        <button className="login-back" onClick={onBack}>← Back to Website</button>

        <div className="login-header">
          <img src={logo} alt="R&D's" className="login-logo" />
          <h1 className="login-brand">R&amp;D's Fashion House</h1>
          <p className="login-subtitle">Sign in to access the management system</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label className="login-label">Username</label>
            <input
              className="login-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-pass-wrap">
              <input
                className="login-input"
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <div className="login-roles">
          <span className="login-role-badge">👑 Owner</span>
          <span className="login-role-badge">🏪 Manager</span>
          <span className="login-role-badge">🧵 Staff</span>
        </div>

      </div>
    </div>
  );
}
