// src/pages/ai/ai-room/components/AvatarBadge.tsx
import React from 'react';
import * as Icons from 'lucide-react';
import { Suspect } from '../types';

interface AvatarBadgeProps {
  suspect: Suspect;
  size?: 'sm' | 'md' | 'lg';
  showRealName?: boolean;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badgeLabel?: string;
  isSelf?: boolean;
}

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  suspect,
  size = 'md',
  showRealName = false,
  selected = false,
  onClick,
  disabled = false,
  badgeLabel,
  isSelf = false,
}) => {
  // Dynamically resolve icon from lucide
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[suspect.iconName] || Icons.HelpCircle;

  const sizeClasses = {
    sm: 'p-1.5 text-xs gap-1.5',
    md: 'p-2.5 text-sm gap-2',
    lg: 'p-4 text-base gap-3',
  }[size];

  const iconSizes = {
    sm: 16,
    md: 22,
    lg: 32,
  }[size];

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`relative inline-flex items-center justify-between rounded-xl border-2 border-[#2C2A29] font-bold transition-all duration-150 ${sizeClasses} ${
        selected
          ? 'bg-[#8A9A5B] text-white shadow-[4px_4px_0px_#2C2A29] -translate-y-0.5'
          : disabled
          ? 'bg-stone-200 text-stone-500 opacity-60 cursor-not-allowed shadow-[2px_2px_0px_#2C2A29]'
          : 'bg-[#F7F4EC] text-[#2C2A29] hover:bg-stone-100 shadow-[3px_3px_0px_#2C2A29] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#2C2A29]'
      }`}
      style={{
        backgroundColor: selected ? undefined : suspect.bgTone || '#F7F4EC',
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex items-center justify-center rounded-lg border-2 border-[#2C2A29] bg-white ${
            size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'
          }`}
        >
          <IconComponent size={iconSizes} className="text-[#2C2A29]" />
        </div>
        <div className="flex flex-col text-right">
          <span className="font-black leading-tight">{suspect.avatarName}</span>
          {showRealName && suspect.realPlayerName && (
            <span className="text-xs font-semibold text-[#8A9A5B] mt-0.5">
              ({suspect.realPlayerName})
            </span>
          )}
          {showRealName && suspect.isAi && (
            <span className="text-xs font-black text-rose-600 mt-0.5">
              [الذكاء الاصطناعي]
            </span>
          )}
        </div>
      </div>

      {isSelf && (
        <span className="text-[10px] bg-[#2C2A29] text-white px-1.5 py-0.5 rounded border border-[#2C2A29]">
          أنت
        </span>
      )}

      {badgeLabel && (
        <span className="text-xs bg-[#C68B59] text-white px-2 py-0.5 rounded-full border border-[#2C2A29] shadow-[1px_1px_0px_#2C2A29]">
          {badgeLabel}
        </span>
      )}
    </button>
  );
};
