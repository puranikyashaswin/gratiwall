export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ mark = '♥', title, children, action }) {
  return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true">{mark}</span>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
