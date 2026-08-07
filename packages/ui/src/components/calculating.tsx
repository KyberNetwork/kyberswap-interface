import { useEffect, useState } from 'react';

const DOT_INTERVAL_MS = 420;

/**
 * Stands in for a figure the backend cannot report yet. The trailing dots cycle to read as work in
 * progress; they sit in a fixed-width slot so the label does not jitter as they grow.
 */
export const Calculating = ({ className, label = 'Calculating' }: { className?: string; label?: string }) => {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setDotCount(count => (count % 3) + 1), DOT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className={className} style={{ whiteSpace: 'nowrap' }}>
      {label}
      <span style={{ display: 'inline-block', width: '1em', textAlign: 'left' }}>{'.'.repeat(dotCount)}</span>
    </span>
  );
};

export default Calculating;
