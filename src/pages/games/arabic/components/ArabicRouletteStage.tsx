import React, { useState, useEffect } from 'react';
import { ARABIC_LETTERS } from '../../../../data/arabicCategories';
import { toArabicNumber } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ArabicRouletteStageProps {
  targetLetter: string;
  roundNumber: number;
  totalRounds: number;
  isTV?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export const ArabicRouletteStage: React.FC<ArabicRouletteStageProps> = ({
  targetLetter,
  roundNumber,
  totalRounds,
  isTV = false,
  onComplete,
  onSkip,
}) => {
  const [displayLetter, setDisplayLetter] = useState<string>(
    () => ARABIC_LETTERS[Math.floor(Math.random() * ARABIC_LETTERS.length)]
  );
  const [isSettled, setIsSettled] = useState<boolean>(false);

  useEffect(() => {
    let speed = 50;
    let elapsed = 0;
    const totalDuration = 2800; // 2.8 seconds
    let timeoutId: any = null;

    const tick = () => {
      elapsed += speed;
      sound.playTick();

      if (elapsed >= totalDuration) {
        setDisplayLetter(targetLetter);
        setIsSettled(true);
        sound.playClick();
        // Give 1.2s to admire the chosen letter before starting
        timeoutId = setTimeout(() => {
          onComplete?.();
        }, 1200);
        return;
      }

      // Pick random letter from pool
      const randomIdx = Math.floor(Math.random() * ARABIC_LETTERS.length);
      setDisplayLetter(ARABIC_LETTERS[randomIdx]);

      // Gradually increase interval (slow down)
      if (elapsed > 1800) {
        speed += 40;
      } else if (elapsed > 1000) {
        speed += 15;
      }

      timeoutId = setTimeout(tick, speed);
    };

    timeoutId = setTimeout(tick, speed);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [targetLetter, onComplete]);

  return (
    <div
      dir="rtl"
      className="flex-1 w-full flex flex-col items-center justify-center p-4 bg-black text-white select-none"
    >
      {/* Top Round Badge */}
      <div className="mb-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 font-sans font-bold text-sm">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span>
          الجولة {toArabicNumber(roundNumber)} من {toArabicNumber(totalRounds)}
        </span>
      </div>

      <h2
        className={`font-sans font-black tracking-tight text-center text-zinc-400 mb-8 ${
          isTV ? 'text-3xl' : 'text-xl'
        }`}
      >
        {isSettled ? 'حرف الجولة المعتمد!' : 'سحب حرف الجولة...'}
      </h2>

      {/* Iridescent Gradient Ring Card */}
      <div
        className={`p-1.5 rounded-3xl transition-all duration-300 ${
          isSettled
            ? 'bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] via-[#4ADE80] to-[#BEF264] shadow-[0_0_50px_rgba(56,189,248,0.4)] scale-105'
            : 'bg-zinc-800'
        }`}
      >
        <div
          className={`flex items-center justify-center bg-black rounded-[22px] border border-white/10 ${
            isTV ? 'w-64 h-64' : 'w-44 h-44'
          }`}
        >
          <span
            className={`font-sans font-black text-white transition-transform ${
              isTV ? 'text-9xl' : 'text-7xl'
            } ${isSettled ? 'scale-110 text-emerald-400' : 'scale-100'}`}
          >
            {displayLetter}
          </span>
        </div>
      </div>

      <p className="mt-6 text-zinc-500 font-sans text-sm text-center">
        {isSettled
          ? 'استعدوا! بدء الجولة خلال ثوانٍ...'
          : 'الروليت يدور ويستقر على حرف عشوائي'}
      </p>

      {/* Host Skip Button on TV */}
      {isTV && onSkip && (
        <button
          onClick={onSkip}
          className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 text-sm font-sans font-bold transition-all"
        >
          <span>تخطي والبدء فوراً</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
