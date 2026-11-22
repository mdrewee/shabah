import { expect, jest, test } from '@jest/globals';
import { STATIC_BINGO_PLAYERS } from '../src/data/footballStaticAssets';
import { BINGO_MANAGER_PLAYERS } from '../src/data/additionalBingoPlayers';
import { BINGO_CELL_POOL, doesPlayerMatchBingoCell, getRandomRoulettePlayer } from '../src/pages/games/coach/coachSync';
import type { BingoCell, BingoRoulettePlayer } from '../src/pages/games/coach/types';

jest.mock('../src/lib/roomBus', () => ({ roomBus: {} }));
jest.mock('../src/pages/games/coach/footballDataService', () => ({ normalizeFootballSearch: (text: string) => text.trim() }));

const player = (id: string) => {
  const entry = STATIC_BINGO_PLAYERS.find((item) => item.id === id)!;
  return { ...entry, nationality: entry.country, photoUrl: '', clubs: entry.clubs || [], trophies: entry.trophies || [], traits: entry.traits || [] } as BingoRoulettePlayer;
};
const cell = (type: BingoCell['type'], targetValue: string) => ({ type, targetValue } as BingoCell);

test('the active roulette has exactly 100 distinct footballers and balanced positions', () => {
  expect(STATIC_BINGO_PLAYERS).toHaveLength(100);
  expect(new Set(STATIC_BINGO_PLAYERS.map((item) => item.id)).size).toBe(100);
  expect(new Set(STATIC_BINGO_PLAYERS.map((item) => item.name)).size).toBe(100);
  const counts: Record<string, number> = {};
  STATIC_BINGO_PLAYERS.forEach((item) => { counts[item.position] = (counts[item.position] || 0) + 1; });
  expect(counts).toEqual({ GK: 15, DEF: 30, MID: 30, ATT: 25 });
  for (const entry of STATIC_BINGO_PLAYERS) {
    expect(entry.name.trim()).not.toBe('');
    expect(entry.country.trim()).not.toBe('');
    expect(entry.clubs?.length).toBeGreaterThan(0);
  }
});

test('every Bingo condition has at least three matching players', () => {
  for (const condition of BINGO_CELL_POOL) {
    const matches = STATIC_BINGO_PLAYERS.filter((entry) => doesPlayerMatchBingoCell(player(entry.id), condition as BingoCell));
    if (matches.length < 3) throw new Error(`${condition.title}: only ${matches.length} matching players`);
  }
});

test('all 100 players are reachable by the live picker, with manager data preserved', () => {
  const ids = STATIC_BINGO_PLAYERS.map((entry) => entry.id);
  for (const id of ids) {
    const picked = getRandomRoulettePlayer(ids.filter((other) => other !== id));
    expect(picked.id).toBe(id);
    expect(picked.managers).toEqual(player(id).managers);
  }
  for (const idsForManager of Object.values(BINGO_MANAGER_PLAYERS)) {
    expect(idsForManager.every((id) => ids.includes(id))).toBe(true);
  }
});

test('historical club membership does not imply a coaching relationship', () => {
  expect(doesPlayerMatchBingoCell(player('neymar'), cell('manager', 'غوارديولا'))).toBe(false);
  expect(doesPlayerMatchBingoCell(player('p_diego_maradona'), cell('manager', 'غوارديولا'))).toBe(false);
  expect(doesPlayerMatchBingoCell(player('p_carles_puyol'), cell('manager', 'غوارديولا'))).toBe(true);
  expect(doesPlayerMatchBingoCell(player('p_sergio_ramos'), cell('manager', 'زيدان'))).toBe(true);
  const legacyPlayer = { ...player('p_sergio_ramos'), managers: undefined };
  expect(doesPlayerMatchBingoCell(legacyPlayer, cell('manager', 'زيدان'))).toBe(true);
});

test('similarly named clubs and competitions are not mistaken for each other', () => {
  expect(doesPlayerMatchBingoCell(player('alisson'), cell('club', 'إنتر'))).toBe(false);
  expect(doesPlayerMatchBingoCell(player('p_javier_zanetti'), cell('club', 'إنتر'))).toBe(true);
  expect(doesPlayerMatchBingoCell(player('p_fabio_cannavaro'), cell('club', 'الأهلي'))).toBe(false);
  expect(doesPlayerMatchBingoCell(player('p_essam_hadary'), cell('club', 'الأهلي'))).toBe(false);
  expect(doesPlayerMatchBingoCell({ ...player('p_manuel_neuer'), trophies: ['كأس العالم للأندية'] }, cell('trophy', 'كأس العالم'))).toBe(false);
  expect(doesPlayerMatchBingoCell(player('p_majed_abdullah'), cell('trophy', 'دوري روشن'))).toBe(true);
});
