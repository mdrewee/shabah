import { beforeEach, expect, test } from '@jest/globals';
import { createInitialJudgeState, savePersistedJudgeState } from '../src/pages/games/judge/judgeSync';
import { createInitialBrokerState, savePersistedBrokerState } from '../src/pages/games/broker/brokerSync';
import { createInitialArabicState, savePersistedArabicState } from '../src/pages/games/arabic/arabicSync';

beforeEach(() => {
  const cache = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => cache.get(key) ?? null,
    setItem: (key: string, value: string) => cache.set(key, value),
  } });
});

test('judge reload restores results, replay resets scores in the same room', () => {
  const previous = { ...createInitialJudgeState('AB23'), roundNumber: 5, cumulativeScores: { p_one: 100 } };
  savePersistedJudgeState('AB23', previous);
  expect(createInitialJudgeState('AB23').cumulativeScores).toEqual({ p_one: 100 });
  expect(createInitialJudgeState('AB23', true)).toMatchObject({ roomCode: 'AB23', phase: 'LOBBY', roundNumber: 1, cumulativeScores: {}, excuses: {}, verdicts: {} });
});

test('broker replay clears previous bids and round history', () => {
  const previous = { ...createInitialBrokerState('AB23'), roundNumber: 5, winnerName: 'Previous winner' };
  savePersistedBrokerState('AB23', previous);
  expect(createInitialBrokerState('AB23').winnerName).toBe('Previous winner');
  expect(createInitialBrokerState('AB23', true)).toMatchObject({ roomCode: 'AB23', roundNumber: 1, contestantBids: {}, roundHistory: [], winnerName: null });
});

test('Arabic replay clears submissions and accumulated points', () => {
  const previous = { ...createInitialArabicState('AB23'), roundNumber: 5, cumulativeScores: { p_one: 50 } };
  savePersistedArabicState('AB23', previous);
  expect(createInitialArabicState('AB23').roundNumber).toBe(5);
  expect(createInitialArabicState('AB23', true)).toMatchObject({ roomCode: 'AB23', roundNumber: 1, cumulativeScores: {}, submissions: {}, evaluations: {} });
});
