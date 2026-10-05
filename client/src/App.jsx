import { lazy, Suspense } from 'react';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { RequireAuth, RequireAdmin } from './components/RouteGuards';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Wall from './pages/Wall';
import Login from './pages/Login';
import Register from './pages/Register';
import Submit from './pages/Submit';
import MyNotes from './pages/MyNotes';
import AdminQueue from './pages/AdminQueue';
import RecipientNotes from './pages/RecipientNotes';
import { EmptyState, Loading } from './components/States';

// Recharts is heavy; the analytics dashboard loads on demand.
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'));

export default function App() {
  const location = useLocation();
  return (
    <ThemeProvider>
      <SocketProvider>
        <Navbar />
        <main>
          <div key={location.pathname} className="route-fade">
            <Routes location={location}>
              <Route path="/" element={<Wall />} />
              <Route path="/to/:name" element={<RecipientNotes />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/submit" element={<RequireAuth><Submit /></RequireAuth>} />
              <Route path="/my-notes" element={<RequireAuth><MyNotes /></RequireAuth>} />
              <Route path="/admin" element={<RequireAdmin><AdminQueue /></RequireAdmin>} />
              <Route
                path="/admin/analytics"
                element={
                  <RequireAdmin>
                    <Suspense fallback={<div className="container page"><Loading label="Loading the dashboard…" /></div>}>
                      <AdminAnalytics />
                    </Suspense>
                  </RequireAdmin>
                }
              />
              <Route
                path="*"
                element={
                  <div className="container page">
                    <EmptyState title="This page isn’t on the board">
                      The page you were looking for doesn’t exist. Head back to the wall to read the latest notes.
                      <div><Link className="btn btn-primary" to="/">Back to the wall</Link></div>
                    </EmptyState>
                  </div>
                }
              />
            </Routes>
          </div>
        </main>
      </SocketProvider>
    </ThemeProvider>
  );
}
