import React from 'react';
import { ShabahGhost } from '../../../../components/mascot/ShabahGhost';
import { BrokerItem } from '../types';
import { formatPriceArabic, toArabicDigits } from '../brokerUtils';
import { sound } from '../../../../lib/audio';
import { Crown, Sparkles, ArrowRight, RotateCcw, Quote } from 'lucide-react';

interface BrokerWinnerViewProps {
  item: BrokerItem;
  winnerName: string;
  winningBid: number;
  winningQuote?: string;
  onNextRound: () => void;
  onReturnToLobby: () => void;
}

export const BrokerWinnerView: React.FC<BrokerWinnerViewProps> = ({
  item,
  winnerName,
  winningBid,
  winningQuote,
  onNextRound,
  onReturnToLobby,
}) => {
  React.useEffect(() => {
    sound.playVictory();
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col items-center justify-center p-4 sm:p-8 select-none relative overflow-hidden"
    >
      {/* Background glow celebration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(74,222,128,0.15),transparent_70%)] pointer-events-none" />

      {/* Mascot with Crown */}
      <div className="relative mb-6">
        <div className="w-32 h-32 sm:w-40 sm:h-40">
          <ShabahGhost mood="happy" className="w-full h-full" />
        </div>
        <div className="absolute -top-4 -right-2 p-2.5 rounded-full bg-amber-400 text-[#0A0A0A] shadow-lg animate-bounce">
          <Crown className="w-7 h-7" />
        </div>
      </div>

      {/* Main Winner Card */}
      <div className="w-full max-w-xl shabah-border-wrap relative z-10 mb-8">
        <div className="shabah-border-inner">
          <div className="shabah-surface p-6 sm:p-8 text-center flex flex-col items-center">
            {/* Header Badge */}
            <div className="px-4 py-1.5 rounded-full bg-amber-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 mb-4 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>👑 صيدة الجولة 👑</span>
            </div>

            {/* Winner Name */}
            <h1 className="text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 tracking-tight">
              {winnerName}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-neutral-500 mb-6">
              باع السلعة للشريطي بأعلى سومة في الحراج!
            </p>

            {/* Item & Winning Bid Box */}
            <div className="w-full p-4 rounded-2xl bg-neutral-100 border-2 border-neutral-300 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-right">
                <span className="text-xs font-bold text-neutral-500 block">
                  السلعة: {item.name}
                </span>
                <span className="text-sm font-black text-neutral-800">
                  العيب: {item.fatalFlaw}
                </span>
              </div>

              <div className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-right">
                <span className="text-[11px] font-bold block opacity-80">
                  السومة الحاسمة:
                </span>
                <span className="text-xl sm:text-2xl font-black">
                  {formatPriceArabic(winningBid)}
                </span>
              </div>
            </div>

            {/* Winning Quote if available */}
            {winningQuote && (
              <div className="w-full p-4 rounded-xl bg-white border-2 border-neutral-200 mb-6 text-right relative">
                <Quote className="w-5 h-5 text-neutral-300 absolute top-3 left-3" />
                <span className="text-xs font-black text-neutral-500 block mb-1">
                  أقوى عذر أقنع الشريطي:
                </span>
                <p className="text-sm sm:text-base font-bold text-[#0A0A0A] italic">
                  "{winningQuote}"
                </p>
              </div>
            )}

            {/* Points Award Badge */}
            <div className="px-5 py-2 rounded-xl bg-purple-100 text-purple-800 font-black text-sm border border-purple-200">
              حصل على +{toArabicDigits(5)} نقاط في رصيد الفوز العام! 🏆
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onNextRound();
          }}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-[3px_3px_0px_#065F46] border-2 border-emerald-700 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span>جولة تالية (سلعة جديدة)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onReturnToLobby();
          }}
          className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-black text-[#0A0A0A] bg-white hover:bg-neutral-100 shadow-[3px_3px_0px_#0A0A0A] border-2 border-[#0A0A0A] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة للوبي</span>
        </button>
      </div>
    </div>
  );
};
