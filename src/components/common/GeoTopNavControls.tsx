import React, { useState, useEffect } from 'react';
import { LogOut, RotateCcw, Maximize, Minimize, Copy, Check } from 'lucide-react';
import { sound } from '../../lib/audio';

export interface GeoTopNavControlsProps {
  roomCode: string;
  onExit?: () => void;
  onReturnToLobby?: () => void;
  exitActionType?: 'end_game' | 'return_lobby';
  exitLabel?: string;
  className?: string;
  showFullscreen?: boolean;
  showExit?: boolean;
  showRoomCode?: boolean; // When false, strictly hides the room code & copy button
}

export const GeoTopNavControls: React.FC<GeoTopNavControlsProps> = ({
  roomCode,
  onExit,
  onReturnToLobby,
  exitActionType = 'end_game',
  exitLabel,
  className = '',
  showFullscreen = false,
  showExit = true,
  showRoomCode = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!roomCode) return;
    const clean = roomCode.toUpperCase().replace(/^ROOM_/, '');
    navigator.clipboard.writeText(clean).then(() => {
      setCopied(true);
      sound.playClick();
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    if (exitActionType === 'return_lobby') {
      if (onReturnToLobby) {
        onReturnToLobby();
      } else if (onExit) {
        onExit();
      }
    } else {
      if (onExit) {
        onExit();
      } else {
        window.location.href = '/';
      }
    }
  };

  const isReturnLobby = exitActionType === 'return_lobby';
  const defaultActionLabel = isReturnLobby ? 'العودة للوبي' : 'إنهاء اللعبة';
  const resolvedLabel = exitLabel || defaultActionLabel;

  // Ochre Orange Palette (#C68B59) with Tactile Upward Jump Animation
  const btnStyle =
    'px-2.5 sm:px-3 py-1.5 bg-[#C68B59] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all duration-150 ease-out hover:-translate-y-1 active:translate-y-0.5 active:shadow-[1px_1px_0px_#2C2A29] cursor-pointer select-none shrink-0';

  const cleanCode = (roomCode || '').toUpperCase().replace(/^ROOM_/, '');

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} dir="rtl">
      {/* 1. Room Code Button (Visible in Lobby, strictly hidden during active gameplay when showRoomCode=false) */}
      {showRoomCode && (
        <button
          type="button"
          onClick={handleCopy}
          title="نسخ رمز الغرفة"
          className={`${btnStyle} font-mono`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>تم النسخ!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>كود: {cleanCode}</span>
            </>
          )}
        </button>
      )}

      {/* 2. Fullscreen Button */}
      {showFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة (شاشة كاملة)'}
          className={btnStyle}
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isFullscreen ? 'تصغير' : 'شاشة كاملة'}</span>
        </button>
      )}

      {/* 3. Action Button ("إنهاء اللعبة" in Lobby vs "العودة للوبي" during Gameplay) */}
      {showExit && (
        <button
          type="button"
          onClick={handleActionClick}
          title={resolvedLabel}
          className={btnStyle}
        >
          {isReturnLobby ? (
            <RotateCcw className="w-3.5 h-3.5" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>{resolvedLabel}</span>
        </button>
      )}
    </div>
  );
};
