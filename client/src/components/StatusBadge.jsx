const LABELS = {
  pending: 'Pending',
  approved: 'Published',
  rejected: 'Rejected',
  flagged: 'Flagged',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{LABELS[status] || status}</span>;
}
