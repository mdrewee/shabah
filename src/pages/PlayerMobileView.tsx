import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { CoachMobileRoot } from './games/coach/CoachMobileRoot';
import { SHABAH_GAMES } from '../data/shabahGames';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../utils/playerSession';

export const PlayerMobileView: React.FC = () => {
  const params = useParams<{ code?: string; roomId?: string; id?: string }>();
  const roomCode = (params.code || params.roomId || params.id || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  // Ensure room exists locally and player is registered
  useEffect(() => {
    if (roomCode) {
      let r = roomBus.getRoom(roomCode);
      if (!r) {
        r = roomBus.createRoom(roomCode);
      }
      const existing = r.players.find((p) => p.id === playerId);
      if (!existing) {
        roomBus.joinRoom(roomCode, playerName, 'falcon', playerId);
      }
    }
  }, [roomCode, playerId, playerName]);

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const matchedGameId = activeRoom?.selectedGameId || SHABAH_GAMES[0].id;
  const matchedGame =
    SHABAH_GAMES.find((g) => g.id === matchedGameId) ||
    SHABAH_GAMES[0];

  if (matchedGame.id === 'ai-coach') {
    return <CoachMobileRoot />;
  }

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId={matchedGame.id}
      gameTitle={matchedGame.title}
      role="contestant"
      currentPlayerId={playerId}
      onExit={() => {
        roomBus.leavePlayer(roomCode, playerId);
        navigate('/');
      }}
    />
  );
};

export default PlayerMobileView;
