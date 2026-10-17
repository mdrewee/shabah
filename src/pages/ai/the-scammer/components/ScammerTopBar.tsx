// src/pages/ai/the-scammer/components/ScammerTopBar.tsx
import React, { useState } from 'react';
import { Copy, Check, Maximize2, Minimize2, LogOut, RotateCcw } from 'lucide-react';
import { ScammerPhase } from '../types';

interface ScammerTopBarProps {
  roomCode: string;
  phase: ScammerPhase;
  onReturnToLobby?: () => void;
  onLeaveRoom?: () => void;
  isHost?: boolean;
}

export const ScammerTopBar: React.FC<ScammerTopBarProps> = ({
  roomCode,
  phase,
  onReturnToLobby,
  onLeaveRoom,
  isHost = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="w-full bg-[#E5E0D5] border-b-2 border-[#2C2A29] px-4 py-2.5 flex justify-between items-center z-30 select-none" dir="rtl">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-[#5C4033]">حراج الغرفة:</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 bg-[#F7F4EC] text-[#2C2A29] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3 py-1 rounded-xl font-black text-xs hover:bg-white active:translate-y-0.5 cursor-pointer"
        >
          <span>{roomCode}</span>
          {copied ? <Check className="text-[#8A9A5B]" size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleFullscreen}
          title="ملء الشاشة"
          className="p-1.5 bg-[#F7F4EC] text-[#2C2A29] border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] rounded-xl hover:bg-white active:translate-y-0.5 cursor-pointer"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>

        {phase !== 'LOBBY' && onReturnToLobby && (
          <button
            onClick={onReturnToLobby}
            className="flex items-center gap-1 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3 py-1 rounded-xl font-bold text-xs hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>العودة للوبي</span>
          </button>
        )}

        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="flex items-center gap-1 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[2px_2px_0px_#2C2A29] px-3 py-1 rounded-xl font-bold text-xs hover:bg-[#2C2A29] active:translate-y-0.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>{isHost ? 'إنهاء الحراج' : 'خروج'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
