import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';

// Room events must update the live snapshot before another packet arrives.
// Resolve transitions here so broadcasts never run inside a React updater.
export function useGameState<T>(initial: () => T) {
  const [state, commit] = useState(initial);
  const snapshot = useRef(state);
  const setState: Dispatch<SetStateAction<T>> = useCallback((update) => {
    const next = typeof update === 'function'
      ? (update as (previous: T) => T)(snapshot.current)
      : update;
    snapshot.current = next;
    commit(next);
  }, []);
  return [state, setState, snapshot] as const;
}
