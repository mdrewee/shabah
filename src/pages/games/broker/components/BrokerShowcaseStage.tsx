import React, { useEffect, useState } from 'react';
import { BrokerItem } from '../types';
import { formatPriceArabic, toArabicDigits } from '../brokerUtils';
import { sound } from '../../../../lib/audio';
import { AlertTriangle, Clock, Tag, Sparkles, CheckCircle2 } from 'lucide-react';

interface BrokerShowcaseStageProps {
  item: BrokerItem;
  roundNumber: number;
  totalRounds?: number;
  durationSeconds?: number; // default 10s
  onComplete?: () => void;
  isHost?: boolean;
}

export const BrokerShowcaseStage: React.FC<BrokerShowcaseStageProps> = ({
  item,
  roundNumber,
  totalRounds = 5,
  durationSeconds = 10,
  onComplete,
  isHost = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    setSecondsLeft(durationSeconds);
  }, [durationSeconds, item.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-[#000000] text-[#FFFFFF] flex flex-col justify-between items-center p-4 sm:p-8 select-none relative overflow-hidden"
    >
      {/* Top Countdown Header */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-4 z-10 pt-2 sm:pt-4">
        {/* Round Badge */}
        <div className="px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs sm:text-sm font-black flex items-center gap-2">
          <span>الجولة {toArabicDigits(roundNumber)} من {toArabicDigits(totalRounds)}</span>
        </div>

        {/* 10s Countdown Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-[#0A0A0A] border-2 border-[#0A0A0A] shadow-[3px_3px_0px_#0A0A0A]">
          <Clock className={`w-5 h-5 ${secondsLeft <= 3 ? 'text-red-600 animate-spin' : 'text-neutral-700'}`} />
          <span className="text-xs font-black text-neutral-600">يبدأ السوم بعد:</span>
          <span className="text-xl sm:text-2xl font-black font-mono text-[#0A0A0A]">
            {toArabicDigits(secondsLeft)}ث
          </span>
        </div>
      </header>

      {/* Main Showcase Card */}
      <main className="w-full max-w-3xl my-auto z-10 py-6">
        <div className="shabah-border-wrap">
          <div className="shabah-border-inner">
            <div className="shabah-surface p-6 sm:p-10 flex flex-col items-center text-center relative overflow-hidden">
              {/* Category Pill */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neutral-100 border border-neutral-300 text-neutral-800 text-xs sm:text-sm font-black mb-3">
                <Tag className="w-3.5 h-3.5 text-neutral-600" />
                <span>{item.categoryLabel}</span>
              </div>

              {/* Item Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#0A0A0A] mb-3 leading-tight">
                {item.name}
              </h1>

              {/* Description */}
              {item.description && (
                <p className="text-sm sm:text-base font-bold text-neutral-600 mb-6 max-w-2xl leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Glowing Red Flaw Alert Card */}
              <div className="w-full max-w-2xl mb-4 p-4 sm:p-5 rounded-2xl bg-red-500/10 border-2 border-red-500 text-red-700 shadow-[0_0_25px_rgba(239,68,68,0.25)] flex items-center gap-3.5 text-right">
                <div className="p-2 rounded-xl bg-red-500/20 text-red-600 shrink-0">
                  <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1">
                  <span className="text-xs sm:text-sm font-black text-red-800 block mb-0.5">
                    العيب القاتل (ركز عليه في المساومة):
                  </span>
                  <p className="text-sm sm:text-base font-bold text-red-700 leading-relaxed">
                    {item.flaw}
                  </p>
                </div>
              </div>

              {/* Rare Perk Card */}
              {item.perk && (
                <div className="w-full max-w-2xl mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 text-emerald-800 shadow-[0_0_25px_rgba(16,185,129,0.2)] flex items-center gap-3.5 text-right">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-600 shrink-0">
                    <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs sm:text-sm font-black text-emerald-900 block mb-0.5">
                      الميزة النادرة (نقطة قوة):
                    </span>
                    <p className="text-sm sm:text-base font-bold text-emerald-800 leading-relaxed">
                      {item.perk}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Specs */}
              {item.specs && item.specs.length > 0 && (
                <div className="w-full max-w-2xl mb-6 text-right">
                  <span className="text-xs font-black text-neutral-500 block mb-2">
                    المواصفات السريعة:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.specs.map((spec, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-700 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Host Manual Skip Button if host */}
      <footer className="w-full max-w-4xl flex items-center justify-center pb-4 z-10">
        {isHost ? (
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              if (onComplete) onComplete();
            }}
            className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 transition-all cursor-pointer"
          >
            تخطي المعاينة وبدء السوم فوراً
          </button>
        ) : (
          <p className="text-xs text-neutral-400 font-bold animate-pulse text-center">
            تجهّز! اقرأ العيب وفكّر في الحجة اللي بتصدم الشريطي وتخليه يرفع السوم...
          </p>
        )}
      </footer>
    </div>
  );
};
