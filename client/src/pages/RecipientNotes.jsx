import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import MasonryGrid from '../components/MasonryGrid';
import { Loading, EmptyState } from '../components/States';

export default function RecipientNotes() {
  const { name } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    setStatus('loading');
    api
      .get(`/notes/to/${encodeURIComponent(name)}`)
      .then((res) => {
        setData(res.data);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [name]);

  return (
    <div className="container page">
      {status === 'loading' && <Loading label="Collecting their notes…" />}

      {status === 'error' && (
        <EmptyState title="No published notes for this person">
          Either the name is mistyped, or their notes are still in the moderation queue.
          <div><Link className="btn btn-secondary" to="/">Back to the wall</Link></div>
        </EmptyState>
      )}

      {status === 'ready' && data && (
        <>
          <div className="recipient-hero">
            <span className="eyebrow">Appreciated on the wall</span>
            <h1>To {data.recipient.name}</h1>
            <div className="recipient-stats">
              <span className="stat-chip"><strong>{data.recipient.total}</strong> published note{data.recipient.total === 1 ? '' : 's'}</span>
              <span className="stat-chip"><strong>{data.recipient.applause}</strong> applause</span>
              {data.recipient.departments.map((d) => (
                <span key={d} className="stat-chip">from {d}</span>
              ))}
            </div>
          </div>
          <MasonryGrid notes={data.notes} />
          <div className="wall-footer">
            <Link to="/">Back to the full wall</Link>
          </div>
        </>
      )}
    </div>
  );
}
