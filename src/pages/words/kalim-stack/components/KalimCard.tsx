import React from 'react';
import { LetterCard } from '../types';

interface KalimCardProps {
  card: LetterCard;
  isSelected?: boolean;
  isHoverable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export const KalimCard: React.FC<KalimCardProps> = ({
  card,
  isSelected = false,
  isHoverable = false,
  onClick,
  size = 'md',
  className = '',
  style
}) => {
  const sizeClasses = {
    sm: 'w-12 h-16 text-xl',
    md: 'w-16 h-24 text-3xl',
    lg: 'w-24 h-36 text-5xl',
    xl: 'w-28 h-40 text-6xl'
  }[size];

  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative select-none rounded-2xl bg-[#F7F4EC] border-2 border-[#2C2A29] flex flex-col justify-between p-2 cursor-pointer transition-all duration-150 ease-out ${sizeClasses} ${
        isSelected
          ? '-translate-y-4 border-[#8A9A5B] shadow-[5px_5px_0px_#8A9A5B] z-30'
          : isHoverable
          ? 'hover:-translate-y-3 hover:shadow-[4px_4px_0px_#2C2A29] shadow-[3px_3px_0px_#2C2A29]'
          : 'shadow-[3px_3px_0px_#2C2A29]'
      } ${className}`}
      dir="rtl"
    >
      {/* Top-Right Index */}
      <div className="flex justify-between items-start leading-none px-0.5">
        <span className="text-xs font-black text-[#5C4033] font-mono">{card.letter}</span>
        <span className="text-[10px] font-black text-[#8A9A5B]">{card.points}</span>
      </div>

      {/* Center Hero Letter */}
      <div className="flex-1 flex items-center justify-center font-black text-[#2C2A29] leading-none my-auto">
        {card.letter}
      </div>

      {/* Bottom-Left Inverted Mini Index */}
      <div className="flex justify-start items-end leading-none px-0.5">
        <span className="text-xs font-black text-[#5C4033] font-mono rotate-180">{card.letter}</span>
      </div>
    </div>
  );
};
