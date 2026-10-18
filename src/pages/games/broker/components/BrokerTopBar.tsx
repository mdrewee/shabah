import React from 'react';
import { ShabahGhost, ShabahMood } from '../../../../components/mascot/ShabahGhost';
import { toArabicDigits } from '../brokerUtils';
import { sound } from '../../../../lib/audio';
import { Clock, Copy, Check, ArrowRight, X } from 'lucide-react';

interface BrokerTopBarProps {
  roomCode: string;
  roundNumber: number;
  timerSeconds?: number;
  mood?: ShabahMood;
  remark?: string;
  isHost?: boolean;
  onReturnToLobby?: () => void;
  onExit?: () => void;
}

export const BrokerTopBar: React.FC<BrokerTopBarProps> = ({
  roomCode,
  roundNumber,
  timerSeconds,
  mood = 'judging',
  remark,
  isHost = false,
  onReturnToLobby,
  onExit,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async () => {
    sound.playClick();
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const isLowTime = timerSeconds !== undefined && timerSeconds <= 10;

  return (
    <header className="w-full bg-[#000000] border-b-2 border-white/10 px-4 sm:px-8 py-3 flex items-center justify-between select-none relative z-30">
      {/* Right Section: Room Code & Round Badge */}
      <div className="flex items-center gap-3">
        {/* Room Code Pill */}
        <div className="shabah-pill-wrap">
          <div className="shabah-pill-inner">
            <button
              type="button"
              onClick={handleCopyCode}
              className="shabah-pill-surface px-3.5 py-1.5 flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
              title="نسخ كود الغرفة"
            >
              <span className="text-xs font-black text-neutral-600">الغرفة:</span>
              <span className="text-sm font-black text-[#0A0A0A] tracking-wider uppercase">
                {roomCode}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
              )}
            </button>
          </div>
        </div>

        {/* Round Badge */}
        <div className="px-3.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs font-black">
          الجولة {toArabicDigits(roundNumber)}
        </div>
      </div>

      {/* Center Section: Mascot + Live Remark */}
      <div className="hidden md:flex items-center gap-3 max-w-md">
        <div className="w-9 h-9 shrink-0">
          <ShabahGhost mood={mood} className="w-full h-full" />
        </div>
        {remark && (
          <div className="shabah-pill-wrap">
            <div className="shabah-pill-inner">
              <div className="shabah-pill-surface px-4 py-1 text-xs font-black text-[#0A0A0A] truncate max-w-sm">
                {remark}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Left Section: Timer & Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Timer Box */}
        {timerSeconds !== undefined && (
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 font-black transition-colors ${
              isLowTime
                ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse'
                : 'bg-white/10 text-white border-white/20'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-400 animate-spin' : 'text-neutral-400'}`} />
            <span className="text-sm font-mono tracking-wider">
              {toArabicDigits(timerSeconds)}ث
            </span>
          </div>
        )}

        {/* Host Controls */}
        {isHost && onReturnToLobby && (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black border border-white/20 transition-all cursor-pointer flex items-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>اللوبي</span>
          </button>
        )}

        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="px-2.5 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-black border border-red-500/40 transition-all cursor-pointer"
            title="إنهاء الغرفة"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
