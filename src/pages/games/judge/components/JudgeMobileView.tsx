import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Predicament } from '../../../../data/judgePredicaments';
import { JudgeVerdictResult } from '../types';
import { toArabicNumber, formatPoints } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import { roomBus } from '../../../../lib/roomBus';
import { JudgeCourtWaitingScreen } from './JudgeCourtWaitingScreen';
import {
  Scale,
  Gavel,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Send,
} from 'lucide-react';

interface JudgeMobileViewProps {
  predicament: Predicament;
  roundNumber: number;
  totalRounds: number;
  timerSeconds: number;
  hasSubmitted: boolean;
  onSubmitExcuse: (excuse: string, wasAutoSubmitted?: boolean) => void;
  myVerdict?: JudgeVerdictResult;
  isCourtroomVerdict: boolean;
  isReadyForNextRound: boolean;
  onToggleReady: () => void;
  readyCount: number;
  totalConnectedCount: number;
}

export const JudgeMobileView: React.FC<JudgeMobileViewProps> = ({
  predicament,
  roundNumber,
  totalRounds,
  timerSeconds,
  hasSubmitted,
  onSubmitExcuse,
  myVerdict,
  isCourtroomVerdict,
  isReadyForNextRound,
  onToggleReady,
  readyCount,
  totalConnectedCount,
}) => {
  const [excuseText, setExcuseText] = useState<string>('');
  const excuseRef = useRef<string>('');
  const isSubmittedRef = useRef<boolean>(hasSubmitted);

  useEffect(() => {
    isSubmittedRef.current = hasSubmitted;
  }, [hasSubmitted]);

  // Clear excuse field and refs between rounds
  useEffect(() => {
    setExcuseText('');
    excuseRef.current = '';
    isSubmittedRef.current = false;
  }, [roundNumber]);

  const maxChars = 140;
  const charCount = excuseText.length;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, maxChars);
    setExcuseText(val);
    excuseRef.current = val;
  };

  // Deterministic auto-submission when time runs out
  const autoSubmitOnTimeout = useCallback(() => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;

    const finalDraft = excuseRef.current.trim();
    // If contestant typed anything (even a word or half line), send it immediately.
    // If untouched and empty, submit "التزم الصمت ولم يقدم أي دفاع".
    const submittedContent =
      finalDraft.length > 0 ? finalDraft : 'التزم الصمت ولم يقدم أي دفاع';

    sound.playClick();
    onSubmitExcuse(submittedContent, true);
  }, [onSubmitExcuse]);

  // 1. Trigger when local countdown hits 0
  useEffect(() => {
    if (timerSeconds === 0 && !isSubmittedRef.current && !isCourtroomVerdict) {
      autoSubmitOnTimeout();
    }
  }, [timerSeconds, isCourtroomVerdict, autoSubmitOnTimeout]);

  // 2. Trigger immediately on JUDGE_TIME_UP broadcast from TV host
  useEffect(() => {
    const unsub = roomBus.on('JUDGE_TIME_UP', () => {
      if (!isSubmittedRef.current && !isCourtroomVerdict) {
        autoSubmitOnTimeout();
      }
    });
    return () => unsub?.();
  }, [isCourtroomVerdict, autoSubmitOnTimeout]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittedRef.current || !excuseText.trim()) return;
    isSubmittedRef.current = true;
    sound.playClick();
    onSubmitExcuse(excuseText.trim(), false);
  };

  // If in verdict reveal phase, show the contestant's personal courtroom result & readiness button
  if (isCourtroomVerdict && myVerdict) {
    const verdictType = myVerdict.verdict;
    const isInnocent =
      verdictType === 'بريء' ||
      verdictType === 'innocent' ||
      myVerdict.verdictLabel?.includes('براءة');
    const isGuilty =
      verdictType === 'مذنب' ||
      verdictType === 'guilty' ||
      myVerdict.verdictLabel?.includes('سجن');

    const displayLabel =
      myVerdict.verdict ||
      myVerdict.verdictLabel ||
      (isInnocent ? 'بريء' : isGuilty ? 'مذنب' : 'مع وقف التنفيذ');

    const score = myVerdict.score ?? myVerdict.pointsAwarded ?? (isInnocent ? 10 : isGuilty ? 0 : 5);
    const roast = myVerdict.roast || myVerdict.judgeRoast || '';

    return (
      <div
        dir="rtl"
        className="flex-1 w-full flex flex-col justify-between p-4 bg-black text-white select-none overflow-y-auto"
      >
        {/* Top Header */}
        <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-purple-400" />
            <span className="font-sans font-black text-base text-white">
              حكم المحكمة في حقك
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-sans text-zinc-300">
            الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
          </span>
        </div>

        {/* Verdict Display Card */}
        <div className="my-auto py-4 space-y-4">
          <div
            className={`p-5 rounded-3xl border-2 transition-all text-center shadow-lg ${
              isInnocent
                ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                : isGuilty
                ? 'bg-red-950/40 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                : 'bg-amber-950/40 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
            }`}
          >
            <div className="flex justify-center mb-3">
              {isInnocent ? (
                <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              ) : isGuilty ? (
                <div className="w-14 h-14 rounded-2xl bg-red-950 border border-red-400 flex items-center justify-center text-red-400">
                  <AlertOctagon className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-400">
                  <Clock className="w-8 h-8" />
                </div>
              )}
            </div>

            <h3
              className={`font-sans font-black text-2xl mb-1 ${
                isInnocent
                  ? 'text-emerald-400'
                  : isGuilty
                  ? 'text-red-400'
                  : 'text-amber-400'
              }`}
            >
              {displayLabel}
            </h3>

            <div className="inline-block px-3 py-1 rounded-full bg-black/60 border border-white/10 text-sm font-sans font-black text-white mt-1">
              النقاط: {formatPoints(score)}
            </div>

            {/* Submitted excuse quote */}
            <div className="my-3 p-3 rounded-2xl bg-black/50 border border-white/5 text-right">
              <div className="text-[11px] font-sans text-zinc-400 mb-0.5">عذرك المقدم:</div>
              <div className="text-sm font-sans font-bold text-zinc-200">
                "{myVerdict.excuse}"
              </div>
            </div>

            {/* Judge Roast (No penalties) */}
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-right space-y-1">
              <div className="text-xs font-sans text-purple-300 font-bold mb-1 flex items-center gap-1.5">
                <Gavel className="w-3.5 h-3.5 text-purple-400" />
                <span>تحليل الشبح القاضي:</span>
              </div>
              <div className="text-sm font-sans text-zinc-100 font-semibold leading-relaxed">
                {roast}
              </div>
            </div>
          </div>
        </div>

        {/* Readiness Button */}
        <div className="pt-2 border-t border-zinc-900">
          <button
            onClick={() => {
              sound.playClick();
              onToggleReady();
            }}
            className={`w-full py-3.5 px-4 rounded-2xl font-sans font-black text-base flex items-center justify-center gap-2 active:scale-98 transition-all ${
              isReadyForNextRound
                ? 'bg-zinc-800 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-white hover:bg-zinc-200 text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            {isReadyForNextRound ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>
                  جاهز للجلسة التالية ({toArabicNumber(readyCount)}/{toArabicNumber(totalConnectedCount)})
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>أنا جاهز للجلسة التالية</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Input Phase / Waiting Phase
  return (
    <div
      dir="rtl"
      className="flex-1 w-full flex flex-col justify-between p-4 bg-black text-white select-none overflow-y-auto"
    >
      {/* Top Header: Context Tag & Round Indicator */}
      <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/60 text-purple-300 font-sans font-bold text-xs">
          <Scale className="w-3.5 h-3.5 text-purple-400" />
          <span>{predicament.contextTag}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-sans text-zinc-400">
            الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
          </span>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-xs font-sans font-bold ${
              timerSeconds <= 10
                ? 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{toArabicNumber(timerSeconds)} ث</span>
          </div>
        </div>
      </div>

      {/* Predicament Card with Key Evidence */}
      <div className="my-3 p-4 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-sans font-bold text-zinc-400">
            القضية المرفوعة ضدك:
          </div>
          {predicament.category && (
            <span className="text-[10px] font-sans font-bold px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400">
              {predicament.category}
            </span>
          )}
        </div>
        <h2 className="font-sans font-black text-lg text-white leading-snug">
          {predicament.title}
        </h2>
        <p className="font-sans text-sm text-zinc-300 leading-relaxed bg-black/60 p-3 rounded-2xl border border-white/5">
          {predicament.description}
        </p>

        {predicament.keyEvidence && (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-right">
            <div className="text-[11px] font-sans font-bold text-red-400 mb-0.5">
              الدليل القاطع الذي يجب عليك تفنيده:
            </div>
            <div className="text-xs font-sans font-semibold text-red-200 leading-relaxed">
              {predicament.keyEvidence}
            </div>
          </div>
        )}
      </div>

      {/* Submission State vs Input Form */}
      {hasSubmitted ? (
        <div className="my-auto py-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-purple-950/80 border-2 border-purple-500/80 flex items-center justify-center text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
            <Gavel className="w-8 h-8 animate-bounce" />
          </div>
          <h3 className="font-sans font-black text-xl text-white">
            تم تسليم عذرك إلى المحكمة!
          </h3>
          <p className="font-sans text-sm text-zinc-400 max-w-xs mx-auto">
            القاضي يراجع ملفك الآن... استعد لسماع الحكم وقصف الجبهة أمام الجلسة.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-sans text-zinc-300">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>متبقي على قفل المرافعات: {toArabicNumber(timerSeconds)} ثانية</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between my-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-sans font-bold text-xs text-zinc-400">
                صغ عذرك المبرر أمام القاضي:
              </label>
              <span
                className={`font-sans text-xs font-mono font-bold ${
                  charCount >= maxChars ? 'text-red-400' : 'text-zinc-500'
                }`}
              >
                [{toArabicNumber(charCount)} / {toArabicNumber(maxChars)}]
              </span>
            </div>

            <textarea
              value={excuseText}
              onChange={handleTextChange}
              placeholder="اكتب عذراً داهية ينجيك من السجن المؤبد..."
              maxLength={maxChars}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-3.5 text-white font-sans font-bold text-base placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 transition-colors resize-none leading-relaxed"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!excuseText.trim()}
              className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-sans font-black text-base flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              <Send className="w-5 h-5 fill-current" />
              <span>اعتمد العذر يا حضرة القاضي</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
