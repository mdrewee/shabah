import React from 'react';
import { ShabahGame } from '../../data/shabahGames';

export interface GameEntryModalProps {
  isOpen: boolean;
  game: ShabahGame | null;
  playerName: string;
  error?: string | null;
  onNameChange: (value: string) => void;
  onSubmitContestant: (e: React.FormEvent) => void;
  onEnterTVMode: () => void;
  onClose: () => void;
}

export const GameEntryModal: React.FC<GameEntryModalProps> = ({
  isOpen,
  game,
  playerName,
  error,
  onNameChange,
  onSubmitContestant,
  onEnterTVMode,
  onClose,
}) => {
  if (!isOpen || !game) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm shabah-border-wrap animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shabah-border-inner">
          <form
            onSubmit={onSubmitContestant}
            className="shabah-surface p-6 flex flex-col items-center text-center"
          >
            {/* 1. Main Title */}
            <h3 className="text-2xl font-black text-[#0A0A0A] text-center mb-1">
              اكتب اسمك
            </h3>

            {/* 2. Subtitle */}
            <p className="text-sm font-bold text-[#0A0A0A]/60 text-center mb-5">
              يظهر اسمك لكل الموجودين في اللوبي
            </p>

            {/* 3. Name Input */}
            <input
              type="text"
              value={playerName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="اسمك هنا..."
              maxLength={18}
              autoFocus
              className="placeholder-neutral-400 font-black text-center text-lg h-13 rounded-xl border-2 border-[#0A0A0A] w-full mb-4 bg-white text-[#0A0A0A] focus:outline-none"
            />

            {error && (
              <div className="w-full py-1.5 px-3 mb-3 bg-red-100 border border-red-400 rounded-lg text-red-700 text-xs font-black">
                {error}
              </div>
            )}

            {/* 4. Bottom Horizontal Buttons Bar */}
            <div className="flex items-center gap-2.5 w-full">
              {/* Primary Button (Right in RTL): [تأكيد الدخول] */}
              <button
                type="submit"
                className="flex-1 h-12 rounded-xl text-white font-black text-base shabah-btn-black cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
              >
                تأكيد الدخول
              </button>

              {/* Dedicated Pure Vector TV Screen Button (Left in RTL) */}
              <button
                type="button"
                onClick={onEnterTVMode}
                title="وضع شاشة العرض / TV"
                aria-label="وضع شاشة العرض / TV"
                className="h-12 w-12 flex-shrink-0 bg-white hover:bg-[#0A0A0A]/5 border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <svg
                  className="w-6 h-6 text-[#0A0A0A]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="20" height="14" x="2" y="3" rx="2" />
                  <line x1="8" x2="16" y1="21" y2="21" />
                  <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
