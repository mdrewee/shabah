// src/pages/ai/ai-lawyer/components/VerdictStampCard.tsx
import React from 'react';
import { DefenseAnalysis } from '../types';

interface VerdictStampCardProps {
  evaluation: DefenseAnalysis;
  isWinner?: boolean;
}

export const VerdictStampCard: React.FC<VerdictStampCardProps> = ({
  evaluation
}) => {
  const isAccepted = evaluation.verdict === 'مقبول';

  return (
    <div
      className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col justify-between h-auto min-h-fit w-full ${
        isAccepted
          ? 'bg-[#F7F4EC] border-[#8A9A5B] shadow-[4px_4px_0px_#8A9A5B]'
          : 'bg-[#B85C5C]/10 border-[#B85C5C] shadow-[4px_4px_0px_#B85C5C]'
      }`}
      dir="rtl"
    >
      {/* 1. Physical Stamp - Positioned at top-left corner */}
      <div className="absolute top-3 left-3 transform -rotate-12 pointer-events-none select-none z-10">
        <div
          className={`border-4 px-3 py-1 rounded-xl font-black text-sm md:text-base tracking-wider uppercase shadow-sm ${
            isAccepted
              ? 'border-[#8A9A5B] text-[#8A9A5B] bg-[#8A9A5B]/15'
              : 'border-[#B85C5C] text-[#B85C5C] bg-[#B85C5C]/20'
          }`}
        >
          {isAccepted ? 'مـقـبـول' : 'مـرفـوض ومـردود'}
        </div>
      </div>

      <div>
        {/* 2. Top Header: Player Name & Centered Score Badge */}
        <div className="flex items-center justify-between mb-4 pl-28">
          <span className="text-lg font-black text-[#2C2A29]">
            {evaluation.playerName}
          </span>

          {/* Centered Score Badge - Safe from Stamp Overlap */}
          <div className="bg-[#E5E0D5] text-[#2C2A29] border-2 border-[#2C2A29] px-3 py-0.5 rounded-xl text-xs font-black shadow-[2px_2px_0px_#2C2A29]">
            الدرجة: {evaluation.logicScore}/10
          </div>
        </div>

        {/* 3. Player's Excuse (Dynamic height, fully wrapped) */}
        <div className="bg-white/90 p-3 rounded-xl border border-[#2C2A29]/20 mb-3">
          <span className="text-[11px] font-black text-[#5C4033] block mb-1">
            عذره المكتوب:
          </span>
          <p className="text-sm font-bold text-[#2C2A29] leading-relaxed break-words whitespace-pre-wrap">
            {evaluation.argumentText || 'لم يقدّم عذراً (انسحب)'}
          </p>
        </div>

        {/* 4. Judge Roast / Critique (Dynamic height, fully wrapped) */}
        <div className="bg-[#F7F4EC] p-3 rounded-xl border border-[#2C2A29]/10">
          <span className="text-[11px] font-black text-[#5C4033] block mb-1">
            حيثيات حكم القاضي:
          </span>
          <p className="text-sm font-bold text-[#2C2A29] leading-relaxed break-words whitespace-pre-wrap">
            {evaluation.roastReason}
          </p>
        </div>
      </div>
    </div>
  );
};
