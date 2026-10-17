import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import { sound } from '../../lib/audio';

interface FullscreenButtonProps {
  className?: string;
  showText?: boolean;
}

export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  className = '',
  showText = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    sound.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <button
      onClick={toggleFullscreen}
      type="button"
      title={isFullscreen ? 'الخروج من الشاشة الكاملة' : 'شاشة كاملة'}
      className={`px-3 py-1.5 bg-[#F7F4EC] hover:bg-[#EDE7D9] text-[#2C2A29] border-2 border-[#2C2A29]/15 rounded-xl shadow-[0_3px_0_#2C2A29] text-xs font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 active:shadow-none cursor-pointer select-none ${className}`}
    >
      {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
      {showText && <span>{isFullscreen ? 'تصغير' : 'شاشة كاملة ⛶'}</span>}
    </button>
  );
};
