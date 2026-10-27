import React, { useEffect, useState } from 'react';
import { Compass, Sparkles, ChevronRight } from 'lucide-react';
import { toArabicNumber } from '../../../../utils/numberFormat';
import { sound } from '../../../../lib/audio';
import { ThreeEarthScene } from './ThreeEarthScene';
import { GuideMascot } from './GuideMascot';
import { GuideLandmark } from '../../../../data/guideLandmarks';

interface GuideIntroStageProps {
  roundNumber: number;
  totalRounds: number;
  landmark: GuideLandmark;
  onComplete: () => void;
  onSkip?: () => void;
}

export const GuideIntroStage: React.FC<GuideIntroStageProps> = ({
  roundNumber,
  totalRounds,
  landmark,
  onComplete,
  onSkip,
}) => {
  // Stage: 0 = Ghost visible, 1 = Ghost spins & scales 1 -> 0, 2 = Complete
  const [ghostStage, setGhostStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    sound.playClick();

    // Ghost visible for 2s, then one fast spin while scaling 1 -> 0 over 1.5s
    const tSpin = setTimeout(() => {
      setGhostStage(1);
    }, 2000);

    const tDisappear = setTimeout(() => {
      setGhostStage(2);
    }, 3500);

    // 1s after the ghost vanishes, intro ends and guessing starts
    const tDone = setTimeout(() => {
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(tSpin);
      clearTimeout(tDisappear);
      clearTimeout(tDone);
      sound.stopAllAudio();
    };
  }, [onComplete]);

  return (
    <div
      dir="rtl"
      className="w-full h-screen max-h-screen bg-[#000000] text-white flex flex-col justify-between p-6 select-none relative overflow-hidden"
    >
      {/* Top Banner */}
      <div className="w-full flex items-center justify-between z-20 pb-4 border-b border-zinc-800 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-1 rounded-2xl bg-gradient-to-tr from-[#B56BFF] via-[#38BDF8] to-[#4ADE80] shadow-[0_0_20px_rgba(56,189,248,0.3)]">
            <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
              <Compass className="w-7 h-7 text-emerald-400 animate-spin" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-sans font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الرحلة رقم {toArabicNumber(roundNumber)}</span>
              </span>
              <span className="text-xs font-sans text-zinc-400">
                من {toArabicNumber(totalRounds)} جولات
              </span>
            </div>
            <h1 className="text-2xl font-sans font-black text-white">
              الشبح المرشد ينطلق نحو وجهة سرية!
            </h1>
          </div>
        </div>

        {/* Skip button for host */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onSkip ? onSkip() : onComplete();
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-sans font-bold text-xs transition-colors cursor-pointer"
        >
          <span>تخطي العرض وبدء التخمين</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center Cinematic 3D Scene */}
      <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden">
        {/* Centered Three.js 3D Earth Globe with Gentle Rotation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <ThreeEarthScene
            className="w-full h-full max-w-4xl max-h-[700px]"
          />
        </div>

        {/* Shabah Explorer Mascot: Spins and scales 1 -> 0 over 1.5s */}
        {ghostStage < 2 && (
          <div
            className={`absolute z-30 transition-all duration-[1500ms] ease-in-out pointer-events-none flex flex-col items-center ${
              ghostStage === 0
                ? 'scale-100 rotate-0 opacity-100'
                : 'scale-0 rotate-[360deg] opacity-0'
            }`}
          >
            <GuideMascot mood={ghostStage === 0 ? 'curious' : 'focused'} />
            <div className="mt-3 px-3 py-1 rounded-full bg-black/90 border border-purple-500 text-purple-200 font-sans font-black text-xs shadow-xl">
              الرحالة ينطلق في مهمة استكشافية...
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subtitle / Prompt */}
      <div className="w-full max-w-xl mx-auto bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl p-3.5 text-center z-20 flex-shrink-0">
        <p className="font-sans font-bold text-sm text-zinc-200">
          استعدوا لقراءة التلميحات وتثبيت دبابيسكم على الخريطة بأقرب مسافة!
        </p>
      </div>
    </div>
  );
};

export default GuideIntroStage;
