import React, { useState } from 'react';
import { Footprints, Shield, Trophy, UserRound } from 'lucide-react';
import type { BingoCell } from '../types';

export function BingoCellVisual({ cell }: { cell: BingoCell }) {
  const [failed, setFailed] = useState(false);
  if (cell.type === 'position') return <span dir="ltr" className="my-auto grid h-12 min-w-12 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-2 font-mono text-xl font-black text-cyan-200">{cell.targetValue}</span>;
  if (cell.type === 'trait' && cell.targetValue === 'أسمر') return <UserRound aria-hidden="true" className="my-auto h-11 w-11 rounded-full border border-amber-700 bg-amber-950/60 p-1.5 text-amber-600" />;
  if (cell.type === 'trait') return <Footprints aria-hidden="true" className="my-auto h-10 w-10 text-emerald-300" />;
  // Older saved cards still contain the incorrectly named SVG files.
  const source = cell.imageUrl?.replace(/(clubs\/(?:man_city|barcelona|bayern|chelsea|real_madrid))\.png$/, '$1.svg');
  if (source && !failed) return <span className="my-auto grid h-12 w-12 place-items-center rounded-lg bg-white p-1">
    <img src={source} alt="" onError={() => setFailed(true)} className={`h-full w-full ${cell.type === 'manager' ? 'rounded-md object-cover' : 'object-contain'}`} />
  </span>;
  return cell.type === 'trophy'
    ? <Trophy aria-hidden="true" className="my-auto h-10 w-10 text-amber-300" />
    : <Shield aria-hidden="true" className="my-auto h-10 w-10 text-cyan-300" />;
}
