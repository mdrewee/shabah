import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, jest, test, beforeEach } from '@jest/globals';
import { FLYING_QUESTIONS, getRandomFlyingQuestion, getRandomUnusedQuestion, drawNextFlyingQuestion } from '../src/pages/games/flying/flyingQuestions';
import { getSeenFlyingQuestions, rememberFlyingQuestion } from '../src/pages/games/flying/flyingQuestionHistory';
import { hasAllFlyingAnswers } from '../src/pages/games/flying/flyingRound';
import { RarityBadge, FLYING_RARITY } from '../src/pages/games/flying/RarityBadge';
import type { FlyingSubmission } from '../src/pages/games/flying/types';

beforeEach(() => {
  const cache = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => cache.get(key) || null, setItem: (key: string, value: string) => cache.set(key, value) } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { length: 0, key: () => null, getItem: () => null } });
});

test('bank contains 400 distinct real prompts and IDs', () => {
  expect(FLYING_QUESTIONS).toHaveLength(400);
  expect(new Set(FLYING_QUESTIONS.map((q) => q.id)).size).toBe(400);
  expect(new Set(FLYING_QUESTIONS.map((q) => q.title.replace(/[أإآ]/g, 'ا').trim())).size).toBe(400);
});

test('random selection respects both session exclusions and a device history across all 400 draws', () => {
  const first = FLYING_QUESTIONS[0];
  rememberFlyingQuestion(first.id);
  const draws = [first.id];
  for (let i = 1; i < FLYING_QUESTIONS.length; i++) draws.push(getRandomFlyingQuestion()!.id);
  expect(new Set(draws).size).toBe(400);
  expect(getRandomFlyingQuestion()).toBeUndefined();
  expect(getSeenFlyingQuestions()).toHaveLength(400);
  jest.isolateModules(() => {
    const restored = require('../src/pages/games/flying/flyingQuestions');
    expect(restored.getRandomFlyingQuestion()).toBeUndefined();
  });
  const next = drawNextFlyingQuestion(draws);
  expect(next.restarted).toBe(true);
  const secondCycle = [next.question!.id];
  for (let i = 1; i < 400; i++) {
    const draw = drawNextFlyingQuestion(secondCycle);
    expect(draw.restarted).toBe(false);
    secondCycle.push(draw.question!.id);
  }
  expect(new Set(secondCycle).size).toBe(400);
});

test('picker samples any available position and never resets an exhausted deck', () => {
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.999999);
  expect(getRandomUnusedQuestion(FLYING_QUESTIONS)?.id).toBe(FLYING_QUESTIONS[399].id);
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
