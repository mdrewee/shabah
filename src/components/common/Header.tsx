import React, { useState } from 'react';
import { Volume2, VolumeX, Coins } from 'lucide-react';
import { sound } from '../../lib/audio';

interface HeaderProps {
  roomCode?: string;
  roleBadge?: string;
  onExit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ roomCode, roleBadge, onExit }) => {
  const [muted, setMuted] = useState(sound.getMuted());

  const toggleSound = () => {
    const next = !muted;
    sound.setMuted(next);
    setMuted(next);
    if (!next) {
      sound.playClick();
    }
  };

  return (
    <header className="w-full border-b-2 border-ink-950 bg-sand-50/95 backdrop-blur-sm sticky top-0 z-40 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <a href="/" className="flex items-center gap-3 group select-none">
          {/* Logo Mark: Stylized crossed sticks & gathering circle */}
          <div className="w-10 h-10 rounded-tactile bg-olive-500 border-2 border-ink-950 shadow-tactile-sm flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-sand-50"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="20" x2="20" y2="4" />
              <line x1="4" y1="4" x2="20" y2="20" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black tracking-tight text-ink-950 font-display">
              طق عصي
            </span>
          </div>
        </a>

        {/* Center Room Code if in room */}
        {roomCode && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1 bg-sand-200 border-2 border-ink-950 rounded-tactile shadow-tactile-sm text-sm font-bold text-ink-950">
            <span className="text-ink-500 font-normal">الغرفة:</span>
            <span className="font-mono tracking-widest text-base text-olive-800">{roomCode}</span>
          </div>
        )}

        {/* Left Actions: Game Balance + Indicators */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Game Balance Indicator (رصيد الألعاب) */}
          <div
            title="رصيد الألعاب المتاحة"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border-2 border-ink-950 bg-sand-200 text-ink-950 shadow-tactile-sm text-xs font-bold cursor-default select-none transition-all hover:bg-sand-300"
          >
            <Coins className="w-3.5 h-3.5 text-ochre-700" />
            <span>رصيد الألعاب: ٥</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sand-50 border border-ink-950/20 text-ink-600 font-normal">
              قريباً
            </span>
          </div>

          {/* Role badge if active */}
          {roleBadge && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-md border-2 border-ink-950 bg-ochre-100 text-ochre-900 shadow-tactile-sm hidden sm:inline-block">
              {roleBadge}
            </span>
          )}

          {/* Minimalist Placeholders: Audio Toggle */}
          <div className="flex items-center gap-1.5 border-r border-sand-300 pr-2 mr-1">
            <button
              onClick={toggleSound}
              aria-label={muted ? 'تفعيل الصوت' : 'كتم الصوت'}
              title={muted ? 'تفعيل الصوت' : 'كتم الصوت'}
              className="w-8 h-8 flex items-center justify-center rounded-tactile border-2 border-ink-950 bg-sand-100 hover:bg-sand-200 shadow-tactile-sm text-ink-800 transition-all"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5 text-ink-400" /> : <Volume2 className="w-3.5 h-3.5 text-olive-700" />}
            </button>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="text-xs font-bold px-3 py-1.5 rounded-tactile border-2 border-ink-950 bg-sand-200 hover:bg-sand-300 shadow-tactile-sm text-ink-950"
            >
              خروج
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
