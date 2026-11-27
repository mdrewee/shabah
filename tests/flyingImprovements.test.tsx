import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, jest, test, beforeEach } from '@jest/globals';
import { FLYING_QUESTIONS, getRandomFlyingQuestion, getRandomUnusedQuestion, drawNextFlyingQuestion } from '../src/pages/games/flying/flyingQuestions';
import { getSeenFlyingQuestions, rememberFlyingQuestion } from '../src/pages/games/flying/flyingQuestionHistory';
import { flyingAltitudeRatio, flyingRevealRoster, flyingSecondsLeft, hasAllFlyingAnswers } from '../src/pages/games/flying/flyingRound';
import { RarityBadge, FLYING_RARITY } from '../src/pages/games/flying/RarityBadge';
import type { FlyingContestantResult, FlyingSubmission } from '../src/pages/games/flying/types';

beforeEach(() => {
  const cache = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => cache.get(key) || null, setItem: (key: string, value: string) => cache.set(key, value) } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { length: 0, key: () => null, getItem: () => null } });
});

test('bank contains hundreds of distinct open prompts and IDs', () => {
  expect(FLYING_QUESTIONS.length).toBeGreaterThan(300);
  expect(FLYING_QUESTIONS.every(q => !/(?:^|\s)(?:أو|فقط)(?:\s|$)/.test(q.title))).toBe(true);
  expect(new Set(FLYING_QUESTIONS.map((q) => q.id)).size).toBe(FLYING_QUESTIONS.length);
  expect(new Set(FLYING_QUESTIONS.map((q) => q.title.replace(/[أإآ]/g, 'ا').trim())).size).toBe(FLYING_QUESTIONS.length);
});

test('random selection respects both session exclusions and a device history across all draws', () => {
  const first = FLYING_QUESTIONS[0];
  rememberFlyingQuestion(first.id);
  const draws = [first.id];
  for (let i = 1; i < FLYING_QUESTIONS.length; i++) draws.push(getRandomFlyingQuestion()!.id);
  expect(new Set(draws).size).toBe(FLYING_QUESTIONS.length);
  expect(getRandomFlyingQuestion()).toBeUndefined();
  expect(getSeenFlyingQuestions()).toHaveLength(FLYING_QUESTIONS.length);
  jest.isolateModules(() => {
    const restored = require('../src/pages/games/flying/flyingQuestions');
    expect(restored.getRandomFlyingQuestion()).toBeUndefined();
  });
  const next = drawNextFlyingQuestion(draws);
  expect(next.restarted).toBe(true);
  const secondCycle = [next.question!.id];
  for (let i = 1; i < FLYING_QUESTIONS.length; i++) {
    const draw = drawNextFlyingQuestion(secondCycle);
    expect(draw.restarted).toBe(false);
    secondCycle.push(draw.question!.id);
  }
  expect(new Set(secondCycle).size).toBe(FLYING_QUESTIONS.length);
});

test('picker samples any available position and never resets an exhausted deck', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  expect(getRandomUnusedQuestion(FLYING_QUESTIONS)?.id).toBe(FLYING_QUESTIONS.at(-1)?.id);
  random.mockReturnValue(0);
  expect(getRandomUnusedQuestion(FLYING_QUESTIONS, [FLYING_QUESTIONS[0].id])?.id).toBe(FLYING_QUESTIONS[1].id);
  expect(getRandomUnusedQuestion([], [])).toBeUndefined();
  random.mockRestore();
});

test('existing saved games seed device history before the first new draw', () => {
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    length: 1, key: () => 'shabah_flying_state_OLD',
    getItem: () => JSON.stringify({ usedQuestionIds: [FLYING_QUESTIONS[0].id] }),
  } });
  const random = jest.spyOn(Math, 'random').mockReturnValue(0);
  jest.isolateModules(() => {
    const restored = require('../src/pages/games/flying/flyingQuestions');
    expect(restored.getRandomFlyingQuestion().id).toBe(FLYING_QUESTIONS[1].id);
  });
  random.mockRestore();
});

test('all active answers end waiting immediately; empty rooms, missing and blank answers do not', () => {
  const submitted = { one: { answer: 'تمر' } as FlyingSubmission, two: { answer: 'قهوة' } as FlyingSubmission };
  expect(hasAllFlyingAnswers([{ id: 'one' }, { id: 'two' }, { id: 'host_tv' }], submitted)).toBe(true);
  expect(hasAllFlyingAnswers([{ id: 'one' }, { id: 'two' }], { one: submitted.one })).toBe(false);
  expect(hasAllFlyingAnswers([{ id: 'one' }], { one: { ...submitted.one, answer: '  ' } })).toBe(false);
  expect(hasAllFlyingAnswers([], submitted)).toBe(false);
  expect(hasAllFlyingAnswers([{ id: 'one' }], submitted)).toBe(true);
});

test('rarity has different symbols and strength levels, independent of text and color', () => {
  expect(['common', 'uncommon', 'rare', 'legendary'].map((tier) => FLYING_RARITY[tier as keyof typeof FLYING_RARITY].power)).toEqual([1, 2, 3, 4]);
  const html = renderToStaticMarkup(<RarityBadge tier="legendary" />);
  expect(html).toContain('lucide-crown');
  expect(renderToStaticMarkup(<RarityBadge tier="rare" />)).toContain('lucide-gem');
  expect(renderToStaticMarkup(<RarityBadge tier="common" />)).toContain('lucide-circle');
});

test('flight altitude uses a fixed course and the reveal roster follows the published results', () => {
  expect(flyingAltitudeRatio(600, 5)).toBe(0.12);
  expect(flyingAltitudeRatio(1600, 5) - flyingAltitudeRatio(1000, 5)).toBeCloseTo(0.12);
  expect(flyingAltitudeRatio(5000, 5)).toBe(1);
  const results = {
    guestB: { contestantId:'guestB', contestantName:'الثاني' } as FlyingContestantResult,
    guestA: { contestantId:'guestA', contestantName:'الأول' } as FlyingContestantResult,
  };
  expect(flyingRevealRoster(results).map(player => player.id)).toEqual(['guestB','guestA']);
});

test('a delayed question packet does not give the player additional time', () => {
  expect(flyingSecondsLeft(1000, 8500)).toBe(28);
  expect(flyingSecondsLeft(1000, 37000)).toBe(0);
});
