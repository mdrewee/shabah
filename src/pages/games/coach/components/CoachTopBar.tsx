import React from 'react';
import { ShabahGhost, ShabahMood } from '../../../../components/mascot/ShabahGhost';
import { formatSecondsToTime, toArabicNumber } from '../../../../utils/numberFormat';
import { CoachGameMode } from '../types';

interface CoachTopBarProps {
  roomCode: string;
  mode: CoachGameMode;
  roundNumber?: number;
  timerSeconds?: number;
  conditionTitle?: string;
  mood?: ShabahMood;
  remark?: string;
  isHost?: boolean;
  onSkipTimer?: () => void;
  onReturnToLobby?: () => void;
  onExit: () => void;
}

export const CoachTopBar: React.FC<CoachTopBarProps> = ({
  roomCode,
  mode,
  roundNumber = 1,
  timerSeconds,
  conditionTitle,
  mood = 'judging',
  remark = 'ركّز بالاختيار ولا تعك في المراكز!',
  isHost = false,
  onSkipTimer,
  onReturnToLobby,
  onExit,
}) => {
  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col items-center pt-2 pb-4 px-3 select-none">
      {/* Top action row */}
      <div className="w-full flex items-center justify-between mb-2">
        {/* Badges: Game & Mode */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-300">
            الشبح المدرب
          </span>

          <span className="px-2.5 py-1 rounded-full bg-white text-[#0A0A0A] text-xs font-black border border-[#0A0A0A]">
            {mode === 'draft' ? `الجولة ${toArabicNumber(roundNumber)} من ٥` : 'بينقو ٤×٤'}
          </span>

          <span className="px-2 py-0.5 rounded-lg bg-neutral-900 text-neutral-400 font-mono text-xs font-black">
            {roomCode}
          </span>
        </div>

        {/* Action Controls: [تخطي المؤقت] + [العودة للوبي] + Contextual Exit */}
        <div className="flex items-center gap-2">
          {isHost && timerSeconds !== undefined && timerSeconds > 0 && onSkipTimer && (
            <button
              type="button"
              onClick={onSkipTimer}
              className="px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-black border border-neutral-700 cursor-pointer transition-transform active:scale-95"
            >
              تخطي المؤقت
            </button>
          )}

          {isHost && onReturnToLobby && (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-black border border-neutral-700 cursor-pointer transition-transform active:scale-95"
            >
              العودة للوبي
            </button>
          )}

          <div className="shabah-pill-wrap">
            <div className="shabah-pill-inner">
              <button
                type="button"
                onClick={onExit}
                className="shabah-pill-surface px-4 py-1 text-xs sm:text-sm font-black text-[#0A0A0A] hover:bg-neutral-100 transition-transform active:scale-95 cursor-pointer block"
              >
                {isHost ? 'إنهاء الغرفة' : 'خروج'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mascot & Central Commentary */}
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <ShabahGhost mood={mood} className="w-full h-full" />
        </div>

        <div className="mt-1 shabah-pill-wrap max-w-lg">
          <div className="shabah-pill-inner">
            <div className="shabah-pill-surface px-5 py-1.5 text-xs sm:text-sm font-black text-[#0A0A0A] text-center">
              {remark}
            </div>
          </div>
        </div>
      </div>

      {/* Active Condition & Countdown Banner */}
      {conditionTitle && (
        <div className="mt-3 w-full max-w-xl flex items-center justify-between gap-3 px-4 py-2 bg-neutral-900 border-2 border-neutral-800 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs font-bold">شرط الجولة:</span>
            <span className="text-white text-sm sm:text-base font-black">{conditionTitle}</span>
          </div>

          {timerSeconds !== undefined && (
            <div
              className={`px-3 py-1 rounded-xl font-mono text-sm font-black ${
                timerSeconds <= 10
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : 'bg-white/10 text-white'
              }`}
            >
              {formatSecondsToTime(timerSeconds)}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
