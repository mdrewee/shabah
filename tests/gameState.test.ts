import { expect, jest, test } from '@jest/globals';
import { useGameState } from '../src/hooks/useGameState';

const commit = jest.fn();
jest.mock('react', () => ({
  useState: (initial: () => unknown) => [initial(), commit],
  useRef: (current: unknown) => ({ current }),
  useCallback: (callback: unknown) => callback,
}));

test('back-to-back room packets see the latest state before React commits a render', () => {
  const [, update, snapshot] = useGameState(() => ({ votes: [] as string[] }));
  const emitted: string[][] = [];
  for (const player of ['one', 'two']) {
    update((previous) => {
      const next = { votes: [...previous.votes, player] };
      emitted.push(next.votes);
      return next;
    });
  }
  expect(snapshot.current.votes).toEqual(['one', 'two']);
  expect(emitted).toEqual([['one'], ['one', 'two']]);
  // React may replay updaters, so it receives resolved values only.
  expect(commit.mock.calls.every(([value]) => typeof value !== 'function')).toBe(true);
});
