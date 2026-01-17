import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, interval: number) {
  const savedCallback = useRef(callback);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id: ReturnType<typeof setInterval> | null = null;

    // Only start polling if currently visible
    if (document.visibilityState !== 'hidden') {
       id = setInterval(tick, interval);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (id) {
            clearInterval(id);
            id = null;
        }
      } else {
        // Resume
        if (!id) {
            tick(); // Immediate update on resume
            id = setInterval(tick, interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (id) clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
}
