export function timeAgo(dateInput) {
  const then = new Date(dateInput).getTime();
  const seconds = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value} ${name}${value > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export function formatDate(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
