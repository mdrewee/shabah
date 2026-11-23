import { beforeEach, expect, jest, test } from '@jest/globals';
import { callGeminiWithFallback } from '../src/services/geminiClient';
import { applyScoringAndDuplicates, cleanAndParseJSON, evaluateAllArabicAnswers, normalizeToArray } from '../src/services/arabicEngine';
import { wordStartsWithLetter } from '../src/data/arabicCategories';
import { recalculateArabicRound } from '../src/pages/games/arabic/arabicScoring';
import type { ArabicRoomState, ContestantEvaluation } from '../src/pages/games/arabic/types';

jest.mock('../src/services/geminiClient', () => ({ callGeminiWithFallback: jest.fn() }));
const ai = jest.mocked(callGeminiWithFallback);
const sub = (playerId: string, answer: string) => ({ playerId, playerName: playerId, answers: { 0: answer } });
const verdict = (playerId: string, answer: string, isCorrect: unknown = true) => ({ playerId, results: [{ category: 'بلاد', answer, isCorrect }] });
beforeEach(() => { ai.mockReset(); });

test('hamzas, spelling, marks and the article share duplicate scoring', () => {
  const result = applyScoringAndDuplicates([verdict('a','ألمانيا'),verdict('b','المانيا')], ['بلاد'], [sub('a','ألمانيا'),sub('b','المانيا')], 'أ');
  expect(result.map(p => p.totalScore)).toEqual([5,5]);
  expect(wordStartsWithLetter('القرد','أ')).toBe(false);
  expect(wordStartsWithLetter('الْقِرْد','ق')).toBe(true);
  expect(wordStartsWithLetter('أَلْمَاس','أ')).toBe(true);
});

test('AI cannot replace original answers, bypass letters or send string booleans', () => {
  for (const [answer, response, valid, pending] of [
    ['باب', verdict('a','بقرة'), false, true],
    ['تفاح', verdict('a','تفاح'), false, false],
    ['بقرة', verdict('a','بقرة','false'), false, true],
  ] as const) {
    const result = applyScoringAndDuplicates([response],['بلاد'],[sub('a',answer)],'ب')[0];
    expect(result.results[0]).toMatchObject({ answer, isCorrect: valid, score: 0, needsReview: pending });
  }
});

test('missing player/category results never borrow another verdict', () => {
  const result = applyScoringAndDuplicates([verdict('unknown','ألمانيا')], ['بلاد'], [sub('a','ألمانيا')], 'أ');
  expect(result[0].results[0]).toMatchObject({ score:0, needsReview:true });
});

test('contradictory verdicts for the same answer require review for both players', () => {
  const result = applyScoringAndDuplicates([verdict('a','ألمانيا'),verdict('b','المانيا',false)], ['بلاد'], [sub('a','ألمانيا'),sub('b','المانيا')], 'أ');
  expect(result.map(p => p.totalScore)).toEqual([0,0]);
  expect(result.every(p => p.results[0].needsReview)).toBe(true);
});

test('object and wrapped JSON preserve player IDs', () => {
  const row = verdict('a','ألمانيا');
  expect(normalizeToArray(cleanAndParseJSON(JSON.stringify(row)))).toEqual([row]);
  expect(normalizeToArray(cleanAndParseJSON('```json\n'+JSON.stringify({ evaluations:[row] })+'\n```'))).toEqual([row]);
});

test('offline gibberish/category guesses get no invented points and require review', async () => {
  ai.mockRejectedValue(new Error('offline'));
  const log = jest.spyOn(console,'warn').mockImplementation(() => {});
  try {
    const result = await evaluateAllArabicAnswers('ب',['حيوان'],[sub('a','باب'),sub('b','برررر')]);
    expect(result.map(p => p.totalScore)).toEqual([0,0]);
    expect(result.every(p => p.results[0].needsReview)).toBe(true);
  } finally { log.mockRestore(); }
});

test('live engine validates letter even if AI returns correct and accepts valid schema', async () => {
  ai.mockResolvedValue(JSON.stringify([verdict('a','تفاح')]));
  expect((await evaluateAllArabicAnswers('ب',['بلاد'],[sub('a','تفاح')]))[0].totalScore).toBe(0);
  ai.mockResolvedValue(JSON.stringify([verdict('a','ألمانيا')]));
  expect((await evaluateAllArabicAnswers('أ',['بلاد'],[sub('a','ألمانيا')]))[0].totalScore).toBe(10);
});

function player(id: string, valid: boolean[]): ContestantEvaluation {
  return { contestantId:id, contestantName:id, roundPoints:0, speedBonus:0, totalRoundPoints:0,
    answers: valid.map((isValid,index)=>({categoryIndex:index,categoryName:String(index),rawAnswer:['ألمانيا','أسد','أحمد'][index],isValid,isUnique:false,points:0,comment:'صحيح'})) };
}
test('accepted objection recalculates both duplicate scores and moves speed bonus without double counting', () => {
  const state = { phase:'INPUT', cumulativeScores:{a:100,b:50}, submissions:{a:{submissionDurationMs:2000},b:{submissionDurationMs:1000}} } as unknown as ArabicRoomState;
  const initial = recalculateArabicRound(state, { a:player('a',[true,true,true]), b:player('b',[false,true,true]) });
  expect(initial.evaluations.a.speedBonus).toBe(5);
  const updated = { ...initial.evaluations, b: { ...initial.evaluations.b, answers: initial.evaluations.b.answers.map(a=>({...a,isValid:true})) } };
  const after = recalculateArabicRound({ ...state, ...initial, phase:'RESULTS' }, updated);
  expect(after.evaluations.a.answers[0].points).toBe(5);
  expect(after.evaluations.a.speedBonus).toBe(0);
  expect(after.evaluations.b.speedBonus).toBe(5);
  expect(after.cumulativeScores).toEqual({a:115,b:70});
  expect(recalculateArabicRound({ ...state, ...after, phase:'RESULTS' }, after.evaluations).cumulativeScores).toEqual(after.cumulativeScores);
});
