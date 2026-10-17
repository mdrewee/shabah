import React, { FC } from 'react';
import { FootballPlayer } from '../../../../data/footballMasterData';
import { DraftPosition, DRAFT_SLOTS_ORDER, DRAFT_POSITION_SHORT_NAMES } from '../types';

interface DraftTacticalPitchProps {
  picks: Record<DraftPosition, FootballPlayer | null>;
  selectedPosition?: DraftPosition | null;
  onSelectSlot?: (pos: DraftPosition) => void;
  interactive?: boolean;
}

export const DraftTacticalPitch: FC<DraftTacticalPitchProps> = ({
  picks,
  selectedPosition,
  onSelectSlot,
  interactive = true,
}) => {
  const renderSlotButton = (pos: DraftPosition) => {
    const player = picks[pos];
    const isFilled = Boolean(player);
    const isSelected = selectedPosition === pos;
    const defaultLabel = DRAFT_POSITION_SHORT_NAMES[pos];

    return (
      <button
        key={pos}
        type="button"
        disabled={!interactive || isFilled}
        onClick={() => {
          if (interactive && !isFilled && onSelectSlot) {
            onSelectSlot(pos);
          }
        }}
        className={`relative z-10 transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
          isFilled
            ? 'cursor-default'
            : isSelected
            ? 'animate-pulse scale-105'
            : interactive
            ? 'hover:scale-105 active:scale-95'
            : 'opacity-80 cursor-default'
        }`}
      >
        {player ? (
          // Confirmed Player Card replacing position label completely
          <div className="bg-[#F7F4EC] text-[#2C2A29] font-black text-xs sm:text-sm px-2.5 py-1.5 rounded-lg border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] max-w-[120px] sm:max-w-[140px] truncate text-center flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8A9A5B] shrink-0" />
            <span className="truncate">{player.name}</span>
          </div>
        ) : (
          // Unfilled Slot
          <div
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all ${
              isSelected
                ? 'bg-[#C68B59] text-[#F7F4EC] border-2 border-[#F7F4EC] shadow-[3px_3px_0px_#2C2A29]'
                : 'bg-[#F7F4EC]/20 text-[#F7F4EC] border-2 border-dashed border-[#F7F4EC] hover:bg-[#F7F4EC]/30'
            }`}
          >
            <span>[{defaultLabel}]</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      className="w-full h-[45vh] min-h-[260px] max-h-[360px] bg-[#43603E] border-3 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-2xl relative overflow-hidden flex flex-col justify-between p-3 select-none"
      dir="rtl"
    >
      {/* Field Markings (Faint White Lines) */}
      {/* Midfield Line / Penalty Box Outline */}
      <div className="absolute top-0 left-0 right-0 h-1 border-b-2 border-white/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-10 border-b-2 border-x-2 border-white/25 rounded-b-xl" />

      {/* Center Circle Arc at Top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-12 border-b-2 border-white/20 rounded-b-full pointer-events-none" />

      {/* Goal Area at Bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t-2 border-x-2 border-white/30 rounded-t-lg pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-9 border-t-2 border-x-2 border-white/30 rounded-t-md pointer-events-none" />
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/40 pointer-events-none" />

      {/* Pitch Grass Texture Stripes */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.15) 20px, rgba(0,0,0,0.15) 40px)',
        }}
      />

      {/* 1. Attack Row (FWD) - Centered at the top */}
      <div className="w-full flex justify-center pt-1">
        {renderSlotButton('FWD')}
      </div>

      {/* 2. Midfield Row (MID) - Centered in middle zone */}
      <div className="w-full flex justify-center py-1">
        {renderSlotButton('MID')}
      </div>

      {/* 3. Defense Row (DEF 1 & DEF 2) - Flanking center defense */}
      <div className="w-full flex justify-around px-4 sm:px-8 py-1">
        {renderSlotButton('DEF_1')}
        {renderSlotButton('DEF_2')}
      </div>

      {/* 4. Goalkeeper Row (GK) - Inside goalmouth at bottom */}
      <div className="w-full flex justify-center pb-1">
        {renderSlotButton('GK')}
      </div>
    </div>
  );
};
