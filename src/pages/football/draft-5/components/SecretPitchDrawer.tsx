import React, { FC } from 'react';
import { FootballPlayer } from '../../../../data/footballMasterData';
import { DraftPosition, DRAFT_SLOTS_ORDER, DRAFT_POSITION_SHORT_NAMES } from '../types';
import { Shield, User } from 'lucide-react';

interface SecretPitchDrawerProps {
  picks: Record<DraftPosition, FootballPlayer | null>;
  selectedPosition?: DraftPosition | null;
  onSelectSlot?: (pos: DraftPosition) => void;
  interactive?: boolean;
}

export const SecretPitchDrawer: FC<SecretPitchDrawerProps> = ({
  picks,
  selectedPosition,
  onSelectSlot,
  interactive = false,
}) => {
  const filledCount = Object.values(picks).filter(Boolean).length;

  return (
    <div className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-2xl p-3 select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E5E0D5]">
        <span className="text-xs font-black text-[#2C2A29] flex items-center gap-1.5">
          <Shield size={14} className="text-[#8A9A5B]" />
          تشكيلة الفريق الخماسي
        </span>
        <span className="text-[10px] font-black text-[#5C4033] bg-[#E5E0D5] px-2 py-0.5 rounded-full border border-[#2C2A29]">
          {filledCount}/5 مكتمل
        </span>
      </div>

      {/* 5-Slot Tactical Pitch Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {DRAFT_SLOTS_ORDER.map((pos) => {
          const player = picks[pos];
          const isFilled = Boolean(player);
          const isSelected = selectedPosition === pos;
          const label = DRAFT_POSITION_SHORT_NAMES[pos];

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
              className={`rounded-xl border-2 p-1.5 flex flex-col items-center justify-center text-center transition-all min-h-[76px] ${
                isFilled
                  ? 'bg-[#8A9A5B] border-[#2C2A29] text-[#F7F4EC] shadow-[1px_1px_0px_#2C2A29]'
                  : isSelected
                  ? 'bg-[#E5E0D5] border-[#C68B59] ring-2 ring-[#C68B59] text-[#2C2A29] shadow-[2px_2px_0px_#2C2A29]'
                  : interactive
                  ? 'bg-[#E5E0D5] border-dashed border-[#C68B59] hover:bg-white text-[#5C4033] cursor-pointer'
                  : 'bg-[#E5E0D5] border-[#2C2A29] text-[#5C4033] opacity-80'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-wider mb-1">
                {label}
              </span>

              {player ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-white text-[#2C2A29] border border-[#2C2A29] flex items-center justify-center text-[10px] font-black overflow-hidden shrink-0">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                  <span className="text-[10px] font-black leading-tight mt-1 truncate max-w-full">
                    {player.name}
                  </span>
                </>
              ) : (
                <div className="w-7 h-7 rounded-full border border-dashed border-[#C68B59] bg-[#F7F4EC] flex items-center justify-center text-[10px] font-black text-[#C68B59]">
                  فارغ
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
