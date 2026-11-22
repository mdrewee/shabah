import { expect, jest, test } from '@jest/globals';
import { applyBingoAttempt, canClaimDraftSlot } from '../src/pages/games/coach/coachRules';
import { checkBingoWin } from '../src/pages/games/coach/coachSync';
import type { CoachRoomState } from '../src/pages/games/coach/types';

jest.mock('../src/lib/roomBus', () => ({ roomBus: {} }));
jest.mock('../src/pages/games/coach/footballDataService', () => ({ normalizeFootballSearch: (text: string) => text.trim() }));

const state = () => ({
  phase: 'BINGO_PLAYING', roundNumber: 1, currentRoundSelections: {},
  squads: { p: { playerId: 'p', playerName: 'Guest', slots: {} } },
  currentRoulettePlayer: { id: 'one', name: 'Player', photoUrl: 'trusted.jpg', clubs: ['ليفربول'], trophies: [], traits: [], nationality: 'مصر' },
  rouletteHistory: ['one'], rouletteEndsAt: 9000, rouletteSkipVotes: [],
  bingoCards: { p: { playerId: 'p', cells: [
    { id: 'a', title: 'ليفربول', type: 'club', targetValue: 'ليفربول', isMarked: false },
    { id: 'b', title: 'ريال مدريد', type: 'club', targetValue: 'ريال مدريد', isMarked: false },
  ] } },
} as unknown as CoachRoomState);
const action = { playerId: 'p', roulettePlayerId: 'one', rouletteTurn: 1, cellIndex: 0 };

test('Bingo allows one validated choice per turn, including after a reload', () => {
  const marked = applyBingoAttempt(state(), action, 1000);
  expect(marked.bingoCards.p.cells[0]).toMatchObject({ isMarked: true, markedPlayerName: 'Player', markedPlayerPhoto: 'trusted.jpg' });
  const restored: CoachRoomState = JSON.parse(JSON.stringify(marked));
  expect(applyBingoAttempt(restored, { ...action, cellIndex: 1 }, 2000)).toBe(restored);
});

test('wrong answers and skips consume the attempt; stale and expired packets do nothing', () => {
  const original = state();
  const wrong = applyBingoAttempt(original, { ...action, cellIndex: 1 }, 1000);
  expect(wrong.rouletteSkipVotes).toEqual(['p']);
  expect(wrong.bingoCards.p.cells.every((cell) => !cell.isMarked)).toBe(true);
  const skipped = applyBingoAttempt(original, { ...action, cellIndex: undefined }, 1000);
  expect(applyBingoAttempt(skipped, action, 2000)).toBe(skipped);
  expect(applyBingoAttempt(original, { ...action, rouletteTurn: 0 }, 1000)).toBe(original);
  expect(applyBingoAttempt(original, action, 9000)).toBe(original);
  expect(applyBingoAttempt(original, { ...action, cellIndex: -1 }, 1000)).toBe(original);
});

test('draft rejects a second pick and delayed picks without blocking the next round', () => {
  const draft = { ...state(), phase: 'DRAFTING' as const };
  expect(canClaimDraftSlot(draft, 'p', 'MID', 1)).toBe(true);
  const picked = { ...draft, currentRoundSelections: { p: { playerName: 'Chosen', conditionId: 'one', conditionTitle: 'Condition' } } };
  expect(canClaimDraftSlot(picked, 'p', 'FWD', 1)).toBe(false);
  expect(canClaimDraftSlot({ ...draft, roundNumber: 2 }, 'p', 'FWD', 1)).toBe(false);
  expect(canClaimDraftSlot({ ...draft, roundNumber: 2 }, 'p', 'FWD', 2)).toBe(true);
});

test('Bingo requires a complete winning pattern', () => {
  const cells = Array.from({ length: 16 }, (_, index) => ({ ...state().bingoCards.p.cells[0], id: String(index), isMarked: index < 3 }));
  expect(checkBingoWin(cells).isBingo).toBe(false);
  cells[3].isMarked = true;
  expect(checkBingoWin(cells).isBingo).toBe(true);
});
