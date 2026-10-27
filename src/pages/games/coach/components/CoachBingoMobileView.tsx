import React, { useState, useEffect } from 'react';
import { BingoCard, BingoRoulettePlayer } from '../types';
import { checkBingoWin, doesPlayerMatchBingoCell } from '../coachSync';
import { SILHOUETTE_SVG } from '../footballDataService';
import { sound } from '../../../../lib/audio';
import { Check, AlertCircle, FastForward, Trophy, CheckCircle2 } from 'lucide-react';

interface CoachBingoMobileViewProps {
  card: BingoCard;
  currentRoulettePlayer: BingoRoulettePlayer | null;
  onToggleCell: (cellIndex: number, playerPhoto?: string, playerName?: string) => void;
  onSkipPlayer?: () => void;
  onClaimBingo: () => void;
  winnerName?: string | null;
  isReadyForNextRound?: boolean;
  onReadyForNextRound?: () => void;
}

export const CoachBingoMobileView: React.FC<CoachBingoMobileViewProps> = ({
  card,
  currentRoulettePlayer,
  onToggleCell,
  onSkipPlayer,
  onClaimBingo,
  winnerName,
  isReadyForNextRound = false,
  onReadyForNextRound,
}) => {
  const [imgError, setImgError] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
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
        msg: `أحسنت! (${p.name}) ينطبق على [${cell.title}]!`,
      });
      onToggleCell(index, p.photoUrl || SILHOUETTE_SVG, p.name);
    } else {
      sound.playTick();
      setWrongCellIndex(index);
      setTurnFeedback({
        type: 'error',
        msg: `إجابة خاطئة! (${p.name}) لا ينطبق على [${cell.title}] (حرقت فرصتك لهذا اللاعب)`,
      });
      window.setTimeout(() => setWrongCellIndex(null), 1500);
    }
  };

  const handleSkip = () => {
    if (!p || hasAlreadyPickedThisTurn) return;
    sound.playClick();
    setAttemptedPlayerId(p.id);
    setTurnFeedback({ type: 'warn', msg: 'تم تخطي هذا اللاعب، بانتظار اللاعب التالي...' });
    if (onSkipPlayer) onSkipPlayer();
  };

  if (winnerName) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-10 px-3 text-center select-none">
        <div className="shabah-border-wrap w-full mb-4">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <Trophy className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-black text-[#0A0A0A]">
                انتهى تحدي البينقو!
              </h3>
              <p className="text-sm font-bold text-neutral-600">
                الفائز: <span className="font-black text-[#0A0A0A]">{winnerName}</span>
              </p>
            </div>
          </div>
        </div>

        {onReadyForNextRound && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReadyForNextRound();
            }}
            className={`w-full py-4 rounded-2xl font-black text-sm border-2 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-[2px_2px_0px_#0A0A0A] ${
              isReadyForNextRound
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white text-[#0A0A0A] border-[#0A0A0A] hover:bg-neutral-100'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isReadyForNextRound ? 'أنت جاهز للجولة التالية!' : 'أنا جاهز للجولة التالية'}</span>
          </button>
        )}
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

            {/* Skip Button */}
            {!hasAlreadyPickedThisTurn && p && (
              <button
                type="button"
                onClick={handleSkip}
                className="px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-black border border-neutral-300 flex items-center gap-1 shrink-0 active:scale-95"
                title="تخطي هذا اللاعب"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>تخطي</span>
              </button>
            )}
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

      {/* 2. The 4x4 Bingo Grid (16 cells with Mandatory Real Images & Perfect Contrast) */}
      <div className="w-full grid grid-cols-4 gap-2">
        {card.cells.map((cell, index) => {
          const isWinningCell = winCheck.matchedVector?.includes(index);
          const isWrongCell = wrongCellIndex === index;

          if (cell.isMarked) {
            // Locked / Correct Cell: Player's photo as full background with bright emerald border
            const bgPhoto = cell.markedPlayerPhoto || p?.photoUrl || SILHOUETTE_SVG;

            return (
              <div
                key={cell.id}
                className={`aspect-square rounded-2xl border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] flex flex-col justify-between p-1.5 relative overflow-hidden select-none bg-neutral-900 ${
                  isWinningCell ? 'ring-2 ring-emerald-300 animate-pulse' : ''
                }`}
              >
                {/* Full player image */}
                <img
                  src={bgPhoto}
                  alt={cell.title}
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-85"
                />

                {/* Slight gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Top Corner Check SVG in Circle */}
                <div className="relative z-10 self-start w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
                </div>

                {/* Cell Title at bottom */}
                <span className="relative z-10 text-[10px] font-black text-white text-center leading-tight truncate px-1 py-0.5 rounded bg-black/70 backdrop-blur-sm">
                  {cell.title}
                </span>
              </div>
            );
          }

          // Unmarked Cell: Real image background (90% visible), soft gradient overlay, bold white title with sharp drop shadow
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellClick(index)}
              className={`aspect-square rounded-2xl border-2 border-white/90 shadow-[0_0_10px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center text-center transition-all cursor-pointer active:scale-95 select-none relative overflow-hidden p-1 ${
                isWrongCell ? 'border-red-500 ring-2 ring-red-500 animate-shake' : ''
              } ${
                hasAlreadyPickedThisTurn
                  ? 'opacity-85 cursor-not-allowed'
                  : 'hover:border-white'
              }`}
            >
              {/* Left-Foot Vector SVG for "أشول" */}
              {(cell.title.includes('أشول') || cell.targetValue === 'left_foot') ? (
                <div className="flex flex-col items-center justify-center p-1 z-10">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-emerald-400 drop-shadow-md">
                    <path d="M4 17l4-1 6 3 6-2v-3l-7-3-3 1-6 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="19" cy="11" r="2.5" fill="#4ADE80" />
                  </svg>
                </div>
              ) : cell.imageUrl && !failedImages[index] ? (
                <img
                  src={cell.imageUrl}
                  alt={cell.title}
                  onError={() => {
                    setFailedImages((prev) => ({ ...prev, [index]: true }));
                  }}
                  className="absolute inset-0 w-full h-full object-contain p-2 opacity-90 bg-[#0A0A0A]"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-2 text-center bg-zinc-950 border border-zinc-800">
                  <span className="text-[11px] font-black text-white leading-tight">
                    {cell.title}
                  </span>
                </div>
              )}

              {/* Gradient Overlay for high visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

              {/* Centered White Bold Title with Sharp Drop Shadow */}
              <span className="relative z-10 font-black text-[11px] sm:text-xs text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-1">
                {cell.title}
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
          <Trophy className="w-6 h-6 fill-white text-white" />
          <span>بينقو! (اضغط لإعلان الفوز)</span>
        </button>
      ) : (
        <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-neutral-400 text-xs font-bold">
          طابق ٤ خانات في صف، عمود، قطر، أو الزوايا الأربع لتفعيل زر [بينقو!]
        </div>
      )}
    </div>
  );
};
