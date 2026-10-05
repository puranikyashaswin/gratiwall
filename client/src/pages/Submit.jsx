import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiError } from '../api/client';

const CATEGORIES = ['Student → Faculty', 'Faculty → Student', 'Peer-to-Peer', 'Staff Appreciation'];
const MAX_MESSAGE = 500;

export default function Submit() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);

  // recipient picker state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null); // { id, name, role, department }
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounce = useRef(null);

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (selected) return undefined;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return undefined;
    }
    setSearching(true);
    debounce.current = setTimeout(async () => {
      try {
        const res = await api.get('/notes/recipients', { params: { q } });
        setResults(res.data.recipients);
        setDropdownOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query, selected]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selected && !query.trim()) {
      setError('Please name who this note is for.');
      return;
    }
    if (!message.trim()) {
      setError('Write a message before sending.');
      return;
    }
    setBusy(true);
    try {
      await api.post('/notes', {
        recipientId: selected?.id || undefined,
        recipientName: selected ? undefined : query.trim(),
        category,
        message,
        senderAnonymous: anonymous,
      });
      setDone(true);
    } catch (err) {
      setError(apiError(err, 'Could not send your note.'));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="container page container-narrow">
        <div className="confirm-panel">
          <span className="stamp" aria-hidden="true">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <h2>Your note is in the queue</h2>
          <p>
            Every note is read by a moderator before it appears on the wall. That’s how we keep
            the board warm and genuine. You’ll see it marked <strong>Published</strong> on your
            notes page once it’s approved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/my-notes" className="btn btn-primary">Track my notes</Link>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setDone(false); setMessage(''); setQuery(''); setSelected(null); setAnonymous(false); }}
            >
              Write another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page container-narrow">
      <div className="page-head">
        <span className="eyebrow">Send a note</span>
        <h1>Pin a thank-you to the wall</h1>
        <p>
          Notes are public once approved. Keep them specific and sincere: a real moment,
          a real person, a real thank-you.
        </p>
      </div>

      {error && <div className="form-error" role="alert">{error}</div>}

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="recipient-search">Who is this for?</label>
          {selected ? (
            <div className="picker-selected">
              <span>
                <strong>{selected.name}</strong>{' '}
                <span style={{ color: 'var(--ink-soft)', textTransform: 'capitalize' }}>
                  · {selected.role}, {selected.department}
                </span>
              </span>
              <button type="button" aria-label="Clear recipient" onClick={() => { setSelected(null); setQuery(''); }}>
                ×
              </button>
            </div>
          ) : (
            <div className="picker">
              <input
                id="recipient-search"
                className="input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                placeholder="Start typing a name, or enter one in full"
                autoComplete="off"
              />
              {dropdownOpen && (
                <div className="picker-results" role="listbox">
                  {results.length === 0 && !searching && (
                    <div style={{ padding: '12px 14px', fontSize: '0.86rem', color: 'var(--ink-faint)' }}>
                      No registered user matches, so your text will be used as the recipient’s name.
                    </div>
                  )}
                  {results.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="picker-option"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setSelected(person); setDropdownOpen(false); }}
                    >
                      <strong>{person.name}</strong>
                      <span>{person.role} · {person.department}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <p className="hint">
            Pick a registered member of campus and they’ll be notified when the note is published,
            or type any name freehand.
          </p>
        </div>

        <div className="field">
          <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 7 }}>Kind of note</span>
          <div className="segmented" role="group" aria-label="Category">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={category === c ? 'selected' : ''}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="message">Your message</label>
          <textarea
            id="message"
            className="textarea"
            maxLength={MAX_MESSAGE}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Thank you for…"
          />
          <div className={`char-counter ${message.length > MAX_MESSAGE ? 'over' : ''}`}>
            {message.length}/{MAX_MESSAGE}
          </div>
        </div>

        <div className="field">
          <label className="toggle">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <span className="track" aria-hidden="true" />
            <span className="toggle-copy">
              <strong>Post anonymously</strong>
              <span>The wall will show “by Anonymous” instead of your name. Moderators can still see who wrote it.</span>
            </span>
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Sending…' : 'Send to moderation'}
        </button>
      </form>
    </div>
  );
}
