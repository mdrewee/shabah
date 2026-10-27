import React from 'react';
import {
  JudgeRoomState,
  PlayerVerdict,
  ContestantExcuse,
} from '../types';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import {
  Gavel,
  Scale,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  Hourglass,
  FileSearch,
} from 'lucide-react';

interface JudgeTVCourtroomProps {
  state: JudgeRoomState;
  onNextRound: () => void;
  readyPlayersCount: number;
  totalConnectedCount: number;
  isAutoAdvancingCountdown?: number | null;
  onReturnToLobby?: () => void;
  onEndGame?: () => void;
}

export const JudgeTVCourtroom: React.FC<JudgeTVCourtroomProps> = ({
  state,
  onNextRound,
  readyPlayersCount,
  totalConnectedCount,
  isAutoAdvancingCountdown,
  onReturnToLobby,
  onEndGame,
}) => {
  const predicament = state.currentPredicament;
  const isRevealed = state.revealState === 'revealed';

  // Gather list of contestants to display: from verdictList, verdicts, or excuses
  const items: Array<{
    playerId: string;
    playerName: string;
    excuse: string;
    verdict?: PlayerVerdict | any;
  }> = [];

  const verdictsMap = state.verdicts || {};

  if (state.verdictList && state.verdictList.length > 0) {
    state.verdictList.forEach((v) => {
      items.push({
        playerId: v.playerId,
        playerName: v.playerName,
        excuse: v.excuse,
        verdict: v,
      });
    });
  } else if (Object.keys(verdictsMap).length > 0) {
    Object.values(verdictsMap).forEach((v: any) => {
      items.push({
        playerId: v.playerId,
        playerName: v.playerName,
        excuse: v.excuse,
        verdict: v,
      });
    });
  } else {
    Object.values(state.excuses || {}).forEach((e: ContestantExcuse) => {
      items.push({
        playerId: e.playerId,
        playerName: e.playerName,
        excuse: e.excuse,
        verdict: verdictsMap[e.playerId],
      });
    });
  }

  // Responsive Grid Logic:
  // 2 players: grid-cols-2 gap-6
  // 3 to 4 players: grid-cols-2 lg:grid-cols-4 gap-4
  // > 4 players: grid-cols-3 gap-3
  let gridLayoutClass = 'grid-cols-1 gap-4';
  if (items.length === 2) {
    gridLayoutClass = 'grid-cols-2 gap-6';
  } else if (items.length >= 3 && items.length <= 4) {
    gridLayoutClass = 'grid-cols-2 lg:grid-cols-4 gap-4';
  } else if (items.length > 4) {
    gridLayoutClass = 'grid-cols-3 gap-3';
  }

  return (
    <div
      dir="rtl"
      className="w-full h-screen max-h-screen overflow-hidden bg-black text-white p-6 flex flex-col justify-between select-none"
    >
      {/* 1. Top Section: Hero Case Card with Key Evidence */}
      <div className="flex-shrink-0 flex items-center justify-between gap-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-3xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] via-[#4ADE80] to-[#BEF264] shadow-[0_0_30px_rgba(181,107,255,0.3)]">
            <div className="w-16 h-16 rounded-[22px] bg-black flex items-center justify-center">
              <Gavel className="w-9 h-9 text-purple-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 font-sans font-bold text-sm flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span>{predicament.category || predicament.contextTag || 'قضية جنائية'}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 font-sans text-sm font-bold">
                الجلسة {toArabicNumber(state.roundNumber)} من {toArabicNumber(state.totalRounds)}
              </span>
            </div>
            <h1 className="font-sans font-black text-2xl text-white tracking-tight">
              {predicament.title}
            </h1>
          </div>
        </div>

        {/* Case Facts & Key Evidence Capsule */}
        <div className="flex items-stretch gap-3 max-w-2xl text-right">
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-3">
            <div className="text-xs font-sans font-bold text-zinc-400 mb-0.5">وقائع القضية:</div>
            <div className="font-sans text-xs font-semibold text-zinc-200 leading-relaxed line-clamp-3">
              {predicament.description}
            </div>
          </div>

          {predicament.keyEvidence && (
            <div className="flex-1 bg-red-950/40 border border-red-800/80 rounded-2xl p-3">
              <div className="text-xs font-sans font-bold text-red-400 mb-0.5 flex items-center gap-1">
                <FileSearch className="w-3.5 h-3.5" />
                <span>الدليل القاطع المرفوع:</span>
              </div>
              <div className="font-sans text-xs font-semibold text-red-200 leading-relaxed line-clamp-3">
                {predicament.keyEvidence}
              </div>
            </div>
          )}
        </div>

        {/* Host Next Round Action & Readiness */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-sm font-sans text-zinc-400">
              جاهزية المتهمين:{' '}
              <strong className="text-emerald-400 font-sans font-bold">
                {toArabicNumber(readyPlayersCount)} من {toArabicNumber(totalConnectedCount)}
              </strong>
            </div>
            {isAutoAdvancingCountdown !== null && isAutoAdvancingCountdown !== undefined && (
              <div className="text-sm font-sans font-black text-amber-400 animate-pulse">
                انتقال خلال {toArabicNumber(isAutoAdvancingCountdown)} ثوانٍ...
              </div>
            )}
          </div>

          <button
            onClick={onNextRound}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-sans font-black text-sm shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-all cursor-pointer"
          >
            <span>بدء الجلسة التالية فوراً</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {onReturnToLobby && (
            <button
              onClick={onReturnToLobby}
              className="px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-sm transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>
          )}

          {onEndGame && (
            <button
              onClick={onEndGame}
              className="px-4 py-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-200 font-sans font-bold text-sm transition-colors cursor-pointer"
            >
              إنهاء اللعبة
            </button>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Responsive Courtroom Grid */}
      <div className="flex-1 my-3 flex flex-col justify-center overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 font-sans">
            <Clock className="w-10 h-10 mb-2 animate-spin text-zinc-600" />
            <span className="text-lg font-bold">بانتظار تقديم المتهمين لأعذارهم أمام القاضي...</span>
          </div>
        ) : (
          <div className={`w-full grid items-stretch ${gridLayoutClass}`}>
            {items.map((item) => {
              const verdictResult = item.verdict;
              const verdictType = verdictResult?.verdict;
              const isInnocent =
                verdictType === 'بريء' ||
                verdictType === 'innocent' ||
                verdictResult?.verdictLabel?.includes('براءة');
              const isGuilty =
                verdictType === 'مذنب' ||
                verdictType === 'guilty' ||
                verdictResult?.verdictLabel?.includes('سجن');
              const isBail = !isInnocent && !isGuilty;

              const displayLabel =
                verdictResult?.verdict ||
                verdictResult?.verdictLabel ||
                (isInnocent ? 'بريء' : isGuilty ? 'مذنب' : 'مع وقف التنفيذ');

              const score =
                verdictResult?.score ?? verdictResult?.pointsAwarded ?? (isInnocent ? 10 : isGuilty ? 0 : 5);
              const roastText =
                verdictResult?.roast || verdictResult?.judgeRoast || '';

              return (
                <div
                  key={item.playerId}
                  className="rounded-3xl p-5 flex flex-col justify-between bg-zinc-950 border-2 border-zinc-800 shadow-2xl relative overflow-hidden transition-all duration-300"
                >
                  {/* Top Capsule for Name & Points */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="px-5 py-1.5 rounded-full bg-zinc-900 border-2 border-zinc-700 text-white font-sans text-lg font-black tracking-wide">
                      {item.playerName}
                    </div>

                    {isRevealed && verdictResult && (
                      <div
                        className={`px-3.5 py-1 rounded-full text-base font-black font-sans border-2 ${
                          isInnocent
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : isGuilty
                            ? 'bg-red-950/80 text-red-400 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            : 'bg-amber-950/80 text-amber-400 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        }`}
                      >
                        {formatPoints(score)}
                      </div>
                    )}
                  </div>

                  {/* White Box for Excuse */}
                  <div className="my-3 p-4 rounded-2xl bg-white border-2 border-zinc-200 shadow-md text-right">
                    <div className="text-xs font-sans font-bold text-zinc-500 mb-1">عذر المتهم:</div>
                    <p className="font-sans text-xl font-bold text-black leading-snug">
                      "{item.excuse}"
                    </p>
                  </div>

                  {/* Glowing Verdict Badge & Zinc-100 Ruthless Roast Box (No penalties) */}
                  {isRevealed && verdictResult ? (
                    <div className="flex flex-col gap-2 mt-auto">
                      {/* Verdict Badge */}
                      <div
                        className={`py-2 px-4 rounded-xl text-center font-sans text-lg font-black tracking-wide border-2 flex items-center justify-center gap-2 ${
                          isInnocent
                            ? 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                            : isGuilty
                            ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                            : 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                        }`}
                      >
                        {isInnocent ? (
                          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                        ) : isGuilty ? (
                          <AlertOctagon className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <Hourglass className="w-5 h-5 stroke-[2.5]" />
                        )}
                        <span>{displayLabel}</span>
                      </div>

                      {/* Judge Roast (No penalties, text-zinc-100 font-semibold) */}
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-right">
                        <div className="text-xs font-sans text-purple-300 font-bold mb-1 flex items-center gap-1.5">
                          <Gavel className="w-3.5 h-3.5 text-purple-400" />
                          <span>تحليل الشبح القاضي:</span>
                        </div>
                        <div className="font-sans text-base font-semibold text-zinc-100 leading-relaxed">
                          {roastText}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-3 px-4 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center text-base font-bold text-zinc-400 flex items-center justify-center gap-2">
                      <Clock className="w-5 h-5 text-purple-400 animate-spin" />
                      <span>القاضي يفحص الأدلة ويراجع مصداقية الحجة...</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Bottom Leaderboard Bar: Cumulative Scores */}
      <div className="flex-shrink-0 pt-3 border-t border-zinc-800 flex items-center justify-between text-sm font-sans">
        <span className="text-zinc-400 font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span>سجل نقاط المحاكمة التراكمي:</span>
        </span>

        <div className="flex items-center gap-3 overflow-x-auto">
          {Object.entries(state.cumulativeScores || {}).map(([pId, score]) => {
            const playerObj = items.find((e) => e.playerId === pId);
            const pName = playerObj ? playerObj.playerName : pId;

            return (
              <div
                key={pId}
                className="flex items-center gap-2 bg-zinc-950 px-3.5 py-1.5 rounded-xl border border-zinc-800"
              >
                <span className="text-zinc-300 font-bold">{pName}:</span>
                <span className="text-purple-400 font-black">{formatPoints(score)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JudgeTVCourtroom;
