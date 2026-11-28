import React, { useState, useEffect } from 'react';
import { UnifiedShabahLobby } from '../../../components/lobby/UnifiedShabahLobby';
import { CoachGameMode } from './types';
import { sound } from '../../../lib/audio';
import { Shield, Grid3X3 } from 'lucide-react';
import { LobbyModePicker } from '../../../components/lobby/LobbyModePicker';

interface CoachLobbyProps {
  roomCode: string;
  role: 'host' | 'contestant';
  isPlayerHost?: boolean;
  selectedMode: CoachGameMode;
  onSelectMode: (mode: CoachGameMode) => void;
  onStartGame?: () => void;
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
    if (role !== 'host' && !isPlayerHost) return;
    sound.playClick();
    if (mode === 'bingo') {
      import('./coachSync').then(({ generatePreloadedBingoPool }) => {
        generatePreloadedBingoPool();
      });
    }
    setCurrentMode(mode);
    onSelectMode(mode);
  };

  const modeControls = (
    <LobbyModePicker<CoachGameMode>
      modes={[
        { id: 'draft', label: 'طور التشكيلة (٥)', icon: Shield },
        { id: 'bingo', label: 'طور البينقو (٤×٤)', icon: Grid3X3 },
      ]}
      selected={currentMode}
      onSelect={role === 'host' || isPlayerHost ? handleModeChange : undefined}
    />
  );

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId="ai-coach"
      gameTitle="الشبح المدرب"
      rulesSummary={currentMode === 'bingo'
        ? 'طابق اللاعب الظاهر مع خانة واحدة في بطاقتك خلال ٨ ثوانٍ. كل اختيار أو تخطٍ يستهلك فرصتك. أكمل صفاً أو عموداً أو قطراً أو الزوايا الأربع ثم أعلن بينقو!'
        : 'كوّن تشكيلتك من ٥ لاعبين، باختيار لاعب واحد في كل جولة حسب الشرط. الاختيار المعتمد يقفل حتى الجولة التالية.'}
      role={role}
      isPlayerHost={isPlayerHost}
      currentPlayerId={currentPlayerId}
      extraControls={modeControls}
      onStartGame={onStartGame}
      onExit={onExit}
    />
  );
};
