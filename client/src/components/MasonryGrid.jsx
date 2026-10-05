import { useEffect, useMemo, useState } from 'react';
import NoteCard from './NoteCard';

function columnCount(width) {
  if (width < 640) return 1;
  if (width < 960) return 2;
  if (width < 1280) return 3;
  if (width < 1680) return 4;
  return 5;
}

function useColumnCount() {
  const [count, setCount] = useState(() => columnCount(window.innerWidth));
  useEffect(() => {
    const onResize = () => setCount(columnCount(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return count;
}

/**
 * Balanced masonry: notes are distributed across N flex columns by estimated
 * card height (message length), so every column fills evenly at any width.
 */
export default function MasonryGrid({ notes }) {
  const count = useColumnCount();

  const columns = useMemo(() => {
    const cols = Array.from({ length: count }, () => ({ items: [], weight: 0 }));
    notes.forEach((note, index) => {
      const weight = 3 + Math.ceil(note.message.length / 90);
      const lightest = cols.reduce((a, b) => (b.weight < a.weight ? b : a));
      lightest.items.push({ note, index });
      lightest.weight += weight;
    });
    return cols.map((c) => c.items);
  }, [notes, count]);

  return (
    <div className="wall-columns">
      {columns.map((col, i) => (
        <div className="wall-col" key={i}>
          {col.map(({ note, index }) => (
            <NoteCard key={note.id} note={note} index={index} />
          ))}
        </div>
      ))}
    </div>
  );
}
