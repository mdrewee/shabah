import React, { useState, useEffect } from 'react';
import { BingoRoulettePlayer, BingoCard } from '../types';
import { SILHOUETTE_SVG } from '../footballDataService';
import { toArabicNumber } from '../../../../utils/numberFormat';
import { Trophy, Award, Users, RotateCcw, ArrowRight } from 'lucide-react';
import { sound } from '../../../../lib/audio';

interface ContestantItem {
  id: string;
  name: string;
}

interface CoachBingoTVViewProps {
  currentRoulettePlayer: BingoRoulettePlayer | null;
  contestants: ContestantItem[];
  bingoCards: Record<string, BingoCard>;
  winnerName?: string | null;
  onNextPlayer?: () => void;
  onNextRound?: () => void;
  onReturnToLobby?: () => void;
  secondsRemaining?: number;
}

export const CoachBingoTVView: React.FC<CoachBingoTVViewProps> = ({
  currentRoulettePlayer,
  contestants,
  bingoCards,
  winnerName,
  onNextPlayer,
  onNextRound,
  onReturnToLobby,
  secondsRemaining,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [currentRoulettePlayer?.id]);

  // If there is a winner, celebrate with Shabah Winner card
  if (winnerName) {
    return (
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12 px-4 select-none">
        <div className="w-full shabah-border-wrap animate-in zoom-in-95 duration-300">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-8 sm:p-12 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <Trophy className="w-10 h-10 text-white" />
              </div>

              <span className="px-4 py-1.5 rounded-full bg-[#0A0A0A] text-white text-xs sm:text-sm font-black">
                بينقو كروي ٤×٤ مكتمل!
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-[#0A0A0A]">
                الفائز: {winnerName}
              </h2>

              <p className="text-base sm:text-lg font-bold text-neutral-700 max-w-md">
                أكمل ٤ خلايا صحيحة في خط فوز معتمد وحسم التحدي الكروي ببراعة!
              </p>

              {/* Host Next Round / Lobby Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full max-w-md">
                {onNextRound && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onNextRound();
                    }}
                    className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm border-2 border-emerald-700 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>جولة بينقو جديدة</span>
                  </button>
                )}

                {onReturnToLobby && (
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onReturnToLobby();
                    }}
                    className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-black text-[#0A0A0A] bg-white hover:bg-neutral-100 shadow-sm border-2 border-[#0A0A0A] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>العودة للوبي</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const p = currentRoulettePlayer;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 py-4 px-4 select-none">
      {/* 1. Large Photo Roulette Card */}
      <div className="w-full max-w-xl shabah-border-wrap">
        <div className="shabah-border-inner">
          <div className="shabah-surface p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Top counter & timer */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#0A0A0A] text-white text-xs font-black">
                روليت اللاعبين المباشر
              </span>
              {secondsRemaining !== undefined && (
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-neutral-100 text-[#0A0A0A]">
                  اللاعب القادم: {toArabicNumber(secondsRemaining)} ث
                </span>
              )}
            </div>

            {/* Modern Football Star Card (High-Res Player Photo or Fallback Badge) */}
            {p?.photoUrl ? (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-zinc-950 border-2 border-zinc-800 p-2 my-3 shadow-xl flex items-center justify-center overflow-hidden relative">
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  className="w-full h-full object-contain drop-shadow-lg"
                />
                {p?.position && (
                  <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/90 text-white font-mono font-black text-[10px] shadow">
                    {p.position}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-zinc-950 border-2 border-zinc-800 flex flex-col items-center justify-center text-white my-3 shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-emerald-400 font-mono font-black text-sm mb-1 shadow-inner">
                  {p?.position || 'STAR'}
                </div>
                <span className="font-mono text-xs font-bold text-zinc-400">
                  {p?.nationality || 'لاعب دولي'}
                </span>
              </div>
            )}

            {/* Full Arabic Name */}
            <h3 className="font-sans font-black text-3xl sm:text-5xl text-[#0A0A0A] mb-1">
              {p?.name || 'جاري سحب اللاعب...'}
            </h3>

            {/* Club & Country Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
              {p?.position && (
                <span className="px-3 py-1 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs font-black">
                  {p.position}
                </span>
              )}
              {p?.currentClub && (
                <span className="px-3 py-1 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-black text-[#0A0A0A]">
                  النادي: {p.currentClub}
                </span>
              )}
              {p?.nationality && (
                <span className="px-3 py-1 rounded-xl bg-neutral-100 border border-neutral-300 text-xs font-black text-[#0A0A0A]">
                  المنتخب: {p.nationality}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contestants Live Grid Progress Tracker */}
      <div className="w-full max-w-4xl flex flex-col gap-2">
        <h4 className="text-xs font-black text-neutral-400 px-2 flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>تقدم المتسابقين في بطاقات البينقو:</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 w-full">
          {contestants.map((c) => {
            const card = bingoCards[c.id];
            const markedCount = card?.cells.filter((cell) => cell.isMarked).length || 0;

            return (
              <div
                key={c.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 flex flex-col items-center text-center gap-1.5"
              >
                <span className="text-white font-black text-xs truncate max-w-full">
                  {c.name}
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-white/10 text-emerald-400">
                  {toArabicNumber(markedCount)} / ١٦
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
