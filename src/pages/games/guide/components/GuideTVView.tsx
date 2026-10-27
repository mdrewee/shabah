import React from 'react';
import { GuideLandmark } from '../../../../data/guideLandmarks';
import { ContestantGuess } from '../types';
import { GuideWorldMap } from './GuideWorldMap';
import { toArabicNumber } from '../../../../utils/numberFormat';
import {
  Compass,
  Clock,
  Check,
  Lock,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface GuideTVViewProps {
  roundNumber: number;
  totalRounds: number;
  landmark: GuideLandmark;
  timerSeconds: number; // 60s -> 0s
  activeClueIndex: number; // 0..4
  connectedContestants: Array<{ id: string; name: string }>;
  guesses: Record<string, ContestantGuess>;
  onForceAdvance?: () => void;
  onReturnToLobby?: () => void;
  onEndGame?: () => void;
}

export const GuideTVView: React.FC<GuideTVViewProps> = ({
  roundNumber,
  totalRounds,
  landmark,
  timerSeconds,
  activeClueIndex,
  connectedContestants,
  guesses,
  onForceAdvance,
  onReturnToLobby,
  onEndGame,
}) => {
  const clues = landmark.clues;
  const pinnedCount = Object.keys(guesses).length;
  const totalCount = Math.max(1, connectedContestants.length);

  return (
    <div
      dir="rtl"
      className="w-full h-screen max-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 select-none overflow-hidden"
    >
      {/* 1. Top Header Bar */}
      <header className="flex items-center justify-between pb-3.5 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              <Compass className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 font-sans font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>المعلم رقم {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}</span>
              </span>
              <span className="text-xs font-sans text-zinc-400">
                الشبح المرشد • تحدي تحديد الموقع والتلميحات
              </span>
            </div>
            <h1 className="text-2xl font-sans font-black text-white tracking-tight">
              خمّنوا موقع المعلم السري بالدبوس على الخريطة!
            </h1>
          </div>
        </div>

        {/* Action Controls & Countdown Clock */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 text-amber-400 font-sans font-extrabold text-2xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Clock className="w-6 h-6 animate-pulse" />
            <span>{toArabicNumber(timerSeconds)} ثانية</span>
          </div>

          {onReturnToLobby && (
            <button
              type="button"
              onClick={onReturnToLobby}
              className="px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>
          )}

          {onEndGame && (
            <button
              type="button"
              onClick={onEndGame}
              className="px-3.5 py-2.5 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Arena: 58% Clues & Questions Card + 42% Map & Contestants */}
      <div className="flex-1 my-3 flex items-stretch gap-6 overflow-hidden">
        {/* RIGHT AREA (58% width): Controlled Clues Card with Max Height */}
        <div className="w-[58%] h-full flex flex-col justify-between py-4 px-5 bg-zinc-950 border-2 border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
          {/* Header of Clues Card */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 flex-shrink-0">
            <span className="font-sans font-bold text-sm text-zinc-400 tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>تلميحات الموقع السري (تُكشف تدريجياً):</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-950 border border-purple-500 text-purple-300 font-sans font-extrabold text-xs">
              تلميح جديد كل ١٢ ثانية
            </span>
          </div>

          {/* The 5 Progressive Clues Stack - Responsive Grid Constrained to 75vh */}
          <div className="flex-1 flex flex-col justify-between gap-2.5 max-h-[75vh] my-2">
            {clues.map((clue, idx) => {
              const isRevealed = idx <= activeClueIndex;
              const isLatest = idx === activeClueIndex;

              return (
                <div
                  key={idx}
                  className={`flex-1 min-h-[58px] max-h-[78px] px-5 rounded-xl border transition-all duration-500 flex items-center justify-between gap-4 ${
                    isRevealed
                      ? isLatest
                        ? 'bg-zinc-900 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                        : 'bg-zinc-900/80 border-zinc-700 text-zinc-100'
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-600'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isRevealed ? (isLatest ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400') : 'bg-zinc-800'}`} />
                    <p className="font-sans text-lg lg:text-xl font-bold leading-snug truncate">
                      {isRevealed ? clue : 'تلميح مشفر لم يحن وقته...'}
                    </p>
                  </div>
                  <span className={`font-sans text-xs font-extrabold px-3 py-1 rounded-md shrink-0 ${
                    isRevealed ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50' : 'bg-zinc-900 text-zinc-600'
                  }`}>
                    تلميح {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom Fast Forward Control */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between flex-shrink-0">
            <span className="text-xs font-sans text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>المتسابقون يقرؤون التلميحات ويحركون دبابيسهم على هواتفهم...</span>
            </span>

            {onForceAdvance && (
              <button
                type="button"
                onClick={onForceAdvance}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-sans font-bold text-xs border border-zinc-700 transition-colors cursor-pointer"
              >
                <span>إغلاق التخمينات وكشف المعلم</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* LEFT AREA (42% width): Mini World Map Preview + Contestants Status Panel */}
        <div className="w-[42%] flex flex-col justify-between gap-4 overflow-hidden">
          {/* 1. Mini World Map (40% width preview) */}
          <div className="flex-1 rounded-3xl overflow-hidden border border-zinc-800 bg-black relative shadow-xl min-h-[280px]">
            <GuideWorldMap
              interactive={false}
              className="w-full h-full"
            />
          </div>

          {/* 2. Connected Contestants Pinning Status List */}
          <div className="h-44 bg-zinc-950 border border-zinc-800 rounded-3xl p-4 flex flex-col justify-between overflow-hidden shadow-xl flex-shrink-0">
            <div className="flex items-center justify-between text-xs font-sans pb-2 border-b border-zinc-800">
              <span className="text-zinc-300 font-black flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>حالة دبابيس الرحالة:</span>
              </span>
              <span className="text-emerald-400 font-black">
                {toArabicNumber(pinnedCount)} من {toArabicNumber(totalCount)} ثبتوا الموقع
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 py-1.5">
              {connectedContestants.map((player) => {
                const hasPinned = Boolean(
                  guesses[player.id] ||
                  Object.values(guesses).find(
                    (g) =>
                      g.contestantId === player.id ||
                      (g.contestantName && player.name && g.contestantName.trim().toLowerCase() === player.name.trim().toLowerCase())
                  )
                );

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/60 border border-zinc-800 text-xs font-sans"
                  >
                    <span className="font-bold text-zinc-200 truncate max-w-[140px]">
                      {player.name}
                    </span>
                    {hasPinned ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981] animate-pulse" />
                        <span>تم التثبيت!</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-xs animate-pulse">
                        يحدد موقعه...
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideTVView;
