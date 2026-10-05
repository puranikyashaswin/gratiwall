import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="wordmark" aria-label="GratiWall home">
          GratiWall
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end className="nav-link">Wall</NavLink>
          {user && <NavLink to="/submit" className="nav-link">Send a note</NavLink>}
          {user && <NavLink to="/my-notes" className="nav-link">My notes</NavLink>}
          {isAdmin && <NavLink to="/admin" className="nav-link">Moderation</NavLink>}
          {isAdmin && <NavLink to="/admin/analytics" className="nav-link">Analytics</NavLink>}
        </nav>
        <div className="nav-user">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </button>
          {user ? (
            <>
              <div className="who">
                <strong>{user.name}</strong>
                <span className={`role-tag ${user.role === 'admin' ? 'role-admin' : ''}`}>{user.role}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/submit" className="btn btn-primary btn-sm">Send a note</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
