import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Share2, Check } from 'lucide-react';

interface MobileTopBarProps {
  roomCode?: string;
  onExit?: () => void;
  title?: string;
  points?: number;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({ roomCode, onExit, title, points }) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleDefaultExit = () => {
    if (onExit) {
      onExit();
    } else {
      localStorage.removeItem('taq_room_code');
      navigate('/');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'طق عصي',
          text: `انضم معي في لعبة طق عصي! كود الغرفة: ${roomCode || ''}`,
          url: shareUrl,
        });
      } catch (err) {
        copyFallback(shareUrl);
      }
    } else {
      copyFallback(shareUrl);
    }
  };

  const copyFallback = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const orangeBtnStyle =
    'h-9 px-3 bg-[#C68B59] text-white border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-[#2C2A29] hover:text-[#E5E0D5] hover:-translate-y-0.5 active:translate-y-0.5 text-xs cursor-pointer';

  return (
    <header className="w-full flex items-center justify-between py-2 px-1 mb-2 z-50">
      {/* Exit Button & Optional Points / Title */}
      <div className="flex items-center gap-2">
        <button onClick={handleDefaultExit} className={orangeBtnStyle} title="خروج">
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </button>

        {points !== undefined && (
          <div className="px-3 py-1 bg-[#C68B59] text-white rounded-xl font-bold text-xs border-2 border-[#2C2A29] shadow-[3px_3px_0px_#2C2A29] flex items-center gap-1 h-9">
            <span>نقاطي:</span> <span className="font-mono text-sm font-black">{points} pt</span>
          </div>
        )}

        {title && (
          <span className="text-xs font-bold text-[#000000] truncate max-w-[130px] hidden sm:inline">
            {title}
          </span>
        )}
      </div>

      {/* Right Controls: Share ONLY (Fullscreen removed on mobile per instructions) */}
      <div className="flex items-center gap-2">
        <button onClick={handleShare} className={orangeBtnStyle} title="مشاركة رابط الغرفة">
          {copied ? <Check className="w-3.5 h-3.5 text-green-200" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ!' : 'مشاركة'}</span>
        </button>
      </div>
    </header>
  );
};
