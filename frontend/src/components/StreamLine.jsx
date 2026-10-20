import { useEffect, useState } from 'react';

// One row of a bot message. Fades in after `index * stagger` ms (the "streaming" effect).
export default function StreamLine({ index = 0, stagger = 160, style, children, onReveal }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setRevealed(true);
      onReveal?.();
    }, index * stagger);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, stagger]);

  return (
    <div className={`stream-line${revealed ? ' revealed' : ''}`} style={style}>
      {children}
    </div>
  );
}
