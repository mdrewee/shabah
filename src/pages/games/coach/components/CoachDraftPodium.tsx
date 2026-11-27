import React from 'react';
import { Trophy } from 'lucide-react';
import { formatPercent, toArabicNumber } from '../../../../utils/numberFormat';
import type { CoachVerdict } from '../types';

export function CoachDraftPodium({ verdict, playerId }: { verdict: CoachVerdict; playerId?: string }) {
  return <section dir="rtl" aria-label="الترتيب النهائي للتشكيلات"
    className="mx-auto my-4 w-full max-w-[720px] rounded-2xl border border-emerald-400/25 bg-zinc-950 px-4 py-5 text-white">
    <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
      <Trophy className="h-5 w-5 text-amber-300" aria-hidden="true" />
      {verdict.verificationMode === 'ai' ? 'ترتيب التشكيلات النهائي' : 'ترتيب التشكيلات المبدئي'}
    </h2>
    {verdict.evaluations.length === 0 ? <p className="text-zinc-300">ما فيه تشكيلات مسجلة.</p> :
      <ol className="space-y-2">
        {verdict.evaluations.map((entry, index) =>
          <li key={entry.playerId} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-3">
            <span className="min-w-0 break-words">
              <span className="me-2 text-emerald-300">{toArabicNumber(entry.rank ?? index + 1)}.</span>
              <bdi>{entry.playerName}</bdi>{entry.playerId === playerId && ' · أنت'}
            </span>
            <span className="shrink-0 font-bold">{formatPercent(entry.totalPercentage)}</span>
          </li>
        )}
      </ol>}
  </section>;
}
