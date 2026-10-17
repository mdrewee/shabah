import React, { useState, useEffect } from 'react';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { CoachGameMode } from './types';
import { sound } from '../../../lib/audio';
import { Shield, Grid3X3, Check } from 'lucide-react';

interface CoachLobbyProps {
  roomCode: string;
  role: 'host' | 'contestant';
  selectedMode: CoachGameMode;
  onSelectMode: (mode: CoachGameMode) => void;
  onStartGame: () => void;
  currentPlayerId?: string;
  onExit?: () => void;
}

export const CoachLobby: React.FC<CoachLobbyProps> = ({
  roomCode,
  role,
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
    <div className="flex flex-col gap-2.5 w-full select-none">
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
          className={`p-3 rounded-xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            currentMode === 'draft'
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ring-2 ring-emerald-400'
              : 'bg-white text-[#0A0A0A] border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-5 h-5" />
            {currentMode === 'draft' && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
          </div>
          <span className="font-black text-xs sm:text-sm">طور التشكيلة (٥)</span>
          <span
            className={`text-[10px] font-bold ${
              currentMode === 'draft' ? 'text-neutral-300' : 'text-neutral-500'
            }`}
          >
            ٥ مراكز وشروط تكتيكية متجددة
          </span>
        </button>

        {/* Mode 2: بينقو الكروي 4x4 */}
        <button
          type="button"
          onClick={() => handleModeChange('bingo')}
          className={`p-3 rounded-xl border-2 flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            currentMode === 'bingo'
              ? 'bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ring-2 ring-emerald-400'
              : 'bg-white text-[#0A0A0A] border-neutral-300 hover:border-neutral-400'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Grid3X3 className="w-5 h-5" />
            {currentMode === 'bingo' && <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />}
          </div>
          <span className="font-black text-xs sm:text-sm">طور البينقو (٤×٤)</span>
          <span
            className={`text-[10px] font-bold ${
              currentMode === 'bingo' ? 'text-neutral-300' : 'text-neutral-500'
            }`}
          >
            ١٦ خانة وروليت صور اللاعبين
          </span>
        </button>
      </div>

      <div className="text-[11px] text-center font-black text-emerald-600 bg-emerald-50 border border-emerald-200 py-1 px-2 rounded-lg">
        الطور المحدد للغرفة: {currentMode === 'bingo' ? 'بينقو كروي (٤×٤)' : 'كوّن فريقك (التشكيلة ٥)'}
      </div>
    </div>
  );

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId="ai-coach"
      gameTitle="الشبح المدرب"
      role={role}
      currentPlayerId={currentPlayerId}
      extraControls={modeControls}
      onStartGame={onStartGame}
      onExit={onExit}
    />
  );
};
