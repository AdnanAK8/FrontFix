import { useCallback, useEffect, useRef, useState } from 'react';

export default function useToast(duration = 2400) {
  const [toast, setToast] = useState({ message: 'Feedback received!', visible: false });
  const timer = useRef(null);

  const showToast = useCallback(
    (message) => {
      clearTimeout(timer.current);
      setToast({ message, visible: true });
      timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { toast, showToast };
}
