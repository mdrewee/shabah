import React from 'react';
import { RankedJudgeContestant } from '../judgeSync';
import { WorstExcuseRecord } from '../types';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import {
  Trophy,
  Crown,
  AlertOctagon,
  ArrowLeft,
  Gavel,
  Scale,
  Sparkles,
} from 'lucide-react';

interface JudgeFinalPodiumProps {
  rankedContestants: RankedJudgeContestant[];
  worstExcuses: Record<string, WorstExcuseRecord>;
  isTV?: boolean;
  onReturnToLobby: () => void;
}

export const JudgeFinalPodium: React.FC<JudgeFinalPodiumProps> = ({
  rankedContestants,
  worstExcuses,
  isTV = false,
  onReturnToLobby,
}) => {
  const winner = rankedContestants[0];
  const lastPlayer =
    rankedContestants.length > 1
      ? rankedContestants[rankedContestants.length - 1]
      : null;

  const worstRecord = lastPlayer ? worstExcuses[lastPlayer.id] : null;

  return (
    <div
      dir="rtl"
      className="flex-1 w-full h-full min-h-screen bg-black text-white p-6 flex flex-col items-center justify-between select-none overflow-y-auto"
    >
      {/* Top Header */}
      <div className="text-center my-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans font-bold text-sm mb-3">
          <Gavel className="w-4 h-4 text-purple-400" />
          <span>جلسة النطق بالأحكام النهائية</span>
        </div>
        <h1
          className={`font-sans font-black text-white tracking-tight ${
            isTV ? 'text-5xl' : 'text-3xl'
          }`}
        >
          ختام محكمة الشبح القاضي
        </h1>
        <p className="font-sans text-sm text-zinc-400 mt-2">
          تكريم داهية المحامين، وتخليد صاحب أردى عذر في السجن المؤبد
        </p>
      </div>

      {/* Main Dual Feature: Winner vs Scapegoat */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
        {/* 1st Place: المحامي الداهية */}
        {winner && (
          <div className="rounded-3xl p-6 bg-gradient-to-b from-amber-950/30 via-zinc-950 to-black border-2 border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.25)] flex flex-col items-center text-center justify-between">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.4)] mb-3">
              <div className="w-16 h-16 rounded-[14px] bg-black flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-sans font-black text-xs mb-2">
              المركز الأول • لقب المحامي الداهية
            </div>

            <h2 className="font-sans font-black text-2xl text-white mb-1">
              {winner.name}
            </h2>

            <div className="text-xl font-sans font-black text-emerald-400 my-2">
              {formatPoints(winner.score)}
            </div>

            <p className="font-sans text-xs text-zinc-400 leading-relaxed bg-black/60 p-3 rounded-2xl border border-white/5">
              صاحب الحجج الدامغة وأذكى تصريفات أخرجته من كافة التهم براءة مع مرتبة الشرف.
            </p>
          </div>
        )}

        {/* Last Place: كبش الفداء و نزيل السجن المؤبد */}
        {lastPlayer && (
          <div className="rounded-3xl p-6 bg-gradient-to-b from-red-950/40 via-zinc-950 to-black border-2 border-red-600/80 shadow-[0_0_40px_rgba(239,68,68,0.25)] flex flex-col items-center text-center justify-between">
            <div className="p-1 rounded-2xl bg-red-950 border border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)] mb-3">
              <div className="w-16 h-16 rounded-[14px] bg-black flex items-center justify-center">
                <AlertOctagon className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 font-sans font-black text-xs mb-2">
              كبش الفداء • نزيل السجن المؤبد
            </div>

            <h2 className="font-sans font-black text-2xl text-white mb-1">
              {lastPlayer.name}
            </h2>

            <div className="text-xl font-sans font-black text-red-400 my-2">
              {formatPoints(lastPlayer.score)}
            </div>

            {/* Worst Excuse Spotlight */}
            <div className="w-full text-right bg-black/70 p-3 rounded-2xl border border-red-900/40 space-y-1">
              <div className="text-[10px] font-sans text-red-400 font-bold">
                أردى عذر تسبب في دخوله السجن:
              </div>
              <div className="text-xs font-sans font-bold text-zinc-200">
                "{worstRecord ? worstRecord.excuse : 'أعذار ضعيفة لا ترقى لمستوى البراءة'}"
              </div>
              {worstRecord?.judgeRoast && (
                <div className="text-[11px] font-sans text-zinc-400 pt-1 border-t border-white/5">
                  رد القاضي: {worstRecord.judgeRoast}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Full Ranking Table */}
      {rankedContestants.length > 2 && (
        <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-4 my-2">
          <div className="text-xs font-sans font-bold text-zinc-400 mb-2 px-2 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-purple-400" />
            <span>ترتيب كافة المتهمين في المحاكمة:</span>
          </div>

          <div className="space-y-1.5">
            {rankedContestants.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-black border border-zinc-900 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-500 text-xs font-bold">
                    #{toArabicNumber(c.rank)}
                  </span>
                  <span className="font-sans font-bold text-zinc-200">{c.name}</span>
                </div>
                <span className="font-sans font-black text-purple-400">
                  {formatPoints(c.score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Return to Lobby Button */}
      <div className="w-full max-w-md my-4">
        <button
          onClick={onReturnToLobby}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-sans font-black text-base flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-98 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>العودة للوبي</span>
        </button>
      </div>
    </div>
  );
};
