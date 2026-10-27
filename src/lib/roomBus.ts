import { useState, useEffect } from 'react';
import {
  RoomState,
  Player,
  AvatarId,
  TeamId,
  HexCell,
  QuestionItem,
  BuzzerLockState,
} from '../types/game';
import { AVATAR_PRESETS } from './gamesCatalog';
import { generateHexGrid, checkWinCondition, getRandomQuestionForCell } from './hexEngine';
import { sound } from './audio';
import { worldFlagsCatalog } from '../data/flags';
import { supabase } from './supabaseClient';
import { calculateColorCloseness } from './colorMath';
import { LandmarkScope, LandmarkRoomState, LandmarkPlayer } from '../types/landmarkGame';
import { calculateHaversineDistance, getLandmarksByScope } from '../data/landmarks';
import { TrajectoryRoomState, TrajectoryPlayer, TrajectoryRound } from '../types/trajectoryGame';
import { TRAJECTORY_ROUNDS_FALLBACK, calculateHitCountries } from './trajectoryEngine';
import { TourismRoomState, TourismPlayer, TourismItem } from '../types/tourismGame';
import { isAnswerCorrect } from '../data/tourismLexicon';
import { normalizeGameId } from '../utils/gameIds';

const STORAGE_PREFIX = 'taghesi_room_';
const CHANNEL_NAME = 'taghesi_bus_v3';

// Unique id of this browser tab (used as tie-breaker for state versions)
const TAB_ID = 't_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Flag game timings (ms)
const FLAG_ROUND_MS = 25_000;
const FLAG_REVEAL_STEP_MS = 1_500;
const FLAG_WINNER_PAUSE_MS = 3_000;
const PRESENCE_TIMEOUT_MS = 15_000;
const HOST_GRACE_MS = 12_000;
const HEARTBEAT_MS = 3_000;
const MAX_PLAYERS = 16;

export const cleanRoomCode = (code: string) => (code || '').toUpperCase().trim().replace(/^ROOM_/, '');

/** Returns true if `incoming` should replace `current` (monotonic version + deterministic tie-break). */
export function isNewerState(incoming: RoomState | null | undefined, current: RoomState | null | undefined): boolean {
  if (!incoming) return false;
  if (!current) return true;
  const iv = incoming.version || 0;
  const cv = current.version || 0;
  if (iv !== cv) return iv > cv;
  const iu = incoming.updatedAt || 0;
  const cu = current.updatedAt || 0;
  if (iu !== cu) return iu > cu;
  return (incoming.writerId || '') > (current.writerId || '');
}

/** Reveal sequence length for N players (original flag + each player + winner pause). */
export function flagRevealDurationMs(playerCount: number): number {
  return FLAG_REVEAL_STEP_MS * (playerCount + 1) + FLAG_WINNER_PAUSE_MS;
}
export const FLAG_REVEAL_STEP = FLAG_REVEAL_STEP_MS;

export type ClientIntentAction =
  | 'PING'
  | 'JOIN'
  | 'LEAVE'
  | 'PLAYER_SET_READY'
  | 'PLAYER_TOGGLE_READY'
  | 'FLAG_SET_READY'
  | 'FLAG_SUBMIT_GUESS'
  | 'FLAG_ROUND_READY'
  | 'FLAG_RESET_LOBBY'
  | 'LANDMARK_SET_SCOPE'
  | 'LANDMARK_START_ROUND'
  | 'LANDMARK_SUBMIT_GUESS'
  | 'LANDMARK_ROUND_READY'
  | 'LANDMARK_RESET_LOBBY'
  | 'LANDMARK_RESOLVE_REVEAL'
  | 'TRAJECTORY_START_ROUND'
  | 'TRAJECTORY_SUBMIT_GUESS'
  | 'TRAJECTORY_ROUND_READY'
  | 'TRAJECTORY_RESET_LOBBY'
  | 'TRAJECTORY_RESOLVE_REVEAL'
  | 'TOURISM_START_ROUND'
  | 'TOURISM_LOCK_IN'
  | 'TOURISM_ROUND_READY'
  | 'TOURISM_RESET_LOBBY'
  | 'TOURISM_RESOLVE_REVEAL'
  | 'TOURISM_SKIP_HINT';

export interface ClientIntent {
  intentId: string;
  action: ClientIntentAction;
  playerId: string;
  payload?: any;
}

export interface JoinResult {
  ok: boolean;
  player?: Player;
  reason?: string;
}

// Standard Room Event Types
export type RoomEventType =
  | 'STATE_UPDATED'
  | 'BUZZER_HIT'
  | 'PLAYER_JOINED'
  | 'PLAYER_KICKED'
  | 'CELL_SELECTED'
  | 'CORRECT_ANSWER'
  | 'COUNTDOWN_TICK'
  | 'TIMEOUT_FREEZE'
  | 'HOST_REQUEST_SUBMITTED'
  | 'HOST_REQUEST_RESOLVED'
  | 'GAME_ENDED'
  | 'ROUND_RESET'
  | 'WINNER_DECLARED'
  | 'REQUEST_ROOM_STATE'
  | 'PLAYER_ROUND_READY'
  | 'PLAYER_READY_UPDATE'
  | 'PLAYER_NEXT_READY'
  | 'PLAYER_NEXT_ROUND_READY'
  | 'PLAYER_SUBMISSION'
  | 'ROUND_STARTED'
  | 'CLIENT_INTENT'
  | 'JOIN_RESULT'
  | 'PLAYER_REACTION'
  | 'SCATTERGORIES_SUBMIT'
  | 'SCATTERGORIES_GRACE'
  | 'SCATTERGORIES_RESULTS'
  | 'WORDLE_GUESS'
  | 'PLAYER_SOLVED_WORDLE'
  | 'WORDLE_GRACE'
  | 'WORDLE_ROUND_ENDED'
  | 'CLAIM_WORD'
  | 'WORD_CLAIMED'
  | 'WORD_CLAIM_REJECTED'
  | 'PENTAGON_ROUND_ENDED'
  | 'LETTER_ROULETTE_STARTED'
  | 'ADMIN_CLAIMED'
  | 'ROUND_STOPPED_BY_PLAYER'
  | 'GAME_TERMINATED'
  | 'WORDLE_ROUND_WON'
  | 'WORDLE_ALL_LOST'
  | 'RETURN_TO_LOBBY'
  | 'ADMIN_REQUEST_SUBMITTED'
  | 'ADMIN_REQUEST_RESOLVED'
  | 'ADMIN_ADVANCE_NEXT_ROUND'
  | 'SCATTERGORIES_ADMIN_VETO'
  | 'GAME_STARTED'
  | 'ROOM_CLOSED'
  | 'ROOM_TERMINATED'
  | 'COACH_STATE_SYNC'
  | 'BROKER_STATE_SYNC'
  | 'BROKER_BID_SUBMITTED'
  | 'COACH_PICK_SUBMITTED'
  | 'COACH_MODE_SELECTED'
  | 'PLAYER_CLAIMED'
  | 'BINGO_CELL_MARKED'
  | 'BINGO_CLAIMED'
  | 'ARABIC_STATE_SYNC'
  | 'ARABIC_SUBMIT_ANSWERS'
  | 'ARABIC_OBJECTION_FILED'
  | 'ARABIC_OBJECTION_VOTE'
  | 'JUDGE_STATE_SYNC'
  | 'JUDGE_SUBMIT_EXCUSE'
  | 'GUIDE_STATE_SYNC'
  | 'GUIDE_PIN_SUBMITTED'
  | 'presence_sync'
  | 'presence_join'
  | 'presence_leave'
  | (string & {});

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
}

// Typed Payload interface
export interface RoomEventPayload<T = any> {
  roomCode: string;
  type: RoomEventType;
  data: T;
  timestamp?: number;
}

// Backward-compatible BusMessage union
export type BusMessage =
  | { type: 'STATE_UPDATED'; roomId: string; state: RoomState }
  | { type: 'BUZZER_HIT'; roomId: string; event: any }
  | { type: 'PLAYER_JOINED'; roomId: string; player: Player }
  | { type: 'PLAYER_KICKED'; roomId: string; playerId: string }
  | { type: 'CELL_SELECTED'; roomId: string; cellId: string }
  | { type: 'CORRECT_ANSWER'; roomId: string; winnerPlayerId: string }
  | { type: 'COUNTDOWN_TICK'; roomId: string; remaining: number }
  | { type: 'TIMEOUT_FREEZE'; roomId: string }
  | { type: 'HOST_REQUEST_SUBMITTED'; roomId: string; request: { playerId: string; playerName: string } }
  | { type: 'HOST_REQUEST_RESOLVED'; roomId: string; playerId: string; accepted: boolean }
  | { type: 'GAME_ENDED'; roomId: string }
  | { type: 'ROUND_RESET'; roomId: string }
  | { type: 'WINNER_DECLARED'; roomId: string; winner: TeamId; path: string[] };

