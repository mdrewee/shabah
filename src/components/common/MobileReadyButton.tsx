import React from 'react';
import { Check } from 'lucide-react';
import { sound } from '@/lib/audio';

interface MobileReadyButtonProps {
  isReady: boolean;
  onToggle: () => void;
  className?: string;
  readyText?: string;
  unreadyText?: string;
}

export const MobileReadyButton: React.FC<MobileReadyButtonProps> = ({
  isReady,
  onToggle,
  className = '',
  readyText = 'أنا جاهز',
  unreadyText = 'جاهز (اضغط للإلغاء)',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick();
    onToggle();
  };

  return (
    <div className={`w-full my-3 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`w-full py-4 text-xl font-black rounded-xl border-2 border-[#2C2A29] shadow-[4px_4px_0px_#2C2A29] active:translate-y-0.5 flex items-center justify-center gap-2 transition-colors cursor-pointer select-none ${
          isReady
            ? 'bg-[#E5E0D5] text-[#2C2A29]'
            : 'bg-[#8A9A5B] hover:opacity-95 text-white'
        }`}
      >
        {isReady ? (
          <>
            <Check className="w-6 h-6 stroke-[3]" />
            <span>{unreadyText}</span>
          </>
        ) : (
          <span>{readyText}</span>
        )}
      </button>
    </div>
  );
};
