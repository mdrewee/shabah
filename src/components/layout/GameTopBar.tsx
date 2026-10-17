import React, { useState } from 'react';
import { Copy, Check, LogOut } from 'lucide-react';
import { sound } from '@/lib/audio';

export interface GameTopBarProps {
  roomCode: string;
  isHost?: boolean;
  currentRound?: number;
  totalRounds?: number;
  onExit?: () => void;
  onTerminate?: () => void;
  gameTitle?: string;
}

export const GameTopBar: React.FC<GameTopBarProps> = ({
  roomCode,
  isHost = false,
  currentRound,
  totalRounds,
  onExit,
  onTerminate,
  gameTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    sound.playClick();
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleExitClick = () => {
    sound.playClick();
    if (isHost) {
      if (onTerminate) {
        onTerminate();
      } else if (onExit) {
        onExit();
      } else {
        window.location.href = '/';
      }
    } else {
      if (onExit) {
        onExit();
      } else {
        window.location.href = '/';
      }
    }
  };

  return (
    <header
      className="w-full h-14 bg-[#E5E0D5] border-b-2 border-[#2C2A29] px-3 sm:px-4 flex items-center justify-between z-30 select-none shrink-0"
      dir="rtl"
    >
      {/* Right side: Room Code badge + Active Round chip */}
      <div className="flex items-center gap-2 sm:gap-3">
        {gameTitle && (
          <span className="hidden sm:inline font-black text-sm md:text-base text-[#2C2A29]">
            {gameTitle}
          </span>
        )}
        <button
          onClick={handleCopyCode}
          type="button"
          className="flex items-center gap-1.5 bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black tracking-widest text-[#2C2A29] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          title="نسخ كود الغرفة"
        >
          {copied ? <Check size={14} className="text-[#8A9A5B]" /> : <Copy size={14} className="text-[#5C4033]" />}
          <span className="font-mono">{roomCode}</span>
        </button>

        {currentRound !== undefined && (
          <span className="bg-[#F7F4EC] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-[#2C2A29]">
            الجولة {currentRound}{totalRounds ? ` من ${totalRounds}` : ''}
          </span>
        )}
      </div>

      {/* Left side: Single Ochre exit/back button */}
      <div>
        <button
          onClick={handleExitClick}
          type="button"
          className="flex items-center gap-1.5 bg-[#C68B59] hover:opacity-95 text-white font-black border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] px-3 py-1.5 rounded-xl text-xs sm:text-sm transition-opacity cursor-pointer active:translate-y-0.5"
        >
          <LogOut size={14} />
          <span>{isHost ? 'إنهاء اللعبة' : 'خروج'}</span>
        </button>
      </div>
    </header>
  );
};
