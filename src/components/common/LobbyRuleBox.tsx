import React from 'react';
import { BookOpen } from 'lucide-react';

interface LobbyRuleBoxProps {
  summary: string;
  className?: string;
  gameTitle?: string; // Kept for backwards compatibility if passed, but ignored in title per requirements
}

export const LobbyRuleBox: React.FC<LobbyRuleBoxProps> = ({
  summary,
  className = '',
}) => {
  return (
    <div
      className={`w-full max-w-2xl mx-auto bg-[#F7F4EC] border-2 border-[#2C2A29] rounded-2xl p-4 shadow-[4px_4px_0px_#2C2A29] text-center select-none ${className}`}
      dir="rtl"
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#8A9A5B]/15 text-[#8A9A5B] text-xs font-black mb-1.5 border border-[#8A9A5B]/30">
        <BookOpen className="w-3.5 h-3.5" />
        <span>طريقة اللعب</span>
      </div>
      <p className="text-sm font-bold text-[#000000] leading-relaxed">
        {summary}
      </p>
    </div>
  );
};
