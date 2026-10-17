import React from 'react';
import { UnifiedShabahLobby } from '../lobby/UnifiedShabahLobby';

export interface UnifiedTVLobbyPlayer {
  id: string;
  name: string;
  isReady?: boolean;
}

export interface UnifiedTVLobbyProps {
  roomCode: string;
  gameTitle: string;
  instructions: string[];
  players: UnifiedTVLobbyPlayer[];
  onStartGame: () => void;
  onKickPlayer?: (playerId: string) => void;
  minPlayers?: number;
  categorySelector?: React.ReactNode;
  subtitle?: string;
}

export const UnifiedTVLobby: React.FC<UnifiedTVLobbyProps> = ({
  roomCode,
  gameTitle,
  instructions,
  players,
  onStartGame,
  onKickPlayer,
  minPlayers = 1,
  categorySelector,
}) => {
  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameTitle={gameTitle}
      rulesSummary={instructions?.slice(0, 2)}
      players={players}
      role="host"
      onStartGame={onStartGame}
      onKickPlayer={onKickPlayer}
      minPlayers={minPlayers}
      extraControls={categorySelector}
    />
  );
};

export default UnifiedTVLobby;
