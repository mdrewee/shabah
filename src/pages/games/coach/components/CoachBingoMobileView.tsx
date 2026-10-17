import React, { useState, useEffect } from 'react';
import { BingoCard, BingoRoulettePlayer } from '../types';
import { checkBingoWin, doesPlayerMatchBingoCell } from '../coachSync';
import { SILHOUETTE_SVG } from '../footballDataService';
import { sound } from '../../../../lib/audio';
import { Check, Flame, AlertCircle } from 'lucide-react';

interface CoachBingoMobileViewProps {
  card: BingoCard;
  currentRoulettePlayer: BingoRoulettePlayer | null;
  onToggleCell: (cellIndex: number) => void;
  onClaimBingo: () => void;
  winnerName?: string | null;
}

export const CoachBingoMobileView: React.FC<CoachBingoMobileViewProps> = ({
  card,
  currentRoulettePlayer,
  onToggleCell,
  onClaimBingo,
  winnerName,
}) => {
  const [imgError, setImgError] = useState(false);
  const [attemptedPlayerId, setAttemptedPlayerId] = useState<string | null>(null);
  const [turnFeedback, setTurnFeedback] = useState<{
    type: 'success' | 'error' | 'warn';
    msg: string;
  } | null>(null);
  const [wrongCellIndex, setWrongCellIndex] = useState<number | null>(null);

  const winCheck = checkBingoWin(card.cells);
  const p = currentRoulettePlayer;

  // Clear feedback and reset error cell when a new roulette player is drawn
  useEffect(() => {
    setImgError(false);
    setWrongCellIndex(null);
    if (p?.id && p.id !== attemptedPlayerId) {
      setTurnFeedback(null);
    }
  }, [p?.id]);

  const hasAlreadyPickedThisTurn = Boolean(p?.id && attemptedPlayerId === p.id);

  const handleCellClick = (index: number) => {
    if (!p) {
      sound.playTick();
      setTurnFeedback({ type: 'warn', msg: 'انتظر بدء دوران الروليت وظهور اللاعب أولاً!' });
      return;
    }

    const cell = card.cells[index];
    if (cell.isMarked) {
      sound.playTick();
      setTurnFeedback({ type: 'warn', msg: 'هذه الخانة محددة مسبقاً!' });
      return;
    }

    // Constraint: Only 1 pick allowed per spun player
    if (hasAlreadyPickedThisTurn) {
      sound.playTick();
      setTurnFeedback({
        type: 'warn',
        msg: 'لقد اخترت خانتك بالفعل لهذا اللاعب! انتظر ظهور اللاعب التالي.',
      });
      return;
    }

    // Lock pick for this player turn immediately
    setAttemptedPlayerId(p.id);

    // Validate if player matches cell condition
    const isMatch = doesPlayerMatchBingoCell(p, cell);

    if (isMatch) {
      sound.playSuccess();
      setWrongCellIndex(null);
      setTurnFeedback({
        type: 'success',
        msg: `أحسنت! (${p.name}) ينطبق على [${cell.title}] ✅`,
      });
      onToggleCell(index);
    } else {
      sound.playTick();
      setWrongCellIndex(index);
      setTurnFeedback({
        type: 'error',
        msg: `إجابة خاطئة! (${p.name}) لا ينطبق على [${cell.title}] ❌ (حرقت فرصتك لهذا اللاعب)`,
      });
      window.setTimeout(() => setWrongCellIndex(null), 1500);
    }
  };

  if (winnerName) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-12 px-3 text-center select-none">
        <div className="shabah-border-wrap w-full">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-8 flex flex-col items-center gap-3">
              <span className="text-3xl">🎉</span>
              <h3 className="text-2xl font-black text-[#0A0A0A]">
                انتهى تحدي البينقو!
              </h3>
              <p className="text-sm font-bold text-neutral-600">
                الفائز: <span className="font-black text-[#0A0A0A]">{winnerName}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-3 py-2 px-3 select-none">
      {/* 1. Header with Current Roulette Player */}
      <div className="w-full shabah-border-wrap">
        <div className="shabah-border-inner">
          <div className="shabah-surface p-3 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={!imgError && p?.photoUrl ? p.photoUrl : SILHOUETTE_SVG}
                alt={p?.name || 'لاعب'}
                onError={() => setImgError(true)}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-neutral-500">لاعب الروليت الحالي:</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    hasAlreadyPickedThisTurn
                      ? 'bg-neutral-200 text-neutral-600'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {hasAlreadyPickedThisTurn ? 'تم استهلاك الفرصة' : 'فرصة واحدة للاختيار'}
                </span>
              </div>
              <span className="font-black text-sm text-[#0A0A0A] truncate mt-0.5">
                {p?.name || 'جاري سحب اللاعب...'}
              </span>
              <span className="text-[10px] text-neutral-600 font-bold truncate">
                {p?.currentClub || ''} • {p?.nationality || ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Turn Feedback Alert */}
      {turnFeedback && (
        <div
          className={`w-full px-3 py-2 rounded-xl border text-xs font-black flex items-center gap-2 transition-all ${
            turnFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : turnFeedback.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{turnFeedback.msg}</span>
        </div>
      )}

      {/* 2. The 4x4 Bingo Grid (16 cells) */}
      <div className="w-full grid grid-cols-4 gap-2">
        {card.cells.map((cell, index) => {
          const isWinningCell = winCheck.matchedVector?.includes(index);
          const isWrongCell = wrongCellIndex === index;

          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellClick(index)}
              className={`aspect-square p-1.5 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 select-none relative ${
                isWrongCell
                  ? 'bg-red-500 text-white border-red-700 animate-shake'
                  : cell.isMarked
                  ? isWinningCell
                    ? 'bg-emerald-500 text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                    : 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]'
                  : hasAlreadyPickedThisTurn
                  ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed opacity-75'
                  : 'bg-white text-[#0A0A0A] border-neutral-300 hover:border-[#0A0A0A]'
              }`}
            >
              {cell.isMarked && (
                <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 text-[#0A0A0A] flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}

              <span className="font-black text-[11px] sm:text-xs leading-tight line-clamp-2">
                {cell.title}
              </span>

              <span
                className={`text-[8px] font-bold mt-0.5 line-clamp-1 ${
                  cell.isMarked ? 'text-neutral-300' : 'text-neutral-500'
                }`}
              >
                {cell.description}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Unlockable [بينقو!] Button */}
      {winCheck.isBingo ? (
        <button
          type="button"
          onClick={() => {
            sound.playSuccess();
            onClaimBingo();
          }}
          className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A] transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2 animate-bounce"
        >
          <Flame className="w-6 h-6 fill-white" />
          <span>بينقو! (اضغط لإعلان الفوز)</span>
        </button>
      ) : (
        <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-neutral-400 text-xs font-bold">
          طابق ٤ خانات في صف، عمود، قطر، أو الزوايا الأربع لتفعيل زر [بينقو!]
        </div>
      )}
    </div>
  );
};

