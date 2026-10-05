import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      const from = location.state?.from;
      navigate(user.role === 'admin' && !from ? '/admin' : from || '/', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not log you in.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="auth-wrap">
        <div className="auth-card">
          <span className="eyebrow">Welcome back</span>
          <h1>Log in to GratiWall</h1>
          <p className="auth-sub">Send notes, track their status, and keep the wall kind if you moderate.</p>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="email">University email</label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gratiwall.edu"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-switch">
            New to GratiWall? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
