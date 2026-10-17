import React from 'react';
import { LogOut } from 'lucide-react';

interface MobileTopBarProps {
  roomCode: string;
  playerName?: string;
  onLeaveRoom?: () => void;
  onExit?: () => void;
  title?: string;
  points?: number;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  roomCode,
  playerName = 'لاعب',
  onLeaveRoom,
  onExit,
  title,
  points
}) => {
  const handleExit = onLeaveRoom || onExit || (() => { window.location.href = '/'; });

  return (
    <header className="w-full bg-[#E5E0D5] border-b-2 border-[#2C2A29] px-3 py-2 flex justify-between items-center z-30 select-none shrink-0" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-black text-[#2C2A29]">{playerName}</span>
        <span className="text-[10px] font-bold text-[#5C4033] bg-[#F7F4EC] border border-[#2C2A29] px-2 py-0.5 rounded-lg">
          غرفة: {roomCode}
        </span>
        {title && (
          <span className="text-[10px] font-bold bg-[#8A9A5B] text-white border border-[#2C2A29] px-2 py-0.5 rounded-lg hidden sm:inline">
            {title}
          </span>
        )}
        {typeof points === 'number' && points > 0 && (
          <span className="text-[10px] font-black text-[#C68B59] bg-[#F7F4EC] border border-[#2C2A29] px-2 py-0.5 rounded-lg">
            {points} pt
          </span>
        )}
      </div>

      <button
        onClick={handleExit}
        className="flex items-center gap-1 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3 py-1 rounded-xl font-bold text-xs hover:bg-[#2C2A29] active:translate-y-0.5 transition-colors cursor-pointer"
      >
        <LogOut size={13} />
        <span>خروج</span>
      </button>
    </header>
  );
};
