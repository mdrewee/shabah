import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from '@jest/globals';
import { BingoCellVisual } from '../src/pages/games/coach/components/BingoCellVisual';
import type { BingoCell } from '../src/pages/games/coach/types';

test.each(['GK', 'DEF', 'MID', 'ATT'])('position %s uses its English code even for a saved card with an old image', (code) => {
  const html = renderToStaticMarkup(<BingoCellVisual cell={{ type: 'position', targetValue: code, imageUrl: '/old.svg' } as BingoCell} />);
  expect(html).toContain(`>${code}</span>`);
  expect(html).not.toContain('<img');
});

test('old Manchester City cards resolve to a real SVG and skin tone never uses a player portrait', () => {
  const club = renderToStaticMarkup(<BingoCellVisual cell={{ type: 'club', imageUrl: '/assets/football/clubs/man_city.png' } as BingoCell} />);
  expect(club).toContain('/assets/football/clubs/man_city.svg');
  const trait = renderToStaticMarkup(<BingoCellVisual cell={{ type: 'trait', targetValue: 'أسمر', imageUrl: '/wrong-person.jpg' } as BingoCell} />);
  expect(trait).not.toContain('<img');
  expect(trait).toContain('<svg');
});
