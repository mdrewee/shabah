import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toArabicNumber, formatSecondsToTime } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import { roomBus } from '../../../../lib/roomBus';
import { Clock, CheckCircle2, Zap } from 'lucide-react';

interface ArabicMobileInputProps {
  contestantId: string;
  contestantName: string;
  currentLetter: string;
  categories: string[]; // exactly 5 categories
  timerSeconds: number;
  hasSubmitted: boolean;
  onSubmit: (answers: Record<number, string>, durationMs: number) => void;
  roundStartTime: number;
}

export const ArabicMobileInput: React.FC<ArabicMobileInputProps> = ({
  contestantId,
  contestantName,
  currentLetter,
  categories,
  timerSeconds,
  hasSubmitted,
  onSubmit,
  roundStartTime,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>({
    0: '',
    1: '',
    2: '',
    3: '',
    4: '',
  });

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);
  const answersRef = useRef<Record<number, string>>(answers);
  const isSubmittedRef = useRef(hasSubmitted);

  useEffect(() => {
    isSubmittedRef.current = hasSubmitted;
  }, [hasSubmitted]);

  // Force submit answers helper with current live draft
  const forceSubmitAnswers = useCallback(() => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    sound.playClick();
    const duration = roundStartTime > 0 ? Date.now() - roundStartTime : 60000;
    onSubmit({ ...answersRef.current }, duration);
  }, [roundStartTime, onSubmit]);

  // Auto focus first input on mount
  useEffect(() => {
    if (!hasSubmitted) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hasSubmitted]);

  // Auto-submit partial draft answers when timer reaches 0
  useEffect(() => {
    if (timerSeconds <= 0 && !isSubmittedRef.current) {
      forceSubmitAnswers();
    }
  }, [timerSeconds, forceSubmitAnswers]);

  // Listen for definitive ARABIC_TIME_UP signal from TV host
  useEffect(() => {
    const unsub = roomBus.on('ARABIC_TIME_UP', () => {
      forceSubmitAnswers();
    });
    return () => unsub?.();
  }, [forceSubmitAnswers]);

  const handleChange = (index: number, val: string) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: val,
    }));
    answersRef.current[index] = val;
  };

  const handleSubmitEarly = () => {
    if (isSubmittedRef.current) return;
    forceSubmitAnswers();
  };

  // Smart Enter navigation: Jumps to next input without submitting prematurely
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // منع الإرسال المبكر أو نزول سطر
      if (index < categories.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        inputRefs.current[index]?.blur(); // إخفاء الكيبورد في آخر خانة
        submitButtonRef.current?.focus(); // توجيه التركيز لزر تسليم الإجابات
      }
    }
  };

  // If already submitted, show waiting state
  if (hasSubmitted) {
    return (
      <div
        dir="rtl"
        className="flex-1 w-full flex flex-col items-center justify-center p-6 bg-black text-white text-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-950 border-2 border-emerald-500/80 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <h3 className="font-sans font-black text-2xl text-white mb-2">
          تم تسليم إجاباتك!
        </h3>
        <p className="font-sans text-sm text-zinc-400 mb-6">
          وقتك مسجل للمنافسة على بونص السرعة (+٥ نقاط). بانتظار باقي المتسابقين...
        </p>

        {/* Live Timer Indicator */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans font-bold text-lg">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>متبقي: {formatSecondsToTime(timerSeconds)}</span>
        </div>

        {/* Submitted Answers Summary */}
        <div className="mt-8 w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 text-right space-y-2.5">
          <div className="text-xs font-sans font-bold text-zinc-500 mb-1 border-b border-zinc-800 pb-2">
            إجاباتك المسلمة بحرف ({currentLetter}):
          </div>
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="font-sans text-zinc-400">{cat}:</span>
              <span className="font-sans font-bold text-emerald-300 truncate max-w-[180px]">
                {answers[idx] ? answers[idx] : <span className="text-zinc-600">فارغة</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  return (
    <div
      dir="rtl"
      className="flex-1 w-full flex flex-col justify-between p-4 bg-black text-white overflow-y-auto"
    >
      {/* Sticky Top Header with Target Letter and Timer */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md pb-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] p-0.5">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center">
              <span className="font-sans font-black text-2xl text-emerald-400">
                {currentLetter}
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs font-sans text-zinc-400 font-bold">الحرف المطلوب</div>
            <div className="text-xs font-sans text-zinc-500">
              أنجزت {toArabicNumber(answeredCount)} من ٥
            </div>
          </div>
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-sans font-extrabold text-sm ${
            timerSeconds <= 10
              ? 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
              : 'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" />
          <span>{formatSecondsToTime(timerSeconds)}</span>
        </div>
      </div>

      {/* 5 Categories Inputs Stack */}
      <div className="my-4 space-y-3.5 flex-1">
        {categories.map((category, index) => {
          const isLast = index === 4;
          const val = answers[index] || '';

          return (
            <div
              key={index}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 focus-within:border-emerald-500 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-sans font-bold text-sm text-zinc-300 flex items-center gap-1.5">
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
                    {toArabicNumber(index + 1)}
                  </span>
                  <span>{category}</span>
                </label>
                {val.trim().length > 0 && (
                  <span className="text-[11px] font-sans text-emerald-400 font-semibold">
                    تمت الكتابة
                  </span>
                )}
              </div>

              <input
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={val}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                enterKeyHint={isLast ? 'done' : 'next'}
                placeholder={`اكتب ${category} يبدأ بحرف (${currentLetter})...`}
                className="w-full bg-black border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white font-sans font-bold text-base placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
          );
        })}
      </div>

      {/* Action Footer: [خلصت!] button */}
      <div className="pt-2">
        <button
          ref={submitButtonRef}
          onClick={handleSubmitEarly}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-sans font-black text-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all cursor-pointer focus:ring-2 focus:ring-emerald-400 focus:outline-none"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>خلصت! (تسليم الإجابات)</span>
        </button>
      </div>
    </div>
  );
};
