// src/pages/ai/ai-room/components/VotingGrid.tsx
import React, { useState } from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Suspect } from '../types';

interface VotingGridProps {
  suspects: Suspect[];
  myAvatarId: string;
  onVote: (targetAvatarId: string) => void;
  hasVoted: boolean;
  disabled?: boolean;
}

export const VotingGrid: React.FC<VotingGridProps> = ({
  suspects,
  myAvatarId,
  onVote,
  hasVoted,
  disabled = false,
}) => {
  const [selectedSuspectId, setSelectedSuspectId] = useState<string | null>(null);

  const handleSelectSuspect = (avatarId: string) => {
    if (avatarId === myAvatarId || hasVoted || disabled) return; // Self-vote guard
    setSelectedSuspectId(avatarId);
  };

  const handleConfirmVote = () => {
    if (!selectedSuspectId || hasVoted || disabled) return;
    onVote(selectedSuspectId);
  };

  if (hasVoted) {
    const votedSuspect = suspects.find((s) => s.avatarId === selectedSuspectId);
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#F7F4EC] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-[#2C2A29] flex items-center justify-center text-emerald-800 shadow-[2px_2px_0px_#2C2A29]">
          <Check size={36} className="stroke-[3]" />
        </div>
        <h3 className="text-xl font-black text-[#000000]">
          تم تسجيل تصويتك بنجاح!
        </h3>
        {votedSuspect && (
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-stone-700">
            <span>اخترت المشتبه به:</span>
            <span className="px-3 py-1 bg-white rounded-lg border-2 border-[#2C2A29] font-black">
              {votedSuspect.avatarName}
            </span>
          </div>
        )}
        <p className="text-sm font-bold text-[#5C4033] max-w-xs">
          انظر لشاشة التلفاز لمشاهدة كشف الستار والنتائج!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#E5E0D5] rounded-2xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] p-4 overflow-hidden">
      {/* Title */}
      <div className="text-center pb-3 border-b-2 border-[#2C2A29] shrink-0">
        <div className="flex items-center justify-center gap-2 mb-1">
          <ShieldAlert className="text-[#2C2A29]" size={22} />
          <h2 className="text-xl font-black text-[#000000]">من هو الذكاء الاصطناعي؟</h2>
        </div>
        <p className="text-xs font-bold text-[#5C4033]">
          اختر الأفاتار الذي تعتقد أنه الروبوت المتنكر. لا يمكنك التصويت لنفسك!
        </p>
      </div>

      {/* Grid of Suspects */}
      <div className="flex-1 overflow-y-auto py-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pr-1">
        {suspects.map((suspect) => {
          const isSelf = suspect.avatarId === myAvatarId;
          const isSelected = selectedSuspectId === suspect.avatarId;

          const IconComponent =
            (Icons as unknown as Record<string, React.ElementType>)[suspect.iconName] ||
            Icons.HelpCircle;

          return (
            <button
              key={suspect.avatarId}
              type="button"
              disabled={isSelf || disabled}
              onClick={() => handleSelectSuspect(suspect.avatarId)}
              className={`w-full p-3 rounded-xl flex items-center justify-between font-bold transition-all duration-150 ${
                isSelected
                  ? 'border-4 border-[#8A9A5B] bg-[#EAD7BB] translate-y-0.5 shadow-[2px_2px_0px_#2C2A29]'
                  : isSelf
                  ? 'border-2 border-stone-300 bg-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                  : 'border-2 border-[#2C2A29] bg-[#F7F4EC] text-[#2C2A29] hover:bg-white shadow-[3px_3px_0px_#2C2A29] active:translate-y-0.5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg border-2 border-[#2C2A29] bg-white flex items-center justify-center shrink-0">
                  <IconComponent size={22} className="text-[#2C2A29]" />
                </div>
                <div className="text-right">
                  <span className="font-black text-sm block leading-tight text-[#000000]">
                    {suspect.avatarName}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] font-bold text-stone-500">
                      (هذا قناعك أنت)
                    </span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="w-7 h-7 rounded-full bg-[#8A9A5B] text-white flex items-center justify-center border-2 border-[#2C2A29] shrink-0">
                  <Check size={16} className="stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm Button */}
      <div className="pt-3 border-t-2 border-[#2C2A29] shrink-0">
        <button
          type="button"
          onClick={handleConfirmVote}
          disabled={!selectedSuspectId || disabled}
          className="w-full py-3.5 bg-[#8A9A5B] text-white rounded-xl border-2 border-[#2C2A29] font-bold text-base shadow-[4px_4px_0px_#2C2A29] hover:bg-[#2C2A29] active:translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2"
        >
          <Check size={20} className="stroke-[3]" />
          <span>تأكيد التصويت</span>
        </button>
      </div>
    </div>
  );
};
