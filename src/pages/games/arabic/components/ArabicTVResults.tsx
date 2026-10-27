import React from 'react';
import {
  ArabicRoomState,
  ContestantEvaluation,
  PlayerArabicEvaluation,
  ObjectionState,
} from '../types';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import { Check, X, Clock, ChevronRight, AlertCircle, Zap } from 'lucide-react';

interface ArabicTVResultsProps {
  state: ArabicRoomState;
  onNextRound: () => void;
  readyContestants: string[];
  totalConnectedContestants: number;
  onReturnToLobby?: () => void;
}

export const ArabicTVResults: React.FC<ArabicTVResultsProps> = ({
  state,
  onNextRound,
  readyContestants,
  totalConnectedContestants,
  onReturnToLobby,
}) => {
  const categories = state.currentCategories || [];
  const activeObjection: ObjectionState | null = state.activeObjection;

  // Harmonize new PlayerArabicEvaluation[] with legacy evaluations
  const playerEvals: PlayerArabicEvaluation[] =
    state.playerEvaluations && state.playerEvaluations.length > 0
      ? state.playerEvaluations
      : Object.values(state.evaluations || {}).map((ev: ContestantEvaluation) => ({
          playerId: ev.contestantId,
          playerName: ev.contestantName,
          totalScore: ev.totalRoundPoints,
          results: (ev.answers || []).map((ans) => ({
            category: ans.categoryName,
            answer: ans.rawAnswer,
            isCorrect: ans.isValid,
            score: ans.points,
            reason: ans.comment,
          })),
        }));

  const count = playerEvals.length;

  const gridContainerClass =
    count <= 1
      ? 'max-w-md mx-auto w-full grid grid-cols-1 gap-6'
      : count === 2
      ? 'grid grid-cols-2 gap-6'
      : count === 3
      ? 'grid grid-cols-3 gap-5'
      : count === 4
      ? 'grid grid-cols-4 gap-4'
      : count === 5
      ? 'grid grid-cols-5 gap-3'
      : 'grid grid-flow-col auto-cols-[280px] gap-4 overflow-x-auto pb-2';

  return (
    <div
      dir="rtl"
      className="w-full h-screen max-h-screen overflow-hidden bg-black text-white p-5 flex flex-col justify-between select-none"
    >
      {/* Top Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] p-0.5 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center">
              <span className="font-sans font-black text-2xl text-emerald-400">
                {state.currentLetter}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-sans font-black text-white">
                نتائج الجولة {toArabicNumber(state.roundNumber)} من {toArabicNumber(state.totalRounds)}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-sans text-zinc-300 font-bold">
                حرف ({state.currentLetter})
              </span>
            </div>
            <div className="text-xs font-sans text-zinc-400 mt-0.5">
              تحكيم الشبح العربي • تدقيق لغوي فصيح وصارم • ١٠ نقاط للمنفرد و ٥ نقاط للمكرر
            </div>
          </div>
        </div>

        {/* Action Controls & Readiness */}
        <div className="flex items-center gap-3">
          {activeObjection && !activeObjection.resolved ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 animate-pulse font-sans text-sm font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>
                اعتراض قيد التصويت: {activeObjection.contestantName} على "{activeObjection.categoryName}" ({activeObjection.answer})
              </span>
            </div>
          ) : (
            <>
              <div className="text-xs font-sans text-zinc-400 text-right">
                جاهزية المتسابقين:{' '}
                <span className="text-emerald-400 font-bold">
                  {toArabicNumber(readyContestants.length)} من {toArabicNumber(totalConnectedContestants)}
                </span>
              </div>
              <button
                onClick={onNextRound}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all cursor-pointer"
              >
                <span>بدء الجولة التالية فوراً</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {onReturnToLobby && (
            <button
              onClick={onReturnToLobby}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
            >
              العودة للوبي
            </button>
          )}
        </div>
      </div>

      {/* Multi-Player Side-by-Side Horizontal Grid */}
      <div className="flex-1 my-3 flex flex-col justify-center overflow-hidden">
        {playerEvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500 font-sans">
            <Clock className="w-8 h-8 mb-2 animate-spin text-zinc-600" />
            <span>جاري استلام وتحكيم الإجابات...</span>
          </div>
        ) : (
          <div className={`w-full h-full max-h-[calc(100vh-140px)] overflow-hidden ${gridContainerClass}`}>
            {playerEvals.map((player) => {
              const totalPoints = player.totalScore || 0;
              const cumulative = state.cumulativeScores?.[player.playerId] || totalPoints;

              return (
                <div
                  key={player.playerId}
                  className="h-full flex flex-col justify-between bg-zinc-950 border-2 border-zinc-800 rounded-2xl p-3.5 shadow-xl overflow-hidden"
                >
                  {/* Column Header: Player Name + Total Round Score */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400 font-sans font-black text-sm shrink-0">
                        {player.playerName.slice(0, 1)}
                      </div>
                      <span className="font-sans font-black text-white text-base truncate">
                        {player.playerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 font-sans font-black text-sm shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                        +{toArabicNumber(totalPoints)}
                      </span>
                    </div>
                  </div>

                  {/* 5 Categories Listed Vertically */}
                  <div className="flex-1 flex flex-col justify-around py-2 gap-2 overflow-hidden">
                    {categories.map((cat, catIdx) => {
                      const res = player.results?.[catIdx] || {
                        category: cat,
                        answer: '',
                        isCorrect: false,
                        score: 0,
                        reason: 'لم يكتب إجابة',
                      };

                      const isCorrect = res.isCorrect;
                      const hasAnswer = Boolean(res.answer && res.answer.trim().length > 0);

                      return (
                        <div
                          key={catIdx}
                          className={`rounded-xl p-2.5 border flex flex-col justify-between transition-colors ${
                            !hasAnswer
                              ? 'bg-zinc-900/30 border-zinc-900 text-zinc-600'
                              : isCorrect
                              ? 'bg-emerald-950/20 border-emerald-900/60 text-white'
                              : 'bg-rose-950/20 border-rose-900/60 text-zinc-300'
                          }`}
                        >
                          {/* Category Name Header */}
                          <div className="flex items-center justify-between text-zinc-400 mb-0.5">
                            <span className="font-sans font-bold text-xs text-zinc-400 truncate">
                              {toArabicNumber(catIdx + 1)}. {cat}
                            </span>
                            <span
                              className={`font-sans font-black text-xs ${
                                isCorrect
                                  ? res.score === 5
                                    ? 'text-amber-400'
                                    : 'text-emerald-400'
                                  : 'text-rose-500'
                              }`}
                            >
                              {isCorrect ? (res.score === 5 ? '+٥' : '+١٠') : '٠'}
                            </span>
                          </div>

                          {/* Contestant Word + Check/X Result Icon */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-sans font-black text-sm text-white truncate">
                              {res.answer ? (
                                res.answer
                              ) : (
                                <span className="text-zinc-600 font-normal text-xs">لم يكتب إجابة</span>
                              )}
                            </span>
                            <div className="shrink-0">
                              {isCorrect ? (
                                <Check className="text-emerald-400 w-5 h-5 stroke-[2.5]" />
                              ) : (
                                <X className="text-rose-500 w-5 h-5 stroke-[2.5]" />
                              )}
                            </div>
                          </div>

                          {/* Short Concise Rationale Below Word */}
                          <div
                            className="font-sans text-xs text-zinc-300 font-medium leading-snug line-clamp-2 mt-0.5"
                            title={res.reason}
                          >
                            {res.reason || (isCorrect ? 'إجابة صحيحة وفصيحة' : 'غير صحيحة')}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cumulative Score Footer */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-sans">
                    <span className="text-zinc-400 font-medium">المجموع التراكمي:</span>
                    <span className="text-emerald-400 font-black text-sm">
                      {formatPoints(cumulative)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArabicTVResults;
