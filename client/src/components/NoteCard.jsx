import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { timeAgo } from '../utils/time';

const TILTS = ['tilt-left', 'tilt-flat', 'tilt-right'];
const APPLAUDED_KEY = 'gratiwall_applauded';

function getApplauded() {
  try {
    return JSON.parse(localStorage.getItem(APPLAUDED_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function NoteCard({ note, index = 0 }) {
  const tilt = TILTS[Math.abs(hashCode(note.id)) % TILTS.length];
  const [applauded, setApplauded] = useState(() => getApplauded().includes(note.id));
  const [count, setCount] = useState(note.applause || 0);

  // Live applause updates arrive from the parent via the note prop.
  useEffect(() => {
    setCount(note.applause || 0);
  }, [note.applause]);

  const applaud = async () => {
    if (applauded) return;
    setApplauded(true);
    setCount((c) => c + 1);
    try {
      const res = await api.post(`/notes/${note.id}/applaud`);
      setCount(res.data.applause);
      localStorage.setItem(APPLAUDED_KEY, JSON.stringify([...getApplauded(), note.id]));
    } catch {
      setApplauded(false);
      setCount((c) => Math.max(0, c - 1));
    }
  };

  return (
    <article
      className={`note-card ${tilt}`}
      style={{ animationDelay: `${Math.min(index, 14) * 45}ms` }}
    >
      <span className="note-category">{note.category}</span>
      <h3 className="note-recipient">
        <Link to={`/to/${encodeURIComponent(note.recipientName)}`}>To {note.recipientName}</Link>
      </h3>
      <p className="note-message">{note.message}</p>
      <footer className="note-footer">
        <span className="note-sender">
          {note.anonymous || !note.sender ? (
            <em>by Anonymous</em>
          ) : (
            <>by {note.sender.name}</>
          )}
        </span>
        <span className="note-meta-right">
          <button
            type="button"
            className={`applaud ${applauded ? 'applauded' : ''}`}
            onClick={applaud}
            disabled={applauded}
            aria-label={applauded ? 'You applauded this note' : 'Applaud this note'}
            title={applauded ? 'You applauded this' : 'Applaud'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M7 11.5V7a1.5 1.5 0 0 1 3 0v4" />
              <path d="M10 11V4.5a1.5 1.5 0 0 1 3 0V11" />
              <path d="M13 11V6a1.5 1.5 0 0 1 3 0v5.5" />
              <path d="M16 11.5a1.5 1.5 0 0 1 3 .5v3a7 7 0 0 1-7 7h-1.4a6 6 0 0 1-4.7-2.3L4 17.4a1.6 1.6 0 0 1 2.4-2.1L7.7 17" />
            </svg>
            {count}
          </button>
          <time className="note-time" dateTime={note.createdAt}>
            {timeAgo(note.createdAt)}
          </time>
        </span>
      </footer>
    </article>
  );
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
