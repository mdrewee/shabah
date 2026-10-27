import React, { useEffect, useState } from 'react';
import { Gavel, Scale } from 'lucide-react';

interface JudgeCourtWaitingScreenProps {
  isTV?: boolean;
}

export const JudgeCourtWaitingScreen: React.FC<JudgeCourtWaitingScreenProps> = ({ isTV = false }) => {
  // Gaze offset state for suspicious shifting eyes: -12px (left), 0px (center), +12px (right)
  const [gazeX, setGazeX] = useState<number>(0);

  useEffect(() => {
    const eyeMovements = [-10, 0, 10, -5, 8, 0];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % eyeMovements.length;
      setGazeX(eyeMovements[idx]);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      dir="rtl"
      className={`w-full ${isTV ? 'h-full max-h-screen' : 'flex-1'} flex flex-col items-center justify-center p-6 bg-black text-white text-center select-none animate-in fade-in duration-300`}
    >
      <div className="relative mb-6">
        {/* Iridescent Outer Ring */}
        <div className="p-1 rounded-full bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_50px_rgba(181,107,255,0.4)] animate-pulse">
          {/* Black Ghost Mask Face */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-[#0A0A0A] border-4 border-[#0A0A0A] flex flex-col items-center justify-center relative overflow-hidden">
            {/* Judge Wig Silhouette Top */}
            <div className="absolute top-2 w-28 h-8 rounded-full bg-neutral-800/60 blur-[1px]" />

            {/* Two Suspicious Shifting Eyes */}
            <div className="flex items-center gap-6 z-10 mt-2">
              {/* Right Eye */}
              <div className="w-9 h-11 rounded-full bg-zinc-900 border-2 border-purple-400/80 flex items-center justify-center overflow-hidden relative shadow-[inset_0_0_10px_rgba(168,85,247,0.5)]">
                <div
                  className="w-4 h-5 rounded-full bg-purple-400 shadow-[0_0_12px_#C084FC] transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${gazeX}px)` }}
                />
              </div>

              {/* Left Eye */}
              <div className="w-9 h-11 rounded-full bg-zinc-900 border-2 border-purple-400/80 flex items-center justify-center overflow-hidden relative shadow-[inset_0_0_10px_rgba(168,85,247,0.5)]">
                <div
                  className="w-4 h-5 rounded-full bg-purple-400 shadow-[0_0_12px_#C084FC] transition-transform duration-300 ease-out"
                  style={{ transform: `translateX(${gazeX}px)` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Pulsing Gavel Badge */}
        <div className="absolute -bottom-2 -left-2 w-12 h-12 rounded-2xl bg-purple-600 border-2 border-black flex items-center justify-center shadow-lg animate-bounce">
          <Gavel className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Mandatory Official Verdict Review Text */}
      <h2 className="font-sans font-bold text-xl sm:text-3xl text-white tracking-tight mb-3">
        محكمة شبح منعقدة... القاضي يفحص ملفات المتهمين
      </h2>

      <p className="font-sans text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed mb-6">
        تدقيق صارم في منطقية الحجج والمخارج القانونية... لا تأخذكم به رأفة ولا شفاعة!
      </p>

      {/* Atmospheric Scale Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs font-sans">
        <Scale className="w-4 h-4 text-purple-400 animate-spin" />
        <span>تداول الأحكام الشرعية وقصف الجبهات قيد التنفيذ...</span>
      </div>
    </div>
  );
};