class RoomBus {
  public localPlayerId: string = '';
  public clientId: string = `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
  private lastBroadcastTimes: Map<string, number> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private kickedPlayerIds: Set<string> = new Set();
  private isIntentionalLeave: Map<string, boolean> = new Map();
  private reconnectTimers: Map<string, any> = new Map();
  private isReconnecting: Map<string, boolean> = new Map();

  public setPlayerId(id: string): void {
    if (id) this.localPlayerId = id;
  }

  public isSelfBroadcast(payload: any): boolean {
    if (!payload || typeof payload !== 'object') return false;
    if (payload._clientId && payload._clientId === this.clientId) return true;
    if (payload._senderId && this.localPlayerId && payload._senderId === this.localPlayerId) return true;
    return false;
  }

  /**
   * Debounced single reconnect runner to strictly prevent call stack overflow recursion
   */
  private scheduleReconnect(cleanCode: string, player?: any): void {
    if (this.isReconnecting.get(cleanCode) || this.isIntentionalLeave.get(cleanCode)) {
      return;
    }

    this.isReconnecting.set(cleanCode, true);
    const existing = this.reconnectTimers.get(cleanCode);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(cleanCode);
      if (this.isIntentionalLeave.get(cleanCode)) {
        this.isReconnecting.set(cleanCode, false);
        return;
      }

      console.log(`[ROOM_BUS] Executing single safe reconnect for ${cleanCode}`);
      const oldCh = this.supabaseChannels.get(cleanCode);
      this.supabaseChannels.delete(cleanCode);
      if (oldCh) {
        try {
          supabase.removeChannel(oldCh);
        } catch {}
      }

      this.isReconnecting.set(cleanCode, false);
      this.ensureSupabaseChannel(cleanCode, player);
    }, 2000);

    this.reconnectTimers.set(cleanCode, timer);
  }

  /**
   * Central safe broadcast transmitter:
   * 1. 300ms throttling per event to eliminate socket flooding
   * 2. Checks channel SUBSCRIBED and joined status; NEVER falls back to REST or spams HTTP.
   * 3. Silent drop for auto-sync background events when disconnected to prevent loop lockup.
   */
  public safeBroadcast(cleanCode: string, event: string, payload: any = {}): void {
    // Smart protection: if event and payload are swapped
    if (typeof event !== 'string' && typeof payload === 'string') {
      const temp = event;
      event = payload;
      payload = temp;
    }

    const NO_THROTTLE_EVENTS = new Set([
      'GUIDE_PIN_SUBMITTED',
      'PLAYER_SUBMISSION',
      'JUDGE_SUBMIT_EXCUSE',
      'BROKER_BID_SUBMITTED',
      'COACH_PICK_SUBMITTED',
      'ARABIC_SUBMIT_ANSWERS',
      'SUBMIT_ARABIC_ANSWERS',
      'ARABIC_TIME_UP',
      'ARABIC_RESULTS_READY',
      'ARABIC_OBJECTION_FILED',
      'ARABIC_OBJECTION_VOTE',
      'PLAYER_READY_UPDATE',
      'BINGO_PLAYER_SELECTED',
      'TERMINATE_ROOM',
      'ROOM_TERMINATED',
    ]);

    if (!NO_THROTTLE_EVENTS.has(event)) {
      const senderKey = payload?._senderId || payload?.contestantId || payload?.playerId || this.localPlayerId || '';
      const throttleKey = senderKey ? `${cleanCode}:${event}:${senderKey}` : `${cleanCode}:${event}`;
      const now = Date.now();
      const lastTime = this.lastBroadcastTimes.get(throttleKey) || 0;
      if (now - lastTime < 300) {
        return; // Dropped by Flood Guard
      }
      this.lastBroadcastTimes.set(throttleKey, now);
    }

    const ch = this.supabaseChannels.get(cleanCode);
    const isSubscribed = this.supabaseChannelStates.get(cleanCode) === 'SUBSCRIBED' && ch?.state === 'joined';

    const AUTO_SYNC_EVENTS = new Set([
      'GUIDE_STATE_SYNC',
      'COACH_STATE_SYNC',
      'BROKER_STATE_SYNC',
      'JUDGE_STATE_SYNC',
      'ARABIC_STATE_SYNC',
      'STATE_UPDATED',
    ]);

    if (!ch || !isSubscribed) {
      if (!AUTO_SYNC_EVENTS.has(event)) {
        console.warn(`[roomBus] Channel not subscribed for ${event} in room ${cleanCode}. Dropping broadcast.`);
      }
      return;
    }

    const payloadObj = payload && typeof payload === 'object' ? payload : { value: payload };
    const enrichedPayload = {
      ...payloadObj,
      _senderId: payloadObj._senderId || this.localPlayerId || this.clientId,
      _clientId: this.clientId,
    };

    try {
      ch.send({
        type: 'broadcast',
        event,
        payload: enrichedPayload,
      });
    } catch (err) {
      console.warn(`[roomBus] safeBroadcast error for ${event}:`, err);
    }
  }

  public broadcastPlayerReadyUpdate(roomCode: string, playerId: string, isReady: boolean, name?: string): void {
    const clean = cleanRoomCode(roomCode);
    const room = this.getRoom(clean);
    const playerName = name || room?.players.find((p) => p.id === playerId)?.name;

    if (room) {
      const pl = room.players.find((p) => p.id === playerId);
      if (pl && pl.isReady !== isReady) {
        pl.isReady = isReady;
        this.saveRoom(room);
      }
    }

    const payload = { playerId, isReady, name: playerName, roomCode: clean };
    this.emit('PLAYER_READY_UPDATE', clean, payload);
    this.safeBroadcast(clean, 'PLAYER_READY_UPDATE', payload);
  }

  public broadcastPlayerSubmission(roomCode: string, playerId: string, answer: any, round: number): void {
    const clean = cleanRoomCode(roomCode);
    const coordinates = answer?.coordinates || (answer?.lat !== undefined ? answer : undefined);
    const payload = {
      playerId,
      round,
      coordinates,
      answer,
      timestamp: Date.now()
    };
    this.safeBroadcast(clean, 'PLAYER_SUBMISSION', payload);
  }

  public broadcastRoundStarted(roomCode: string, round: number): void {
    const clean = cleanRoomCode(roomCode);
    this.safeBroadcast(clean, 'ROUND_STARTED', { round, timestamp: Date.now() });
  }

  public broadcastGameStarted(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    const gameId = payload?.gameId;
    if (gameId) {
      const room = this.getRoom(clean);
      if (room) {
        room.selectedGameId = gameId;
        this.saveRoom(room);
      }
      import('../services/roomService').then(({ updateRoomStatus }) => {
        if (typeof updateRoomStatus === 'function') {
          updateRoomStatus(clean, 'playing', gameId);
        }
      }).catch((e) => console.warn('updateRoomStatus err:', e));
    }
    this.emit('GAME_STARTED', clean, payload);
    this.safeBroadcast(clean, 'GAME_STARTED', payload);
  }

  public broadcastReturnToLobby(roomCode: string): void {
    const clean = cleanRoomCode(roomCode);
    const room = this.getRoom(clean);
    if (room) {
      room.players.forEach((p) => {
        p.isReady = false;
      });
      this.saveRoom(room);
    }
    this.emit('RETURN_TO_LOBBY', clean, {});
    this.safeBroadcast(clean, 'RETURN_TO_LOBBY', { roomCode: clean });
  }

  public broadcastCoachSync(roomCode: string, state: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('COACH_STATE_SYNC', clean, state);
    this.safeBroadcast(clean, 'COACH_STATE_SYNC', state);
  }

  public broadcastBrokerSync(roomCode: string, state: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('BROKER_STATE_SYNC', clean, state);
    this.safeBroadcast(clean, 'BROKER_STATE_SYNC', state);
  }

  public broadcastBrokerBid(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('BROKER_BID_SUBMITTED', clean, payload);
    this.safeBroadcast(clean, 'BROKER_BID_SUBMITTED', payload);
  }

  public broadcastCoachPick(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('COACH_PICK_SUBMITTED', clean, payload);
    this.safeBroadcast(clean, 'COACH_PICK_SUBMITTED', payload);
  }

  public broadcastArabicSync(roomCode: string, state: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_STATE_SYNC', clean, state);
    this.safeBroadcast(clean, 'ARABIC_STATE_SYNC', state);
  }

  public broadcastArabicAnswers(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_SUBMIT_ANSWERS', clean, payload);
    this.safeBroadcast(clean, 'ARABIC_SUBMIT_ANSWERS', payload);
  }

  public broadcastArabicTimeUp(roomCode: string): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_TIME_UP', clean, { roomCode: clean });
    this.safeBroadcast(clean, 'ARABIC_TIME_UP', { roomCode: clean });
  }

  public broadcastArabicResultsReady(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_RESULTS_READY', clean, payload);
    this.safeBroadcast(clean, 'ARABIC_RESULTS_READY', payload);
  }

  public broadcastArabicObjection(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_OBJECTION_FILED', clean, payload);
    this.safeBroadcast(clean, 'ARABIC_OBJECTION_FILED', payload);
  }

  public broadcastArabicVote(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('ARABIC_OBJECTION_VOTE', clean, payload);
    this.safeBroadcast(clean, 'ARABIC_OBJECTION_VOTE', payload);
  }

  public broadcastJudgeSync(roomCode: string, state: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('JUDGE_STATE_SYNC', clean, state);
    this.safeBroadcast(clean, 'JUDGE_STATE_SYNC', state);
  }

  public broadcastJudgeExcuse(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('JUDGE_SUBMIT_EXCUSE', clean, payload);
    this.safeBroadcast(clean, 'JUDGE_SUBMIT_EXCUSE', payload);
  }

  public broadcastGuideSync(roomCode: string, state: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('GUIDE_STATE_SYNC', clean, state);
    this.safeBroadcast(clean, 'GUIDE_STATE_SYNC', state);
  }

  public broadcastGuidePin(roomCode: string, payload: any): void {
    const clean = cleanRoomCode(roomCode);
    const eventPayload = {
      ...payload,
      roomCode: clean,
      _senderId: payload?.contestantId || this.localPlayerId || this.clientId,
      _clientId: this.clientId,
    };
    this.dispatchLocal({
      roomCode: clean,
      type: 'GUIDE_PIN_SUBMITTED',
      data: eventPayload,
      timestamp: Date.now(),
    });
    if (this.channel) {
      try {
        this.channel.postMessage({
          roomCode: clean,
          type: 'GUIDE_PIN_SUBMITTED',
          data: eventPayload,
          timestamp: Date.now(),
        });
      } catch {}
    }
    this.safeBroadcast(clean, 'GUIDE_PIN_SUBMITTED', eventPayload);
  }

  private channel: BroadcastChannel | null = null;
  public typedListeners: Map<string, Set<(event: RoomEventPayload) => void>> = new Map();
  public listeners = this.typedListeners;
  private subscribers: Set<(msg: BusMessage) => void> = new Set();
  private timerIntervals: Map<string, number> = new Map();
  private idleIntervals: Map<string, number> = new Map();
  private supabaseChannels: Map<string, any> = new Map();
  private supabaseChannelStates: Map<string, 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED'> = new Map();
  private pendingMessagesQueue: Map<string, RoomEventPayload[]> = new Map();
  private pendingPresence: Map<string, any> = new Map();

  // --- Host authority (the TV screen owns the room state) ---
  private hostedRooms: Map<string, number> = new Map();
  private hostSince: Map<string, number> = new Map();
  private lastHeartbeat: Map<string, number> = new Map();
  private presence: Map<string, Map<string, number>> = new Map();
  private seenIntentIds: string[] = [];
  private seenIntentSet: Set<string> = new Set();
  private hostTicker: { stop: () => void } | null = null;

  private currentRoomCode: string | null = null;
  private syncDebounceTimer: any = null;
  private pendingBroadcasts: Map<string, Array<{ event: string; payload: any }>> = new Map();

  constructor() {
    // Prevent duplicate instances during Vite HMR
    if (typeof window !== 'undefined' && (window as any).__SHABAH_BUS__) {
      return (window as any).__SHABAH_BUS__;
    }
    if (typeof window !== 'undefined') {
      (window as any).__SHABAH_BUS__ = this;
    }

    this.initChannel();
    this.initStorageFallback();
    this.initRequestListener();
    this.initIntentListener();
  }

  // Only the hosting TV answers state requests, and it re-broadcasts WITHOUT bumping the version
  private initRequestListener() {
    this.on('REQUEST_ROOM_STATE', (payload) => {
      const cleanCode = cleanRoomCode(payload.roomCode);
      if (!this.isHosting(cleanCode)) return;
      const localRoom = this.getRoom(cleanCode);
      if (localRoom) {
        this.broadcastState(localRoom);
      }
    });
  }

  private initIntentListener() {
    this.on('CLIENT_INTENT', (payload) => {
      try {
        this.handleIntent(payload);
      } catch (err) {
        console.error('Host intent handling failed:', err);
      }
    });
  }

  // Purely browser native BroadcastChannel API
  private initChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent) => {
          if (event && event.data) {
            this.handleIncoming(event.data);
          }
        };
      } catch {
        this.channel = null;
      }
    }
  }

  // Solid fallback using localStorage storage event
  private initStorageFallback() {
    if (typeof window === 'undefined') return;
    try {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key && e.key.startsWith(STORAGE_PREFIX) && e.newValue) {
          try {
            const state = JSON.parse(e.newValue) as RoomState;
            // Dispatch locally ONLY. Re-emitting here re-broadcast stale copies to every device.
            this.dispatchLocal({
              roomCode: cleanRoomCode(state.code),
              type: 'STATE_UPDATED',
              data: state,
              timestamp: Date.now(),
            });
          } catch {
            // ignore JSON parse error
          }
        }
      });
    } catch {
      // ignore storage listener attachment failure
    }
  }

  // Cross-device Supabase Realtime channel integration (prevents duplicates)

  public async trackPlayerPresence(roomCode: string, player: { id: string; name: string; isReady?: boolean; team?: string }) {
    const cleanCode = cleanRoomCode(roomCode);
    this.pendingPresence.set(cleanCode, player);
    const ch = this.ensureSupabaseChannel(cleanCode);
    if (!ch) return;
    try {
      if (ch.state === 'joined') {
        await ch.track({
          id: player.id,
          name: player.name,
          team: player.team || 'team_a',
          isReady: Boolean(player.isReady),
          joinedAt: Date.now()
        });
        this.pendingPresence.delete(cleanCode);
      }
    } catch (err) {
      console.warn('[roomBus] trackPlayerPresence error:', err);
    }
  }

  public syncPresencePlayers(roomCode: string, list: any[]) {
    try {
      const clean = cleanRoomCode(roomCode);
      if (!clean) return;
      let room = this.getRoom(clean);
      if (!room) {
        room = this.createRoom(clean);
      }

      // Deduplicate incoming list strictly by player ID
      const uniqueMap = new Map<string, any>();
      list.forEach((p) => {
        if (p && p.id && p.id !== 'host_tv' && !this.kickedPlayerIds.has(p.id)) {
          if (uniqueMap.has(p.id)) {
            const prev = uniqueMap.get(p.id);
            uniqueMap.set(p.id, {
              ...prev,
              ...p,
              isReady: Boolean(prev.isReady || p.isReady),
            });
          } else {
            uniqueMap.set(p.id, p);
          }
        }
      });
      const cleanList = Array.from(uniqueMap.values());

      // Deduplicate existing room.players strictly by player ID
      const roomPlayersMap = new Map<string, Player>();
      room.players.forEach((p) => {
        if (p && p.id && p.id !== 'host_tv') {
          if (roomPlayersMap.has(p.id)) {
            const prev = roomPlayersMap.get(p.id)!;
            roomPlayersMap.set(p.id, {
              ...prev,
              ...p,
              isReady: Boolean(prev.isReady || p.isReady),
            });
          } else {
            roomPlayersMap.set(p.id, p);
          }
        }
      });
      room.players = Array.from(roomPlayersMap.values());

      let hasChanges = false;
      cleanList.forEach((p) => {
        if (!p || !p.id) return;
        let curr = this.getRoom(clean);
        if (!curr) return;

        let existing = curr.players.find((pl) => pl.id === p.id);
        
        if (!existing) {
          this.joinPlayer(clean, p.name || 'متسابق', p.avatar || 'avatar_1', p.team || 'team_a', p.id, true);
          const refreshed = this.getRoom(clean);
          if (refreshed) curr = refreshed;
          existing = curr.players.find((pl) => pl.id === p.id);
          hasChanges = true;
        } else {
          if (!existing.isOnline) {
            existing.isOnline = true;
            hasChanges = true;
          }
          if (p.isReady !== undefined && existing.isReady !== p.isReady) {
            existing.isReady = Boolean(p.isReady);
            hasChanges = true;
          }
          if (p.name && existing.name !== p.name) {
            existing.name = p.name;
            hasChanges = true;
          }
        }

        const activeId = existing ? existing.id : p.id;
        const targetRoom = curr;
        room = targetRoom;

        if (targetRoom.flagState) {
          if (!targetRoom.flagState.players[activeId]) {
            targetRoom.flagState.players[activeId] = {
              id: activeId,
              name: p.name || 'متسابق',
              score: 0,
              isReady: Boolean(p.isReady),
              currentGuessHex: null,
              currentAccuracy: null,
            };
            hasChanges = true;
          } else if (p.isReady !== undefined && targetRoom.flagState.players[activeId].isReady !== Boolean(p.isReady)) {
            targetRoom.flagState.players[activeId].isReady = Boolean(p.isReady);
            hasChanges = true;
          }
        }

        if (targetRoom.landmarkState) {
          if (!targetRoom.landmarkState.players[activeId]) {
            targetRoom.landmarkState.players[activeId] = {
              id: activeId,
              name: p.name || 'متسابق',
              score: 0,
              isReady: Boolean(p.isReady),
              currentLat: null,
              currentLng: null,
              currentDistanceKm: null,
              currentPointsAwarded: 0,
              hasSubmitted: false,
            };
            hasChanges = true;
          } else if (p.isReady !== undefined && targetRoom.landmarkState.players[activeId].isReady !== Boolean(p.isReady)) {
            targetRoom.landmarkState.players[activeId].isReady = Boolean(p.isReady);
            hasChanges = true;
          }
        }

        if (targetRoom.trajectoryState) {
          if (!targetRoom.trajectoryState.players[activeId]) {
            targetRoom.trajectoryState.players[activeId] = {
              id: activeId,
              name: p.name || 'متسابق',
              score: 0,
              isReady: Boolean(p.isReady),
              hasSubmitted: false,
              guessedCountryAr: null,
              guessedCountryEn: null,
              guessedIso3: null,
              isValidIntersect: false,
              entryDistanceKm: null,
              rank: null,
              currentPointsAwarded: 0,
            };
            hasChanges = true;
          } else if (p.isReady !== undefined && targetRoom.trajectoryState.players[activeId].isReady !== Boolean(p.isReady)) {
            targetRoom.trajectoryState.players[activeId].isReady = Boolean(p.isReady);
            hasChanges = true;
          }
        }

        if (targetRoom.tourismState) {
          if (!targetRoom.tourismState.players[activeId]) {
            targetRoom.tourismState.players[activeId] = {
              id: activeId,
              name: p.name || 'متسابق',
              score: 0,
              isReady: Boolean(p.isReady),
              hasLockedIn: false,
              lockedInStage: null,
              lockedInAnswer: null,
              isCorrect: false,
              pointsAwarded: 0,
            };
            hasChanges = true;
          } else if (p.isReady !== undefined && targetRoom.tourismState.players[activeId].isReady !== Boolean(p.isReady)) {
            targetRoom.tourismState.players[activeId].isReady = Boolean(p.isReady);
            hasChanges = true;
          }
        }
      });

      if (hasChanges && room) {
        room.lastActivity = Date.now();
        this.saveRoom(room);
        this.emit('STATE_UPDATED', clean, room);
      }
    } catch (err) {
      console.error('[roomBus] syncPresencePlayers error shielded:', err);
    }
  }

  public initRoom(roomCode: string, player: { id: string; name: string; isHost?: boolean; isReady?: boolean }): any {
    const cleanCode = cleanRoomCode(roomCode);
    if (!cleanCode) return null;
    if (player?.id) {
      this.localPlayerId = player.id;
    }

    // If already connected to the exact same room with an active channel, just update presence
    const currentCh = this.supabaseChannels.get(cleanCode);
    const isSubscribed = this.supabaseChannelStates.get(cleanCode) === 'SUBSCRIBED' && currentCh?.state === 'joined';
    if (this.currentRoomCode === cleanCode && currentCh && isSubscribed) {
      this.trackPlayer(cleanCode, player);
      return currentCh;
    }

    // Teardown any previous connection to a different room
    if (this.currentRoomCode && this.currentRoomCode !== cleanCode) {
      this.leaveRoom(this.currentRoomCode);
    }
    this.currentRoomCode = cleanCode;

    // Clean up any lingering channels registered inside supabase client
    if (typeof supabase?.getChannels === 'function') {
      const existingChannels = supabase.getChannels();
      existingChannels.forEach((ch: any) => {
        const topic = ch?.topic || '';
        if (topic.startsWith('room_') || topic.startsWith('realtime:room_')) {
          if (topic !== `room_${cleanCode}` && topic !== `realtime:room_${cleanCode}`) {
            try {
              ch.untrack();
            } catch {}
            supabase.removeChannel(ch);
          }
        }
      });
    }

    const ch = this.ensureSupabaseChannel(cleanCode, player);
    if (ch && this.supabaseChannelStates.get(cleanCode) === 'SUBSCRIBED') {
      this.trackPlayer(cleanCode, player);
    }
    return ch;
  }

  public async trackPlayer(roomCode: string, player: { id: string; name: string; isHost?: boolean; isReady?: boolean; [key: string]: any }): Promise<void> {
    const clean = cleanRoomCode(roomCode);
    const ch = this.supabaseChannels.get(clean) || this.ensureSupabaseChannel(clean);
    if (!ch) return;

    try {
      await ch.track({
        id: player.id,
        name: player.name,
        isHost: Boolean(player.isHost),
        isReady: Boolean(player.isReady),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[roomBus] trackPlayer error:', err);
    }
  }

  public getFormattedPlayers(roomCode: string): Array<{ id: string; name: string; isHost: boolean; isReady: boolean }> {
    const clean = cleanRoomCode(roomCode);
    const ch = this.supabaseChannels.get(clean);
    if (ch) {
      try {
        const state = ch.presenceState();
        const all = Object.values(state).flat() as any[];
        const map = new Map<string, { id: string; name: string; isHost: boolean; isReady: boolean }>();
        all.forEach((p) => {
          if (p && p.id && p.id !== 'host_tv' && !this.kickedPlayerIds.has(p.id)) {
            map.set(p.id, {
              id: p.id,
              name: p.name || 'متسابق',
              isHost: Boolean(p.isHost),
              isReady: Boolean(p.isReady),
            });
          }
        });
        if (map.size > 0) {
          return Array.from(map.values());
        }
      } catch (err) {
        console.error('[roomBus] getFormattedPlayers presenceState error shielded:', err);
      }
    }

    const r = this.getRoom(clean);
    if (r && r.players.length > 0) {
      return r.players
        .filter((p) => p.id !== 'host_tv' && !this.kickedPlayerIds.has(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          isHost: false,
          isReady: Boolean(p.isReady),
        }));
    }

    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(`taghesi_player_${clean}`) || localStorage.getItem(`taghesi_player_${clean}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.id && parsed?.name) {
            return [{
              id: parsed.id,
              name: parsed.name,
              isHost: false,
              isReady: false,
            }];
          }
        }
      } catch {}
    }

    return [];
  }

  public getPlayers(roomCode?: string): RoomPlayer[] {
    const code = roomCode || this.currentRoomCode || '';
    if (!code) return [];
    return this.getFormattedPlayers(code).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: Boolean(p.isHost),
      isReady: Boolean(p.isReady),
      joinedAt: Date.now(),
    }));
  }

  public leaveRoom(roomCode?: string, playerId?: string): void {
    clearTimeout(this.syncDebounceTimer);
    const code = roomCode || this.currentRoomCode;
    if (!code) return;
    const clean = cleanRoomCode(code);

    // Intentional leave guard to immediately terminate any reconnect attempts
    this.isIntentionalLeave.set(clean, true);
    const timer = this.reconnectTimers.get(clean);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(clean);
    }
    this.isReconnecting.set(clean, false);
    this.reconnectAttempts.delete(clean);

    if (playerId) {
      this.leavePlayer(clean, playerId);
    }

    const ch = this.supabaseChannels.get(clean);
    this.supabaseChannels.delete(clean);
    this.supabaseChannelStates.set(clean, 'CLOSED');

    if (ch) {
      try {
        ch.untrack();
      } catch {}
      try {
        supabase.removeChannel(ch);
      } catch {}
    }
    if (this.currentRoomCode === clean) {
      this.currentRoomCode = null;
    }
    this.pendingBroadcasts.delete(clean);
  }

  public registerChannel(roomCode: string, channel: any) {
    const clean = cleanRoomCode(roomCode);
    this.supabaseChannels.set(clean, channel);
    this.supabaseChannelStates.set(clean, 'SUBSCRIBED');
  }

  public getSupabaseChannel(roomCode: string): any {
    const clean = cleanRoomCode(roomCode);
    return this.supabaseChannels.get(clean) || null;
  }

  public ensureSupabaseChannel(roomCode: string, player?: { id: string; name: string; isHost?: boolean; isReady?: boolean }) {
    if (typeof window === 'undefined' || !roomCode) return null;
    const cleanCode = roomCode.toUpperCase().replace(/^ROOM_/, '');

    // 1. Check local instance map
    if (this.supabaseChannels.has(cleanCode)) {
      const ch = this.supabaseChannels.get(cleanCode);
      if (player && this.supabaseChannelStates.get(cleanCode) === 'SUBSCRIBED') {
        this.trackPlayer(cleanCode, player);
      }
      return ch;
    }

    // 2. Prevent duplicate channel instances across the Supabase client
    const topic = `room_${cleanCode}`;
    const existing = supabase.getChannels().find(
      (c: any) => c.topic === topic || c.topic === `realtime:${topic}` || c.topic === `room:${cleanCode}` || c.topic === `realtime:room:${cleanCode}`
    );
    if (existing) {
      this.supabaseChannels.set(cleanCode, existing);
      if (existing.state === 'joined') {
        this.supabaseChannelStates.set(cleanCode, 'SUBSCRIBED');
        this.flushPendingQueue(cleanCode);
        if (player) {
          this.trackPlayer(cleanCode, player);
        }
      }
      return existing;
    }

    this.supabaseChannelStates.set(cleanCode, 'CONNECTING');
    if (!this.pendingMessagesQueue.has(cleanCode)) {
      this.pendingMessagesQueue.set(cleanCode, []);
    }

    try {
      const presenceKey = player?.id || (this.isHosting(cleanCode)
        ? 'host_tv'
        : (typeof window !== 'undefined'
          ? (localStorage.getItem('taghesi_playerId') || sessionStorage.getItem('taghesi_playerId') || 'guest_' + Math.random().toString(36).substring(2, 7))
          : 'guest'));

      const ch = supabase.channel(topic, {
        config: {
          broadcast: { self: false, ack: false },
          presence: { key: presenceKey }
        },
      });

      ch.on('presence', { event: 'sync' }, () => {
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
          try {
            const state = ch.presenceState();
            const allPresences = Object.values(state).flat() as any[];
            const playersMap = new Map<string, any>();

            allPresences.forEach((entry) => {
              if (entry && entry.id && entry.id !== 'host_tv') {
                playersMap.set(entry.id, entry);
              }
            });

            const uniquePlayerList = Array.from(playersMap.values());
            console.log(`[ROOM_BUS] Authoritative Players Count: ${uniquePlayerList.length}`, uniquePlayerList);
            this.syncPresencePlayers(cleanCode, uniquePlayerList);
            this.emit('presence_sync', cleanCode, this.getFormattedPlayers(cleanCode));
          } catch (err) {
            console.warn('[roomBus] Presence sync error:', err);
          }
        }, 150);
      });

      ch.on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
          try {
            const list = (newPresences || []).filter((p: any) => p && p.id && p.id !== 'host_tv');
            this.syncPresencePlayers(cleanCode, list);
            this.emit('presence_join', cleanCode, { key, newPresences });
            this.emit('presence_sync', cleanCode, this.getFormattedPlayers(cleanCode));
          } catch (err) {
            console.warn('[roomBus] Presence join error:', err);
          }
        }, 150);
      });

      ch.on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        clearTimeout(this.syncDebounceTimer);
        this.syncDebounceTimer = setTimeout(() => {
          try {
            this.emit('presence_leave', cleanCode, { key, leftPresences });
            this.emit('presence_sync', cleanCode, this.getFormattedPlayers(cleanCode));
          } catch (err) {
            console.warn('[roomBus] Presence leave error:', err);
          }
        }, 150);
      });

      ch.on('broadcast', { event: 'PLAYER_READY_UPDATE' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          if (!payload || !payload.playerId) return;
          this.emit('PLAYER_READY_UPDATE', cleanCode, payload);
          const room = this.getRoom(cleanCode);
          if (room) {
            const p = room.players.find(
              (pl) => pl.id === payload.playerId || (payload.name && pl.name?.trim().toLowerCase() === payload.name?.trim().toLowerCase())
            );
            if (p) {
              p.isReady = Boolean(payload.isReady);
              if (room.flagState?.players[p.id]) room.flagState.players[p.id].isReady = p.isReady;
              if (room.landmarkState?.players[p.id]) room.landmarkState.players[p.id].isReady = p.isReady;
              if (room.trajectoryState?.players[p.id]) room.trajectoryState.players[p.id].isReady = p.isReady;
              if (room.tourismState?.players[p.id]) room.tourismState.players[p.id].isReady = p.isReady;
              if (this.isHosting(cleanCode)) {
                this.saveRoom(room);
                this.broadcastState(room);
              } else {
                this.writeLocal(room);
              }
            }
          }
        } catch (err) {
          console.error('[roomBus] PLAYER_READY_UPDATE error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'PLAYER_SUBMISSION' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          if (!payload || !payload.playerId) return;
          this.emit('PLAYER_SUBMISSION', cleanCode, payload);
          if (this.isHosting(cleanCode)) {
            const room = this.getRoom(cleanCode);
            if (!room) return;

            // 1. Landmark submission handling
            if (room.landmarkState) {
              if (payload.round !== undefined && Number(payload.round) !== Number(room.landmarkState.currentRound)) {
                console.warn('[TV IGNORE] Stale round submission received:', payload);
                return;
              }
              const coords = payload.coordinates || payload.answer?.coordinates || (payload.answer?.lat !== undefined ? payload.answer : undefined);
              if (coords && coords.lat !== undefined && coords.lng !== undefined) {
                console.log('[Landmark Guess Received]:', payload);
                this.submitLandmarkGuess(cleanCode, payload.playerId, coords.lat, coords.lng);
              }
            }

            // 2. Flag submission handling
            if (room.flagState) {
              if (payload.round !== undefined && Number(payload.round) !== Number(room.flagState.currentRound)) {
                console.warn('[TV IGNORE] Stale round submission received:', payload);
                return;
              }
              const hex = typeof payload.answer === 'string' ? payload.answer : (payload.answer?.hex || payload.hex || payload.answer?.currentHex);
              if (hex) {
                const currentFlagId = room.flagState.currentFlagId;
                const flagData = worldFlagsCatalog.find((f) => f.id === currentFlagId);
                const targetHex = flagData?.targetHex || '#000000';
                const score = payload.answer?.score ?? payload.score ?? calculateColorCloseness(hex, targetHex);
                this.submitFlagGuess(cleanCode, payload.playerId, hex, score);
              }
            }

            // 3. Trajectory submission handling
            if (room.trajectoryState) {
              if (payload.round !== undefined && Number(payload.round) !== Number(room.trajectoryState.currentRound)) {
                console.warn('[TV IGNORE] Stale round submission received:', payload);
                return;
              }
              const answer = payload.answer;
              const countryAr = typeof answer === 'string' ? answer : (answer?.nameAr || answer?.countryAr || '');
              const countryEn = typeof answer === 'object' ? (answer?.nameEn || answer?.countryEn) : undefined;
              const iso3 = typeof answer === 'object' ? answer?.iso3 : undefined;
              if (countryAr) {
                this.submitTrajectoryGuess(cleanCode, payload.playerId, countryAr, countryEn, iso3);
              }
            }

            // 4. Tourism submission handling
            if (room.tourismState) {
              if (payload.round !== undefined && Number(payload.round) !== Number(room.tourismState.currentRound)) {
                console.warn('[TV IGNORE] Stale round submission received:', payload);
                return;
              }
              const ansStr = typeof payload.answer === 'string' ? payload.answer : (payload.answer?.nameAr || payload.answer?.answer || '');
              if (ansStr) {
                this.lockInTourismAnswer(cleanCode, payload.playerId, ansStr);
              }
            }
          }
        } catch (err) {
          console.error('[roomBus] PLAYER_SUBMISSION error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ROUND_STARTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ROUND_STARTED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] ROUND_STARTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'GAME_STARTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('GAME_STARTED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] GAME_STARTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'RETURN_TO_LOBBY' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('RETURN_TO_LOBBY', cleanCode, {});
        } catch (err) {
          console.error('[roomBus] RETURN_TO_LOBBY broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'COACH_STATE_SYNC' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('COACH_STATE_SYNC', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] COACH_STATE_SYNC broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'BROKER_STATE_SYNC' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('BROKER_STATE_SYNC', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] BROKER_STATE_SYNC broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'BROKER_BID_SUBMITTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('BROKER_BID_SUBMITTED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] BROKER_BID_SUBMITTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'COACH_PICK_SUBMITTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('COACH_PICK_SUBMITTED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] COACH_PICK_SUBMITTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_STATE_SYNC' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ARABIC_STATE_SYNC', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] ARABIC_STATE_SYNC broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_SUBMIT_ANSWERS' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'ARABIC_SUBMIT_ANSWERS',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] ARABIC_SUBMIT_ANSWERS broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'SUBMIT_ARABIC_ANSWERS' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'ARABIC_SUBMIT_ANSWERS',
            data: payload,
            timestamp: Date.now(),
          });
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'SUBMIT_ARABIC_ANSWERS',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] SUBMIT_ARABIC_ANSWERS broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_TIME_UP' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'ARABIC_TIME_UP',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] ARABIC_TIME_UP broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_RESULTS_READY' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'ARABIC_RESULTS_READY',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] ARABIC_RESULTS_READY broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_OBJECTION_FILED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ARABIC_OBJECTION_FILED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] ARABIC_OBJECTION_FILED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ARABIC_OBJECTION_VOTE' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ARABIC_OBJECTION_VOTE', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] ARABIC_OBJECTION_VOTE broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'JUDGE_STATE_SYNC' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('JUDGE_STATE_SYNC', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] JUDGE_STATE_SYNC broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'JUDGE_SUBMIT_EXCUSE' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('JUDGE_SUBMIT_EXCUSE', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] JUDGE_SUBMIT_EXCUSE broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'JUDGE_RESULTS_READY' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('JUDGE_RESULTS_READY', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] JUDGE_RESULTS_READY broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'GUIDE_STATE_SYNC' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'GUIDE_STATE_SYNC',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] GUIDE_STATE_SYNC broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'GUIDE_PIN_SUBMITTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.dispatchLocal({
            roomCode: cleanCode,
            type: 'GUIDE_PIN_SUBMITTED',
            data: payload,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[roomBus] GUIDE_PIN_SUBMITTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ROOM_CLOSED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ROOM_CLOSED', cleanCode, payload || {});
        } catch (err) {
          console.error('[roomBus] ROOM_CLOSED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'ROOM_TERMINATED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('ROOM_TERMINATED', cleanCode, payload || {});
          this.emit('TERMINATE_ROOM', cleanCode, payload || {});
        } catch (err) {
          console.error('[roomBus] ROOM_TERMINATED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'TERMINATE_ROOM' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          const room = this.getRoom(cleanCode);
          if (room?.hostId && payload?._senderId && payload._senderId !== room.hostId && payload._senderId !== 'host_tv') {
            console.warn('[roomBus] Unauthorized TERMINATE_ROOM dropped from:', payload._senderId);
            return;
          }
          this.emit('TERMINATE_ROOM', cleanCode, payload || {});
          this.emit('ROOM_TERMINATED', cleanCode, payload || {});
        } catch (err) {
          console.error('[roomBus] TERMINATE_ROOM broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'FORCE_PLAYER_KICK' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          const room = this.getRoom(cleanCode);
          if (room?.hostId && payload?._senderId && payload._senderId !== room.hostId && payload._senderId !== 'host_tv') {
            console.warn('[roomBus] Unauthorized FORCE_PLAYER_KICK dropped from:', payload._senderId);
            return;
          }
          const kickedId = payload?.targetPlayerId || payload?.playerId || payload?.data;
          if (kickedId) {
            this.kickedPlayerIds.add(kickedId);
          }
          this.emit('FORCE_PLAYER_KICK', cleanCode, payload || {});
          this.emit('PLAYER_KICKED', cleanCode, payload || {});
        } catch (err) {
          console.error('[roomBus] FORCE_PLAYER_KICK broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'PLAYER_KICKED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          const room = this.getRoom(cleanCode);
          if (room?.hostId && payload?._senderId && payload._senderId !== room.hostId && payload._senderId !== 'host_tv') {
            console.warn('[roomBus] Unauthorized PLAYER_KICKED dropped from:', payload._senderId);
            return;
          }
          const kickedId = payload?.targetPlayerId || payload?.playerId || payload?.data;
          if (kickedId) {
            this.kickedPlayerIds.add(kickedId);
          }
          this.emit('FORCE_PLAYER_KICK', cleanCode, payload || {});
          this.emit('PLAYER_KICKED', cleanCode, payload || {});
        } catch (err) {
          console.error('[roomBus] PLAYER_KICKED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'BINGO_PLAYER_SELECTED' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          this.emit('BINGO_PLAYER_SELECTED', cleanCode, payload);
        } catch (err) {
          console.error('[roomBus] BINGO_PLAYER_SELECTED broadcast error shielded:', err);
        }
      });

      ch.on('broadcast', { event: 'room_event' }, ({ payload }) => {
        try {
          if (this.isSelfBroadcast(payload)) return;
          if (payload && payload.roomCode) {
            const cleanIncoming = cleanRoomCode(payload.roomCode);
            if (cleanIncoming === cleanCode) {
              if (payload.type === 'STATE_UPDATED' && payload.data) {
                const state = payload.data as RoomState;
                // Version gate: never let an older/stale copy overwrite a newer local state
                if (!isNewerState(state, this.getRoom(cleanCode))) {
                  return;
                }
                this.writeLocal(state);
              }
              this.dispatchLocal(payload);
            }
          }
        } catch (err) {
          console.error('[roomBus] room_event broadcast error shielded:', err);
        }
      });

      ch.subscribe(async (status: string) => {
        console.log(`[ROOM_BUS] Channel Status: ${status}`);
        if (status === 'SUBSCRIBED') {
          this.supabaseChannelStates.set(cleanCode, 'SUBSCRIBED');
          this.isReconnecting.set(cleanCode, false);
          this.isIntentionalLeave.set(cleanCode, false);
          const timer = this.reconnectTimers.get(cleanCode);
          if (timer) {
            clearTimeout(timer);
            this.reconnectTimers.delete(cleanCode);
          }
          this.reconnectAttempts.delete(cleanCode);
          this.flushPendingQueue(cleanCode);

          if (player) {
            await this.trackPlayer(cleanCode, player);
          } else {
            const pending = this.pendingPresence.get(cleanCode);
            if (pending) {
              await this.trackPlayerPresence(cleanCode, pending);
            } else if (typeof window !== 'undefined') {
              try {
                const saved = sessionStorage.getItem(`taghesi_player_${cleanCode}`) || localStorage.getItem(`taghesi_player_${cleanCode}`);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed?.id && parsed?.name) {
                    await this.trackPlayerPresence(cleanCode, parsed);
                  }
                }
              } catch {}
            }
          }

          // Flush any queued broadcasts that were attempted before subscription
          const queue = this.pendingBroadcasts.get(cleanCode);
          if (queue && queue.length > 0) {
            while (queue.length > 0) {
              const item = queue.shift();
              if (item) {
                this.broadcast(cleanCode, item.event, item.payload);
              }
            }
          }

          // (Re)connected: hosts push their state, clients ask for the latest one
          if (this.isHosting(cleanCode)) {
            const local = this.getRoom(cleanCode);
            if (local) this.broadcastState(local);
          } else {
            this.safeChannelSend(cleanCode, {
              roomCode: cleanCode,
              type: 'REQUEST_ROOM_STATE',
              data: {},
              timestamp: Date.now(),
            });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          this.supabaseChannelStates.set(cleanCode, 'CLOSED');

          // If intentional leave or already reconnecting: DO NOTHING, NEVER RECURSE
          if (this.isIntentionalLeave.get(cleanCode) || this.isReconnecting.get(cleanCode)) {
            return;
          }

          // Single debounced safe reconnect without synchronous removeChannel recursion
          this.scheduleReconnect(cleanCode, player);
        }
      });

      this.supabaseChannels.set(cleanCode, ch);
      return ch;
    } catch (err) {
      this.supabaseChannelStates.set(cleanCode, 'CLOSED');
      console.warn('Could not initialize Supabase Realtime channel:', err);
      return null;
    }
  }

  // Safe sender function: ONLY calls channel.send() when state is strictly joined / SUBSCRIBED
  public safeChannelSend(cleanCode: string, payload: RoomEventPayload): void {
    const ch = this.supabaseChannels.get(cleanCode);
    const isSubscribed = this.supabaseChannelStates.get(cleanCode) === 'SUBSCRIBED';
    const canPush =
      ch &&
      typeof (ch as any).channelAdapter?.canPush === 'function'
        ? (ch as any).channelAdapter.canPush()
        : isSubscribed && ch?.state === 'joined';

    if (ch && canPush) {
      try {
        ch.send({
          type: 'broadcast',
          event: 'room_event',
          payload,
        });
      } catch (err) {
        console.warn('Supabase broadcast send error:', err);
      }
    } else {
      // Channel not yet strictly SUBSCRIBED / joined: queue it (bounded, latest state snapshot only)
      if (!this.pendingMessagesQueue.has(cleanCode)) {
        this.pendingMessagesQueue.set(cleanCode, []);
      }
      let queue = this.pendingMessagesQueue.get(cleanCode)!;
      if (payload.type === 'STATE_UPDATED') {
        queue = queue.filter((m) => m.type !== 'STATE_UPDATED');
      }
      queue.push(payload);
      if (queue.length > 60) queue = queue.slice(queue.length - 60);
      this.pendingMessagesQueue.set(cleanCode, queue);
    }
  }

  private flushPendingQueue(cleanCode: string): void {
    const ch = this.supabaseChannels.get(cleanCode);
    const queue = this.pendingMessagesQueue.get(cleanCode);
    if (!ch || !queue || queue.length === 0) return;

    const canPush =
      typeof (ch as any).channelAdapter?.canPush === 'function'
        ? (ch as any).channelAdapter.canPush()
        : ch.state === 'joined';
    if (!canPush) return;

    while (queue.length > 0) {
      const payload = queue.shift();
      if (payload) {
        try {
          ch.send({
            type: 'broadcast',
            event: 'room_event',
            payload,
          });
        } catch (err) {
          console.warn('Error flushing pending Supabase message:', err);
        }
      }
    }
  }

  private broadcastToSupabase(payload: RoomEventPayload) {
    if (typeof window === 'undefined' || !payload.roomCode) return;
    const cleanCode = payload.roomCode.toUpperCase().replace(/^ROOM_/, '');
    this.ensureSupabaseChannel(cleanCode);
    this.safeChannelSend(cleanCode, payload);
  }

  // Internal dispatcher to both typed listeners and subscribers
  private handleIncoming(raw: any) {
    if (this.isSelfBroadcast(raw) || this.isSelfBroadcast(raw?.data) || this.isSelfBroadcast(raw?.payload)) {
      return;
    }

    let payload: RoomEventPayload;

    if (raw && typeof raw === 'object' && 'roomCode' in raw && 'type' in raw) {
      payload = raw as RoomEventPayload;
    } else if (raw && typeof raw === 'object' && 'roomId' in raw && 'type' in raw) {
      // Convert from BusMessage
      payload = {
        roomCode: raw.roomId,
        type: raw.type,
        data: raw.state || raw.player || raw.event || raw.request || raw,
        timestamp: Date.now(),
      };
    } else {
      return;
    }

    if (this.isSelfBroadcast(payload.data)) {
      return;
    }

    this.dispatchLocal(payload);
  }

  public dispatchLocal(payload: RoomEventPayload) {
    // 1. Dispatch to typed listeners for this specific type
    const listeners = this.typedListeners.get(payload.type);
    if (listeners && listeners.size > 0) {
      const snapshot = Array.from(listeners);
      for (const cb of snapshot) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[ROOM_BUS] Error in listener for "${payload.type}":`, err);
        }
      }
    }

    // 2. Dispatch to wildcard listeners
    const wildcard = this.typedListeners.get('*');
    if (wildcard && wildcard.size > 0) {
      const snapshot = Array.from(wildcard);
      for (const cb of snapshot) {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[ROOM_BUS] Error in wildcard listener for "${payload.type}":`, err);
        }
      }
    }

    // 3. Dispatch to legacy subscribers
    const legacyMsg = this.toLegacyMessage(payload);
    if (legacyMsg && this.subscribers.size > 0) {
      const snapshot = Array.from(this.subscribers);
      for (const fn of snapshot) {
        try {
          fn(legacyMsg);
        } catch (err) {
          console.error(`[ROOM_BUS] Error in legacy subscriber for "${payload.type}":`, err);
        }
      }
    }
  }

  private toLegacyMessage(payload: RoomEventPayload): BusMessage | null {
    const { roomCode, type, data } = payload;
    switch (type) {
      case 'STATE_UPDATED':
        return { type: 'STATE_UPDATED', roomId: roomCode, state: data };
      case 'BUZZER_HIT':
        return { type: 'BUZZER_HIT', roomId: roomCode, event: data };
      case 'PLAYER_JOINED':
        return { type: 'PLAYER_JOINED', roomId: roomCode, player: data };
      case 'PLAYER_KICKED':
        return { type: 'PLAYER_KICKED', roomId: roomCode, playerId: typeof data === 'string' ? data : data?.playerId };
      case 'CELL_SELECTED':
        return { type: 'CELL_SELECTED', roomId: roomCode, cellId: typeof data === 'string' ? data : data?.cellId };
      case 'CORRECT_ANSWER':
        return { type: 'CORRECT_ANSWER', roomId: roomCode, winnerPlayerId: typeof data === 'string' ? data : data?.winnerPlayerId };
      case 'COUNTDOWN_TICK':
        return { type: 'COUNTDOWN_TICK', roomId: roomCode, remaining: typeof data === 'number' ? data : data?.remaining };
      case 'TIMEOUT_FREEZE':
        return { type: 'TIMEOUT_FREEZE', roomId: roomCode };
      case 'HOST_REQUEST_SUBMITTED':
        return { type: 'HOST_REQUEST_SUBMITTED', roomId: roomCode, request: data };
      case 'HOST_REQUEST_RESOLVED':
        return { type: 'HOST_REQUEST_RESOLVED', roomId: roomCode, playerId: data?.playerId, accepted: data?.accepted };
      case 'GAME_ENDED':
        return { type: 'GAME_ENDED', roomId: roomCode };
      case 'ROUND_RESET':
        return { type: 'ROUND_RESET', roomId: roomCode };
      case 'WINNER_DECLARED':
        return { type: 'WINNER_DECLARED', roomId: roomCode, winner: data?.winner, path: data?.path };
      default:
        return null;
    }
  }

  // --- Typed Event Listener API: on, emit, off ---

  public on<T = any>(
    type: RoomEventType | '*' | string,
    callback: (event: any) => void
  ): () => void {
    if (!this.typedListeners.has(type)) {
      this.typedListeners.set(type, new Set());
    }
    const set = this.typedListeners.get(type)!;
    set.add(callback);
    return () => this.off(type, callback);
  }

  public off<T = any>(
    type: RoomEventType | '*' | string,
    callback: (event: any) => void
  ): void {
    const set = this.typedListeners.get(type);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        this.typedListeners.delete(type);
      }
    }
  }

  public emit<T = any>(type: RoomEventType | string, roomCodeOrPayload?: string | T, maybeData?: T): void {
    let cleanCode = '';
    let data: any = maybeData;

    if (typeof roomCodeOrPayload === 'string') {
      cleanCode = roomCodeOrPayload.toUpperCase().replace(/^ROOM_/, '');
    } else if (roomCodeOrPayload !== undefined && maybeData === undefined) {
      data = roomCodeOrPayload;
      cleanCode = (data?.roomCode || this.currentRoomCode || '').toUpperCase().replace(/^ROOM_/, '');
    }

    const payload: RoomEventPayload<T> = {
      roomCode: cleanCode,
      type: type as any,
      data: data as T,
      timestamp: Date.now(),
    };

    const isAutoSync =
      type === 'GUIDE_STATE_SYNC' ||
      type === 'COACH_STATE_SYNC' ||
      type === 'BROKER_STATE_SYNC' ||
      type === 'JUDGE_STATE_SYNC' ||
      type === 'ARABIC_STATE_SYNC';

    // 1. Post to native BroadcastChannel (skip auto-sync loops)
    if (this.channel && !isAutoSync) {
      try {
        this.channel.postMessage(payload);
      } catch (e) {
        console.warn('BroadcastChannel postMessage error, using local fallback:', e);
      }
    }

    // 2. Broadcast across devices via Supabase Realtime (safeBroadcast handles auto-sync)
    if (!isAutoSync) {
      this.broadcastToSupabase(payload);
    }

    // 3. Always dispatch locally immediately to all listeners safely
    this.dispatchLocal(payload);
  }

  // --- Backward Compatible subscribe & broadcast ---

  public subscribe(fn: (msg: BusMessage) => void): () => void {
    this.subscribers.add(fn);
    return () => {
      this.subscribers.delete(fn);
    };
  }

  public async broadcast(roomCodeOrEventOrMsg: any, eventOrPayload?: any, payload?: any): Promise<void> {
    if (typeof roomCodeOrEventOrMsg === 'object' && roomCodeOrEventOrMsg !== null && roomCodeOrEventOrMsg.type && roomCodeOrEventOrMsg.roomId) {
      const msg = roomCodeOrEventOrMsg as BusMessage;
      this.emit(msg.type, msg.roomId, (msg as any).state || (msg as any).player || (msg as any).event || (msg as any).request || msg);
      return;
    }

    let roomCode = '';
    let event = '';
    let data: any = {};

    if (payload !== undefined) {
      // 3-argument call: broadcast(roomCode, event, payload)
      roomCode = String(roomCodeOrEventOrMsg || '');
      event = eventOrPayload;
      data = payload;

      // Smart swap if event and payload were inverted
      if (typeof event !== 'string' && typeof data === 'string') {
        const temp = event;
        event = data;
        data = temp;
      }
    } else {
      // 2-argument call: broadcast(event, payload) or broadcast(payload, event)
      let first = roomCodeOrEventOrMsg;
      let second = eventOrPayload;

      // Smart swap if first is payload object and second is event string
      if (typeof first !== 'string' && typeof second === 'string') {
        const temp = first;
        first = second;
        second = temp;
      }

      if (typeof second === 'object' && second !== null) {
        event = String(first || '');
        data = second;
        roomCode = data.roomCode || data.roomId || '';
      } else {
        roomCode = String(first || '');
        event = String(second || '');
        data = {};
      }
    }

    let clean = cleanRoomCode(roomCode);
    if (!clean) {
      const activeHosted = Array.from(this.hostedRooms.keys())[0];
      clean = activeHosted || 'SHBH';
    }

    const eventName = String(event);

    this.emit(eventName as any, clean, data);
    this.safeBroadcast(clean, eventName, data);
  }

  // --- Storage & Room State Operations ---

  public isHosting(roomCode: string): boolean {
    const clean = cleanRoomCode(roomCode);
    return (this.hostedRooms.get(clean) || 0) > 0;
  }

  public registerHost(roomCode: string): () => void {
    const clean = cleanRoomCode(roomCode);
    const count = (this.hostedRooms.get(clean) || 0) + 1;
    this.hostedRooms.set(clean, count);
    if (!this.hostSince.has(clean)) {
      this.hostSince.set(clean, Date.now());
    }

    const room = this.getRoom(clean);
    if (room) {
      this.broadcastState(room);
    }

    return () => {
      const c = (this.hostedRooms.get(clean) || 1) - 1;
      if (c <= 0) {
        this.hostedRooms.delete(clean);
        this.hostSince.delete(clean);
      } else {
        this.hostedRooms.set(clean, c);
      }
    };
  }

  public writeLocal(state: RoomState): void {
    if (typeof window === 'undefined') return;
    try {
      const codeUpper = state.code.toUpperCase();
      const idUpper = state.id.toUpperCase();
      const serialized = JSON.stringify(state);

      localStorage.setItem(STORAGE_PREFIX + codeUpper, serialized);
      if (idUpper !== codeUpper) {
        localStorage.setItem(STORAGE_PREFIX + idUpper, serialized);
      }
    } catch (e) {
      console.error('Failed to write room locally:', e);
    }
  }

  public broadcastState(state: RoomState): void {
    const clean = cleanRoomCode(state.code);
    this.writeLocal(state);
    this.emit('STATE_UPDATED', clean, state);
  }

  public getRoom(roomId: string): RoomState | null {
    if (typeof window === 'undefined') return null;
    try {
      const clean = roomId.toUpperCase().replace(/^ROOM_/, '');
      const raw =
        localStorage.getItem(STORAGE_PREFIX + clean) ||
        localStorage.getItem(STORAGE_PREFIX + 'ROOM_' + clean);
      if (!raw) return null;
      return JSON.parse(raw) as RoomState;
    } catch {
      return null;
    }
  }

  public saveRoom(state: RoomState): void {
    if (typeof window === 'undefined') return;
    state.version = (state.version || 0) + 1;
    state.updatedAt = Date.now();
    state.writerId = TAB_ID;
    this.broadcastState(state);
  }

  public sendIntent(roomCode: string, action: ClientIntentAction, playerId: string, payload?: any): string {
    const cleanCode = cleanRoomCode(roomCode);
    const intentId = 'int_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    const intent: ClientIntent = {
      intentId,
      action,
      playerId,
      payload,
    };
    this.emit('CLIENT_INTENT', cleanCode, intent);
    return intentId;
  }

  private handleIntent(payload: RoomEventPayload) {
    const cleanCode = cleanRoomCode(payload.roomCode);
    if (!this.isHosting(cleanCode)) return;

    const intent = payload.data as ClientIntent;
    if (!intent || !intent.intentId) return;

    // Deduplicate intents
    if (this.seenIntentSet.has(intent.intentId)) return;
    this.seenIntentSet.add(intent.intentId);
    this.seenIntentIds.push(intent.intentId);
    if (this.seenIntentIds.length > 200) {
      const old = this.seenIntentIds.shift();
      if (old) this.seenIntentSet.delete(old);
    }

    const room = this.getRoom(cleanCode);
    if (!room) return;

    switch (intent.action) {
      case 'PING': {
        const p = room.players.find((pl) => pl.id === intent.playerId);
        if (p) {
          p.isOnline = true;
          p.lastPingMs = intent.payload?.ping || 25;
        }
        break;
      }
      case 'JOIN': {
        const { name, avatar, team } = intent.payload || {};
        const p = this.joinPlayer(cleanCode, name, avatar, team);
        this.emit('JOIN_RESULT', cleanCode, {
          ok: Boolean(p),
          player: p,
          intentId: intent.intentId,
        });
        break;
      }
      case 'LEAVE': {
        this.kickPlayer(cleanCode, intent.playerId);
        break;
      }
      case 'PLAYER_SET_READY':
      case 'PLAYER_TOGGLE_READY': {
        this.togglePlayerReady(cleanCode, intent.playerId);
        break;
      }
      case 'FLAG_SET_READY': {
        this.toggleFlagReady(cleanCode, intent.playerId);
        break;
      }
      case 'FLAG_SUBMIT_GUESS': {
        const { hex, score } = intent.payload || {};
        this.submitFlagGuess(cleanCode, intent.playerId, hex, score);
        break;
      }
      case 'FLAG_ROUND_READY': {
        if (!room.flagState) break;
        if (!room.flagState.roundReadyPlayers) {
          room.flagState.roundReadyPlayers = {};
        }
        room.flagState.roundReadyPlayers[intent.playerId] = true;
        this.saveRoom(room);
        break;
      }
      case 'FLAG_RESET_LOBBY': {
        this.resetFlagToLobby(cleanCode);
        break;
      }
      case 'LANDMARK_SET_SCOPE': {
        const { scope } = intent.payload || {};
        this.setLandmarkScope(cleanCode, scope || 'saudi');
        break;
      }
      case 'LANDMARK_START_ROUND': {
        const { roundNumber } = intent.payload || {};
        this.tvStartNextLandmarkRound(cleanCode, roundNumber || 1);
        break;
      }
      case 'LANDMARK_SUBMIT_GUESS': {
        const { lat, lng } = intent.payload || {};
        this.submitLandmarkGuess(cleanCode, intent.playerId, lat, lng);
        break;
      }
      case 'LANDMARK_ROUND_READY': {
        if (!room.landmarkState) break;
        if (!room.landmarkState.roundReadyPlayers) {
          room.landmarkState.roundReadyPlayers = {};
        }
        room.landmarkState.roundReadyPlayers[intent.playerId] = true;
        this.saveRoom(room);

        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.landmarkState.roundReadyPlayers).filter(
          (k) => room.landmarkState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.landmarkState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextLandmarkRound(cleanCode, (room.landmarkState?.currentRound || 1) + 1);
          }, 400);
        }
        break;
      }
      case 'LANDMARK_RESOLVE_REVEAL': {
        this.resolveLandmarkReveal(cleanCode);
        break;
      }
      case 'LANDMARK_RESET_LOBBY': {
        this.resetLandmarkToLobby(cleanCode);
        break;
      }
      case 'TRAJECTORY_START_ROUND': {
        const { roundNumber } = intent.payload || {};
        this.tvStartNextTrajectoryRound(cleanCode, roundNumber || 1);
        break;
      }
      case 'TRAJECTORY_SUBMIT_GUESS': {
        const { countryAr, countryEn, iso3 } = intent.payload || {};
        this.submitTrajectoryGuess(cleanCode, intent.playerId, countryAr, countryEn, iso3);
        break;
      }
      case 'TRAJECTORY_ROUND_READY': {
        if (!room.trajectoryState) break;
        if (!room.trajectoryState.roundReadyPlayers) {
          room.trajectoryState.roundReadyPlayers = {};
        }
        room.trajectoryState.roundReadyPlayers[intent.playerId] = true;
        this.saveRoom(room);

        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.trajectoryState.roundReadyPlayers).filter(
          (k) => room.trajectoryState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.trajectoryState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextTrajectoryRound(cleanCode, (room.trajectoryState?.currentRound || 1) + 1);
          }, 400);
        }
        break;
      }
      case 'TRAJECTORY_RESOLVE_REVEAL': {
        this.resolveTrajectoryReveal(cleanCode);
        break;
      }
      case 'TRAJECTORY_RESET_LOBBY': {
        this.resetTrajectoryToLobby(cleanCode);
        break;
      }
      case 'TOURISM_START_ROUND': {
        const { roundNumber } = intent.payload || {};
        this.tvStartNextTourismRound(cleanCode, roundNumber || 1);
        break;
      }
      case 'TOURISM_LOCK_IN': {
        const { answer } = intent.payload || {};
        this.lockInTourismAnswer(cleanCode, intent.playerId, answer);
        break;
      }
      case 'TOURISM_ROUND_READY': {
        if (!room.tourismState) break;
        if (!room.tourismState.roundReadyPlayers) {
          room.tourismState.roundReadyPlayers = {};
        }
        room.tourismState.roundReadyPlayers[intent.playerId] = true;
        this.saveRoom(room);

        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.tourismState.roundReadyPlayers).filter(
          (k) => room.tourismState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.tourismState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextTourismRound(cleanCode, (room.tourismState?.currentRound || 1) + 1);
          }, 400);
        }
        break;
      }
      case 'TOURISM_RESOLVE_REVEAL': {
        this.resolveTourismReveal(cleanCode);
        break;
      }
      case 'TOURISM_RESET_LOBBY': {
        this.resetTourismToLobby(cleanCode);
        break;
      }
      case 'TOURISM_SKIP_HINT': {
        this.voteSkipTourismHint(cleanCode, intent.playerId);
        break;
      }
    }
  }

  public createRoom(customCode?: string, gameModeId: string = 'letter-classic'): RoomState {
    const codeList = ['TAQ1', 'ARAG', 'NAJD', 'WAHA', 'SAHR', 'SAMR', 'DIWN', 'JAWS'];
    const generated = codeList[Math.floor(Math.random() * codeList.length)] + Math.floor(10 + Math.random() * 89);
    const code = (customCode || generated).toUpperCase();

    const hexGrid = generateHexGrid(gameModeId);

    const newRoom: RoomState = {
      id: code,
      code: code,
      createdAt: Date.now(),
      status: 'lobby',
      hostConnected: false,
      hostPasscode: 'GM-' + Math.floor(1000 + Math.random() * 9000),
      hostPlayerId: null,
      hostRequest: null,
      selectedGameId: gameModeId,
      players: [],
      lastActivity: Date.now(),
      hexGrid,
      activeCellId: null,
      activeQuestion: null,
      buzzerLock: {
        status: 'idle',
        countdownRemaining: 3,
        timerDuration: 3,
        attemptNumber: 1,
        isFrozen: false,
      },
      scores: {
        team_a: {
          name: 'الفريق الأخضر',
          color: 'olive',
          connectDirection: 'horizontal',
          cellsWon: 0,
          roundsWon: 0,
        },
        team_b: {
          name: 'الفريق الطيني',
          color: 'ochre',
          connectDirection: 'vertical',
          cellsWon: 0,
          roundsWon: 0,
        },
      },
      winnerTeam: null,
      winningPath: [],
      roundNumber: 1,
      lastWinnerPlayerId: null,
      cellPickerPlayerId: null,
      cellPickerPlayerName: null,
      flagState: gameModeId === 'geo-flag-color' ? {
        gameState: 'LOBBY',
        players: {},
        currentRound: 1,
        totalRounds: 5,
        currentFlagId: null,
        countdown: 25,
        revealedPlayerIds: [],
        roundReadyPlayers: {},
        sessionFlagIds: [],
        playedFlagIds: [],
      } : undefined,
    };

    this.saveRoom(newRoom);

    // Sync to authoritative Supabase rooms table for cross-device support
    if (gameModeId) {
      supabase
        .from('rooms')
        .upsert(
          {
            room_code: code,
            game_id: normalizeGameId(gameModeId) || gameModeId,
            status: 'lobby',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'room_code' }
        )
        .then(
          ({ error }: any) => {
            if (error) console.warn('[RoomBus] Supabase room sync:', error.message);
          },
          (e: any) => console.warn('[RoomBus] Supabase room sync err:', e)
        );
    }

    return newRoom;
  }

  public validateRoom(roomId: string): { valid: boolean; reason?: string } {
    const clean = roomId.trim().toUpperCase();
    if (!clean) return { valid: false, reason: 'فضلاً أدخل رمز الغرفة' };
    const room = this.getRoom(clean);
    if (!room) {
      return { valid: false, reason: 'رمز الغرفة غير موجود أو غير نشط حالياً' };
    }
    if (room.status === 'round_won') {
      return { valid: false, reason: 'رمز الغرفة غير موجود أو غير نشط حالياً' };
    }
    if (room.flagState && room.flagState.gameState !== 'LOBBY') {
      return { valid: false, reason: 'اللعبة بادية حالياً.. انتظر اللعبة القادمة!' };
    }
    return { valid: true };
  }

  public joinRoom(roomId: string, name: string, avatar: AvatarId = 'falcon', customId?: string): JoinResult {
    const player = this.joinPlayer(roomId, name, avatar, undefined, customId);
    if (!player) {
      return { ok: false, reason: 'اللعبة جارية حالياً أو تعذر الانضمام للغرفة' };
    }
    return { ok: true, player };
  }

  public joinPlayer(roomId: string, name: string, avatar: AvatarId, team?: TeamId, customId?: string, silent?: boolean): Player | null {
    let room = this.getRoom(roomId);
    if (!room) {
      room = this.createRoom(roomId);
    }

    // Match strictly by customId first
    let existingIndex = -1;
    if (customId) {
      existingIndex = room.players.findIndex((p) => p.id === customId);
    }

    let finalName = name.trim();
    // If player does not match an existing ID, ensure their name doesn't overwrite another player's slot
    if (existingIndex < 0) {
      const nameCollision = room.players.some(
        (p) => (!customId || p.id !== customId) && p.name.trim().toLowerCase() === finalName.toLowerCase()
      );
      if (nameCollision) {
        let count = 2;
        while (room.players.some((p) => p.name.trim().toLowerCase() === `${finalName} (${count})`.toLowerCase())) {
          count++;
        }
        finalName = `${finalName} (${count})`;
      }
    }

    if (existingIndex < 0 && room.flagState && room.flagState.gameState !== 'LOBBY') {
      return null;
    }

    const playerId = customId || (existingIndex >= 0 ? room.players[existingIndex].id : 'p_' + Math.random().toString(36).substring(2, 9));

    const teamACount = room.players.filter((p) => p.team === 'team_a').length;
    const teamBCount = room.players.filter((p) => p.team === 'team_b').length;
    const assignedTeam: TeamId = team || (teamACount <= teamBCount ? 'team_a' : 'team_b');

    const existingP = existingIndex >= 0 ? room.players[existingIndex] : null;
    const player: Player = {
      id: playerId,
      name: finalName,
      avatar: existingP ? existingP.avatar : avatar,
      team: existingP ? existingP.team : assignedTeam,
      joinedAt: existingP ? existingP.joinedAt : Date.now(),
      isOnline: true,
      isReady: existingP ? (existingP.isReady || false) : false,
      lastPingMs: 22 + Math.floor(Math.random() * 18),
    };

    if (existingIndex >= 0) {
      room.players[existingIndex] = player;
    } else {
      room.players.push(player);
    }

    // Enforce strict uniqueness in room.players by ID
    const dedupMap = new Map<string, Player>();
    room.players.forEach((p) => {
      if (p && p.id) dedupMap.set(p.id, p);
    });
    room.players = Array.from(dedupMap.values());

    if (room.flagState) {
      if (!room.flagState.players[playerId]) {
        room.flagState.players[playerId] = {
          id: playerId,
          name: player.name,
          score: 0,
          isReady: false,
          currentGuessHex: null,
          currentAccuracy: null,
        };
      } else {
        room.flagState.players[playerId].name = player.name;
      }
    }

    if (room.landmarkState) {
      if (!room.landmarkState.players[playerId]) {
        room.landmarkState.players[playerId] = {
          id: playerId,
          name: player.name,
          score: 0,
          isReady: false,
          currentLat: null,
          currentLng: null,
          currentDistanceKm: null,
          currentPointsAwarded: 0,
          hasSubmitted: false,
        };
      } else {
        room.landmarkState.players[playerId].name = player.name;
      }
    }

    if (room.tourismState) {
      if (!room.tourismState.players[playerId]) {
        room.tourismState.players[playerId] = {
          id: playerId,
          name: player.name,
          score: 0,
          isReady: false,
          hasLockedIn: false,
          lockedInStage: null,
          lockedInAnswer: null,
          isCorrect: false,
          pointsAwarded: 0,
        };
      } else {
        room.tourismState.players[playerId].name = player.name;
      }
    }
    if (room.trajectoryState) {
      if (!room.trajectoryState.players[playerId]) {
        room.trajectoryState.players[playerId] = {
          id: playerId,
          name: player.name,
          score: 0,
          isReady: false,
          hasSubmitted: false,
          guessedCountryAr: null,
          guessedCountryEn: null,
          guessedIso3: null,
          isValidIntersect: false,
          entryDistanceKm: null,
          rank: null,
          currentPointsAwarded: 0,
        };
      } else {
        room.trajectoryState.players[playerId].name = player.name;
      }
    }

    room.lastActivity = Date.now();
    this.saveRoom(room);
    this.emit('PLAYER_JOINED', room.id, player);
    if (existingIndex < 0 && !silent) {
      sound.playPlayerJoin();
    }

    return player;
  }

  public swapPlayerTeam(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player) return;

    player.team = player.team === 'team_a' ? 'team_b' : 'team_a';
    room.lastActivity = Date.now();
    this.saveRoom(room);
    sound.playClick();
  }

  public setPlayerTeam(roomId: string, playerId: string, team: TeamId) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.team = team;
      this.saveRoom(room);
    }
  }

  public kickPlayer(roomId: string, playerId: string) {
    const clean = cleanRoomCode(roomId);
    this.kickedPlayerIds.add(playerId);
    const room = this.getRoom(clean);
    if (!room) return;

    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.flagState && room.flagState.players[playerId]) {
      delete room.flagState.players[playerId];
    }
    if (room.flagState && room.flagState.roundReadyPlayers && room.flagState.roundReadyPlayers[playerId]) {
      delete room.flagState.roundReadyPlayers[playerId];
    }
    if (room.landmarkState && room.landmarkState.players[playerId]) {
      delete room.landmarkState.players[playerId];
    }
    if (room.landmarkState && room.landmarkState.roundReadyPlayers && room.landmarkState.roundReadyPlayers[playerId]) {
      delete room.landmarkState.roundReadyPlayers[playerId];
    }
    if (room.trajectoryState && room.trajectoryState.players[playerId]) {
      delete room.trajectoryState.players[playerId];
    }
    if (room.trajectoryState && room.trajectoryState.roundReadyPlayers && room.trajectoryState.roundReadyPlayers[playerId]) {
      delete room.trajectoryState.roundReadyPlayers[playerId];
    }
    if (room.tourismState && room.tourismState.players[playerId]) {
      delete room.tourismState.players[playerId];
    }
    if (room.tourismState && room.tourismState.roundReadyPlayers && room.tourismState.roundReadyPlayers[playerId]) {
      delete room.tourismState.roundReadyPlayers[playerId];
    }
    room.lastActivity = Date.now();
    this.saveRoom(room);
    sound.playKick();

    this.emit('FORCE_PLAYER_KICK', clean, { targetPlayerId: playerId, playerId });
    this.emit('PLAYER_KICKED', clean, { targetPlayerId: playerId, playerId });
    this.emit('presence_sync', clean, this.getFormattedPlayers(clean));
    this.safeBroadcast(clean, 'FORCE_PLAYER_KICK', { targetPlayerId: playerId, playerId });
    this.safeBroadcast(clean, 'PLAYER_KICKED', { targetPlayerId: playerId, playerId });
  }

  public broadcastForcePlayerKick(roomCode: string, targetPlayerId: string): void {
    const clean = cleanRoomCode(roomCode);
    this.kickPlayer(clean, targetPlayerId);
  }

  public broadcastTerminateRoom(roomCode: string): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('TERMINATE_ROOM', clean, { roomCode: clean });
    this.emit('ROOM_TERMINATED', clean, { roomCode: clean });
    this.safeBroadcast(clean, 'TERMINATE_ROOM', { roomCode: clean });
    this.safeBroadcast(clean, 'ROOM_TERMINATED', { roomCode: clean });
  }

  public async terminateRoom(roomCode: string, reason = 'تم إنهاء الغرفة بواسطة المضيف'): Promise<void> {
    const clean = cleanRoomCode(roomCode);
    try {
      if (supabase) {
        await supabase
          .from('rooms')
          .delete()
          .eq('room_code', clean);
      }
    } catch (err) {
      console.warn('[ROOM_BUS] Error deleting room from DB:', err);
    }

    try {
      await this.safeBroadcast(clean, 'ROOM_TERMINATED', {
        roomCode: clean,
        reason,
        timestamp: Date.now(),
      });
      await this.safeBroadcast(clean, 'TERMINATE_ROOM', {
        roomCode: clean,
        reason,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('[ROOM_BUS] Error broadcasting ROOM_TERMINATED:', err);
    }

    this.emit('ROOM_TERMINATED', clean, { roomCode: clean, reason });
    this.emit('TERMINATE_ROOM', clean, { roomCode: clean, reason });
    this.leaveRoom(clean);
  }

  public broadcastBingoPlayerSelected(roomCode: string, player: any): void {
    const clean = cleanRoomCode(roomCode);
    this.emit('BINGO_PLAYER_SELECTED', clean, player);
    this.safeBroadcast(clean, 'BINGO_PLAYER_SELECTED', player);
  }

  public leavePlayer(roomId: string, playerId: string) {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room) return;
    const p = room.players.find((pl) => pl.id === playerId);
    if (p) {
      p.isOnline = false;
      this.saveRoom(room);
      this.emit('STATE_UPDATED', clean, room);
    }
  }

  public setHostStatus(roomId: string, connected: boolean) {
    const room = this.getRoom(roomId);
    if (!room) return;
    room.hostConnected = connected;
    room.lastActivity = Date.now();
    this.saveRoom(room);
  }

  public requestHostRole(roomId: string, playerId: string, playerName: string) {
    const room = this.getRoom(roomId);
    if (!room) return;
    const request = {
      playerId,
      playerName,
      requestedAt: Date.now(),
    };
    room.hostRequest = request;
    room.lastActivity = Date.now();
    this.saveRoom(room);
    this.emit('HOST_REQUEST_SUBMITTED', roomId, request);
    sound.playClick();
  }

  public respondHostRequest(roomId: string, accept: boolean) {
    const room = this.getRoom(roomId);
    if (!room || !room.hostRequest) return;
    const req = room.hostRequest;
    room.hostRequest = null;

    if (accept) {
      room.hostConnected = true;
      room.hostPlayerId = req.playerId;
      room.players = room.players.filter((p) => p.id !== req.playerId);
      this.saveRoom(room);
      this.emit('HOST_REQUEST_RESOLVED', roomId, { playerId: req.playerId, accepted: true });
      sound.playVictory();
    } else {
      this.saveRoom(room);
      this.emit('HOST_REQUEST_RESOLVED', roomId, { playerId: req.playerId, accepted: false });
      sound.playClick();
    }
  }

  public endGame(roomId: string) {
    this.clearTimer(roomId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_PREFIX + roomId.toUpperCase());
      } catch {}
    }
    this.emit('GAME_ENDED', roomId, {});
    sound.playClick();
  }

  public endGameSession(roomId: string) {
    this.endGame(roomId);
  }

  public selectGame(roomId: string, gameId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;
    room.selectedGameId = gameId;
    room.hexGrid = generateHexGrid(gameId);
    room.activeCellId = null;
    room.activeQuestion = null;
    room.buzzerLock = { status: 'idle', countdownRemaining: 3, timerDuration: 3, attemptNumber: 1, isFrozen: false };
    room.lastActivity = Date.now();
    this.saveRoom(room);
    sound.playClick();
  }

  public startGame(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;

    const team1Count = room.players.filter((p) => p.team === 'team_a').length;
    const team2Count = room.players.filter((p) => p.team === 'team_b').length;
    if (team1Count < 1 || team2Count < 1) {
      return;
    }

    room.status = 'playing';
    room.roundNumber = 1;
    room.lastActivity = Date.now();

    const availableCells = room.hexGrid.filter((c: HexCell) => c.owner === 'none');
    if (availableCells.length > 0) {
      const randomInitialCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      room.activeCellId = randomInitialCell.id;
      
      if (!room.usedQuestionIds) room.usedQuestionIds = [];
      const { question: initialQuestion, baseId } = getRandomQuestionForCell(
        randomInitialCell,
        room.selectedGameId,
        undefined,
        room.usedQuestionIds
      );
      room.activeQuestion = initialQuestion;
      if (!room.usedQuestionIds.includes(baseId)) {
        room.usedQuestionIds.push(baseId);
      }

      room.questionTurnState = {
        cellId: randomInitialCell.id,
        letter: randomInitialCell.label,
        currentQuestionId: initialQuestion.id,
        attemptPhase: 'INITIAL',
        lockedTeamId: null,
      };

      this.clearTimer(roomId);
      this.clearIdleCountdown(roomId);
      room.buzzerLock = {
        status: 'reading',
        attemptPhase: 'INITIAL',
        lockedTeamId: null,
        endsAt: null,
        idleEndsAt: null,
        countdownRemaining: 3,
        timerDuration: 3,
        attemptNumber: 1,
        isFrozen: false,
      };
    }

    this.saveRoom(room);
    sound.playVictory();
  }

  public openBuzzer(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || !room.activeCellId || !room.activeQuestion) return;

    this.clearTimer(roomId);

    const now = Date.now();
    const lockedTeam = room.buzzerLock.lockedTeamId || null;
    const currentPhase = room.buzzerLock.attemptPhase || 'INITIAL';

    room.buzzerLock = {
      status: 'unlocked',
      lockedTeamId: lockedTeam,
      attemptPhase: currentPhase,
      endsAt: null,
      idleEndsAt: now + 10_000,
      countdownRemaining: currentPhase === 'REBOUND_TEAM_B' ? 5 : 3,
      timerDuration: currentPhase === 'REBOUND_TEAM_B' ? 5 : 3,
      attemptNumber: currentPhase === 'REBOUND_TEAM_B' ? 2 : 1,
      isFrozen: false,
      idleCountdownRemaining: 10,
    };

    this.saveRoom(room);
    this.startIdleCountdown(roomId);
    sound.playClick();
  }

  public pressBuzzer(roomId: string, playerId: string): boolean {
    const room = this.getRoom(roomId);
    if (!room || room.buzzerLock.status !== 'unlocked') {
      return false;
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) return false;

    // Strict Lockout Check: Block players on locked team during rebound
    if (room.buzzerLock.lockedTeamId && player.team === room.buzzerLock.lockedTeamId) {
      return false;
    }

    // CRITICAL: Stop and clear the 5s rebound opportunity timer or 10s idle timer immediately
    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);

    const now = Date.now();
    const isRebound = room.buzzerLock.attemptPhase === 'REBOUND_TEAM_B' || room.buzzerLock.attemptNumber === 2;
    // Answering phase ALWAYS gets a fresh, dedicated 3 seconds!
    const answeringDuration = 3;

    room.buzzerLock = {
      status: 'buzzed',
      buzzedPlayerId: player.id,
      buzzedPlayerName: player.name,
      buzzedTeam: player.team,
      lockedTeamId: room.buzzerLock.lockedTeamId || null,
      attemptPhase: isRebound ? 'REBOUND_TEAM_B' : 'INITIAL',
      endsAt: now + (answeringDuration * 1000), // Fresh 3000ms timestamp!
      idleEndsAt: null,
      countdownRemaining: answeringDuration,
      timerDuration: answeringDuration,
      attemptNumber: isRebound ? 2 : 1,
      countdownStartedAt: now,
      isFrozen: false,
    };

    room.lastActivity = Date.now();
    this.saveRoom(room);

    sound.playBuzzer();
    this.startCountdownTimer(roomId);

    return true;
  }

  private startIdleCountdown(roomId: string) {
    this.clearIdleCountdown(roomId);

    const interval = window.setInterval(() => {
      const room = this.getRoom(roomId);
      if (!room || room.buzzerLock.status !== 'unlocked' || !room.activeCellId || !room.buzzerLock.idleEndsAt) {
        this.clearIdleCountdown(roomId);
        return;
      }

      // If in Rebound phase, the 5-second rebound timer takes precedence over 10s idle
      if (room.buzzerLock.attemptPhase === 'REBOUND_TEAM_B') {
        return;
      }

      const remainingMs = room.buzzerLock.idleEndsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingMs <= 0) {
        this.clearIdleCountdown(roomId);
        const cell = room.hexGrid.find((c: HexCell) => c.id === room.activeCellId);
        if (cell) {
          if (!room.usedQuestionIds) room.usedQuestionIds = [];
          const { question: freshQuestion, baseId } = getRandomQuestionForCell(
            cell,
            room.selectedGameId,
            undefined,
            room.usedQuestionIds
          );
          room.activeQuestion = freshQuestion;
          if (!room.usedQuestionIds.includes(baseId)) {
            room.usedQuestionIds.push(baseId);
          }
        }

        room.toastMessage = 'انتهت 10 ثوانٍ دون ضغط! تم تبديل السؤال تلقائياً';
        room.buzzerLock.idleCountdownRemaining = 10;
        room.buzzerLock.idleEndsAt = Date.now() + 10_000;
        this.saveRoom(room);
        sound.playTimeout();

        setTimeout(() => {
          const r = this.getRoom(roomId);
          if (r && r.toastMessage) {
            r.toastMessage = undefined;
            this.saveRoom(r);
          }
        }, 3500);

        this.startIdleCountdown(roomId);
      } else {
        if (room.buzzerLock.idleCountdownRemaining !== remainingSec) {
          room.buzzerLock.idleCountdownRemaining = remainingSec;
          this.saveRoom(room);
          sound.playTick();
        }
      }
    }, 200);

    this.idleIntervals.set(roomId, interval);
  }

  private clearIdleCountdown(roomId: string) {
    if (this.idleIntervals.has(roomId)) {
      clearInterval(this.idleIntervals.get(roomId));
      this.idleIntervals.delete(roomId);
    }
  }

  private startCountdownTimer(roomId: string) {
    this.clearTimer(roomId);

    const interval = window.setInterval(() => {
      const room = this.getRoom(roomId);
      if (!room || !room.activeCellId || !room.buzzerLock.endsAt) {
        this.clearTimer(roomId);
        return;
      }

      const status = room.buzzerLock.status;
      const isReboundUnlocked = status === 'unlocked' && room.buzzerLock.attemptPhase === 'REBOUND_TEAM_B';
      const isBuzzed = status === 'buzzed';

      if (!isBuzzed && !isReboundUnlocked) {
        this.clearTimer(roomId);
        return;
      }

      const remainingMs = room.buzzerLock.endsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingMs <= 0) {
        this.clearTimer(roomId);
        room.buzzerLock.countdownRemaining = 0;
        room.buzzerLock.endsAt = null;

        if (isReboundUnlocked) {
          // Rebound 5-second timer expired without answer -> Trigger Double Failure Reroll
          this.triggerQuestionRerollOnDoubleFailure(roomId, room);
        } else {
          // Buzzed player countdown expired -> Freeze and await Host evaluation
          room.buzzerLock.isFrozen = true;
          this.saveRoom(room);
          this.emit('TIMEOUT_FREEZE', roomId, {});
          sound.playTimeout();
        }
      } else {
        if (room.buzzerLock.countdownRemaining !== remainingSec) {
          room.buzzerLock.countdownRemaining = remainingSec;
          this.saveRoom(room);
          this.emit('COUNTDOWN_TICK', roomId, remainingSec);
          sound.playTick();
        }
      }
    }, 200);

    this.timerIntervals.set(roomId, interval);
  }

  private clearTimer(roomId: string) {
    if (this.timerIntervals.has(roomId)) {
      clearInterval(this.timerIntervals.get(roomId));
      this.timerIntervals.delete(roomId);
    }
  }

  private triggerQuestionRerollOnDoubleFailure(roomId: string, room: RoomState) {
    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);

    sound.playFailBuzzer();
    room.toastMessage = 'إجابة غير صحيحة لكلا الفريقين — تغيير السؤال على نفس الحرف';

    const cell = room.hexGrid.find((c: HexCell) => c.id === room.activeCellId);
    if (cell) {
      if (!room.usedQuestionIds) room.usedQuestionIds = [];
      const currentBaseId = room.activeQuestion?.id?.split('_')[0];
      const { question: freshQuestion, baseId } = getRandomQuestionForCell(
        cell,
        room.selectedGameId,
        currentBaseId,
        room.usedQuestionIds
      );
      room.activeQuestion = freshQuestion;
      if (!room.usedQuestionIds.includes(baseId)) {
        room.usedQuestionIds.push(baseId);
      }
      room.questionTurnState = {
        cellId: cell.id,
        letter: cell.label,
        currentQuestionId: freshQuestion.id,
        attemptPhase: 'REROLL',
        lockedTeamId: null,
      };
    }

    room.buzzerLock = {
      status: 'reading',
      attemptPhase: 'REROLL',
      lockedTeamId: null,
      endsAt: null,
      idleEndsAt: null,
      countdownRemaining: 3,
      timerDuration: 3,
      attemptNumber: 1,
      isFrozen: false,
    };

    this.saveRoom(room);
    this.emit('ROUND_RESET', roomId, {});

    setTimeout(() => {
      const r = this.getRoom(roomId);
      if (r && r.toastMessage) {
        r.toastMessage = undefined;
        this.saveRoom(r);
      }
    }, 3500);
  }

  public evaluateAnswer(roomId: string, isCorrect: boolean, winnerPlayerId?: string) {
    const room = this.getRoom(roomId);
    if (!room || !room.activeCellId) return;

    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);

    const currentAttempt = room.buzzerLock.attemptNumber || 1;
    const buzzedTeam = room.buzzerLock.buzzedTeam || 'team_a';
    const opponentTeam: TeamId = buzzedTeam === 'team_a' ? 'team_b' : 'team_a';

    if (isCorrect) {
      const cellIndex = room.hexGrid.findIndex((c: HexCell) => c.id === room.activeCellId);
      if (cellIndex >= 0) {
        room.hexGrid[cellIndex].owner = buzzedTeam;
      }

      if (buzzedTeam && room.scores?.[buzzedTeam]) {
        room.scores[buzzedTeam].cellsWon += 1;
      }

      const winCheck = checkWinCondition(room.hexGrid);

      if (winCheck.winner === buzzedTeam) {
        room.winnerTeam = buzzedTeam;
        room.winningPath = winCheck.winningPath;
        if (room.scores?.[buzzedTeam]) {
          room.scores[buzzedTeam].roundsWon += 1;
        }
        this.saveRoom(room);
        this.emit('WINNER_DECLARED', roomId, { winner: buzzedTeam, path: winCheck.winningPath });
        sound.playVictory();
        return;
      }

      const activeWinnerId = winnerPlayerId || room.buzzerLock.buzzedPlayerId;
      if (activeWinnerId) {
        room.lastWinnerPlayerId = activeWinnerId;
        room.cellPickerPlayerId = activeWinnerId;
        const winnerObj = room.players.find((p) => p.id === activeWinnerId);
        room.cellPickerPlayerName = winnerObj ? winnerObj.name : 'الفائز';
      }

      sound.playCellClaimed();
      this.emit('CORRECT_ANSWER', roomId, activeWinnerId || '');

      room.activeCellId = null;
      room.activeQuestion = null;
      room.questionTurnState = undefined;
      room.buzzerLock = {
        status: 'idle',
        endsAt: null,
        idleEndsAt: null,
        countdownRemaining: 3,
        timerDuration: 3,
        attemptNumber: 1,
        isFrozen: false,
      };

      this.saveRoom(room);
    } else {
      // Wrong answer evaluation
      if (currentAttempt === 1 || room.buzzerLock.attemptPhase === 'INITIAL') {
        // Step 2: Single Rebound Attempt for Opponent Team (5-Second Buzz Window)
        // Lock out Team A, transfer exact same question to Team B
        const now = Date.now();
        room.questionTurnState = {
          cellId: room.activeCellId,
          letter: room.activeQuestion?.letter || '',
          currentQuestionId: room.activeQuestion?.id || '',
          attemptPhase: 'REBOUND_TEAM_B',
          lockedTeamId: buzzedTeam,
        };

        room.buzzerLock = {
          status: 'unlocked',
          buzzedTeam: opponentTeam,
          buzzedPlayerId: undefined,
          buzzedPlayerName: undefined,
          lockedTeamId: buzzedTeam,
          attemptPhase: 'REBOUND_TEAM_B',
          endsAt: now + 5000, // 5000ms window for Team B to press buzzer!
          idleEndsAt: null,
          countdownRemaining: 5,
          timerDuration: 5,
          attemptNumber: 2,
          countdownStartedAt: now,
          isFrozen: false,
        };

        this.saveRoom(room);
        sound.playTick();
        this.startCountdownTimer(roomId);
      } else {
        // Step 3: Question Reroll on Double Failure (Host clicked ❌ for Team B)
        this.triggerQuestionRerollOnDoubleFailure(roomId, room);
      }
    }
  }

  public claimReboundTurn(roomId: string, playerId: string) {
    const room = this.getRoom(roomId);
    if (!room || room.buzzerLock.status !== 'unlocked' || room.buzzerLock.attemptPhase !== 'REBOUND_TEAM_B') return;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.team === room.buzzerLock.lockedTeamId) return;

    // CRITICAL: Stop and clear the 5s rebound opportunity timer immediately
    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);

    const now = Date.now();
    const answeringDuration = 3;

    room.buzzerLock.buzzedPlayerId = playerId;
    room.buzzerLock.buzzedPlayerName = player.name;
    room.buzzerLock.buzzedTeam = player.team;
    room.buzzerLock.status = 'buzzed';
    room.buzzerLock.endsAt = now + (answeringDuration * 1000);
    room.buzzerLock.idleEndsAt = null;
    room.buzzerLock.countdownRemaining = answeringDuration;
    room.buzzerLock.timerDuration = answeringDuration;
    room.buzzerLock.attemptNumber = 2;
    room.buzzerLock.countdownStartedAt = now;
    room.buzzerLock.isFrozen = false;

    this.saveRoom(room);
    sound.playBuzzer();
    this.startCountdownTimer(roomId);
  }

  public pickNextCell(roomId: string, playerId: string, cellId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;
    if (room.cellPickerPlayerId && room.cellPickerPlayerId !== playerId) return;

    const cell = room.hexGrid.find((c: HexCell) => c.id === cellId);
    if (!cell || cell.owner !== 'none') return;

    room.activeCellId = cellId;
    if (!room.usedQuestionIds) room.usedQuestionIds = [];
    const { question: pickedQuestion, baseId } = getRandomQuestionForCell(
      cell,
      room.selectedGameId,
      undefined,
      room.usedQuestionIds
    );
    room.activeQuestion = pickedQuestion;
    if (!room.usedQuestionIds.includes(baseId)) {
      room.usedQuestionIds.push(baseId);
    }
    room.cellPickerPlayerId = null;
    room.cellPickerPlayerName = null;

    room.questionTurnState = {
      cellId: cell.id,
      letter: cell.label,
      currentQuestionId: pickedQuestion.id,
      attemptPhase: 'INITIAL',
      lockedTeamId: null,
    };

    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);
    room.buzzerLock = {
      status: 'reading',
      attemptPhase: 'INITIAL',
      lockedTeamId: null,
      endsAt: null,
      idleEndsAt: null,
      countdownRemaining: 3,
      timerDuration: 3,
      attemptNumber: 1,
      isFrozen: false,
    };

    room.lastActivity = Date.now();
    this.saveRoom(room);
    this.emit('CELL_SELECTED', roomId, cellId);
    sound.playClick();
  }

  public resetBoard(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room) return;

    this.clearTimer(roomId);
    this.clearIdleCountdown(roomId);

    room.hexGrid = generateHexGrid(room.selectedGameId);
    room.activeCellId = null;
    room.activeQuestion = null;
    room.questionTurnState = undefined;
    room.winnerTeam = null;
    room.winningPath = [];
    room.lastWinnerPlayerId = null;
    room.cellPickerPlayerId = null;
    room.cellPickerPlayerName = null;
    room.roundNumber = (room.roundNumber || 1) + 1;
    room.status = 'playing';

    if (room.scores?.team_a) {
      room.scores.team_a.cellsWon = 0;
    }
    if (room.scores?.team_b) {
      room.scores.team_b.cellsWon = 0;
    }

    const availableCells = room.hexGrid.filter((c: HexCell) => c.owner === 'none');
    if (availableCells.length > 0) {
      const randomInitialCell = availableCells[Math.floor(Math.random() * availableCells.length)];
      room.activeCellId = randomInitialCell.id;
      
      if (!room.usedQuestionIds) room.usedQuestionIds = [];
      const { question: initialQuestion, baseId } = getRandomQuestionForCell(
        randomInitialCell,
        room.selectedGameId,
        undefined,
        room.usedQuestionIds
      );
      room.activeQuestion = initialQuestion;
      if (!room.usedQuestionIds.includes(baseId)) {
        room.usedQuestionIds.push(baseId);
      }

      room.questionTurnState = {
        cellId: randomInitialCell.id,
        letter: randomInitialCell.label,
        currentQuestionId: initialQuestion.id,
        attemptPhase: 'INITIAL',
        lockedTeamId: null,
      };

      room.buzzerLock = {
        status: 'reading',
        attemptPhase: 'INITIAL',
        lockedTeamId: null,
        endsAt: null,
        idleEndsAt: null,
        countdownRemaining: 3,
        timerDuration: 3,
        attemptNumber: 1,
        isFrozen: false,
      };
    } else {
      room.buzzerLock = { status: 'idle', endsAt: null, idleEndsAt: null, countdownRemaining: 3, timerDuration: 3, attemptNumber: 1, isFrozen: false };
    }

    this.saveRoom(room);
    this.emit('ROUND_RESET', roomId, {});
    sound.playClick();
  }

  public rerollQuestion(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || !room.activeCellId) return;

    const cell = room.hexGrid.find((c: HexCell) => c.id === room.activeCellId);
    if (!cell) return;

    if (!room.usedQuestionIds) room.usedQuestionIds = [];
    const currentBaseId = room.activeQuestion?.id?.split('_')[0];
    const { question: freshQuestion, baseId } = getRandomQuestionForCell(
      cell,
      room.selectedGameId,
      currentBaseId,
      room.usedQuestionIds
    );
    room.activeQuestion = freshQuestion;
    if (!room.usedQuestionIds.includes(baseId)) {
      room.usedQuestionIds.push(baseId);
    }

    room.questionTurnState = {
      cellId: cell.id,
      letter: cell.label,
      currentQuestionId: freshQuestion.id,
      attemptPhase: 'REROLL',
      lockedTeamId: null,
    };

    room.buzzerLock = {
      status: 'reading',
      attemptPhase: 'REROLL',
      lockedTeamId: null,
      endsAt: null,
      idleEndsAt: null,
      countdownRemaining: 3,
      timerDuration: 3,
      attemptNumber: 1,
      isFrozen: false,
    };

    this.saveRoom(room);
    this.emit('ROUND_RESET', roomId, {});
    sound.playClick();
  }

  public addMockPlayer(roomId: string, team?: TeamId): Player | null {
    const mockNames = ['أبو فهد', 'سارة العتيبي', 'طلال بن عبد العزيز', 'نورة الدوسري', 'مشاري', 'ريم خالد', 'سلطان'];
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room) return null;

    const availableNames = mockNames.filter((n) => !room.players.some((p) => p.name === n));
    const chosenName = availableNames.length > 0 ? availableNames[0] : 'متسابق ' + (room.players.length + 1);
    const chosenAvatar = AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)].id;

    const player = this.joinPlayer(clean, chosenName, chosenAvatar, team);
    if (player) {
      player.isBot = true;
      if (room.flagState && room.flagState.players[player.id]) {
        room.flagState.players[player.id].isReady = true;
      }
      if (room.landmarkState && room.landmarkState.players[player.id]) {
        room.landmarkState.players[player.id].isReady = true;
      }
      if (room.tourismState && room.tourismState.players[player.id]) {
        room.tourismState.players[player.id].isReady = true;
      }
      this.saveRoom(room);
    }
    return player;
  }

  // --- Flag Game Specific Methods ---

  
  public setPlayerReady(roomIdOrPlayerId: string, playerIdOrReady: string | boolean, isReadyParam?: boolean): boolean {
    let clean = '';
    let playerId = '';
    let isReady = false;

    if (typeof playerIdOrReady === 'boolean') {
      clean = this.currentRoomCode || '';
      playerId = roomIdOrPlayerId;
      isReady = playerIdOrReady;
    } else {
      clean = cleanRoomCode(roomIdOrPlayerId);
      playerId = String(playerIdOrReady);
      isReady = Boolean(isReadyParam);
    }

    const room = clean ? this.getRoom(clean) : null;
    if (room) {
      const p = room.players.find((pl) => pl.id === playerId);
      if (p) {
        p.isReady = isReady;

        // Sync across all game states
        if (room.flagState?.players?.[playerId]) {
          room.flagState.players[playerId].isReady = isReady;
        }
        if (room.landmarkState?.players?.[playerId]) {
          room.landmarkState.players[playerId].isReady = isReady;
        }
        if (room.trajectoryState?.players?.[playerId]) {
          room.trajectoryState.players[playerId].isReady = isReady;
        }
        if (room.tourismState?.players?.[playerId]) {
          room.tourismState.players[playerId].isReady = isReady;
        }

        this.saveRoom(room);
        this.broadcastPlayerReadyUpdate(clean, playerId, isReady, p.name);
        return isReady;
      }
    }
    if (clean) {
      this.broadcastPlayerReadyUpdate(clean, playerId, isReady);
    }
    return isReady;
  }

  public togglePlayerReady(roomId: string, playerId: string): boolean {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    const p = room?.players.find((pl) => pl.id === playerId);
    const nextReady = p ? !p.isReady : true;
    return this.setPlayerReady(clean, playerId, nextReady);
  }

  public toggleFlagReady(roomId: string, playerId: string) {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'FLAG_SET_READY', playerId);
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.flagState) return;

    if (!room.flagState.players[playerId]) {
      const p = room.players.find((pl) => pl.id === playerId);
      if (p) {
        room.flagState.players[playerId] = {
          id: p.id,
          name: p.name,
          score: 0,
          isReady: false,
          currentGuessHex: null,
          currentAccuracy: null,
        };
      } else return;
    }

    room.flagState.players[playerId].isReady = !room.flagState.players[playerId].isReady;

    const allReady =
      room.players.length >= 2 &&
      room.players.every((p) => room.flagState!.players[p.id]?.isReady);

    if (allReady && room.flagState.gameState === 'LOBBY') {
      room.flagState.gameState = 'PLAYING';
      this.startFlagRound(room);
    }
    this.saveRoom(room);
  }

  public startFlagRound(room: any) {
    if (!room.flagState) return;

    // Flag Depletion Engine: Pick 5 unique random flags without repeating until all 57 flags are exhausted
    if (!room.flagState.sessionFlagIds || room.flagState.sessionFlagIds.length < 5) {
      if (!room.flagState.playedFlagIds) {
        room.flagState.playedFlagIds = [];
      }
      const allIds = worldFlagsCatalog.map((f) => f.id);
      let unplayed = allIds.filter((id) => !room.flagState.playedFlagIds.includes(id));
      
      // If pool depleted (less than 5 flags remaining), reset playedFlagIds
      if (unplayed.length < 5) {
        room.flagState.playedFlagIds = [];
        unplayed = [...allIds];
      }

      const shuffled = [...unplayed].sort(() => Math.random() - 0.5);
      const chosenFive = shuffled.slice(0, 5);
      room.flagState.sessionFlagIds = chosenFive;
      room.flagState.playedFlagIds.push(...chosenFive);
    }

    const roundIdx = Math.max(0, Math.min(4, (room.flagState.currentRound || 1) - 1));
    const randomFlag = room.flagState.sessionFlagIds[roundIdx] || 'sa';

    room.flagState.currentFlagId = randomFlag;
    room.flagState.countdown = 25;
    room.flagState.revealedPlayerIds = [];
    room.flagState.gameState = 'PLAYING';
    room.flagState.roundReadyPlayers = {}; // Strictly reset ready state per round!

    Object.values(room.flagState.players).forEach((p: any) => {
      p.currentGuessHex = null;
      p.currentAccuracy = null;
      p.isReady = false;
    });

    // Save and broadcast immediately so all players & TV transition to PLAYING
    this.saveRoom(room);
    this.emit('ROUND_STARTED', room.id, {
      roundIndex: room.flagState.currentRound || 1,
      flagId: randomFlag,
    });

    if (this.timerIntervals.has(room.id + '_flag')) {
      clearInterval(this.timerIntervals.get(room.id + '_flag'));
    }

    const interval = window.setInterval(() => {
      const currentRoom = this.getRoom(room.id);
      if (!currentRoom || !currentRoom.flagState || currentRoom.flagState.gameState !== 'PLAYING') {
        clearInterval(interval);
        return;
      }
      currentRoom.flagState.countdown -= 1;

      if (currentRoom.flagState.countdown <= 0) {
        clearInterval(interval);
        currentRoom.flagState.gameState = 'REVEALING';
        this.emit('TIMEOUT_FREEZE', currentRoom.id, {});
      }
      this.saveRoom(currentRoom);
    }, 1000);

    this.timerIntervals.set(room.id + '_flag', interval);
  }

  public submitFlagGuess(roomId: string, playerId: string, hex: string, score: number) {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'FLAG_SUBMIT_GUESS', playerId, { hex, score });
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.flagState) return;

    const p = room.flagState.players[playerId];
    if (p) {
      p.currentGuessHex = hex;
      p.currentAccuracy = score;
    }

    const activePlayers = room.players.filter((p) => p.isOnline !== false && !p.isBot);
    const guessedCount = activePlayers.filter(
      (pl) => room.flagState!.players[pl.id]?.currentGuessHex !== null
    ).length;

    console.log(`[TV SUBMISSIONS] ${guessedCount} of ${activePlayers.length} players answered.`);

    // ONLY advance early if EVERY joined player has submitted (minimum 2 players)
    if (activePlayers.length >= 2 && guessedCount >= activePlayers.length && room.flagState.gameState === 'PLAYING') {
      console.log('[TV ALL ANSWERED] All players submitted. Concluding round early.');
      if (this.timerIntervals.has(room.id + '_flag')) {
        clearInterval(this.timerIntervals.get(room.id + '_flag'));
      }
      room.flagState.gameState = 'REVEALING';
    }
    this.saveRoom(room);
  }

  public advanceFlagRound(roomId: string) {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room || !room.flagState) return;

    const highestScore = Math.max(...Object.values(room.flagState.players).map((p: any) => p.currentAccuracy || 0));
    Object.values(room.flagState.players).forEach((p: any) => {
      if (p.currentAccuracy === highestScore && highestScore > 0) {
        p.score += 1;
      }
    });

    if (room.flagState.currentRound >= room.flagState.totalRounds) {
      room.flagState.gameState = 'GAME_OVER';
    } else {
      room.flagState.gameState = 'ROUND_INTERMISSION';
      room.flagState.roundReadyPlayers = {}; // Strictly reset ready players map!
      Object.values(room.flagState.players).forEach((p: any) => {
        p.isReady = false;
      });

      // Auto-ready any mock/bot players after 1.5s
      const bots = room.players.filter((p) => p.isBot);
      if (bots.length > 0) {
        setTimeout(() => {
          const r = this.getRoom(clean);
          if (r && r.flagState && r.flagState.gameState === 'ROUND_INTERMISSION') {
            bots.forEach((b) => {
              r.flagState!.roundReadyPlayers[b.id] = true;
            });
            this.saveRoom(r);
          }
        }, 1500);
      }
    }
    this.saveRoom(room);
  }

  public emitPlayerRoundReady(roomId: string, playerId: string, roundIndex: number): void {
    const clean = cleanRoomCode(roomId);
    if (this.isHosting(clean)) {
      const room = this.getRoom(clean);
      if (room && room.flagState) {
        if (!room.flagState.roundReadyPlayers) {
          room.flagState.roundReadyPlayers = {};
        }
        room.flagState.roundReadyPlayers[playerId] = true;
        this.saveRoom(room);
      }
    } else {
      this.sendIntent(clean, 'FLAG_ROUND_READY', playerId, { roundIndex });
    }

    this.emit('PLAYER_ROUND_READY', clean, {
      playerId,
      roundIndex,
    });
    sound.playClick();
  }

  public readyForNextRound(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room || !room.flagState) return;
    this.emitPlayerRoundReady(roomId, playerId, room.flagState.currentRound);
  }

  public tvStartNextRound(roomId: string, nextRoundNumber: number): void {
    const clean = roomId.toUpperCase().replace(/^ROOM_/, '');
    const room = this.getRoom(clean);
    if (!room || !room.flagState) return;

    if (nextRoundNumber > room.flagState.totalRounds) {
      room.flagState.gameState = 'GAME_OVER';
      this.saveRoom(room);
      return;
    }

    // Flag Depletion Engine: Pick 5 unique random flags without repeating until all 57 flags are exhausted
    if (!room.flagState.sessionFlagIds || room.flagState.sessionFlagIds.length < 5) {
      if (!room.flagState.playedFlagIds) {
        room.flagState.playedFlagIds = [];
      }
      const played = room.flagState.playedFlagIds;
      const allIds = worldFlagsCatalog.map((f) => f.id);
      let unplayed = allIds.filter((id) => !played.includes(id));
      
      if (unplayed.length < 5) {
        room.flagState.playedFlagIds = [];
        unplayed = [...allIds];
      }

      const shuffled = [...unplayed].sort(() => Math.random() - 0.5);
      const chosenFive = shuffled.slice(0, 5);
      room.flagState.sessionFlagIds = chosenFive;
      room.flagState.playedFlagIds.push(...chosenFive);
    }

    const roundIdx = Math.max(0, Math.min(4, nextRoundNumber - 1));
    const nextFlagId = room.flagState.sessionFlagIds[roundIdx] || 'sa';

    room.flagState.currentRound = nextRoundNumber;
    room.flagState.currentFlagId = nextFlagId;
    room.flagState.countdown = 25;
    room.flagState.revealedPlayerIds = [];
    room.flagState.gameState = 'PLAYING';
    room.flagState.roundReadyPlayers = {}; // Strictly reset ready state per round!

    Object.values(room.flagState.players).forEach((p: any) => {
      p.currentGuessHex = null;
      p.currentAccuracy = null;
      p.isReady = false;
    });

    this.saveRoom(room);

    this.emit('ROUND_STARTED', clean, {
      roundIndex: nextRoundNumber,
      flagId: nextFlagId,
    });
    this.broadcastRoundStarted(clean, nextRoundNumber);
    this.broadcastState(room);

    if (this.timerIntervals.has(room.id + '_flag')) {
      clearInterval(this.timerIntervals.get(room.id + '_flag'));
    }

    const interval = window.setInterval(() => {
      const currentRoom = this.getRoom(room.id);
      if (!currentRoom || !currentRoom.flagState || currentRoom.flagState.gameState !== 'PLAYING') {
        clearInterval(interval);
        return;
      }
      currentRoom.flagState.countdown -= 1;

      if (currentRoom.flagState.countdown <= 0) {
        clearInterval(interval);
        currentRoom.flagState.gameState = 'REVEALING';
        this.emit('TIMEOUT_FREEZE', currentRoom.id, {});
      }
      this.saveRoom(currentRoom);
    }, 1000);

    this.timerIntervals.set(room.id + '_flag', interval);
  }

  public resetFlagToLobby(roomId: string) {
    const room = this.getRoom(roomId);
    if (!room || !room.flagState) return;

    if (this.timerIntervals.has(room.id + '_flag')) {
      clearInterval(this.timerIntervals.get(room.id + '_flag'));
    }

    room.flagState.gameState = 'LOBBY';
    room.flagState.currentRound = 1;
    room.flagState.countdown = 25;
    room.flagState.currentFlagId = null;
    room.flagState.revealedPlayerIds = [];
    room.flagState.roundReadyPlayers = {};
    room.flagState.sessionFlagIds = [];
    Object.values(room.flagState.players).forEach((p: any) => {
      p.score = 0;
      p.isReady = false;
      p.currentGuessHex = null;
      p.currentAccuracy = null;
    });

    room.players.forEach((p) => {
      p.isReady = false;
    });

    this.saveRoom(room);
    this.broadcastState(room);
    sound.playClick();
  }

  // ========================================================
  // LANDMARK PINNING GAME METHODS (حدد الموقع)
  // ========================================================

  public setLandmarkScope(roomId: string, scope: LandmarkScope): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'LANDMARK_SET_SCOPE', 'host', { scope });
      return;
    }

    const room = this.getRoom(clean);
    if (!room) return;

    if (!room.landmarkState) {
      this.initLandmarkGame(clean, scope);
      return;
    }

    room.landmarkState.scope = scope;
    const pool = getLandmarksByScope(scope);
    const allIds = pool.map((l) => l.id);
    const played = room.landmarkState.playedLandmarkIds || [];
    let unplayed = allIds.filter((id) => !played.includes(id));
    if (unplayed.length < 5) {
      room.landmarkState.playedLandmarkIds = [];
      unplayed = [...allIds];
    }
    const shuffled = [...unplayed].sort(() => Math.random() - 0.5);
    const chosenFive = shuffled.slice(0, 5);
    room.landmarkState.sessionLandmarkIds = chosenFive;
    room.landmarkState.playedLandmarkIds.push(...chosenFive);

    this.saveRoom(room);
    sound.playClick();
  }

  public initLandmarkGame(roomId: string, scope: LandmarkScope = 'saudi'): LandmarkRoomState {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean) || this.createRoom(clean);

    room.selectedGameId = 'geo-pin-landmark';

    const pool = getLandmarksByScope(scope);
    const allIds = pool.map((l) => l.id);
    const played = room.landmarkState?.playedLandmarkIds || [];
    let unplayed = allIds.filter((id) => !played.includes(id));
    if (unplayed.length < 5) {
      unplayed = [...allIds];
    }
    const shuffled = [...unplayed].sort(() => Math.random() - 0.5);
    const chosenFive = shuffled.slice(0, 5);

    const playersMap: Record<string, LandmarkPlayer> = {};
    room.players.forEach((p) => {
      playersMap[p.id] = {
        id: p.id,
        name: p.name,
        score: 0,
        isReady: false,
        currentLat: null,
        currentLng: null,
        currentDistanceKm: null,
        currentPointsAwarded: 0,
        hasSubmitted: false,
      };
    });

    const landmarkState: LandmarkRoomState = {
      gameState: 'LOBBY',
      scope,
      players: playersMap,
      currentRound: 1,
      totalRounds: 5,
      currentLandmarkId: chosenFive[0] || null,
      roundEndsAt: null,
      sessionLandmarkIds: chosenFive,
      playedLandmarkIds: [...chosenFive],
      roundReadyPlayers: {},
      revealStartedAt: null,
    };

    room.landmarkState = landmarkState;
    this.saveRoom(room);
    return landmarkState;
  }

  public tvStartNextLandmarkRound(roomId: string, nextRoundNumber: number): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'LANDMARK_START_ROUND', 'host', { roundNumber: nextRoundNumber });
      return;
    }

    const room = this.getRoom(clean);
    if (!room) return;

    if (!room.landmarkState) {
      this.initLandmarkGame(clean, 'saudi');
      const refreshed = this.getRoom(clean);
      if (!refreshed || !refreshed.landmarkState) return;
      Object.assign(room, refreshed);
    }
    if (!room.landmarkState) return;

    if (nextRoundNumber > room.landmarkState.totalRounds) {
      room.landmarkState.gameState = 'GAME_OVER';
      this.saveRoom(room);
      return;
    }

    // Ensure 5 unique landmarks for the session
    if (!room.landmarkState.sessionLandmarkIds || room.landmarkState.sessionLandmarkIds.length < 5) {
      const pool = getLandmarksByScope(room.landmarkState.scope || 'saudi');
      const allIds = pool.map((l) => l.id);
      const played = room.landmarkState.playedLandmarkIds || [];
      let unplayed = allIds.filter((id) => !played.includes(id));
      if (unplayed.length < 5) {
        room.landmarkState.playedLandmarkIds = [];
        unplayed = [...allIds];
      }
      const shuffled = [...unplayed].sort(() => Math.random() - 0.5);
      const chosenFive = shuffled.slice(0, 5);
      room.landmarkState.sessionLandmarkIds = chosenFive;
      room.landmarkState.playedLandmarkIds.push(...chosenFive);
    }

    const roundIdx = Math.max(0, Math.min(4, nextRoundNumber - 1));
    const nextLandmarkId = room.landmarkState.sessionLandmarkIds[roundIdx];

    room.landmarkState.currentRound = nextRoundNumber;
    room.landmarkState.currentLandmarkId = nextLandmarkId;
    room.landmarkState.roundEndsAt = Date.now() + 45000; // Strictly 45 seconds
    room.landmarkState.gameState = 'PLAYING';
    room.landmarkState.roundReadyPlayers = {};
    room.landmarkState.revealStartedAt = null;

    // Synchronize all room players into landmark state & reset turn data
    room.players.forEach((p) => {
      if (!room.landmarkState!.players[p.id]) {
        room.landmarkState!.players[p.id] = {
          id: p.id,
          name: p.name,
          score: 0,
          isReady: false,
          currentLat: null,
          currentLng: null,
          currentDistanceKm: null,
          currentPointsAwarded: 0,
          hasSubmitted: false,
        };
      } else {
        const lp = room.landmarkState!.players[p.id];
        lp.currentLat = null;
        lp.currentLng = null;
        lp.currentDistanceKm = null;
        lp.currentPointsAwarded = 0;
        lp.hasSubmitted = false;
        lp.isReady = false;
      }
    });

    this.saveRoom(room);

    this.emit('ROUND_STARTED', clean, {
      roundIndex: nextRoundNumber,
      landmarkId: nextLandmarkId,
    });
    this.broadcastRoundStarted(clean, nextRoundNumber);
    this.broadcastState(room);

    // Simulated guesses for bot players
    const bots = room.players.filter((p) => p.isBot);
    if (bots.length > 0) {
      const pool = getLandmarksByScope(room.landmarkState.scope || 'saudi');
      const target = pool.find((l) => l.id === nextLandmarkId) || pool[0];
      bots.forEach((bot, idx) => {
        const delay = 3000 + idx * 2000 + Math.random() * 1500;
        setTimeout(() => {
          const r = this.getRoom(clean);
          if (r && r.landmarkState && r.landmarkState.gameState === 'PLAYING') {
            const jitterLat = (Math.random() - 0.5) * 1.5;
            const jitterLng = (Math.random() - 0.5) * 1.5;
            this.submitLandmarkGuess(
              clean,
              bot.id,
              target.lat + jitterLat,
              target.lng + jitterLng
            );
          }
        }, delay);
      });
    }

    // Clear previous timer for this room
    if (this.timerIntervals.has(room.id + '_landmark')) {
      clearInterval(this.timerIntervals.get(room.id + '_landmark'));
    }

    const interval = window.setInterval(() => {
      const currentRoom = this.getRoom(room.id);
      if (!currentRoom || !currentRoom.landmarkState || currentRoom.landmarkState.gameState !== 'PLAYING') {
        clearInterval(interval);
        return;
      }

      if (currentRoom.landmarkState.roundEndsAt && Date.now() >= currentRoom.landmarkState.roundEndsAt) {
        clearInterval(interval);
        this.resolveLandmarkReveal(currentRoom.id);
      }
    }, 500);

    this.timerIntervals.set(room.id + '_landmark', interval);
  }

  public submitLandmarkGuess(roomId: string, playerId: string, lat: number, lng: number): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'LANDMARK_SUBMIT_GUESS', playerId, { lat, lng });
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.landmarkState || room.landmarkState.gameState !== 'PLAYING') return;

    console.log('[Landmark Guess Received]:', { playerId, lat, lng, round: room.landmarkState.currentRound });

    if (!room.landmarkState.players[playerId]) {
      const basePlayer = room.players.find((p) => p.id === playerId);
      room.landmarkState.players[playerId] = {
        id: playerId,
        name: basePlayer?.name || 'لاعب',
        score: 0,
        isReady: false,
        currentLat: lat,
        currentLng: lng,
        currentDistanceKm: null,
        currentPointsAwarded: 0,
        hasSubmitted: true,
      };
    } else {
      const lp = room.landmarkState.players[playerId];
      lp.currentLat = lat;
      lp.currentLng = lng;
      lp.hasSubmitted = true;
    }

    this.saveRoom(room);
    sound.playClick();

    const activePlayers = room.players.filter((p) => p.isOnline !== false && !p.isBot);
    const submittedCount = activePlayers.filter((p) => {
      const lp = room.landmarkState?.players[p.id];
      return lp && lp.hasSubmitted;
    }).length;

    console.log(`[TV SUBMISSIONS] ${submittedCount} of ${activePlayers.length} players answered.`);

    // ONLY advance early if EVERY joined player has submitted (minimum 2 players)
    if (activePlayers.length >= 2 && submittedCount >= activePlayers.length) {
      console.log('[TV ALL ANSWERED] All players submitted. Concluding round early.');
      if (this.timerIntervals.has(room.id + '_landmark')) {
        clearInterval(this.timerIntervals.get(room.id + '_landmark'));
      }
      this.resolveLandmarkReveal(clean);
    }
  }

  public resolveLandmarkReveal(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'LANDMARK_RESOLVE_REVEAL', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.landmarkState || room.landmarkState.gameState !== 'PLAYING') return;

    if (this.timerIntervals.has(room.id + '_landmark')) {
      clearInterval(this.timerIntervals.get(room.id + '_landmark'));
    }

    const state = room.landmarkState;
    state.gameState = 'REVEALING';
    state.revealStartedAt = Date.now();

    // Find authentic target coordinates
    const pool = getLandmarksByScope(state.scope || 'saudi');
    const target = pool.find((l) => l.id === state.currentLandmarkId) || pool[0];

    // Calculate distances for all players
    const playersList = Object.values(state.players);
    playersList.forEach((p) => {
      if (p.hasSubmitted && p.currentLat !== null && p.currentLng !== null) {
        p.currentDistanceKm = calculateHaversineDistance(
          p.currentLat,
          p.currentLng,
          target.lat,
          target.lng
        );
      } else {
        // Penalty for not submitting
        p.currentDistanceKm = 99999;
      }
      p.currentPointsAwarded = 0;
    });

    // Valid guessers sorted by distance ascending
    const validGuessers = playersList
      .filter((p) => p.currentDistanceKm !== null && p.currentDistanceKm < 99999)
      .sort((a, b) => (a.currentDistanceKm || 0) - (b.currentDistanceKm || 0));

    if (validGuessers.length > 0) {
      // Group by distinct distance to handle ties fairly
      const distinctDistances = Array.from(
        new Set(validGuessers.map((p) => p.currentDistanceKm!))
      ).sort((a, b) => a - b);

      const pointsMap: number[] = [3, 2, 1]; // 1st = 3pts, 2nd = 2pts, 3rd = 1pt

      validGuessers.forEach((p) => {
        const rankIndex = distinctDistances.indexOf(p.currentDistanceKm!);
        const awarded = rankIndex < pointsMap.length ? pointsMap[rankIndex] : 0;
        p.currentPointsAwarded = awarded;
        p.score += awarded;
      });
    }

    this.saveRoom(room);
    this.emit('TIMEOUT_FREEZE', clean, {});

    // 4-second pause before transitioning to intermission / podium
    setTimeout(() => {
      const current = this.getRoom(clean);
      if (current && current.landmarkState && current.landmarkState.gameState === 'REVEALING') {
        this.advanceLandmarkRound(clean);
      }
    }, 4000);
  }

  public advanceLandmarkRound(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room || !room.landmarkState) return;

    if (room.landmarkState.currentRound >= room.landmarkState.totalRounds) {
      room.landmarkState.gameState = 'GAME_OVER';
    } else {
      room.landmarkState.gameState = 'ROUND_INTERMISSION';
      room.landmarkState.roundReadyPlayers = {};
      Object.values(room.landmarkState.players).forEach((p) => {
        p.isReady = false;
      });

      // Auto-ready any bot players after 1.5s
      const bots = room.players.filter((p) => p.isBot);
      if (bots.length > 0) {
        setTimeout(() => {
          const r = this.getRoom(clean);
          if (r && r.landmarkState && r.landmarkState.gameState === 'ROUND_INTERMISSION') {
            bots.forEach((b) => {
              r.landmarkState!.roundReadyPlayers[b.id] = true;
            });
            this.saveRoom(r);
          }
        }, 1500);
      }
    }

    this.saveRoom(room);
  }

  public emitPlayerLandmarkRoundReady(roomId: string, playerId: string, roundIndex: number): void {
    const clean = cleanRoomCode(roomId);
    if (this.isHosting(clean)) {
      const room = this.getRoom(clean);
      if (room && room.landmarkState) {
        if (!room.landmarkState.roundReadyPlayers) {
          room.landmarkState.roundReadyPlayers = {};
        }
        room.landmarkState.roundReadyPlayers[playerId] = true;
        this.saveRoom(room);

        // Check if all connected active players are ready
        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.landmarkState.roundReadyPlayers).filter(
          (k) => room.landmarkState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.landmarkState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextLandmarkRound(clean, (room.landmarkState?.currentRound || 1) + 1);
          }, 400);
        }
      }
    } else {
      this.sendIntent(clean, 'LANDMARK_ROUND_READY', playerId, { roundIndex });
    }

    this.emit('PLAYER_ROUND_READY', clean, {
      playerId,
      roundIndex,
    });
    sound.playClick();
  }

  public readyForNextLandmarkRound(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room || !room.landmarkState) return;
    this.emitPlayerLandmarkRoundReady(roomId, playerId, room.landmarkState.currentRound);
  }

  public resetLandmarkToLobby(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'LANDMARK_RESET_LOBBY', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.landmarkState) return;

    if (this.timerIntervals.has(room.id + '_landmark')) {
      clearInterval(this.timerIntervals.get(room.id + '_landmark'));
    }

    room.landmarkState.gameState = 'LOBBY';
    room.landmarkState.currentRound = 1;
    room.landmarkState.roundEndsAt = null;
    room.landmarkState.currentLandmarkId = null;
    room.landmarkState.roundReadyPlayers = {};
    room.landmarkState.sessionLandmarkIds = [];
    room.landmarkState.revealStartedAt = null;

    Object.values(room.landmarkState.players).forEach((p) => {
      p.score = 0;
      p.isReady = false;
      p.currentLat = null;
      p.currentLng = null;
      p.currentDistanceKm = null;
      p.currentPointsAwarded = 0;
      p.hasSubmitted = false;
    });

    room.players.forEach((p) => {
      p.isReady = false;
    });

    this.saveRoom(room);
    this.broadcastState(room);
    sound.playClick();
  }

  // ==========================================
  // Line Trajectory Game Engine Methods
  // ==========================================

  public initTrajectoryGame(roomId: string): TrajectoryRoomState {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean) || this.createRoom(clean);

    room.selectedGameId = 'geo-trajectory';

    const rounds = TRAJECTORY_ROUNDS_FALLBACK;
    const previouslyPlayed = room.trajectoryState?.playedRoundIds || [];
    let available = rounds.filter((r) => !previouslyPlayed.includes(r.id));
    if (available.length < 5) {
      available = rounds;
    }
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const chosenFive = shuffled.slice(0, 5).map((r) => r.id);
    const updatedPlayed = Array.from(new Set([...previouslyPlayed, ...chosenFive]));

    const playersMap: Record<string, TrajectoryPlayer> = {};
    room.players.forEach((p) => {
      playersMap[p.id] = {
        id: p.id,
        name: p.name,
        score: 0,
        isReady: false,
        hasSubmitted: false,
        guessedCountryAr: null,
        guessedCountryEn: null,
        guessedIso3: null,
        isValidIntersect: false,
        entryDistanceKm: null,
        rank: null,
        currentPointsAwarded: 0,
      };
    });

    const firstRound = rounds.find((r) => r.id === chosenFive[0]) || rounds[0];

    const trajectoryState: TrajectoryRoomState = {
      gameState: 'GAME_LOBBY',
      players: playersMap,
      currentRound: 0,
      totalRounds: 5,
      currentRoundData: firstRound,
      roundEndsAt: null,
      sessionRoundIds: chosenFive,
      playedRoundIds: updatedPlayed,
      roundReadyPlayers: {},
      revealStartedAt: null,
      hitCountries: [],
    };

    room.trajectoryState = trajectoryState;
    this.saveRoom(room);
    return trajectoryState;
  }

  public tvStartNextTrajectoryRound(roomId: string, nextRoundNumber: number): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TRAJECTORY_START_ROUND', 'host', { roundNumber: nextRoundNumber });
      return;
    }

    let room = this.getRoom(clean);
    if (!room) return;

    if (!room.trajectoryState) {
      this.initTrajectoryGame(clean);
      room = this.getRoom(clean);
      if (!room || !room.trajectoryState) return;
    }

    if (nextRoundNumber > room.trajectoryState.totalRounds) {
      room.trajectoryState.gameState = 'GAME_OVER';
      this.saveRoom(room);
      return;
    }

    // Ensure 5 unique rounds without repeating from playedRoundIds
    if (!room.trajectoryState.sessionRoundIds || room.trajectoryState.sessionRoundIds.length < 5) {
      const previouslyPlayed = room.trajectoryState.playedRoundIds || [];
      let available = TRAJECTORY_ROUNDS_FALLBACK.filter((r) => !previouslyPlayed.includes(r.id));
      if (available.length < 5) {
        available = TRAJECTORY_ROUNDS_FALLBACK;
        room.trajectoryState.playedRoundIds = [];
      }
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const chosenFive = shuffled.slice(0, 5).map((r) => r.id);
      room.trajectoryState.sessionRoundIds = chosenFive;
      room.trajectoryState.playedRoundIds = Array.from(
        new Set([...(room.trajectoryState.playedRoundIds || []), ...chosenFive])
      );
    }

    const roundIdx = Math.max(0, Math.min(4, nextRoundNumber - 1));
    const roundId = room.trajectoryState.sessionRoundIds[roundIdx];
    const roundData = TRAJECTORY_ROUNDS_FALLBACK.find((r) => r.id === roundId) || TRAJECTORY_ROUNDS_FALLBACK[0];

    room.trajectoryState.currentRound = nextRoundNumber;
    room.trajectoryState.currentRoundData = roundData;
    room.trajectoryState.roundEndsAt = Date.now() + 30000; // Strictly 30 seconds
    room.trajectoryState.gameState = 'PLAYING';
    room.trajectoryState.roundReadyPlayers = {};
    room.trajectoryState.revealStartedAt = null;

    // Synchronize all room players & reset turn data
    room.players.forEach((p) => {
      if (!room.trajectoryState!.players[p.id]) {
        room.trajectoryState!.players[p.id] = {
          id: p.id,
          name: p.name,
          score: 0,
          isReady: false,
          hasSubmitted: false,
          guessedCountryAr: null,
          guessedCountryEn: null,
          guessedIso3: null,
          isValidIntersect: false,
          entryDistanceKm: null,
          rank: null,
          currentPointsAwarded: 0,
        };
      } else {
        const tp = room.trajectoryState!.players[p.id];
        tp.hasSubmitted = false;
        tp.isReady = false;
        tp.guessedCountryAr = null;
        tp.guessedCountryEn = null;
        tp.guessedIso3 = null;
        tp.isValidIntersect = false;
        tp.entryDistanceKm = null;
        tp.rank = null;
        tp.currentPointsAwarded = 0;
      }
    });

    this.saveRoom(room);

    this.emit('ROUND_STARTED', clean, {
      roundIndex: nextRoundNumber,
      roundId: roundData.id,
      round: nextRoundNumber,
    });
    this.broadcastRoundStarted(clean, nextRoundNumber);
    this.broadcastState(room);

    // Simulated guesses for bot players if any
    const bots = room.players.filter((p) => p.isBot);
    if (bots.length > 0 && room.trajectoryState.hitCountries.length > 0) {
      bots.forEach((bot, idx) => {
        const delay = 4000 + idx * 2500 + Math.random() * 2000;
        setTimeout(() => {
          const r = this.getRoom(clean);
          if (r && r.trajectoryState && r.trajectoryState.gameState === 'PLAYING') {
            const hits = r.trajectoryState.hitCountries;
            const chosen = hits[Math.floor(Math.random() * hits.length)];
            if (chosen) {
              this.submitTrajectoryGuess(
                clean,
                bot.id,
                chosen.nameAr,
                chosen.nameEn,
                chosen.iso3
              );
            }
          }
        }, delay);
      });
    }

    // Set countdown check
    if (this.timerIntervals.has(room.id + '_trajectory')) {
      clearInterval(this.timerIntervals.get(room.id + '_trajectory'));
    }

    const interval = window.setInterval(() => {
      const currentRoom = this.getRoom(room.id);
      if (!currentRoom || !currentRoom.trajectoryState || currentRoom.trajectoryState.gameState !== 'PLAYING') {
        clearInterval(interval);
        return;
      }

      if (currentRoom.trajectoryState.roundEndsAt && Date.now() >= currentRoom.trajectoryState.roundEndsAt) {
        clearInterval(interval);
        this.resolveTrajectoryReveal(currentRoom.id);
      }
    }, 500);

    this.timerIntervals.set(room.id + '_trajectory', interval);
  }

  public setTrajectoryHitCountries(roomId: string, hits: any[]): void {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room || !room.trajectoryState) return;
    room.trajectoryState.hitCountries = hits;
    this.saveRoom(room);
  }

  public submitTrajectoryGuess(
    roomId: string,
    playerId: string,
    countryAr: string,
    countryEn?: string,
    iso3?: string
  ): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TRAJECTORY_SUBMIT_GUESS', playerId, { countryAr, countryEn, iso3 });
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.trajectoryState || room.trajectoryState.gameState !== 'PLAYING') return;

    if (!room.trajectoryState.players[playerId]) {
      const basePlayer = room.players.find((p) => p.id === playerId);
      room.trajectoryState.players[playerId] = {
        id: playerId,
        name: basePlayer?.name || 'لاعب',
        score: 0,
        isReady: false,
        hasSubmitted: true,
        guessedCountryAr: countryAr,
        guessedCountryEn: countryEn || null,
        guessedIso3: iso3 || null,
        isValidIntersect: false,
        entryDistanceKm: null,
        rank: null,
        currentPointsAwarded: 0,
      };
    } else {
      const tp = room.trajectoryState.players[playerId];
      tp.guessedCountryAr = countryAr;
      tp.guessedCountryEn = countryEn || null;
      tp.guessedIso3 = iso3 || null;
      tp.hasSubmitted = true;
    }

    this.saveRoom(room);
    sound.playClick();

    const activePlayers = room.players.filter((p) => p.isOnline !== false && !p.isBot);
    const submittedCount = activePlayers.filter((p) => {
      const tp = room.trajectoryState?.players[p.id];
      return tp && tp.hasSubmitted;
    }).length;

    console.log(`[TV SUBMISSIONS] ${submittedCount} of ${activePlayers.length} players answered.`);

    // ONLY advance early if EVERY joined player has submitted (minimum 2 players)
    if (activePlayers.length >= 2 && submittedCount >= activePlayers.length) {
      console.log('[TV ALL ANSWERED] All players submitted. Concluding round early.');
      if (this.timerIntervals.has(room.id + '_trajectory')) {
        clearInterval(this.timerIntervals.get(room.id + '_trajectory'));
      }
      this.resolveTrajectoryReveal(clean);
    }
  }

  public resolveTrajectoryReveal(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TRAJECTORY_RESOLVE_REVEAL', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.trajectoryState || room.trajectoryState.gameState !== 'PLAYING') return;

    if (this.timerIntervals.has(room.id + '_trajectory')) {
      clearInterval(this.timerIntervals.get(room.id + '_trajectory'));
    }

    const state = room.trajectoryState;
    state.gameState = 'REVEALING';
    state.revealStartedAt = Date.now();

    const hits = state.hitCountries || [];
    const playersList = Object.values(state.players);

    playersList.forEach((p) => {
      p.isValidIntersect = false;
      p.entryDistanceKm = null;
      p.rank = null;
      p.currentPointsAwarded = 0;

      if (p.hasSubmitted && (p.guessedIso3 || p.guessedCountryAr)) {
        const hit = hits.find((h) => {
          if (p.guessedIso3 && h.iso3 === p.guessedIso3) return true;
          return h.nameAr === p.guessedCountryAr || h.nameEn.toLowerCase() === (p.guessedCountryEn || '').toLowerCase();
        });

        if (hit) {
          p.isValidIntersect = true;
          p.entryDistanceKm = hit.distanceKm;
        }
      }
    });

    // Valid guessers sorted by distance descending (Furthest country gets 1st place!)
    const validGuessers = playersList
      .filter((p) => p.isValidIntersect && p.entryDistanceKm !== null)
      .sort((a, b) => (b.entryDistanceKm || 0) - (a.entryDistanceKm || 0));

    if (validGuessers.length > 0) {
      // Group distinct distances descending
      const distinctDistances = Array.from(
        new Set(validGuessers.map((p) => p.entryDistanceKm!))
      ).sort((a, b) => b - a);

      const pointsMap = [3, 2, 1]; // 1st = 3pts, 2nd = 2pts, 3rd = 1pt

      validGuessers.forEach((p) => {
        const rankIndex = distinctDistances.indexOf(p.entryDistanceKm!);
        p.rank = rankIndex + 1;
        const awarded = rankIndex < pointsMap.length ? pointsMap[rankIndex] : 0;
        p.currentPointsAwarded = awarded;
        p.score += awarded;
      });
    }

    this.saveRoom(room);
    this.emit('TIMEOUT_FREEZE', clean, {});

    // 5-second pause for reveal sweep & rank animation before intermission
    setTimeout(() => {
      const current = this.getRoom(clean);
      if (current && current.trajectoryState && current.trajectoryState.gameState === 'REVEALING') {
        this.advanceTrajectoryRound(clean);
      }
    }, 5000);
  }

  public advanceTrajectoryRound(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room || !room.trajectoryState) return;

    if (room.trajectoryState.currentRound >= room.trajectoryState.totalRounds) {
      room.trajectoryState.gameState = 'GAME_OVER';
    } else {
      room.trajectoryState.gameState = 'ROUND_INTERMISSION';
      room.trajectoryState.roundReadyPlayers = {};
      Object.values(room.trajectoryState.players).forEach((p) => {
        p.isReady = false;
        p.hasSubmitted = false;
        p.guessedCountryAr = null;
        p.guessedCountryEn = null;
        p.guessedIso3 = null;
        p.isValidIntersect = false;
        p.entryDistanceKm = null;
        p.rank = null;
        p.currentPointsAwarded = 0;
      });

      // Auto-ready bot players
      const bots = room.players.filter((p) => p.isBot);
      if (bots.length > 0) {
        setTimeout(() => {
          const r = this.getRoom(clean);
          if (r && r.trajectoryState && r.trajectoryState.gameState === 'ROUND_INTERMISSION') {
            bots.forEach((b) => {
              r.trajectoryState!.roundReadyPlayers[b.id] = true;
            });
            this.saveRoom(r);
          }
        }, 1500);
      }
    }

    this.saveRoom(room);
  }

  public emitPlayerTrajectoryRoundReady(roomId: string, playerId: string, roundIndex: number): void {
    const clean = cleanRoomCode(roomId);
    if (this.isHosting(clean)) {
      const room = this.getRoom(clean);
      if (room && room.trajectoryState) {
        if (!room.trajectoryState.roundReadyPlayers) {
          room.trajectoryState.roundReadyPlayers = {};
        }
        room.trajectoryState.roundReadyPlayers[playerId] = true;
        this.saveRoom(room);

        // Check if all connected active players are ready
        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.trajectoryState.roundReadyPlayers).filter(
          (k) => room.trajectoryState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.trajectoryState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextTrajectoryRound(clean, (room.trajectoryState?.currentRound || 1) + 1);
          }, 400);
        }
      }
    } else {
      this.sendIntent(clean, 'TRAJECTORY_ROUND_READY', playerId, { roundIndex });
    }

    this.emit('PLAYER_ROUND_READY', clean, {
      playerId,
      roundIndex,
    });
    sound.playClick();
  }

  public readyForNextTrajectoryRound(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room || !room.trajectoryState) return;
    this.emitPlayerTrajectoryRoundReady(roomId, playerId, room.trajectoryState.currentRound);
  }

  public resetTrajectoryToLobby(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TRAJECTORY_RESET_LOBBY', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.trajectoryState) return;

    if (this.timerIntervals.has(room.id + '_trajectory')) {
      clearInterval(this.timerIntervals.get(room.id + '_trajectory'));
    }

    room.trajectoryState.gameState = 'GAME_LOBBY';
    room.trajectoryState.currentRound = 0;
    room.trajectoryState.roundEndsAt = null;
    room.trajectoryState.roundReadyPlayers = {};
    room.trajectoryState.sessionRoundIds = [];
    room.trajectoryState.revealStartedAt = null;

    Object.values(room.trajectoryState.players).forEach((p) => {
      p.score = 0;
      p.isReady = false;
      p.hasSubmitted = false;
      p.guessedCountryAr = null;
      p.guessedCountryEn = null;
      p.guessedIso3 = null;
      p.isValidIntersect = false;
      p.entryDistanceKm = null;
      p.rank = null;
      p.currentPointsAwarded = 0;
    });

    room.players.forEach((p) => {
      p.isReady = false;
    });

    this.saveRoom(room);
    this.broadcastState(room);
    sound.playClick();
  }

  // ==========================================
  // Blind Tourism (سياحة عمياء) Game Methods
  // ==========================================

  public async fetchTourismQuestions(): Promise<TourismItem[]> {
    try {
      const resp = await fetch('/data/blind-tourism.json');
      if (!resp.ok) throw new Error('Failed to load blind-tourism.json');
      const data = await resp.json();
      return data as TourismItem[];
    } catch {
      return [
        {
          id: 'bt_01',
          target: 'باريس',
          type: 'مدينة',
          hints: [
            'تلقب بعاصمة الضباب ومدينة الأنوار.',
            'يوجد فيها أحد أشهر المتاحف عالمياً (اللوفر).',
            'تحتوي على معلم برجي شهير يعود لعام 1889.',
            'يمر عبرها نهر السين الشهير.',
            'هي عاصمة دولة فرنسا.'
          ]
        },
        {
          id: 'bt_02',
          target: 'اليابان',
          type: 'دولة',
          hints: [
            'تسمى بلاد الشمس المشرقة.',
            'تتكون من أرخبيل يضم آلاف الجزر، وأكبر مدنها طوكيو.',
            'تتميز بزهور الساكورا الشهيرة وجبل فوجي.',
            'تشتهر بتقاليد الساموراي والقطارات السريعة (شينكانسن).',
            'دولة آسيوية عاصمتها طوكيو.'
          ]
        },
        {
          id: 'bt_03',
          target: 'العلا',
          type: 'منطقة تراثية',
          hints: [
            'تقع في الشمال الغربي للمملكة العربية السعودية.',
            'تحتوي على أول موقع سعودي مسجل في قائمة التراث العالمي لليونسكو (الحِجر).',
            'تضم مسرح مرايا الزجاجي الأكبر في العالم.',
            'تشتهر بصخرة الفيل التشكيلية الطبيعية.',
            'مدينة تاريخية واحة تحيط بها الجبال الصخرية الرملية.'
          ]
        },
        {
          id: 'bt_04',
          target: 'إيطاليا',
          type: 'دولة',
          hints: [
            'تشبه خريطة جغرافيتها شكل الحذاء العالي.',
            'تضم دولة مستقلة بالكامل داخل عاصمتها (الفاتيكان).',
            'تشتهر ببرج مائل شهير في إحدى مدنها التاريخية.',
            'منهلة أطباق البيتزا والمعكرونة العالمية.',
            'دولة أوروبية عاصمتها روما.'
          ]
        },
        {
          id: 'bt_05',
          target: 'دبي',
          type: 'مدينة',
          hints: [
            'تضم أعلى بناء معماري من صنع البشر في العالم.',
            'تحتوي على جزر صناعية على شكل نخلة.',
            'تشتهر بسياحة التسوق والأبراج الفارهة.',
            'تعتبر الإمارة الأكثر سكاناً في دولة الإمارات.',
            'مدينة خليجية ساحلية بارزة.'
          ]
        }
      ];
    }
  }

  public initTourismGame(roomId: string, questions?: TourismItem[]): TourismRoomState {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean) || this.createRoom(clean);

    room.selectedGameId = 'geo-blind-tourism';

    const fallbackQuestions: TourismItem[] = questions && questions.length > 0 ? questions : [
      {
        id: 'bt_01',
        target: 'باريس',
        type: 'مدينة',
        hints: [
          'تلقب بعاصمة الضباب ومدينة الأنوار.',
          'يوجد فيها أحد أشهر المتاحف عالمياً (اللوفر).',
          'تحتوي على معلم برجي شهير يعود لعام 1889.',
          'يمر عبرها نهر السين الشهير.',
          'هي عاصمة دولة فرنسا.'
        ]
      }
    ];

    const previouslyPlayed = room.tourismState?.playedItemIds || [];
    let available = fallbackQuestions.filter((q) => !previouslyPlayed.includes(q.id));
    if (available.length < 5) {
      available = fallbackQuestions;
    }
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const chosenFive = shuffled.slice(0, 5).map((q) => q.id);
    const updatedPlayed = Array.from(new Set([...previouslyPlayed, ...chosenFive]));

    const playersMap: Record<string, TourismPlayer> = {};
    room.players.forEach((p) => {
      playersMap[p.id] = {
        id: p.id,
        name: p.name,
        score: 0,
        isReady: false,
        hasLockedIn: false,
        lockedInStage: null,
        lockedInAnswer: null,
        isCorrect: false,
        pointsAwarded: 0,
      };
    });

    const firstItem = fallbackQuestions.find((q) => q.id === chosenFive[0]) || fallbackQuestions[0];

    const tourismState: TourismRoomState = {
      gameState: 'GAME_LOBBY',
      players: playersMap,
      currentRound: 0,
      totalRounds: 5,
      currentItem: firstItem,
      currentStage: 1,
      stageEndsAt: null,
      sessionItemIds: chosenFive,
      playedItemIds: updatedPlayed,
      roundReadyPlayers: {},
      revealStartedAt: null,
    };

    room.tourismState = tourismState;
    this.saveRoom(room);
    return tourismState;
  }

  public async tvStartNextTourismRound(roomId: string, nextRoundNumber: number): Promise<void> {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TOURISM_START_ROUND', 'host', { roundNumber: nextRoundNumber });
      return;
    }

    let room = this.getRoom(clean);
    if (!room) return;

    if (!room.tourismState) {
      const q = await this.fetchTourismQuestions();
      this.initTourismGame(clean, q);
      room = this.getRoom(clean);
      if (!room || !room.tourismState) return;
    }

    if (nextRoundNumber > room.tourismState.totalRounds) {
      room.tourismState.gameState = 'GAME_OVER';
      this.saveRoom(room);
      return;
    }

    const allQuestions = await this.fetchTourismQuestions();

    // Ensure session has 5 unplayed questions
    if (!room.tourismState.sessionItemIds || room.tourismState.sessionItemIds.length < 5) {
      const previouslyPlayed = room.tourismState.playedItemIds || [];
      let available = allQuestions.filter((q) => !previouslyPlayed.includes(q.id));
      if (available.length < 5) {
        available = allQuestions;
        room.tourismState.playedItemIds = [];
      }
      const shuffled = [...available].sort(() => Math.random() - 0.5);
      const chosenFive = shuffled.slice(0, 5).map((q) => q.id);
      room.tourismState.sessionItemIds = chosenFive;
      room.tourismState.playedItemIds = Array.from(
        new Set([...(room.tourismState.playedItemIds || []), ...chosenFive])
      );
    }

    const roundIdx = Math.max(0, Math.min(4, nextRoundNumber - 1));
    const itemId = room.tourismState.sessionItemIds[roundIdx];
    const itemData = allQuestions.find((q) => q.id === itemId) || allQuestions[0];

    room.tourismState.currentRound = nextRoundNumber;
    room.tourismState.currentItem = itemData;
    room.tourismState.currentStage = 1; // Stage 1 starts
    room.tourismState.stageEndsAt = Date.now() + 15000; // 15 seconds per stage
    room.tourismState.gameState = 'PLAYING';
    room.tourismState.roundReadyPlayers = {};
    room.tourismState.revealStartedAt = null;
    room.tourismState.skipHintVotes = {};

    // Reset player round answers
    room.players.forEach((p) => {
      if (!room.tourismState!.players[p.id]) {
        room.tourismState!.players[p.id] = {
          id: p.id,
          name: p.name,
          score: 0,
          isReady: false,
          hasLockedIn: false,
          lockedInStage: null,
          lockedInAnswer: null,
          isCorrect: false,
          pointsAwarded: 0,
        };
      } else {
        const tp = room.tourismState!.players[p.id];
        tp.hasLockedIn = false;
        tp.isReady = false;
        tp.lockedInStage = null;
        tp.lockedInAnswer = null;
        tp.isCorrect = false;
        tp.pointsAwarded = 0;
      }
    });

    this.saveRoom(room);
    this.emit('ROUND_STARTED', clean, {
      roundIndex: nextRoundNumber,
      itemId: itemData.id,
      round: nextRoundNumber,
    });
    this.broadcastRoundStarted(clean, nextRoundNumber);
    this.broadcastState(room);

    // Start 15s progressive hint ticker
    if (this.timerIntervals.has(room.id + '_tourism')) {
      clearInterval(this.timerIntervals.get(room.id + '_tourism'));
    }

    const interval = window.setInterval(() => {
      const currentRoom = this.getRoom(room.id);
      if (!currentRoom || !currentRoom.tourismState || currentRoom.tourismState.gameState !== 'PLAYING') {
        clearInterval(interval);
        return;
      }

      const tState = currentRoom.tourismState;
      if (tState.stageEndsAt && Date.now() >= tState.stageEndsAt) {
        if (tState.currentStage < 5) {
          // Advance to next progressive hint stage
          tState.currentStage += 1;
          tState.stageEndsAt = Date.now() + 15000;
          tState.skipHintVotes = {};
          this.saveRoom(currentRoom);
          this.broadcastState(currentRoom);
          sound.playTick();
        } else {
          // All 5 hint stages expired -> Resolve Reveal
          clearInterval(interval);
          this.resolveTourismReveal(clean);
        }
      }
    }, 500);

    this.timerIntervals.set(room.id + '_tourism', interval);
  }

  public voteSkipTourismHint(roomId: string, playerId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TOURISM_SKIP_HINT', playerId);
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.tourismState || room.tourismState.gameState !== 'PLAYING') return;

    const tState = room.tourismState;
    if (!tState.skipHintVotes) {
      tState.skipHintVotes = {};
    }
    tState.skipHintVotes[playerId] = true;

    const activePlayers = room.players.filter((p) => p.isOnline !== false && !p.isBot);
    const votes = Object.keys(tState.skipHintVotes).filter((k) => tState.skipHintVotes![k]).length;
    const requiredVotes = Math.max(1, Math.ceil((activePlayers.length || 1) / 2));

    if (votes >= requiredVotes) {
      tState.skipHintVotes = {};
      if (tState.currentStage < 5) {
        tState.currentStage += 1;
        tState.stageEndsAt = Date.now() + 15000;
        this.saveRoom(room);
        this.broadcastState(room);
        sound.playTick();
      } else {
        if (this.timerIntervals.has(room.id + '_tourism')) {
          clearInterval(this.timerIntervals.get(room.id + '_tourism'));
        }
        this.resolveTourismReveal(clean);
      }
    } else {
      this.saveRoom(room);
      this.broadcastState(room);
      sound.playClick();
    }
  }

  public lockInTourismAnswer(roomId: string, playerId: string, answer: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TOURISM_LOCK_IN', playerId, { answer });
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.tourismState || room.tourismState.gameState !== 'PLAYING') return;

    const tState = room.tourismState;
    if (!tState.players[playerId]) {
      const basePlayer = room.players.find((p) => p.id === playerId);
      tState.players[playerId] = {
        id: playerId,
        name: basePlayer?.name || 'لاعب',
        score: 0,
        isReady: false,
        hasLockedIn: true,
        lockedInStage: tState.currentStage,
        lockedInAnswer: answer,
        isCorrect: false,
        pointsAwarded: 0,
      };
    } else {
      const tp = tState.players[playerId];
      if (tp.hasLockedIn) return; // Already locked in for this round
      tp.hasLockedIn = true;
      tp.lockedInStage = tState.currentStage;
      tp.lockedInAnswer = answer;
    }

    this.saveRoom(room);
    sound.playClick();

    const activePlayers = room.players.filter((p) => p.isOnline !== false && !p.isBot);
    const lockedCount = activePlayers.filter((p) => {
      const tp = tState.players[p.id];
      return tp && tp.hasLockedIn;
    }).length;

    console.log(`[TV SUBMISSIONS] ${lockedCount} of ${activePlayers.length} players answered.`);

    // ONLY advance early if EVERY joined player has submitted (minimum 2 players)
    if (activePlayers.length >= 2 && lockedCount >= activePlayers.length) {
      console.log('[TV ALL ANSWERED] All players submitted. Concluding round early.');
      if (this.timerIntervals.has(room.id + '_tourism')) {
        clearInterval(this.timerIntervals.get(room.id + '_tourism'));
      }
      this.resolveTourismReveal(clean);
    }
  }

  public resolveTourismReveal(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TOURISM_RESOLVE_REVEAL', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.tourismState || room.tourismState.gameState !== 'PLAYING') return;

    if (this.timerIntervals.has(room.id + '_tourism')) {
      clearInterval(this.timerIntervals.get(room.id + '_tourism'));
    }

    const state = room.tourismState;
    state.gameState = 'REVEALING';
    state.revealStartedAt = Date.now();

    const target = state.currentItem?.target || '';
    const aliases = state.currentItem?.aliases || [];
    const playersList = Object.values(state.players);

    // Points system based on Hint Stage: 1->5pts, 2->4pts, 3->3pts, 4->2pts, 5->1pt
    const stagePoints = [0, 5, 4, 3, 2, 1];

    playersList.forEach((p) => {
      p.isCorrect = false;
      p.pointsAwarded = 0;

      if (p.hasLockedIn && p.lockedInAnswer) {
        const correct = isAnswerCorrect(p.lockedInAnswer, target, aliases);
        if (correct) {
          p.isCorrect = true;
          const stage = p.lockedInStage || 5;
          const pts = stagePoints[stage] || 1;
          p.pointsAwarded = pts;
          p.score += pts;
        }
      }
    });

    this.saveRoom(room);
    this.emit('TIMEOUT_FREEZE', clean, {});
    sound.playVictory();

    // 5-second reveal showcase before advancing to ROUND_INTERMISSION
    setTimeout(() => {
      const current = this.getRoom(clean);
      if (current && current.tourismState && current.tourismState.gameState === 'REVEALING') {
        this.advanceTourismRound(clean);
      }
    }, 5000);
  }

  public advanceTourismRound(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    const room = this.getRoom(clean);
    if (!room || !room.tourismState) return;

    if (room.tourismState.currentRound >= room.tourismState.totalRounds) {
      room.tourismState.gameState = 'GAME_OVER';
    } else {
      room.tourismState.gameState = 'ROUND_INTERMISSION';
      room.tourismState.roundReadyPlayers = {};
      Object.values(room.tourismState.players).forEach((p) => {
        p.isReady = false;
        p.hasLockedIn = false;
        p.lockedInStage = null;
        p.lockedInAnswer = null;
        p.isCorrect = false;
        p.pointsAwarded = 0;
      });
    }

    this.saveRoom(room);
  }

  public emitPlayerTourismRoundReady(roomId: string, playerId: string, roundIndex: number): void {
    const clean = cleanRoomCode(roomId);
    if (this.isHosting(clean)) {
      const room = this.getRoom(clean);
      if (room && room.tourismState) {
        if (!room.tourismState.roundReadyPlayers) {
          room.tourismState.roundReadyPlayers = {};
        }
        room.tourismState.roundReadyPlayers[playerId] = true;
        this.saveRoom(room);

        const activePlayers = room.players.filter((p) => p.isOnline !== false);
        const readyIds = Object.keys(room.tourismState.roundReadyPlayers).filter(
          (k) => room.tourismState!.roundReadyPlayers[k]
        );
        if (
          activePlayers.length > 0 &&
          readyIds.length >= activePlayers.length &&
          room.tourismState.gameState === 'ROUND_INTERMISSION'
        ) {
          setTimeout(() => {
            this.tvStartNextTourismRound(clean, (room.tourismState?.currentRound || 1) + 1);
          }, 400);
        }
      }
    } else {
      this.sendIntent(clean, 'TOURISM_ROUND_READY', playerId, { roundIndex });
    }

    this.emit('PLAYER_ROUND_READY', clean, {
      playerId,
      roundIndex,
    });
    sound.playClick();
  }

  public readyForNextTourismRound(roomId: string, playerId: string): void {
    const room = this.getRoom(roomId);
    if (!room || !room.tourismState) return;
    this.emitPlayerTourismRoundReady(roomId, playerId, room.tourismState.currentRound);
  }

  public resetTourismToLobby(roomId: string): void {
    const clean = cleanRoomCode(roomId);
    if (!this.isHosting(clean)) {
      this.sendIntent(clean, 'TOURISM_RESET_LOBBY', 'host');
      return;
    }

    const room = this.getRoom(clean);
    if (!room || !room.tourismState) return;

    if (this.timerIntervals.has(room.id + '_tourism')) {
      clearInterval(this.timerIntervals.get(room.id + '_tourism'));
    }

    room.tourismState.gameState = 'GAME_LOBBY';
    room.tourismState.currentRound = 0;
    room.tourismState.currentStage = 1;
    room.tourismState.stageEndsAt = null;
    room.tourismState.roundReadyPlayers = {};
    room.tourismState.sessionItemIds = [];
    room.tourismState.revealStartedAt = null;

    Object.values(room.tourismState.players).forEach((p) => {
      p.score = 0;
      p.isReady = false;
      p.hasLockedIn = false;
      p.lockedInStage = null;
      p.lockedInAnswer = null;
      p.isCorrect = false;
      p.pointsAwarded = 0;
    });

    room.players.forEach((p) => {
      p.isReady = false;
    });

    this.saveRoom(room);
    this.broadcastState(room);
    sound.playClick();
  }
}

