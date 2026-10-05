import axios from 'axios';

// In dev, VITE_API_URL is unset and requests stay relative so the Vite
// proxy forwards them to the API. In production builds it holds the
// absolute backend origin (e.g. the Render service URL).
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const api = axios.create({ baseURL: `${API_ORIGIN}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gratiwall_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('gratiwall_token')) {
      localStorage.removeItem('gratiwall_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  }
);

export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  return err.response?.data?.message || fallback;
}

export default api;
