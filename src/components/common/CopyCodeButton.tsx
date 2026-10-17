import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { sound } from '../../lib/audio';

interface CopyCodeButtonProps {
  code: string;
  className?: string;
}

export const CopyCodeButton: React.FC<CopyCodeButtonProps> = ({ code, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      sound.playClick();
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      title="نسخ رمز الغرفة"
      className={`px-3 py-1.5 bg-[#F7F4EC] hover:bg-[#EDE7D9] text-[#2C2A29] border-2 border-[#2C2A29]/15 rounded-xl shadow-[0_3px_0_#2C2A29] text-xs font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 active:shadow-none cursor-pointer select-none ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-[#8A9A5B]" />
          <span className="text-[#8A9A5B]">تم النسخ!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-[#2C2A29]/60" />
          <span>نسخ الكود</span>
        </>
      )}
    </button>
  );
};
