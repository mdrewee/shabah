import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { CoachMobileRoot } from './games/coach/CoachMobileRoot';
import { BrokerMobileRoot } from './games/broker/BrokerMobileRoot';
import { SHABAH_GAMES } from '../data/shabahGames';
import {
  getOrCreatePlayerId,
  getOrCreatePlayerName,
  getPersistedPlayerName,
} from '../utils/playerSession';
import { checkRoomExists } from '../services/roomService';
import { normalizeGameId } from '../utils/gameIds';
import { useRoomSync } from '../hooks/useRoomSync';

export const PlayerMobileView: React.FC = () => {
  const params = useParams<{ code?: string; roomId?: string; id?: string }>();
  const [searchParams] = useSearchParams();
  const roomCode = (params.code || params.roomId || params.id || 'SHBH').trim().toUpperCase();
  const navigate = useNavigate();
  const isPlayerHost = searchParams.get('host') === '1';

  const [playerId] = useState<string>(() => getOrCreatePlayerId());
  const [playerName] = useState<string>(() => {
    return getPersistedPlayerName() || getOrCreatePlayerName('متسابق');
  });

  // Maintain stable Supabase Realtime presence channel across mobile screens
  useRoomSync({
    roomCode,
    role: 'contestant',
    playerId,
    playerName,
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
  const [loadedGameId, setLoadedGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomCode) return;
    if (!activeRoom?.selectedGameId) {
      checkRoomExists(roomCode).then((res) => {
        if (res.exists && res.gameId) {
          const canon = normalizeGameId(res.gameId);
          setLoadedGameId(canon);
          const r = roomBus.getRoom(roomCode);
          if (r) {
            r.selectedGameId = canon;
            roomBus.writeLocal(r);
          }
        }
      });
    }
  }, [roomCode, activeRoom?.selectedGameId]);

  const rawGameId = activeRoom?.selectedGameId || loadedGameId || SHABAH_GAMES[0].id;
  const matchedGameId = normalizeGameId(rawGameId);
  const matchedGame =
    SHABAH_GAMES.find((g) => g.id === matchedGameId) ||
    SHABAH_GAMES[0];

  if (matchedGame.id === 'ai-coach') {
    return <CoachMobileRoot />;
  }

  if (matchedGame.id === 'ai-broker') {
    return <BrokerMobileRoot />;
  }

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId={matchedGame.id}
      gameTitle={matchedGame.title}
      role="contestant"
      isPlayerHost={isPlayerHost}
      currentPlayerId={playerId}
      onExit={() => {
        roomBus.leavePlayer(roomCode, playerId);
        navigate('/');
      }}
    />
  );
};

export default PlayerMobileView;
