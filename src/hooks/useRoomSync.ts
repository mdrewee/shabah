import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { roomBus } from '../lib/roomBus';
import { ShabahLobbyPlayer } from '../components/lobby/UnifiedShabahLobby';

interface UseRoomSyncOptions {
  roomCode: string;
  role: 'host' | 'contestant';
  playerId?: string;
  playerName?: string;
  isReady?: boolean;
}

export function useRoomSync({
  roomCode,
  role,
  playerId: propPlayerId,
  playerName: propPlayerName,
  isReady: propIsReady = false,
}: UseRoomSyncOptions) {
  const cleanCode = (roomCode || '').trim().toUpperCase();
  const isHost = role === 'host';

  const [connectedPlayers, setConnectedPlayers] = useState<ShabahLobbyPlayer[]>(() => {
    const r = roomBus.getRoom(cleanCode);
    if (r && r.players.length > 0) {
      return r.players
        .filter((p) => p.id !== 'host_tv')
        .map((p) => ({
          id: p.id,
          name: p.name,
          isReady: Boolean(p.isReady),
        }));
    }
    return [];
  });

  // Use refs for values that change so that useEffect only depends on cleanCode
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const playerIdRef = useRef(propPlayerId);
  playerIdRef.current = propPlayerId;

  const playerNameRef = useRef(propPlayerName);
  playerNameRef.current = propPlayerName;

  const isReadyRef = useRef(propIsReady);
  isReadyRef.current = propIsReady;

  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!cleanCode) return;

    const channelTopic = `room_${cleanCode}`;
    const key = isHostRef.current ? 'host_tv' : (playerIdRef.current || 'guest');

    let channel = supabase.getChannels().find(
      (c: any) => c.topic === channelTopic || c.topic === `realtime:${channelTopic}`
    );

    if (!channel) {
      channel = supabase.channel(channelTopic, {
        config: {
          presence: { key },
        },
      });
    }

    channelRef.current = channel;

    const flattenAndSet = () => {
      try {
        const state = channel.presenceState();
        const all = Object.values(state).flat() as any[];
        const map = new Map<string, ShabahLobbyPlayer>();

        all.forEach((p) => {
          if (p && p.id && p.id !== 'host_tv' && !p.isHost) {
            map.set(p.id, {
              id: p.id,
              name: p.name || 'متسابق',
              isReady: Boolean(p.isReady),
            });
          }
        });

        const list = Array.from(map.values());

        // TV Sync Stability: Do not wipe out player list if an empty sync heartbeat momentarily arrives
        if (isHostRef.current) {
          setConnectedPlayers((prev) => {
            if (list.length === 0 && prev.length > 0) {
              console.log('[TV SYNC] Retaining existing players during transient empty presence sync');
              return prev;
            }
            console.log('[TV SYNC] Current connected players count:', list.length, list);
            return list;
          });
        } else {
          setConnectedPlayers(list);
        }

        // Keep roomBus synchronized so existing views continue working
        roomBus.syncPresencePlayers(cleanCode, list);
      } catch (err) {
        console.warn('[useRoomSync] Presence sync error:', err);
      }
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        flattenAndSet();
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        console.log('[PRESENCE JOIN]', newPresences);
        flattenAndSet();
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        console.log('[PRESENCE LEAVE]', leftPresences);
        flattenAndSet();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const pid = playerIdRef.current;
          const pname = playerNameRef.current;
          await channel.track({
            id: isHostRef.current ? 'host_tv' : pid,
            name: isHostRef.current ? 'شاشة التلفزيون' : (pname || 'متسابق'),
            isReady: isReadyRef.current,
            isHost: isHostRef.current,
            joinedAt: Date.now(),
          });
        }
      });

    return () => {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [cleanCode]); // ONLY depend on cleanCode!

  const updateReadyState = async (newReady: boolean) => {
    isReadyRef.current = newReady;
    if (channelRef.current && !isHost) {
      try {
        await channelRef.current.track({
          id: playerIdRef.current,
          name: playerNameRef.current || 'متسابق',
          isReady: newReady,
          isHost: false,
          joinedAt: Date.now(),
        });
      } catch (err) {
        console.warn('[useRoomSync] Error tracking ready state:', err);
      }
    }
    // Also emit locally for immediate UI response
    if (playerIdRef.current) {
      roomBus.togglePlayerReady(cleanCode, playerIdRef.current);
    }
  };

  return {
    connectedPlayers,
    updateReadyState,
  };
}
