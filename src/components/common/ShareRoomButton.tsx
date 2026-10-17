import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { sound } from '../../lib/audio';

interface ShareRoomButtonProps {
  roomCode: string;
  className?: string;
  label?: string;
}

export const ShareRoomButton: React.FC<ShareRoomButtonProps> = ({
  roomCode,
  className = '',
  label = 'مشاركة رابط الغرفة',
}) => {
  const [shared, setShared] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    const cleanCode = (roomCode || '').toUpperCase().replace(/^ROOM_/, '');
    const joinUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/join?code=${cleanCode}`
      : `/join?code=${cleanCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'انضم إلى لعبة طق عصي',
          text: `انضم إلى غرفتي في طق عصي! الرمز: ${cleanCode}`,
          url: joinUrl,
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch (err) {
        // user cancelled or share failed, fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(joinUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      className={`w-full py-3 px-4 bg-[#8A9A5B] hover:bg-[#2C2A29] text-white hover:text-[#E5E0D5] border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-150 ease-out hover:-translate-y-1 active:translate-y-0.5 active:shadow-[1px_1px_0px_#2C2A29] cursor-pointer select-none ${className}`}
    >
      {shared ? (
        <>
          <Check className="w-4 h-4 text-white" />
          <span>تم نسخ رابط الغرفة! ✓</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-white" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
