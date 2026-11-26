import { beforeEach, expect, test } from '@jest/globals';
import { GUIDE_LANDMARKS_POOL, getRandomGuideLandmarks } from '../src/data/guideLandmarks';
import { acceptsGuidePin, createInitialGuideState, loadPersistedGuideState, savePersistedGuideState } from '../src/pages/games/guide/guideSync';
import { evaluateGuess } from '../src/services/guideScoring';

beforeEach(() => {
  const cache = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => cache.get(key) || null,
    setItem: (key: string, value: string) => cache.set(key, value),
  }});
});

test('expanded bank has over 120 distinct destinations with five clues and valid coordinates', () => {
  expect(GUIDE_LANDMARKS_POOL.length).toBeGreaterThanOrEqual(120);
  expect(new Set(GUIDE_LANDMARKS_POOL.map(x => x.id)).size).toBe(GUIDE_LANDMARKS_POOL.length);
  for (const item of GUIDE_LANDMARKS_POOL) {
    expect(item.clues).toHaveLength(5);
    expect(new Set(item.clues).size).toBe(5);
    expect(Math.abs(item.lat)).toBeLessThanOrEqual(90);
    expect(Math.abs(item.lng)).toBeLessThanOrEqual(180);
  }
});

test('draw excludes already played destinations', () => {
  const excluded = GUIDE_LANDMARKS_POOL.slice(0, -1).map(x => x.id);
  expect(getRandomGuideLandmarks(1, excluded)[0]).toEqual(GUIDE_LANDMARKS_POOL.at(-1));
});

test('saved guessing round retains scores and timing', () => {
  const state = { ...createInitialGuideState('TEST'), phase: 'GUESSING' as const, roundStartedAt: 12345, cumulativeScores: { p: 16 } };
  savePersistedGuideState('TEST', state);
  expect(loadPersistedGuideState('TEST')).toEqual(state);
  sessionStorage.setItem('SHABAH_GUIDE_STATE_TEST', '{broken');
  expect(loadPersistedGuideState('TEST')).toBeNull();
});

test('pins require current member, current round, finite bounded coords and a first submission', () => {
  const state = { ...createInitialGuideState('TEST'), phase: 'GUESSING' as const };
  const pin = { contestantId: 'p', roundNumber: state.roundNumber, landmarkId: state.currentLandmark.id, lat: 0, lng: 0 };
  expect(acceptsGuidePin(state, pin, ['p'])).toBe(true);
  for (const bad of [{ ...pin, lat: NaN }, { ...pin, lng: 181 }, { ...pin, roundNumber: 0 }, { ...pin, landmarkId: 'old' }, { ...pin, contestantId: 'unknown' }]) {
    expect(acceptsGuidePin(state, bad, ['p'])).toBe(false);
  }
  expect(acceptsGuidePin({ ...state, guesses: { p: { ...pin, contestantName: 'p', submittedAt: 1 } } }, pin, ['p'])).toBe(false);
});

test('points depend on distance consistently across continent boundaries', () => {
  for (const [distance, points] of [[50,10],[51,8],[200,8],[201,6],[900,6],[901,3],[3379,3],[3500,3],[3501,1],[6000,1],[6001,0]]) {
    expect(evaluateGuess(distance, true).points).toBe(points);
    expect(evaluateGuess(distance, false).points).toBe(points);
  }
});
