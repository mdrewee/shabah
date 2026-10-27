import React, { useEffect } from 'react';
import { ShabahGhost } from '../../../../components/mascot/ShabahGhost';
import { ContestantBidState } from '../types';
import { formatPriceArabic, getRankOrdinalArabic, toArabicDigits } from '../brokerUtils';
import { sound } from '../../../../lib/audio';
import { Trophy, Crown, Coins, RotateCcw, ArrowRight, User } from 'lucide-react';

interface BrokerFinalPodiumProps {
  contestants: ContestantBidState[];
  totalRounds?: number;
  onReturnToLobby: () => void;
  isHost?: boolean;
}

export const BrokerFinalPodium: React.FC<BrokerFinalPodiumProps> = ({
  contestants,
  totalRounds = 5,
  onReturnToLobby,
  isHost = false,
}) => {
  useEffect(() => {
    sound.playVictory();
  }, []);

  // Sort contestants descending by cumulative bankroll
  const sorted = [...contestants].sort((a, b) => (b.totalBankroll || 0) - (a.totalBankroll || 0));

  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];
  const rest = sorted.slice(3);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between items-center p-4 sm:p-8 select-none relative overflow-y-auto"
    >
      {/* Background glow celebration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.12),transparent_70%)] pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10 pt-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl sm:text-2xl font-black text-white">
            منصة التتويج الكبرى ({toArabicDigits(totalRounds)} جولات)
          </h1>
        </div>
        <span className="text-xs font-bold text-neutral-400">
          حراج الشبح الشريطي
        </span>
      </header>

      {/* Main Podium & Champion Showcase */}
      <main className="w-full max-w-4xl my-auto z-10 py-6 flex flex-col items-center">
        {/* Grand Champion Hero Card */}
        {firstPlace && (
          <div className="w-full max-w-xl shabah-border-wrap mb-8">
            <div className="shabah-border-inner">
              <div className="shabah-surface p-6 sm:p-8 text-center flex flex-col items-center relative">
                {/* Crown Icon with animation */}
                <div className="p-3 rounded-full bg-amber-400 text-[#0A0A0A] mb-3 shadow-[0_0_20px_rgba(250,204,21,0.6)]">
                  <Crown className="w-8 h-8" />
                </div>

                <span className="text-xs font-black px-4 py-1 rounded-full bg-neutral-900 text-amber-400 border border-neutral-700 mb-2">
                  أغنى شريطي بالحراج
                </span>

                <h2 className="text-3xl sm:text-5xl font-black text-[#0A0A0A] mb-2 tracking-tight">
                  {firstPlace.playerName}
                </h2>

                <p className="text-xs sm:text-sm font-bold text-neutral-500 mb-4">
                  فاز باللقب بحصده أعلى رصيد مبيعات تراكمي طوال الـ {toArabicDigits(totalRounds)} جولات!
                </p>

                {/* Total Bankroll Badge */}
                <div className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-black text-xl sm:text-2xl flex items-center gap-2 shadow-[2px_2px_0px_#065F46]">
                  <Coins className="w-6 h-6 text-amber-300" />
                  <span>الرصيد الكلي: {formatPriceArabic(firstPlace.totalBankroll || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Brutalist 3-Step Podium (Top 3) */}
        {sorted.length > 0 && (
          <div className="w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 items-end mb-8 pt-4">
            {/* 2nd Place */}
            {secondPlace ? (
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <span className="text-[11px] font-black text-neutral-400 block">المركز الثاني</span>
                  <span className="text-xs sm:text-sm font-black text-white truncate max-w-[90px] sm:max-w-none block">
                    {secondPlace.playerName}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {formatPriceArabic(secondPlace.totalBankroll || 0)}
                  </span>
                </div>
                <div className="w-full h-24 sm:h-32 rounded-t-2xl bg-neutral-800 border-2 border-neutral-600 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-3xl font-black text-neutral-300">٢</span>
                </div>
              </div>
            ) : (
              <div className="h-24 sm:h-32" />
            )}

            {/* 1st Place */}
            {firstPlace ? (
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <Crown className="w-5 h-5 text-amber-400 mx-auto mb-0.5" />
                  <span className="text-[11px] font-black text-amber-400 block">البطل</span>
                  <span className="text-sm sm:text-base font-black text-white truncate max-w-[100px] sm:max-w-none block">
                    {firstPlace.playerName}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-400">
                    {formatPriceArabic(firstPlace.totalBankroll || 0)}
                  </span>
                </div>
                <div className="w-full h-32 sm:h-44 rounded-t-2xl bg-amber-500 border-2 border-amber-400 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.4)]">
                  <span className="text-3xl sm:text-4xl font-black text-[#0A0A0A]">١</span>
                </div>
              </div>
            ) : null}

            {/* 3rd Place */}
            {thirdPlace ? (
              <div className="flex flex-col items-center">
                <div className="mb-2 text-center">
                  <span className="text-[11px] font-black text-neutral-400 block">المركز الثالث</span>
                  <span className="text-xs sm:text-sm font-black text-white truncate max-w-[90px] sm:max-w-none block">
                    {thirdPlace.playerName}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {formatPriceArabic(thirdPlace.totalBankroll || 0)}
                  </span>
                </div>
                <div className="w-full h-16 sm:h-24 rounded-t-2xl bg-neutral-900 border-2 border-neutral-700 flex flex-col items-center justify-center shadow-md">
                  <span className="text-xl sm:text-2xl font-black text-neutral-400">٣</span>
                </div>
              </div>
            ) : (
              <div className="h-16 sm:h-24" />
            )}
          </div>
        )}

        {/* Remaining Contestants Ranking */}
        {rest.length > 0 && (
          <div className="w-full max-w-xl p-4 rounded-2xl bg-neutral-900 border border-neutral-800 mb-6">
            <span className="text-xs font-black text-neutral-400 block mb-3">
              بقية المتسابقين:
            </span>
            <div className="flex flex-col gap-2">
              {rest.map((c, i) => (
                <div
                  key={c.playerId}
                  className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-neutral-400 w-6">
                      {getRankOrdinalArabic(i + 4)}
                    </span>
                    <span className="text-sm font-black text-white">{c.playerName}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">
                    {formatPriceArabic(c.totalBankroll || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Return to Lobby Footer */}
      <footer className="w-full max-w-md flex flex-col items-center gap-3 z-10 pb-4">
        {isHost ? (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="w-full py-4 px-6 rounded-xl font-black text-[#0A0A0A] bg-white hover:bg-neutral-100 shadow-[3px_3px_0px_#0A0A0A] border-2 border-[#0A0A0A] active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <ArrowRight className="w-5 h-5" />
            <span>العودة للوبي (بدء لعبة جديدة)</span>
          </button>
        ) : (
          <p className="text-xs text-neutral-400 font-bold text-center">
            شكراً لمشاركتكم في حراج الشبح الشريطي! في انتظار المضيف للعودة للوبي.
          </p>
        )}
      </footer>
    </div>
  );
};
