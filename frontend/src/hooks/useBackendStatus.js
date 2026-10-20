import { useEffect, useState } from 'react';
import { BACKEND_URL } from '../config.js';

// Pings the backend every `intervalMs` and reports whether it's reachable.
export default function useBackendStatus(intervalMs = 6000) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      let ok = false;
      try {
        const res = await fetch(`${BACKEND_URL}/`, { method: 'GET' });
        ok = res.ok;
      } catch {
        ok = false;
      }
      if (!cancelled) setOnline(ok);
    }

    check();
    const id = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return online;
}
