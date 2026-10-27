import React, { useState, useEffect } from 'react';
import {
  ContestantEvaluation,
  ContestantAnswer,
  ObjectionState,
} from '../types';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import {
  Check,
  X,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from 'lucide-react';

interface ArabicMobileResultsProps {
  currentContestantId: string;
  evaluations: Record<string, ContestantEvaluation>;
  categories: string[];
  currentLetter: string;
  activeObjection: ObjectionState | null;
  onFileObjection: (categoryIndex: number, answer: string) => void;
  onVoteObjection: (objectionId: string, voteFor: boolean) => void;
  isReadyForNextRound: boolean;
  onToggleReady: () => void;
  readyContestantsCount: number;
  totalContestantsCount: number;
  onReturnToLobby?: () => void;
}

export const ArabicMobileResults: React.FC<ArabicMobileResultsProps> = ({
  currentContestantId,
  evaluations,
  categories,
  currentLetter,
  activeObjection,
  onFileObjection,
  onVoteObjection,
  isReadyForNextRound,
  onToggleReady,
  readyContestantsCount,
  totalContestantsCount,
  onReturnToLobby,
}) => {
  const contestantsList = Object.values(evaluations);

  // Default carousel to current contestant's index
  const myIndex = contestantsList.findIndex((c) => c.contestantId === currentContestantId);
  const [activeIndex, setActiveIndex] = useState<number>(() => (myIndex >= 0 ? myIndex : 0));

  // Objection countdown timer in modal
  const [objectionSecondsLeft, setObjectionSecondsLeft] = useState<number>(8);

  useEffect(() => {
    if (!activeObjection || activeObjection.resolved) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((activeObjection.endsAt - Date.now()) / 1000));
      setObjectionSecondsLeft(remaining);
    }, 200);

    return () => clearInterval(interval);
  }, [activeObjection]);

  const activeContestant = contestantsList[activeIndex] || contestantsList[0];
  const isMe = activeContestant?.contestantId === currentContestantId;

  const handlePrev = () => {
    sound.playClick();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : contestantsList.length - 1));
  };

  const handleNext = () => {
    sound.playClick();
    setActiveIndex((prev) => (prev < contestantsList.length - 1 ? prev + 1 : 0));
  };

  // Has the current user already voted on the active objection?
  const hasVotedFor = activeObjection?.votesFor.includes(currentContestantId);
  const hasVotedAgainst = activeObjection?.votesAgainst.includes(currentContestantId);
  const hasVoted = hasVotedFor || hasVotedAgainst;
  const isMyObjection = activeObjection?.contestantId === currentContestantId;

  return (
    <div
      dir="rtl"
      className="flex-1 w-full flex flex-col justify-between p-4 bg-black text-white overflow-hidden relative"
    >
      {/* 8-Second Objection Voting Modal Overlay */}
      {activeObjection && !activeObjection.resolved && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-zinc-950 border-2 border-amber-500/80 rounded-3xl p-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] text-center animate-in fade-in duration-200">
            {/* Header with Countdown */}
            <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-sans font-bold text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>اعتراض على التصحيح</span>
              </span>
              <div className="flex items-center gap-1 text-xs font-sans font-extrabold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-800">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{toArabicNumber(objectionSecondsLeft)} ثوانٍ</span>
              </div>
            </div>

            {/* Objection Details */}
            <p className="font-sans text-sm text-zinc-300 mb-1">
              المتسابق <strong className="text-white">{activeObjection.contestantName}</strong> يعترض على خانة:
            </p>
            <div className="my-3 p-3 rounded-2xl bg-black border border-zinc-800">
              <div className="text-xs font-sans text-zinc-400">{activeObjection.categoryName}</div>
              <div className="text-lg font-sans font-black text-emerald-400 mt-0.5">
                "{activeObjection.answer}"
              </div>
            </div>

            {/* Voting buttons or waiting status */}
            {isMyObjection ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans text-zinc-400">
                اعتراضك معروض للتصويت على باقي المتسابقين...
              </div>
            ) : hasVoted ? (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans text-emerald-400 font-bold flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>تم تسجيل صوتك! بانتظار اكتمال الأصوات...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={() => {
                    sound.playClick();
                    onVoteObjection(activeObjection.id, true);
                  }}
                  className="py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>صحيحة (قبول)</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    onVoteObjection(activeObjection.id, false);
                  }}
                  className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-sans font-black text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <ThumbsDown className="w-4 h-4" />
                  <span>شطحة (رفض)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Carousel Navigation Tabs */}
      <div className="flex-shrink-0 flex items-center justify-between pb-3 border-b border-zinc-800">
        <button
          onClick={handlePrev}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[220px] py-1 px-1">
          {contestantsList.map((c, idx) => {
            const isSelected = idx === activeIndex;
            const isSelf = c.contestantId === currentContestantId;

            return (
              <button
                key={c.contestantId}
                onClick={() => {
                  sound.playClick();
                  setActiveIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-sans font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {isSelf ? 'أنا' : c.contestantName}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Contestant Header Summary */}
      {activeContestant && (
        <div className="flex-shrink-0 my-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center font-sans font-black text-emerald-400">
              {activeContestant.contestantName.slice(0, 1)}
            </div>
            <div>
              <div className="font-sans font-black text-base text-white">
                {activeContestant.contestantName} {isMe && <span className="text-xs text-zinc-500">(أنت)</span>}
              </div>
              <div className="font-sans text-[11px] text-zinc-400">
                حرف الجولة ({currentLetter})
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeContestant.speedBonus > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 text-xs font-sans font-black flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                <span>+٥ أسرع</span>
              </span>
            )}
            <div className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans font-black text-base">
              {formatPoints(activeContestant.totalRoundPoints)}
            </div>
          </div>
        </div>
      )}

      {/* 5 Answers Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 my-1 pr-1">
        {activeContestant?.answers.map((ans, idx) => {
          const isValid = ans.isValid;
          const hasAnswer = Boolean(ans.rawAnswer);
          const canObject = isMe && !isValid && hasAnswer && !ans.objected;

          return (
            <div
              key={idx}
              className={`p-3 rounded-2xl border transition-all ${
                !hasAnswer
                  ? 'bg-zinc-950/60 border-zinc-900 text-zinc-600'
                  : isValid
                  ? 'bg-emerald-950/20 border-emerald-900/60 text-white'
                  : 'bg-red-950/20 border-red-900/60 text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs text-zinc-400 font-bold">
                  {ans.categoryName}:
                </span>

                <div className="flex items-center gap-2">
                  {/* Objection Button on user's own false answers */}
                  {canObject && (
                    <button
                      onClick={() => onFileObjection(idx, ans.rawAnswer)}
                      className="px-2 py-0.5 rounded-lg bg-amber-950/90 text-amber-300 border border-amber-700 hover:bg-amber-900 font-sans font-extrabold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>اعترض!</span>
                    </button>
                  )}

                  {ans.objected && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-bold bg-zinc-800 text-zinc-400">
                      تم الاعتراض
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {isValid ? (
                      <span
                        className={`flex items-center gap-0.5 font-sans font-black text-sm ${
                          ans.points === 5 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>{formatPoints(ans.points)}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-red-400 font-sans font-bold text-sm">
                        <X className="w-4 h-4" />
                        <span>٠</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* The Answer text */}
              <div className="font-sans font-bold text-base text-white">
                {ans.rawAnswer || <span className="text-zinc-600 font-normal">لم تتم الإجابة</span>}
              </div>

              {/* Shabah Roast / Comment */}
              {ans.comment && (
                <div className="mt-1 text-[11px] font-sans text-zinc-400 border-t border-white/5 pt-1">
                  {ans.comment}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Readiness Action Bar */}
      <div className="flex-shrink-0 pt-2 border-t border-zinc-900">
        <button
          onClick={() => {
            sound.playClick();
            onToggleReady();
          }}
          className={`w-full py-3.5 px-4 rounded-2xl font-sans font-black text-base flex items-center justify-center gap-2 active:scale-98 transition-all ${
            isReadyForNextRound
              ? 'bg-zinc-800 border-2 border-emerald-500/80 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}
        >
          {isReadyForNextRound ? (
            <>
              <Check className="w-5 h-5 text-emerald-400" />
              <span>جاهز للجولة التالية ({toArabicNumber(readyContestantsCount)}/{toArabicNumber(totalContestantsCount)})</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>أنا جاهز للجولة التالية</span>
            </>
          )}
        </button>

        {onReturnToLobby && (
          <button
            onClick={() => {
              sound.playClick();
              onReturnToLobby();
            }}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-sans font-bold transition-colors cursor-pointer"
          >
            العودة للوبي
          </button>
        )}
      </div>
    </div>
  );
};
