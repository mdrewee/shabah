import { useState, useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { roomBus } from '../lib/roomBus';
import { ShabahLobbyPlayer } from '../components/lobby/UnifiedShabahLobby';

export interface UseRoomSyncOptions {
  roomCode: string;
  role?: 'host' | 'contestant';
  playerId?: string;
  playerName?: string;
  isReady?: boolean;
}

interface SharedChannelEntry {
  channel: RealtimeChannel;
  refCount: number;
  subscribers: Set<(players: ShabahLobbyPlayer[]) => void>;
  latestPlayers: ShabahLobbyPlayer[];
}

// Module-level manager to allow multiple components (e.g. CoachTVRoot and embedded UnifiedShabahLobby)
// to safely share the same channel without duplicate .on() calls on an already-subscribed channel.
const sharedChannels = new Map<string, SharedChannelEntry>();

export function useRoomSync(
  optionsOrRoomCode: UseRoomSyncOptions | string,
  argPlayerId?: string,
  argPlayerName?: string,
  argIsHost: boolean = false
) {
  // Normalize arguments whether passed as options object or positional parameters
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

  const cleanCode = (roomCode || '').trim().toUpperCase();
  const isHost = role === 'host';

  const [connectedPlayers, setConnectedPlayers] = useState<ShabahLobbyPlayer[]>(() => {
    if (!cleanCode) return [];
    const shared = sharedChannels.get(`room_${cleanCode}`);
    if (shared && shared.latestPlayers.length > 0) {
      return shared.latestPlayers;
    }
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

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Keep latest values in refs to avoid recreating the channel effect unnecessarily
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  const playerNameRef = useRef(playerName);
  playerNameRef.current = playerName;

  const isReadyRef = useRef(isReady);
  isReadyRef.current = isReady;

  useEffect(() => {
    if (!cleanCode) return;

    const channelName = `room_${cleanCode}`;
    const presenceKey = isHostRef.current ? 'host_tv' : (playerIdRef.current || 'guest');

    let entry = sharedChannels.get(channelName);

    const notifySubscriber = (players: ShabahLobbyPlayer[]) => {
      setConnectedPlayers((prev) => {
        // TV Sync stability: do not overwrite with transient empty array if we already have players
        if (isHostRef.current && players.length === 0 && prev.length > 0) {
          return prev;
        }
        return players;
      });
    };

    if (!entry) {
      // 1. Clean up any existing channel with same topic from previous mounts/StrictMode
      const existingChannels = supabase.getChannels().filter(
        (ch) => ch.topic === channelName || ch.topic === `realtime:${channelName}`
      );
      existingChannels.forEach((ch) => {
        try {
          ch.untrack();
        } catch {}
        supabase.removeChannel(ch);
      });

      // 2. Create fresh channel
      const channel = supabase.channel(channelName, {
        config: {
          presence: { key: presenceKey },
        },
      });

      entry = {
        channel,
        refCount: 1,
        subscribers: new Set([notifySubscriber]),
        latestPlayers: [],
      };
      sharedChannels.set(channelName, entry);
      channelRef.current = channel;
      roomBus.registerChannel(cleanCode, channel);

      const syncPresence = () => {
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

          const players = Array.from(map.values());
          const cur = sharedChannels.get(channelName);
          if (cur) {
            cur.latestPlayers = players;
            cur.subscribers.forEach((cb) => cb(players));
          }

          roomBus.syncPresencePlayers(cleanCode, players);
        } catch (err) {
          console.warn('[useRoomSync] Presence sync error:', err);
        }
      };

      // 3. Bind all presence and broadcast listeners BEFORE calling subscribe()
      channel
        .on('presence', { event: 'sync' }, () => {
          syncPresence();
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
          console.log('[PRESENCE] Player joined:', key, newPresences);
          syncPresence();
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
          console.log('[PRESENCE] Player left:', key, leftPresences);
          syncPresence();
        })
        .on('broadcast', { event: 'GAME_STARTED' }, ({ payload }: any) => {
          console.log('[SYNC] Game started:', payload);
          roomBus.emit('GAME_STARTED', cleanCode, payload);
        })
        .on('broadcast', { event: 'RETURN_TO_LOBBY' }, () => {
          console.log('[SYNC] Return to lobby');
          roomBus.emit('RETURN_TO_LOBBY', cleanCode, {});
        })
        .on('broadcast', { event: 'COACH_STATE_SYNC' }, ({ payload }: any) => {
          roomBus.emit('COACH_STATE_SYNC', cleanCode, payload);
        })
        .on('broadcast', { event: 'BROKER_STATE_SYNC' }, ({ payload }: any) => {
          roomBus.emit('BROKER_STATE_SYNC', cleanCode, payload);
        })
        .on('broadcast', { event: 'PLAYER_READY_UPDATE' }, ({ payload }: any) => {
          if (!payload || !payload.playerId) return;
          roomBus.emit('PLAYER_READY_UPDATE', cleanCode, payload);
        });

      // 4. Call subscribe() ONLY after all listeners have been registered
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              id: presenceKey,
              name: isHostRef.current ? 'شاشة التلفزيون' : (playerNameRef.current || 'متسابق'),
              isReady: isReadyRef.current,
              isHost: isHostRef.current,
              joinedAt: Date.now(),
            });
          } catch (err) {
            console.warn('[useRoomSync] Track error:', err);
          }
        }
      });
    } else {
      // Channel already exists and is managed! Safely attach this subscriber without calling .on() again
      entry.refCount += 1;
      entry.subscribers.add(notifySubscriber);
      channelRef.current = entry.channel;

      if (entry.latestPlayers.length > 0) {
        notifySubscriber(entry.latestPlayers);
      }

      // If this is a contestant joining an active channel, track their presence
      if (!isHostRef.current && playerIdRef.current) {
        entry.channel
          .track({
            id: playerIdRef.current,
            name: playerNameRef.current || 'متسابق',
            isReady: isReadyRef.current,
            isHost: false,
            joinedAt: Date.now(),
          })
          .catch(() => {});
      }
    }

    // 5. Cleanup on unmount
    return () => {
      const cur = sharedChannels.get(channelName);
      if (cur) {
        cur.subscribers.delete(notifySubscriber);
        cur.refCount -= 1;

        if (cur.refCount <= 0) {
          sharedChannels.delete(channelName);
          try {
            cur.channel.untrack();
          } catch {}
          supabase.removeChannel(cur.channel);
        }
      }
      channelRef.current = null;
    };
  }, [cleanCode]); // Only depend on cleanCode!

  const updateReadyState = async (newReady: boolean) => {
    isReadyRef.current = newReady;
    const channel = channelRef.current;
    if (channel && !isHost) {
      try {
        await channel.track({
          id: playerIdRef.current || 'guest',
          name: playerNameRef.current || 'متسابق',
          isReady: newReady,
          isHost: false,
          joinedAt: Date.now(),
        });
      } catch (err) {
        console.warn('[useRoomSync] Error tracking ready state:', err);
      }
    }
    if (playerIdRef.current) {
      roomBus.setPlayerReady(cleanCode, playerIdRef.current, newReady);
    }
  };

  return {
    connectedPlayers,
    channel: channelRef.current,
    updateReadyState,
  };
}
