import React from 'react';
import { RankedContestant } from '../arabicSync';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import { Trophy, Crown, Medal, PlusCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface ArabicFinalPodiumProps {
  rankedContestants: RankedContestant[];
  isTV?: boolean;
  onExtendRounds?: () => void;
  onReturnToLobby: () => void;
}

export const ArabicFinalPodium: React.FC<ArabicFinalPodiumProps> = ({
  rankedContestants,
  isTV = false,
  onExtendRounds,
  onReturnToLobby,
}) => {
  const winner = rankedContestants[0];
  const second = rankedContestants[1];
  const third = rankedContestants[2];

  return (
    <div
      dir="rtl"
      className="flex-1 w-full h-full min-h-screen bg-black text-white p-6 flex flex-col items-center justify-between select-none"
    >
      {/* Top Header */}
      <div className="text-center my-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans font-bold text-sm mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>منصة التتويج الكبرى</span>
        </div>
        <h1
          className={`font-sans font-black text-white tracking-tight ${
            isTV ? 'text-5xl' : 'text-3xl'
          }`}
        >
          أفصح شبح في الحروف!
        </h1>
        <p className="font-sans text-sm text-zinc-400 mt-2">
          المجموع التراكمي لكافة جولات المباراة وسرعة البديهة
        </p>
      </div>

      {/* 3D-Style Brutalist Podium */}
      <div className="w-full max-w-2xl flex items-end justify-center gap-3 my-6">
        {/* 2nd Place */}
        {second && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-sans font-black text-zinc-300 mb-2">
              <Medal className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="font-sans font-extrabold text-sm text-zinc-300 text-center truncate max-w-[110px]">
              {second.name}
            </div>
            <div className="text-xs font-sans font-bold text-zinc-500 mb-2">
              {formatPoints(second.score)}
            </div>
            <div
              className={`w-full rounded-t-2xl bg-zinc-900 border-t-4 border-zinc-600 flex items-center justify-center font-sans font-black text-zinc-400 ${
                isTV ? 'h-36 text-2xl' : 'h-24 text-xl'
              }`}
            >
              ٢
            </div>
          </div>
        )}

        {/* 1st Place (Winner) */}
        {winner && (
          <div className="flex-1 flex flex-col items-center">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-500 shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-2">
              <div className="w-16 h-16 rounded-[14px] bg-black flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="font-sans font-black text-base text-white text-center truncate max-w-[130px]">
              {winner.name}
            </div>
            <div className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-sans font-black my-1">
              لقب: أفصح شبح
            </div>
            <div className="text-sm font-sans font-black text-emerald-400 mb-2">
              {formatPoints(winner.score)}
            </div>
            <div
              className={`w-full rounded-t-2xl bg-zinc-950 border-t-4 border-amber-400 flex items-center justify-center font-sans font-black text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] ${
                isTV ? 'h-48 text-4xl' : 'h-32 text-3xl'
              }`}
            >
              ١
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {third && (
          <div className="flex-1 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-sans font-black text-amber-600 mb-2">
              <Medal className="w-6 h-6 text-amber-700" />
            </div>
            <div className="font-sans font-extrabold text-sm text-zinc-300 text-center truncate max-w-[110px]">
              {third.name}
            </div>
            <div className="text-xs font-sans font-bold text-zinc-500 mb-2">
              {formatPoints(third.score)}
            </div>
            <div
              className={`w-full rounded-t-2xl bg-zinc-900/80 border-t-4 border-amber-700 flex items-center justify-center font-sans font-black text-amber-700 ${
                isTV ? 'h-28 text-xl' : 'h-16 text-lg'
              }`}
            >
              ٣
            </div>
          </div>
        )}
      </div>

      {/* Remaining contestants table if > 3 */}
      {rankedContestants.length > 3 && (
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-3 my-2 space-y-2">
          {rankedContestants.slice(3).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between text-sm px-3 py-1.5 rounded-xl bg-black border border-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-500 text-xs">
                  {toArabicNumber(c.rank)}.
                </span>
                <span className="font-sans font-bold text-zinc-300">{c.name}</span>
              </div>
              <span className="font-sans font-black text-zinc-400">
                {formatPoints(c.score)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-md flex flex-col gap-3 my-4">
        {isTV && onExtendRounds && (
          <button
            onClick={onExtendRounds}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-98 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            <span>تمديد ٥ جولات إضافية</span>
          </button>
        )}

        <button
          onClick={onReturnToLobby}
          className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 font-sans font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة للوبي</span>
        </button>
      </div>
    </div>
  );
};
