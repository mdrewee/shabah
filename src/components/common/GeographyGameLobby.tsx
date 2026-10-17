import React from 'react';
import { UnifiedShabahLobby } from '../lobby/UnifiedShabahLobby';

export interface GeographyGameLobbyProps {
  gameTitle: string;
  gameCategory?: string;
  icon?: React.ReactNode;
  ruleSummary: string;
  roomCode: string;
  players: Array<{ id: string; name: string; isReady?: boolean }>;
  onStartGame: () => void;
  onExitGame: () => void;
  onKickPlayer?: (playerId: string, playerName: string) => void;
  customSlot?: React.ReactNode;
  statusMessage?: string;
  canStart?: boolean;
}

export const GeographyGameLobby: React.FC<GeographyGameLobbyProps> = ({
  gameTitle,
  ruleSummary,
  roomCode,
  players,
  onStartGame,
  onExitGame,
  onKickPlayer,
  customSlot,
}) => {
  const cleanPlayers = React.useMemo(() => {
    const map = new Map<string, (typeof players)[0]>();
    players.forEach((p) => {
      if (!p || !p.id || p.id === 'host_tv') return;
      if (map.has(p.id)) {
        const existing = map.get(p.id)!;
        map.set(p.id, {
          ...existing,
          ...p,
          isReady: Boolean(existing.isReady || p.isReady),
        });
      } else {
        map.set(p.id, { ...p, isReady: Boolean(p.isReady) });
      }
    });
    return Array.from(map.values());
  }, [players]);

  const rules = ruleSummary
    ? ruleSummary
        .split(/[.،!؟\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 2)
    : undefined;

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameTitle={gameTitle}
      rulesSummary={rules}
      players={cleanPlayers}
      role="host"
      onStartGame={onStartGame}
      onExit={onExitGame}
      onKickPlayer={
        onKickPlayer
          ? (pid) => {
              const target = cleanPlayers.find((p) => p.id === pid);
              onKickPlayer(pid, target?.name || '');
            }
          : undefined
      }
      minPlayers={1}
      extraControls={customSlot}
    />
  );
};

export default GeographyGameLobby;
