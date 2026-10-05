import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './States';

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
