import React from 'react';
import { expect, test } from '@jest/globals';
import { renderToStaticMarkup } from 'react-dom/server';
import { ShabahRoundReveal } from '../src/components/common/ShabahRoundReveal';

test('reveals an answer before displaying the winner', () => {
  const html = renderToStaticMarkup(
    <ShabahRoundReveal entries={[{ id: 'p_one', name: 'Player one', answer: 'Their answer' }]}>
      <p>WINNER</p>
    </ShabahRoundReveal>
  );
  expect(html).toContain('Their answer');
  expect(html).not.toContain('WINNER');
});

test('keeps the game view visible when there are no results yet', () => {
  expect(renderToStaticMarkup(<ShabahRoundReveal entries={[]}><p>DRAFTING</p></ShabahRoundReveal>))
    .toBe('<p>DRAFTING</p>');
});
