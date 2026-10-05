import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../api/client';
import { DEPARTMENTS } from '../constants';

const ROLES = ['student', 'faculty', 'staff'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: DEPARTMENTS[0],
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
      navigate('/submit', { replace: true });
    } catch (err) {
      setError(apiError(err, 'Could not create your account.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="auth-wrap">
        <div className="auth-card">
          <span className="eyebrow">Join the wall</span>
          <h1>Create your account</h1>
          <p className="auth-sub">One account for sending thank-you notes and following what happens to them.</p>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" className="input" required value={form.name} onChange={set('name')} placeholder="e.g. Aarav Mehta" />
            </div>
            <div className="field">
              <label htmlFor="reg-email">University email</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={set('email')}
                placeholder="you@gratiwall.edu"
              />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="field">
              <span className="field-label" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 7 }}>I am a…</span>
              <div className="segmented" role="group" aria-label="Role">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={form.role === role ? 'selected' : ''}
                    onClick={() => setForm((f) => ({ ...f, role }))}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="department">Department</label>
              <select id="department" className="select" value={form.department} onChange={set('department')}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
