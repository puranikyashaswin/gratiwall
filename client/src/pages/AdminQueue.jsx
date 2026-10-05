import { useEffect, useMemo, useState } from 'react';
import api, { apiError } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { Loading, EmptyState } from '../components/States';
import { timeAgo } from '../utils/time';

const TABS = ['pending', 'approved', 'rejected', 'flagged'];
const TAB_LABELS = { pending: 'Pending', approved: 'Published', rejected: 'Rejected', flagged: 'Flagged' };

export default function AdminQueue() {
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState('pending');
  const [status, setStatus] = useState('loading');
  const [actionError, setActionError] = useState('');

  const load = () => {
    api
      .get('/admin/notes', { params: { status: 'all' } })
      .then((res) => {
        setNotes(res.data.notes);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, flagged: 0 };
    for (const n of notes) c[n.status] = (c[n.status] || 0) + 1;
    return c;
  }, [notes]);

  const visible = useMemo(() => {
    const list = notes.filter((n) => n.status === tab);
    return tab === 'pending'
      ? [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      : [...list].sort((a, b) => new Date(b.moderatedAt || b.createdAt) - new Date(a.moderatedAt || a.createdAt));
  }, [notes, tab]);

  const applyModeration = (updated) => {
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  return (
    <div className="container container-feed page">
      <div className="page-head">
        <span className="eyebrow">Moderation</span>
        <h1>The queue</h1>
        <p>
          Read each note before it reaches the wall. Approve what’s genuine, reject with a reason
          the sender can learn from, flag anything that needs a second look.
        </p>
      </div>

      {actionError && <div className="form-error" role="alert">{actionError}</div>}

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? 'active' : ''}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
            <span className="count">{counts[t] || 0}</span>
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading label="Loading the queue…" />}

      {status === 'error' && (
        <EmptyState mark="!" title="Couldn’t load the queue">
          The server didn’t respond. Refresh to try again.
          <div><button type="button" className="btn btn-secondary" onClick={load}>Retry</button></div>
        </EmptyState>
      )}

      {status === 'ready' && visible.length === 0 && (
        <EmptyState title={tab === 'pending' ? 'The queue is clear' : `No ${TAB_LABELS[tab].toLowerCase()} notes`}>
          {tab === 'pending'
            ? 'Nothing is waiting for review right now. New submissions will appear here as they arrive.'
            : 'Notes you moderate will be listed under this tab.'}
        </EmptyState>
      )}

      {status === 'ready' &&
        visible.map((note) => (
          <ModerationCard
            key={note.id}
            note={note}
            onDone={applyModeration}
            onError={setActionError}
          />
        ))}
    </div>
  );
}

function ModerationCard({ note, onDone, onError }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');

  const act = async (action, extra = {}) => {
    setBusy(action);
    onError('');
    try {
      const res = await api.patch(`/admin/notes/${note.id}`, { action, ...extra });
      onDone(res.data.note);
      setRejecting(false);
    } catch (err) {
      onError(apiError(err, 'The action could not be saved.'));
    } finally {
      setBusy('');
    }
  };

  return (
    <article className="mod-card">
      <div className="mod-top">
        <StatusBadge status={note.status} />
        <span className="note-category" style={{ margin: 0 }}>{note.category}</span>
        {note.anonymous && <span className="mod-anon-note">anonymous on wall</span>}
        <span className="time">{timeAgo(note.createdAt)}</span>
      </div>
      <p className="mod-route">
        <strong>{note.sender?.name || 'Unknown sender'}</strong>
        {note.sender && (
          <span style={{ textTransform: 'capitalize' }}> ({note.sender.role}, {note.sender.department})</span>
        )}
        {' → '}
        <strong>{note.recipientName}</strong>
      </p>
      <p className="mod-message">{note.message}</p>

      {note.status === 'rejected' && note.rejectionReason && (
        <div className="reason-line"><strong>Rejection reason:</strong> {note.rejectionReason}</div>
      )}
      {note.moderatedBy && note.status !== 'pending' && (
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-faint)', margin: '4px 0 0' }}>
          Moderated by {note.moderatedBy.name}
        </p>
      )}

      <div className="mod-actions" style={{ marginTop: 14 }}>
        {note.status !== 'approved' && (
          <button
            type="button"
            className="btn btn-approve btn-sm"
            disabled={Boolean(busy)}
            onClick={() => act('approve')}
          >
            {busy === 'approve' ? 'Publishing…' : note.status === 'pending' ? 'Approve & publish' : 'Approve'}
          </button>
        )}
        {note.status !== 'rejected' && (
          <button
            type="button"
            className="btn btn-reject btn-sm"
            disabled={Boolean(busy)}
            onClick={() => setRejecting((v) => !v)}
          >
            Reject
          </button>
        )}
        {note.status !== 'flagged' && (
          <button
            type="button"
            className="btn btn-flag btn-sm"
            disabled={Boolean(busy)}
            onClick={() => act('flag')}
          >
            {busy === 'flag' ? 'Flagging…' : 'Flag for review'}
          </button>
        )}
      </div>

      {rejecting && (
        <div className="mod-reject-box">
          <input
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional, but it helps the sender)"
            maxLength={300}
            aria-label="Rejection reason"
          />
          <button
            type="button"
            className="btn btn-reject btn-sm"
            disabled={Boolean(busy)}
            onClick={() => act('reject', { reason })}
          >
            {busy === 'reject' ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      )}
    </article>
  );
}
