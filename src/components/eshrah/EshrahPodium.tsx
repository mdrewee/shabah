import React from 'react';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { sound } from '../../lib/audio';

interface EshrahPodiumProps {
  team1Score: number;
  team2Score: number;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const EshrahPodium: React.FC<EshrahPodiumProps> = ({
  team1Score,
  team2Score,
  onPlayAgain,
  onBackToHome
}) => {
  const isTeam1Winner = team1Score > team2Score;
  const isTie = team1Score === team2Score;

  const winnerTitle = isTie
    ? 'تعادل أسطوري بين الفريقين!'
    : isTeam1Winner
    ? 'الفريق الأول هو بطل التحدي!'
    : 'الفريق الثاني هو بطل التحدي!';

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center text-center gap-6 py-6 px-3 select-none" dir="rtl">
      {/* Trophy Icon */}
      <div className="w-24 h-24 rounded-3xl bg-[#8A9A5B] border-2 border-[#2C2A29] shadow-[5px_5px_0px_#2C2A29] flex items-center justify-center text-white">
        <Trophy size={48} />
      </div>

      <div>
        <span className="text-xs font-black text-[#5C4033] bg-[#F7F4EC] border-2 border-[#2C2A29] px-4 py-1 rounded-xl shadow-[2px_2px_0px_#2C2A29]">
          نهاية التحدي
        </span>
        <h2 className="text-3xl md:text-4xl font-black text-[#2C2A29] mt-3">
          {winnerTitle}
        </h2>
      </div>

      {/* Score Comparison Box */}
      <div className="w-full grid grid-cols-2 gap-4">
        {/* Team 1 Score Card */}
        <div
          className={`p-5 rounded-2xl border-2 border-[#2C2A29] flex flex-col items-center gap-2 ${
            isTeam1Winner
              ? 'bg-[#8A9A5B] text-white shadow-[4px_4px_0px_#2C2A29] scale-102'
              : 'bg-[#F7F4EC] text-[#2C2A29] shadow-[3px_3px_0px_#2C2A29]'
          }`}
        >
          <span className="text-sm font-black">الفريق الأول</span>
          <div className="text-4xl md:text-5xl font-black font-mono">
            {team1Score} <span className="text-lg">pt</span>
          </div>
          {isTeam1Winner && (
            <span className="text-[10px] font-black bg-white text-[#8A9A5B] px-2.5 py-0.5 rounded-lg border border-[#2C2A29]">
              فائز
            </span>
          )}
        </div>

        {/* Team 2 Score Card */}
        <div
          className={`p-5 rounded-2xl border-2 border-[#2C2A29] flex flex-col items-center gap-2 ${
            !isTie && !isTeam1Winner
              ? 'bg-[#C68B59] text-white shadow-[4px_4px_0px_#2C2A29] scale-102'
              : 'bg-[#F7F4EC] text-[#2C2A29] shadow-[3px_3px_0px_#2C2A29]'
          }`}
        >
          <span className="text-sm font-black">الفريق الثاني</span>
          <div className="text-4xl md:text-5xl font-black font-mono">
            {team2Score} <span className="text-lg">pt</span>
          </div>
          {!isTie && !isTeam1Winner && (
            <span className="text-[10px] font-black bg-white text-[#C68B59] px-2.5 py-0.5 rounded-lg border border-[#2C2A29]">
              فائز
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex gap-3 pt-2">
        <button
          onClick={() => {
            sound.playClick();
            onPlayAgain();
          }}
          className="flex-1 bg-[#8A9A5B] text-white py-3.5 rounded-2xl font-black text-base border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] hover:bg-[#78884e] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw size={18} />
          <span>لعب جولة ثانية</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onBackToHome();
          }}
          className="flex-1 bg-[#C68B59] text-white py-3.5 rounded-2xl font-black text-base border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] hover:bg-[#b07849] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home size={18} />
          <span>القائمة الرئيسية</span>
        </button>
      </div>
    </div>
  );
};