export const roomBus: RoomBus =
  (typeof window !== 'undefined' && (window as any).__SHABAH_BUS__) || new RoomBus();

export function useRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<RoomState | null>(() => (roomId ? roomBus.getRoom(roomId) : null));
  const [activeBuzzer, setActiveBuzzer] = useState<any | null>(null);
  const [greenFlashPlayerId, setGreenFlashPlayerId] = useState<string | null>(null);
  const [hostDelegatedPlayerId, setHostDelegatedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    // Only TV/host views or non-mobile views should auto-initialize channels via useRoom.
    // Mobile player views manage their own dedicated presence channel in PlayerMobileView.
    const isMobilePlayPath = typeof window !== 'undefined' && (
      window.location.pathname.includes('/play') ||
      window.location.pathname.includes('/join') ||
      window.location.pathname.includes('/flags-lobby') ||
      window.location.pathname.includes('/flags-play') ||
      window.location.pathname.includes('/geo-play') ||
      window.location.pathname.includes('/trajectory-play') ||
      window.location.pathname.includes('/tourism-play')
    );

    if (!isMobilePlayPath) {
      roomBus.ensureSupabaseChannel(roomId);
    }

    const current = roomBus.getRoom(roomId);
    if (current) setRoom(current);

    const cleanRoomId = roomId.toUpperCase().replace(/^ROOM_/, '');

    const unsubscribe = roomBus.on('*', (payload) => {
      const cleanPayloadCode = payload.roomCode.toUpperCase().replace(/^ROOM_/, '');
      if (cleanPayloadCode === cleanRoomId) {
        if (payload.type === 'STATE_UPDATED') {
          setRoom({ ...payload.data });
        } else if (payload.type === 'CORRECT_ANSWER') {
          setGreenFlashPlayerId(payload.data);
          setTimeout(() => setGreenFlashPlayerId(null), 2500);
        } else if (payload.type === 'HOST_REQUEST_RESOLVED' && payload.data?.accepted) {
          setHostDelegatedPlayerId(payload.data?.playerId);
        } else if (payload.type === 'GAME_ENDED') {
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        } else if (payload.type === 'BUZZER_HIT') {
          setActiveBuzzer(payload.data);
          setTimeout(() => {
            setActiveBuzzer((prev: any) => (prev?.timestamp === payload.data?.timestamp ? null : prev));
          }, 3500);
        } else if (payload.type === 'PLAYER_JOINED' || payload.type === 'PLAYER_KICKED') {
          const updated = roomBus.getRoom(roomId);
          if (updated) setRoom(updated);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

  return { room, activeBuzzer, greenFlashPlayerId, hostDelegatedPlayerId };
}
