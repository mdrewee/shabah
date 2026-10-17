import { useState, useEffect } from 'react';

export function useSafeCountdown(endsAt: number | null | undefined, onExpire?: () => void) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!endsAt) return 0;
    const remainingMs = endsAt - Date.now();
    return Math.max(0, Math.ceil(remainingMs / 1000));
  });

  useEffect(() => {
    if (!endsAt) {
      setSecondsLeft(0);
      return;
    }

    const calculateRemaining = () => {
      const remainingMs = endsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(remainingSec);

      if (remainingMs <= 0) {
        if (onExpire) onExpire();
        return false;
      }
      return true;
    };

    // Calculate immediately on mount/update
    const isActive = calculateRemaining();
    if (!isActive) return;

    // Use a single, safe interval updating purely derived time
    const intervalId = setInterval(() => {
      const keepGoing = calculateRemaining();
      if (!keepGoing) {
        clearInterval(intervalId);
      }
    }, 200);

    return () => clearInterval(intervalId);
  }, [endsAt]);

  return secondsLeft;
}
