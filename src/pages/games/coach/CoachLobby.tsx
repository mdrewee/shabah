import React, { useState, useEffect } from 'react';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { CoachGameMode } from './types';
import { sound } from '../../../lib/audio';
import { Shield, Grid3X3, Check } from 'lucide-react';

interface CoachLobbyProps {
  roomCode: string;
  role: 'host' | 'contestant';
  isPlayerHost?: boolean;
  selectedMode: CoachGameMode;
  onSelectMode: (mode: CoachGameMode) => void;
  onStartGame: () => void;
  currentPlayerId?: string;
  onExit?: () => void;
}

export const CoachLobby: React.FC<CoachLobbyProps> = ({
  roomCode,
  role,
  isPlayerHost,
  selectedMode: propSelectedMode,
  onSelectMode,
  onStartGame,
  currentPlayerId,
  onExit,
}) => {
  // Local state initialized with prop, keeping in sync
  const [currentMode, setCurrentMode] = useState<CoachGameMode>(propSelectedMode || 'draft');

  useEffect(() => {
    if (propSelectedMode) {
      setCurrentMode(propSelectedMode);
    }
  }, [propSelectedMode]);

  const handleModeChange = (mode: CoachGameMode) => {
    sound.playClick();
    setCurrentMode(mode);
    onSelectMode(mode);
  };

  const modeControls = (
    <div className="flex flex-col gap-2 w-full select-none">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-neutral-800">اختر طور التحدي:</span>
        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
          الحد الأقصى: ١٠ لاعبين
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 w-full">
        {/* Mode 1: كوّن فريقك (التشكيلة 5) */}
        <button
          type="button"
          onClick={() => handleModeChange('draft')}
          className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            currentMode === 'draft'
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ring-2 ring-emerald-400'
              : 'bg-white text-[#0A0A0A] border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <Shield className="w-5 h-5 shrink-0" />
          <span className="font-black text-xs sm:text-sm">طور التشكيلة (٥)</span>
          {currentMode === 'draft' && <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />}
        </button>

        {/* Mode 2: بينقو الكروي 4x4 */}
        <button
          type="button"
          onClick={() => handleModeChange('bingo')}
          className={`py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 ${
            currentMode === 'bingo'
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ring-2 ring-emerald-400'
              : 'bg-white text-[#0A0A0A] border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <Grid3X3 className="w-5 h-5 shrink-0" />
          <span className="font-black text-xs sm:text-sm">طور البينقو (٤×٤)</span>
          {currentMode === 'bingo' && <Check className="w-4 h-4 text-emerald-400 stroke-[3] shrink-0" />}
        </button>
      </div>
    </div>
  );

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId="ai-coach"
      gameTitle="الشبح المدرب"
      role={role}
      isPlayerHost={isPlayerHost}
      currentPlayerId={currentPlayerId}
      extraControls={modeControls}
      onStartGame={onStartGame}
      onExit={onExit}
    />
  );
};
