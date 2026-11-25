import {RoundCelebration} from '../../../../components/common/RoundCelebration';
import { BingoCellVisual } from './BingoCellVisual';
import React, { useState, useEffect } from 'react';
import { BingoCard, BingoRoulettePlayer } from '../types';
import { checkBingoWin, doesPlayerMatchBingoCell } from '../coachSync';
import { SILHOUETTE_SVG } from '../footballDataService';
import { sound } from '../../../../lib/audio';
import { toArabicNumber } from '../../../../utils/numberFormat';
import {
  Check,
  AlertCircle,
  FastForward,
  Trophy,
  CheckCircle2,
} from 'lucide-react';

interface CoachBingoMobileViewProps {
  card: BingoCard;
  currentRoulettePlayer: BingoRoulettePlayer | null;
  hasAttempted: boolean;
  turnKey: string;
  endsAt?: number;
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
  hasAttempted,
  turnKey,
  endsAt,
  onToggleCell,
  onSkipPlayer,
  onClaimBingo,
  winnerName,
  isReadyForNextRound = false,
  onReadyForNextRound,
}) => {
  const [attemptedPlayerId, setAttemptedPlayerId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil(((endsAt || Date.now()) - Date.now()) / 1000)));
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [endsAt]);
  const [turnFeedback, setTurnFeedback] = useState<{
    type: 'success' | 'error' | 'warn';
    msg: string;
  } | null>(null);
  const [wrongCellIndex, setWrongCellIndex] = useState<number | null>(null);

  const winCheck = checkBingoWin(card.cells);
  const p = currentRoulettePlayer;

  // Clear feedback and reset error cell when a new roulette player is drawn
  useEffect(() => {
    setWrongCellIndex(null);
    if (p?.id && p.id !== attemptedPlayerId) {
      setTurnFeedback(null);
    }
  }, [turnKey]);

  const hasAlreadyPickedThisTurn = hasAttempted || attemptedPlayerId === turnKey || seconds === 0;

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
    setAttemptedPlayerId(turnKey);

    // Validate if player matches cell condition
    const isMatch = doesPlayerMatchBingoCell(p, cell);

    if (isMatch) {
      sound.playSuccess();
      setWrongCellIndex(null);
      setTurnFeedback({
        type: 'success',
        msg: `أحسنت! (${p.name}) ينطبق على [${cell.title}]!`,
      });
    } else {
      sound.playTick();
      setWrongCellIndex(index);
      setTurnFeedback({
        type: 'error',
        msg: `إجابة خاطئة! (${p.name}) لا ينطبق على [${cell.title}] (حرقت فرصتك لهذا اللاعب)`,
      });
      window.setTimeout(() => setWrongCellIndex(null), 1500);
    }
    onToggleCell(index, p.photoUrl || SILHOUETTE_SVG, p.name);
  };

  const handleSkip = () => {
    if (!p || hasAlreadyPickedThisTurn) return;
    sound.playClick();
    setAttemptedPlayerId(turnKey);
    setTurnFeedback({ type: 'warn', msg: 'تم تخطي هذا اللاعب، بانتظار اللاعب التالي...' });
    if (onSkipPlayer) onSkipPlayer();
  };

  if (winnerName) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center py-10 px-3 text-center select-none">
        <RoundCelebration award="عين الصقر" names={[winnerName]}/>
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
      <div className="flex items-center justify-between text-sm font-bold text-zinc-300">
        <span>وقت الاختيار</span>
        <span role="timer" className={seconds <= 3 ? 'text-red-300' : 'text-emerald-300'}>{toArabicNumber(seconds)} ثوانٍ</span>
      </div>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full bg-gradient-to-l from-emerald-400 to-violet-400 transition-all" style={{width: `${Math.min(100, seconds / 8 * 100)}%`}} /></div>
      {/* 1. Header with Current Roulette Player */}
      <div className="w-full shabah-border-wrap">
        <div className="shabah-border-inner">
          <div className="shabah-surface p-3 flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
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
              <span className="font-sans font-black text-2xl sm:text-3xl leading-tight text-[#0A0A0A] break-words mt-1">
                {p?.name || 'جاري سحب اللاعب...'}
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

      {/* 2. The 4x4 Bingo Grid (16 cells with Mandatory Contrast & Unbreakable Visuals) */}
      <div className="w-full grid grid-cols-4 gap-2">
        {card.cells.map((cell, index) => {
          const isWinningCell = winCheck.matchedVector?.includes(index);
          const isWrongCell = wrongCellIndex === index;

          if (cell.isMarked) {
            // Marked Cell: Display ONLY Player Name in bold & clear in the center (Zero star icon, zero club/flag)
            return (
              <div
                key={cell.id}
                className={`aspect-square rounded-2xl border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center p-2 relative overflow-hidden select-none bg-zinc-950 text-white ${
                  isWinningCell ? 'ring-2 ring-emerald-300 animate-pulse' : ''
                }`}
              >
                {/* Top Corner Check Icon */}
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-3 h-3 stroke-[3] text-white" />
                </div>

                {/* Marked Player Name ONLY (Bold & Clear in Center) */}
                <span className="font-sans font-black text-xs sm:text-sm text-emerald-300 text-center leading-tight break-words px-1">
                  {cell.markedPlayerName || 'لاعب مطابق'}
                </span>
              </div>
            );
          }

          // Unmarked Cell: Unbreakable Lucide icons & stable CDN images with sharp title
          return (
            <button
              key={cell.id}
              type="button"
              onClick={() => handleCellClick(index)}
              className={`aspect-square rounded-2xl border-2 border-white/90 shadow-[0_0_10px_rgba(255,255,255,0.15)] flex flex-col items-center justify-between text-center transition-all cursor-pointer active:scale-95 select-none relative overflow-hidden p-2 bg-[#0A0A0A] ${
                isWrongCell ? 'border-red-500 ring-2 ring-red-500 animate-shake' : ''
              } ${
                hasAlreadyPickedThisTurn
                  ? 'opacity-85 cursor-not-allowed'
                  : 'hover:border-white'
              }`}
            >
              <BingoCellVisual key={cell.id} cell={cell} />

              {/* Title with sharp contrast */}
              <span className="relative z-10 font-sans font-black text-[11px] sm:text-xs text-white leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-1">
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
