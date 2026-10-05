import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Loading, EmptyState } from '../components/States';
import { formatDate } from '../utils/time';

export default function MyNotes() {
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api
      .get('/notes/mine')
      .then((res) => {
        setNotes(res.data.notes);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="container container-feed page">
      <div className="page-head">
        <span className="eyebrow">My notes</span>
        <h1>Everything you’ve sent</h1>
        <p>Follow each note from the moderation queue to the public wall.</p>
      </div>

      {status === 'loading' && <Loading label="Fetching your notes…" />}

      {status === 'error' && (
        <EmptyState mark="!" title="Couldn’t load your notes">
          The server didn’t respond. Refresh the page to try again.
        </EmptyState>
      )}

      {status === 'ready' && notes.length === 0 && (
        <EmptyState title="No notes yet">
          You haven’t sent any thank-you notes. Someone on campus probably deserves one today.
          <div><Link to="/submit" className="btn btn-primary">Send your first note</Link></div>
        </EmptyState>
      )}

      {status === 'ready' && notes.length > 0 && (
        <div>
          {notes.map((note) => (
            <article key={note.id} className="mod-card">
              <div className="mod-top">
                <StatusBadge status={note.status} />
                <span className="note-category" style={{ margin: 0 }}>{note.category}</span>
                {note.anonymous && <span className="mod-anon-note">anonymous on wall</span>}
                <span className="time">{formatDate(note.createdAt)}</span>
              </div>
              <p className="mod-route">
                To <strong>{note.recipientName}</strong>
              </p>
              <p className="mod-message">{note.message}</p>
              {note.status === 'rejected' && note.rejectionReason && (
                <div className="reason-line">
                  <strong>Moderator’s note:</strong> {note.rejectionReason}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
