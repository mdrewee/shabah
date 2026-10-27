import React, { useEffect } from 'react';
import { ShabahGhost } from '../../../../components/mascot/ShabahGhost';
import { BrokerItem, ContestantBidState } from '../types';
import { formatPriceArabic, toArabicDigits } from '../brokerUtils';
import { sound } from '../../../../lib/audio';
import { Crown, Sparkles, Quote, CheckCircle2, RotateCcw, ArrowRight, Trophy, Users } from 'lucide-react';

interface BrokerRoundWinnerProps {
  item: BrokerItem;
  roundNumber: number;
  totalRounds?: number;
  winnerName: string;
  winningBid: number;
  winningQuote?: string;
  contestants?: ContestantBidState[];
  currentUserId?: string;
  isHost?: boolean;
  onPlayerReady?: () => void;
  onNextRound: () => void;
  onReturnToLobby: () => void;
}

export const BrokerRoundWinner: React.FC<BrokerRoundWinnerProps> = ({
  item,
  roundNumber,
  totalRounds = 5,
  winnerName,
  winningBid,
  winningQuote,
  contestants = [],
  currentUserId,
  isHost = false,
  onPlayerReady,
  onNextRound,
  onReturnToLobby,
}) => {
  useEffect(() => {
    sound.playVictory();
  }, []);

  const isLastRound = roundNumber >= totalRounds;
  const isMeReady = currentUserId
    ? contestants.find((c) => c.playerId === currentUserId)?.isReadyForNextRound
    : false;

  const readyCount = contestants.filter((c) => c.isReadyForNextRound).length;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col items-center justify-between p-4 sm:p-8 select-none relative overflow-y-auto"
    >
      {/* Background glow celebration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.12),transparent_70%)] pointer-events-none" />

      {/* Header Info */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10 pt-2">
        <span className="px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-black">
          الجولة {toArabicDigits(roundNumber)} من {toArabicDigits(totalRounds)}
        </span>
        <span className="text-xs font-bold text-neutral-400">
          إعلان الفائز بالجولة
        </span>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl flex flex-col items-center my-auto z-10 py-6">
        {/* Mascot with Crown SVG */}
        <div className="relative mb-5">
          <div className="w-28 h-28 sm:w-36 sm:h-36">
            <ShabahGhost mood="happy" className="w-full h-full" />
          </div>
          <div className="absolute -top-3 -right-2 p-2 rounded-full bg-amber-400 text-[#0A0A0A] shadow-lg animate-bounce">
            <Crown className="w-6 h-6" />
          </div>
        </div>

        {/* Winner Announcement Card */}
        <div className="w-full shabah-border-wrap mb-6">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-6 sm:p-8 text-center flex flex-col items-center">
              {/* Badge */}
              <div className="px-4 py-1.5 rounded-full bg-amber-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 mb-3 shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>صيدة الجولة</span>
              </div>

              {/* Winner Name */}
              <h1 className="text-3xl sm:text-4xl font-black text-[#0A0A0A] mb-1 tracking-tight">
                {winnerName}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-neutral-500 mb-5">
                أقنع الشريطي وباع السلعة بأعلى سومة!
              </p>

              {/* Item & Winning Bid Box */}
              <div className="w-full p-4 rounded-2xl bg-neutral-100 border-2 border-neutral-300 mb-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-neutral-500 block">
                    السلعة المباعة:
                  </span>
                  <span className="text-sm font-black text-neutral-800">
                    {item.name}
                  </span>
                </div>

                <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-right shrink-0">
                  <span className="text-[11px] font-bold block opacity-80">
                    السومة الفائزة:
                  </span>
                  <span className="text-xl sm:text-2xl font-black">
                    {formatPriceArabic(winningBid)}
                  </span>
                </div>
              </div>

              {/* Winning Pitch Card (Quoting the exact text) */}
              <div className="w-full p-4 rounded-xl bg-white border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] text-right relative">
                <Quote className="w-5 h-5 text-neutral-300 absolute top-3 left-3" />
                <span className="text-xs font-black text-neutral-500 block mb-1">
                  الحجة الفائزة التي أقنعت الشريطي:
                </span>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A] italic font-sans leading-relaxed">
                  "{winningQuote || 'أقنع الشريطي بالذكاء والسرعة وفاز بالسومة!'}"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Checklist if contestants present */}
        {contestants.length > 0 && !isLastRound && (
          <div className="w-full p-4 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-white">
                <Users className="w-4 h-4 text-neutral-400" />
                <span>جاهزية المتسابقين للجولة التالية:</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {toArabicDigits(readyCount)} / {toArabicDigits(contestants.length)} جاهز
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {contestants.map((c) => (
                <div
                  key={c.playerId}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    c.isReadyForNextRound
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      c.isReadyForNextRound ? 'text-emerald-400' : 'text-neutral-500'
                    }`}
                  />
                  <span>{c.playerName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <footer className="w-full max-w-xl flex flex-col gap-3 z-10 pb-4">
        {/* Contestant "Ready" Button (Mobile) */}
        {!isHost && onPlayerReady && !isLastRound && (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onPlayerReady();
            }}
            className={`w-full py-4 rounded-xl font-black text-sm transition-all cursor-pointer border-2 flex items-center justify-center gap-2 shadow-[2px_2px_0px_#0A0A0A] active:scale-95 ${
              isMeReady
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white text-[#0A0A0A] hover:bg-neutral-100 border-[#0A0A0A]'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isMeReady ? 'أنت جاهز للجولة التالية!' : 'أنا جاهز للجولة التالية'}</span>
          </button>
        )}

        {/* TV Host Controls or Override */}
        {isHost && (
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onNextRound();
              }}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-[3px_3px_0px_#065F46] border-2 border-emerald-700 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {isLastRound ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>عرض منصة التتويج الكبرى</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  <span>بدء الجولة التالية ({toArabicDigits(roundNumber + 1)} من {toArabicDigits(totalRounds)})</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onReturnToLobby();
              }}
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-black text-[#0A0A0A] bg-white hover:bg-neutral-100 shadow-[3px_3px_0px_#0A0A0A] border-2 border-[#0A0A0A] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <ArrowRight className="w-5 h-5" />
              <span>العودة للوبي</span>
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};
