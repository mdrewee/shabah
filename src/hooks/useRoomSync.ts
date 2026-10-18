import { useState, useEffect, useRef } from 'react';
import { roomBus, cleanRoomCode } from '../lib/roomBus';
import { ShabahLobbyPlayer } from '../components/lobby/UnifiedShabahLobby';

export interface UseRoomSyncOptions {
  roomCode: string;
  role?: 'host' | 'contestant';
  playerId?: string;
  playerName?: string;
  isReady?: boolean;
}

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

export function useRoomSync(
  optionsOrRoomCode: UseRoomSyncOptions | string,
  argPlayerId?: string,
  argPlayerName?: string,
  argIsHost: boolean = false
) {
  let roomCode = '';
  let role: 'host' | 'contestant' = 'contestant';
  let playerId = '';
  let playerName = '';
  let isReady = false;

  if (typeof optionsOrRoomCode === 'string') {
    roomCode = optionsOrRoomCode;
    playerId = argPlayerId || '';
    playerName = argPlayerName || '';
    role = argIsHost ? 'host' : 'contestant';
  } else if (optionsOrRoomCode && typeof optionsOrRoomCode === 'object') {
    roomCode = optionsOrRoomCode.roomCode || '';
    role = optionsOrRoomCode.role || 'contestant';
    playerId = optionsOrRoomCode.playerId || '';
    playerName = optionsOrRoomCode.playerName || '';
    isReady = Boolean(optionsOrRoomCode.isReady);
  }

  const cleanCode = cleanRoomCode(roomCode);
  const isHost = role === 'host';

  const [connectedPlayers, setConnectedPlayers] = useState<ShabahLobbyPlayer[]>(() => {
    if (!cleanCode) return [];
    return roomBus.getFormattedPlayers(cleanCode).filter((p) => !p.isHost && p.id !== 'host_tv');
  });

  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  useEffect(() => {
    if (!cleanCode) return;

    // Initialize or join the room channel via the authoritative roomBus
    roomBus.initRoom(cleanCode, {
      id: isHost ? 'host_tv' : (playerId || 'guest'),
      name: isHost ? 'شاشة التلفزيون' : (playerName || 'متسابق'),
      isHost,
      isReady,
    });

    const unsubPresence = roomBus.on('presence_sync', (evt: any) => {
      try {
        const rawPlayers = evt?.data ?? evt;
        const players: any[] = Array.isArray(rawPlayers) ? rawPlayers : [];
        const contestants: ShabahLobbyPlayer[] = players
          .filter((p: any) => p && typeof p === 'object' && p.id && p.id !== 'host_tv' && !p.isHost)
          .map((p: any) => ({
            id: String(p.id),
            name: String(p.name || 'متسابق'),
            isReady: Boolean(p.isReady),
          }));

        setConnectedPlayers((prev) => {
          // Sync stability: do not clear player list on temporary transient empty arrays
          if (contestants.length === 0 && prev.length > 0) {
            return prev;
          }
          return contestants;
        });
      } catch (err) {
        console.error('[useRoomSync] presence_sync error shielded:', err);
      }
    });

    const unsubReady = roomBus.on('PLAYER_READY_UPDATE', (evt: any) => {
      try {
        const payload = evt?.data || evt;
        const pId = payload?.playerId;
        const ready = payload?.isReady;
        if (pId) {
          setConnectedPlayers((prev) =>
            prev.map((p) => (p.id === pId ? { ...p, isReady: Boolean(ready) } : p))
          );
        }
      } catch (err) {
        console.error('[useRoomSync] PLAYER_READY_UPDATE error shielded:', err);
      }
    });

    // Seed initial players if already present
    try {
      const initial = roomBus.getFormattedPlayers(cleanCode).filter((p) => !p.isHost && p.id !== 'host_tv');
      if (initial.length > 0) {
        setConnectedPlayers(initial);
      }
    } catch (err) {
      console.error('[useRoomSync] initial players error shielded:', err);
    }

    return () => {
      unsubPresence();
      unsubReady();
    };
  }, [cleanCode, isHost, playerId, playerName]);

  const updateReadyState = async (newReady: boolean) => {
    try {
      const curPlayerId = playerIdRef.current;
      if (curPlayerId) {
        roomBus.setPlayerReady(cleanCode, curPlayerId, newReady);
        await roomBus.trackPlayer(cleanCode, {
          id: curPlayerId,
          name: playerNameRef.current || 'متسابق',
          isReady: newReady,
          isHost: false,
        });
      }
    } catch (err) {
      console.error('[useRoomSync] updateReadyState error shielded:', err);
    }
  };

  return {
    connectedPlayers,
    allPlayers: connectedPlayers,
    channel: roomBus.getSupabaseChannel(cleanCode),
    updateReadyState,
    setPlayerReady: updateReadyState,
    broadcast: async (event: string, payload: any = {}) => {
      try {
        await roomBus.broadcast(cleanCode, event, payload);
      } catch (err) {
        console.error('[useRoomSync] broadcast error shielded:', err);
      }
    },
  };
}
