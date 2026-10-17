import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRoom, roomBus } from '../lib/roomBus';
import { UnifiedShabahLobby } from '../components/lobby/UnifiedShabahLobby';
import { CoachTVRoot } from './games/coach/CoachTVRoot';
import { SHABAH_GAMES } from '../data/shabahGames';

export const TVScreenView: React.FC = () => {
  const params = useParams<{ code?: string; roomId?: string; id?: string; gameId?: string }>();
  const [searchParams] = useSearchParams();

  const roomCode = (
    params.code ||
    params.roomId ||
    params.id ||
    searchParams.get('room') ||
    'SHBH'
  )
    .trim()
    .toUpperCase();

  const rawGameId = (params.gameId || searchParams.get('game') || '').trim();

  // Create or retrieve room state
  useEffect(() => {
    if (roomCode && !roomBus.getRoom(roomCode)) {
      const room = roomBus.createRoom(roomCode);
      if (rawGameId) {
        room.selectedGameId = rawGameId;
      }
      roomBus.writeLocal(room);
    }
  }, [roomCode, rawGameId]);

  const { room } = useRoom(roomCode);
  const activeRoom = room || roomBus.getRoom(roomCode);

  const matchedGameId =
    rawGameId ||
    activeRoom?.selectedGameId ||
    SHABAH_GAMES[0].id;

  const matchedGame =
    SHABAH_GAMES.find((g) => g.id === matchedGameId) ||
    SHABAH_GAMES[0];

  if (matchedGame.id === 'ai-coach') {
    return <CoachTVRoot />;
  }

  return (
    <UnifiedShabahLobby
      roomCode={roomCode}
      gameId={matchedGame.id}
      gameTitle={matchedGame.title}
      role="host"
    />
  );
};

export default TVScreenView;
