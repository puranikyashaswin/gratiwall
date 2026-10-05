import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('gratiwall_token')));

  useEffect(() => {
    const token = localStorage.getItem('gratiwall_token');
    if (!token) return;
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem('gratiwall_token'))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((token, nextUser) => {
    localStorage.setItem('gratiwall_token', token);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      persist(res.data.token, res.data.user);
      return res.data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const res = await api.post('/auth/register', payload);
      persist(res.data.token, res.data.user);
      return res.data.user;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('gratiwall_token');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
