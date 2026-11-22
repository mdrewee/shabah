import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, jest, test } from '@jest/globals';
import { CoachBingoMobileView } from '../src/pages/games/coach/components/CoachBingoMobileView';
import { CoachBingoTVView } from '../src/pages/games/coach/components/CoachBingoTVView';
import type { BingoRoulettePlayer } from '../src/pages/games/coach/types';

jest.mock('../src/pages/games/coach/coachSync', () => ({ checkBingoWin: () => ({ isBingo: false }), doesPlayerMatchBingoCell: () => false }));
jest.mock('../src/pages/games/coach/footballDataService', () => ({ SILHOUETTE_SVG: '' }));
jest.mock('../src/lib/audio', () => ({ sound: {} }));

test('both roulette views show the player name without revealing club, country, position or portrait', () => {
  const player: BingoRoulettePlayer = { id: 'one', name: 'اسم اللاعب الكامل', position: 'ATT', currentClub: 'SECRET CLUB', nationality: 'SECRET COUNTRY', photoUrl: '/secret-portrait.jpg', clubs: [], trophies: [], traits: [] };
  const views = [
    renderToStaticMarkup(<CoachBingoMobileView card={{ playerId: 'guest', cells: [], isBingo: false }} currentRoulettePlayer={player} hasAttempted={false} turnKey="1" onToggleCell={() => {}} onClaimBingo={() => {}} />),
    renderToStaticMarkup(<CoachBingoTVView currentRoulettePlayer={player} contestants={[]} bingoCards={{}} />),
  ];
  for (const html of views) {
    expect(html).toContain(player.name);
    for (const hint of ['SECRET CLUB', 'SECRET COUNTRY', 'ATT', '/secret-portrait.jpg']) expect(html).not.toContain(hint);
  }
});
