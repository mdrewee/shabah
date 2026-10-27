import React from 'react';
import { RankedGuideContestant } from '../guideSync';
import { toArabicNumber } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import {
  Trophy,
  Compass,
  Crown,
  Medal,
  RotateCcw,
  Sparkles,
  MapPinOff,
} from 'lucide-react';

interface GuideFinalPodiumProps {
  isTV?: boolean;
  rankedContestants: RankedGuideContestant[];
  onReturnToLobby: () => void;
}

export const GuideFinalPodium: React.FC<GuideFinalPodiumProps> = ({
  isTV = true,
  rankedContestants,
  onReturnToLobby,
}) => {
  const winner = rankedContestants[0];
  const runnerUp = rankedContestants[1];
  const thirdPlace = rankedContestants[2];

  // Find the player with the worst "biggest miss"
  const worstMissPlayer = [...rankedContestants]
    .filter((p) => p.biggestMiss && p.biggestMiss.distanceKm > 0)
    .sort((a, b) => (b.biggestMiss?.distanceKm || 0) - (a.biggestMiss?.distanceKm || 0))[0] ||
    rankedContestants[rankedContestants.length - 1];

  return (
    <div
      dir="rtl"
      className="w-full h-full min-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 select-none overflow-y-auto"
    >
      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_25px_rgba(181,107,255,0.4)]">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              <Compass className="w-7 h-7 text-amber-400 animate-spin" />
            </div>
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-700 text-amber-300 font-sans font-bold text-xs flex items-center gap-1 w-fit mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>خريطة الرحالة النهائية</span>
            </span>
            <h1 className="text-2xl font-sans font-black text-white">
              منصة تتويج الشبح المرشد (٥ جولات)
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onReturnToLobby();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-sans font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>العودة للوبي الرئيسي</span>
        </button>
      </header>

      {/* Main Center Podium Arena */}
      <div className="my-auto py-6 max-w-4xl mx-auto w-full flex flex-col items-center">
        {/* Top 3 Podium Columns */}
        <div className="w-full grid grid-cols-3 gap-4 items-end mb-8 pt-8">
          {/* 2nd Place */}
          {runnerUp && (
            <div className="flex flex-col items-center order-1">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border-2 border-zinc-400 flex items-center justify-center mb-2 shadow-lg">
                <Medal className="w-8 h-8 text-zinc-300" />
              </div>
              <span className="font-sans font-black text-base text-zinc-200 truncate max-w-[120px]">
                {runnerUp.playerName}
              </span>
              <span className="font-sans font-bold text-xs text-zinc-400 mb-2">
                {toArabicNumber(runnerUp.totalScore)} نقطة
              </span>
              <div className="w-full h-36 rounded-t-3xl bg-gradient-to-b from-zinc-800 to-zinc-950 border-t-2 border-x-2 border-zinc-700 flex flex-col items-center justify-center">
                <span className="font-sans font-black text-3xl text-zinc-400">٢</span>
                <span className="text-[11px] font-sans font-bold text-zinc-500">المركز الثاني</span>
              </div>
            </div>
          )}

          {/* 1st Place Champion: ابن بطوطة / داهية الخرائط */}
          {winner && (
            <div className="flex flex-col items-center order-2">
              <div className="relative mb-2">
                <Crown className="w-10 h-10 text-amber-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-1 shadow-[0_0_40px_rgba(245,158,11,0.5)]">
                  <div className="w-full h-full bg-black rounded-[20px] flex items-center justify-center">
                    <Trophy className="w-10 h-10 text-amber-400" />
                  </div>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 font-sans font-black text-xs mb-1">
                ابن بطوطة / داهية الخرائط
              </div>

              <span className="font-sans font-black text-xl text-white truncate max-w-[180px]">
                {winner.playerName}
              </span>
              <span className="font-sans font-bold text-sm text-emerald-400 mb-2">
                {toArabicNumber(winner.totalScore)} نقطة
              </span>

              <div className="w-full h-52 rounded-t-3xl bg-gradient-to-b from-amber-600/30 via-zinc-900 to-zinc-950 border-t-4 border-x-2 border-amber-500 flex flex-col items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <span className="font-sans font-black text-5xl text-amber-400">١</span>
                <span className="text-xs font-sans font-black text-amber-300 mt-1">بطل الرحلات</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center order-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-950 border-2 border-amber-800 flex items-center justify-center mb-2 shadow-lg">
                <Medal className="w-8 h-8 text-amber-600" />
              </div>
              <span className="font-sans font-black text-base text-zinc-200 truncate max-w-[120px]">
                {thirdPlace.playerName}
              </span>
              <span className="font-sans font-bold text-xs text-zinc-400 mb-2">
                {toArabicNumber(thirdPlace.totalScore)} نقطة
              </span>
              <div className="w-full h-24 rounded-t-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-t-2 border-x-2 border-zinc-800 flex flex-col items-center justify-center">
                <span className="font-sans font-black text-2xl text-amber-700">٣</span>
                <span className="text-[11px] font-sans font-bold text-zinc-500">المركز الثالث</span>
              </div>
            </div>
          )}
        </div>

        {/* Special Shabah Roast Award: السائح الضايع */}
        {worstMissPlayer && (
          <div className="w-full max-w-xl bg-zinc-950 border-2 border-red-950/80 rounded-3xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-700 flex items-center justify-center text-red-400 shrink-0">
                <MapPinOff className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300 font-sans font-bold text-[10px]">
                    جائزة السائح الضايع
                  </span>
                  <span className="font-sans font-black text-sm text-white">
                    {worstMissPlayer.playerName}
                  </span>
                </div>
                <p className="font-sans text-xs text-zinc-400">
                  {worstMissPlayer.biggestMiss ? (
                    <>
                      أكبر شطحة كانت على بعد{' '}
                      <strong className="text-red-400 font-bold">
                        {toArabicNumber(worstMissPlayer.biggestMiss.distanceKm)} كم
                      </strong>{' '}
                      في معلم ({worstMissPlayer.biggestMiss.landmarkName})!
                    </>
                  ) : (
                    'أكثر متسابق كان تائهاً في خريطة العالم بدون بوصلة!'
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Return Action */}
      <footer className="pt-4 border-t border-zinc-800 text-center flex flex-col items-center">
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onReturnToLobby();
          }}
          className="w-full max-w-md py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-sans font-black text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-98 transition-all cursor-pointer"
        >
          العودة للوبي الرئيسي
        </button>
      </footer>
    </div>
  );
};
