import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MasonryGrid from '../components/MasonryGrid';
import { Loading, EmptyState } from '../components/States';
import { timeAgo } from '../utils/time';
import { CATEGORIES, DEPARTMENTS } from '../constants';

const SPOTLIGHT_INTERVAL = 2500;
const SPOTLIGHT_POOL = 6;

export default function Wall() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [category, setCategory] = useState('all');
  const [department, setDepartment] = useState('all');
  const [tv, setTv] = useState(false);

  const load = useCallback(async (pageToLoad = 1, append = false) => {
    const params = { page: pageToLoad, limit: 24 };
    if (category !== 'all') params.category = category;
    if (department !== 'all') params.department = department;
    try {
      const res = await api.get('/notes/wall', { params });
      setNotes((prev) => (append ? [...prev, ...res.data.notes] : res.data.notes));
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
      setStatus('ready');
    } catch {
      setStatus((prev) => (prev === 'ready' ? prev : 'error'));
    }
  }, [category, department]);

  useEffect(() => {
    setStatus('loading');
    load(1);
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onPublished = (note) => {
      setNotes((prev) => {
        if (prev.some((n) => n.id === note.id)) return prev;
        return [note, ...prev];
      });
      setTotal((t) => t + 1);
    };
    const onApplause = ({ id, applause }) => {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, applause } : n)));
    };
    socket.on('note:published', onPublished);
    socket.on('note:applause', onApplause);
    return () => {
      socket.off('note:published', onPublished);
      socket.off('note:applause', onApplause);
    };
  }, [socket]);

  // TV mode: hide chrome, enlarge type, go fullscreen. Esc exits fullscreen,
  // which flips TV mode back off via the fullscreenchange listener.
  useEffect(() => {
    document.documentElement.classList.toggle('tv', tv);
    if (tv && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setTv(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.documentElement.classList.remove('tv');
    };
  }, [tv]);

  const exitTv = () => {
    setTv(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };

  const spotlightNotes = useMemo(() => notes.slice(0, SPOTLIGHT_POOL), [notes]);
  const filtersActive = category !== 'all' || department !== 'all';

  return (
    <div>
      <section className="wall-hero">
        <div className="container" style={{ paddingTop: 'clamp(30px,5vw,54px)', paddingBottom: 'clamp(30px,5vw,54px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <span className="eyebrow">Woxsen University · Campus Appreciation</span>
            <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)' }}>
              The wall where thank-yous live
            </h1>
            <p style={{ color: 'var(--ink-soft)', maxWidth: '58ch', margin: '12px auto 0' }}>
              Every note below was written by a member of our campus and approved by a moderator.
              New notes appear here the moment they are published.
            </p>
          </div>
          {status === 'ready' && spotlightNotes.length > 0 && (
            <Spotlight notes={spotlightNotes} />
          )}
        </div>
      </section>

      <div className="container page">
        <div className="wall-meta">
          <div>
            <h2>Fresh on the board</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-faint)', fontSize: '0.88rem' }}>
              {total} published note{total === 1 ? '' : 's'}
              {filtersActive ? ' matching your filters' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`live-pill ${connected ? '' : 'offline'}`}>
              <span className="dot" aria-hidden="true" />
              {connected ? 'Live' : 'Reconnecting…'}
            </span>
            <button
              type="button"
              className="icon-btn"
              onClick={tv ? exitTv : () => setTv(true)}
              aria-label={tv ? 'Exit TV mode' : 'Enter TV mode'}
              title={tv ? 'Exit TV mode (Esc)' : 'TV mode: fullscreen, big type'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {tv ? (
                  <path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />
                ) : (
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
                )}
              </svg>
            </button>
            {!user && <Link to="/submit" className="btn btn-primary">Send a note</Link>}
          </div>
        </div>

        <div className="filter-bar" role="group" aria-label="Filter notes">
          <span className="filter-label">Filter</span>
          <button
            type="button"
            className={`filter-chip ${category === 'all' ? 'selected' : ''}`}
            onClick={() => setCategory('all')}
          >
            All kinds
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`filter-chip ${category === c ? 'selected' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
          <select
            className="select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {filtersActive && (
            <button
              type="button"
              className="btn btn-ghost btn-sm filter-clear"
              onClick={() => { setCategory('all'); setDepartment('all'); }}
            >
              Clear filters
            </button>
          )}
        </div>

        {status === 'loading' && <Loading label="Pinning notes to the board…" />}

        {status === 'error' && (
          <EmptyState mark="!" title="The board can’t be reached">
            The server isn’t responding. It may still be starting up, or MongoDB may not be running.
            Check that the backend is up, then refresh this page.
            <div>
              <button type="button" className="btn btn-secondary" onClick={() => { setStatus('loading'); load(1); }}>
                Try again
              </button>
            </div>
          </EmptyState>
        )}

        {status === 'ready' && notes.length === 0 && (
          <EmptyState title={filtersActive ? 'Nothing matches those filters' : 'The wall is waiting for its first note'}>
            {filtersActive
              ? 'No published notes match this combination yet. Try widening the filters, or send the first note of this kind yourself.'
              : 'No notes have been published yet. Be the first to appreciate someone on campus. Your note will appear here once a moderator approves it.'}
            <div>
              {filtersActive ? (
                <button type="button" className="btn btn-secondary" onClick={() => { setCategory('all'); setDepartment('all'); }}>
                  Clear filters
                </button>
              ) : (
                <Link className="btn btn-primary" to="/submit">Write the first note</Link>
              )}
            </div>
          </EmptyState>
        )}

        {status === 'ready' && notes.length > 0 && (
          <>
            <MasonryGrid notes={notes} />
            {page < totalPages && (
              <div className="wall-more">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => load(page + 1, true)}
                >
                  Load earlier notes
                </button>
              </div>
            )}
          </>
        )}

        <div className="wall-footer">
          GratiWall · Woxsen University. Gratitude, pinned in public.{' '}
          {notes[0] ? `Last note ${timeAgo(notes[0].createdAt)}.` : 'No notes yet.'}
        </div>
      </div>
    </div>
  );
}

function Spotlight({ notes }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (notes.length < 2) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % notes.length);
    }, SPOTLIGHT_INTERVAL);
    return () => clearInterval(timer);
  }, [notes.length]);

  const safeIndex = index % notes.length;

  return (
    <div className="spotlight" aria-live="polite">
      {notes.map((note, i) => (
        <div key={note.id} className={`spotlight-note ${i === safeIndex ? 'visible' : ''}`} aria-hidden={i !== safeIndex}>
          <div className="spotlight-card">
            <div className="spotlight-label">Spotlight · {note.category}</div>
            <h2 className="note-recipient">
              <Link to={`/to/${encodeURIComponent(note.recipientName)}`}>To {note.recipientName}</Link>
            </h2>
            <p className="note-message">“{note.message}”</p>
            <span className="note-sender" style={{ fontSize: '0.95rem' }}>
              {note.anonymous || !note.sender ? <em>by Anonymous</em> : <>by {note.sender.name} · <span style={{ textTransform: 'capitalize' }}>{note.sender.role}</span></>}
            </span>
          </div>
        </div>
      ))}
      <div className="spotlight-dots" style={{ position: 'absolute', bottom: -26, left: 0, right: 0 }}>
        {notes.map((note, i) => (
          <span key={note.id} className={i === safeIndex ? 'on' : ''} />
        ))}
      </div>
    </div>
  );
}
