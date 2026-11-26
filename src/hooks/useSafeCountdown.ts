import { useState, useEffect } from 'react';

export function useSafeCountdown(endsAt: number | null | undefined, onExpire?: () => void) {
  const [countdown, setCountdown] = useState(() => ({
    endsAt,
    seconds: endsAt ? Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)) : 0,
  }));

  useEffect(() => {
    if (!endsAt) {
      return;
    }

    const calculateRemaining = () => {
      const remainingMs = endsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      setCountdown(previous => previous.endsAt === endsAt && previous.seconds === remainingSec
        ? previous : { endsAt, seconds: remainingSec });

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

  if (!endsAt) return 0;
  return countdown.endsAt === endsAt
    ? countdown.seconds
    : Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}
