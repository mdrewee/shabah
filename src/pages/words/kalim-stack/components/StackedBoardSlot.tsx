import React from 'react';
import { BoardSlot } from '../types';
import { KalimCard } from './KalimCard';

interface StackedBoardSlotProps {
  slot: BoardSlot;
  isTargetable?: boolean;
  onSlotClick?: () => void;
  size?: 'md' | 'lg' | 'xl';
  slotLabel?: string;
}

export const StackedBoardSlot: React.FC<StackedBoardSlotProps> = ({
  slot,
  isTargetable = false,
  onSlotClick,
  size = 'lg',
  slotLabel
}) => {
  const stackCount = Math.min(slot.stackHistory.length, 4); // Up to 4 visual physical layers

  const dimensions = {
    md: { w: 'w-16', h: 'h-24', widthPx: '64px', heightPx: '96px' },
    lg: { w: 'w-24', h: 'h-36', widthPx: '96px', heightPx: '144px' },
    xl: { w: 'w-28', h: 'h-40', widthPx: '112px', heightPx: '160px' }
  }[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={isTargetable ? onSlotClick : undefined}
        className={`relative flex items-center justify-center p-3 rounded-2xl transition-all duration-150 select-none ${
          isTargetable
            ? 'cursor-pointer hover:scale-105 active:scale-95 bg-[#8A9A5B]/15 border-2 border-dashed border-[#8A9A5B] shadow-[0_0_12px_rgba(138,154,91,0.3)]'
            : ''
        }`}
      >
        {/* Visual Underneath Stack Layers */}
        {Array.from({ length: stackCount }).map((_, idx) => (
          <div
            key={idx}
            className="absolute rounded-2xl bg-[#E5E0D5] border-2 border-[#2C2A29] pointer-events-none"
            style={{
              width: dimensions.widthPx,
              height: dimensions.heightPx,
              transform: `translate(${(idx + 1) * 3}px, ${(idx + 1) * 3}px)`,
              zIndex: idx
            }}
          />
        ))}

        {/* Active Top Card */}
        <div className="relative" style={{ zIndex: stackCount + 1 }}>
          <KalimCard card={slot.topCard} size={size} />
        </div>
      </div>

      {slotLabel && (
        <span className="text-[10px] font-black text-[#5C4033] bg-[#F7F4EC] border border-[#2C2A29] px-2 py-0.5 rounded-lg shadow-sm">
          {slotLabel}
        </span>
      )}
    </div>
  );
};
